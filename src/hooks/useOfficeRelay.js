import { useRef, useState } from 'react';
import { CORE_AGENT_IDS, MEETING_SEATS, WAYPOINTS } from '../constants/officeConfig';
import { buildOfficePath } from '../utils/pathfinding';
import { abortableSleep, executeAgentPrompt } from '../utils/geminiClient';
import { playRetroTone } from '../utils/audio';

function isAbortErr(err) {
  return err?.name === 'AbortError' || err?.message === 'ABORTED';
}

/**
 * Menyaring log konteks saat siklus revisi agar agen fokus pada instruksi asli,
 * rencana arsitektur Alex, kontribusi spesialis, serta HANYA draf & audit QA terbaru
 * (mencegah draf gagal lama menghabiskan kuota token & membingungkan revisi).
 */
function buildFocusedRelayLogs(allSessionLogs, turnStartIdx, rakaId, nadiaId) {
  const priorHistory = allSessionLogs.slice(0, turnStartIdx).slice(-4);
  const currentTurnLogs = allSessionLogs.slice(turnStartIdx);

  let lastRakaIdx = -1;
  let lastNadiaIdx = -1;
  currentTurnLogs.forEach((entry, idx) => {
    if (entry.agentId === rakaId) lastRakaIdx = idx;
    if (entry.agentId === nadiaId) lastNadiaIdx = idx;
  });

  const filteredTurn = currentTurnLogs.filter((entry, idx) => {
    if (entry.agentId === rakaId) return idx === lastRakaIdx;
    if (entry.agentId === nadiaId) return idx === lastNadiaIdx;
    return true;
  });

  return [...priorHistory, ...filteredTurn];
}

export function useOfficeRelay({
  directorRef,
  npcRef,
  fxEventsRef,
  agents,
  activeSession,
  logs,
  projectBrief,
  apiMode,
  aiProvider,
  agyStatus,
  agyModel,
  geminiApiKey,
  deepseekApiKey,
  simSpeed,
  fxEnabled,
  maxRevisions,
  workflowMode,
  fastAgentId,
  promptInput,
  setPromptInput,
  selectedFile,
  filePayload,
  isReadingFile,
  clearFile,
  selectedNpcId,
  setSelectedNpcId,
  appendLogToSession,
  updateLogInSession,
  removeLogFromSession,
  showToast,
}) {
  const [isRelayRunning, setIsRelayRunning] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState(
    'Kantor Siap • Gerakkan Director (WASD/Klik) atau Jalankan Tim'
  );

  const abortControllerRef = useRef(null);

  const emitFx = (type, x, y) => {
    fxEventsRef.current.push({ type, x, y });
  };

  const stopActiveRun = () => {
    abortControllerRef.current?.abort();
  };

  const moveNpcTo = (npcId, targetPoint, options = {}, signal = null) => {
    return new Promise((resolve, reject) => {
      const npc = npcRef.current.find((n) => n.id === npcId);
      if (!npc) return resolve();

      if (signal?.aborted) {
        const err = new Error('ABORTED');
        err.name = 'AbortError';
        return reject(err);
      }

      const onAbort = () => {
        npc.pathQueue = [];
        npc.onArriveCallback = null;
        npc.carryingDoc = false;
        npc.meetingTimer = 0;
        npc.state = 'IDLE';
        npc.statusBubble = '';
        const err = new Error('ABORTED');
        err.name = 'AbortError';
        reject(err);
      };

      signal?.addEventListener('abort', onAbort, { once: true });

      // Batalkan walk sebelumnya (mis. balik ke lounge) secara bersih sebelum berangkat ke tujuan baru
      if (npc.onArriveCallback) {
        const prevCb = npc.onArriveCallback;
        npc.onArriveCallback = null;
        prevCb();
      }

      npc.roamTarget = null;
      npc.roamPath = [];
      npc.pendingIdleBubble = '';
      npc.meetingTimer = 0;
      npc.state = 'WALKING';
      npc.carryingDoc = Boolean(options.carryingDoc);
      npc.statusBubble = options.bubble || '';
      npc.hasReportExclamation = false;
      npc.pathQueue = buildOfficePath(npc.x, npc.y, targetPoint);
      npc.onArriveCallback = () => {
        signal?.removeEventListener('abort', onAbort);
        npc.state = options.endState || 'IDLE';
        npc.carryingDoc = false;
        npc.statusBubble = options.endBubble || '';
        npc.hasReportExclamation = Boolean(options.showExclamation);
        npc.meetingTimer = options.meetingDuration || 0;
        if (options.endFacing) npc.facing = options.endFacing;
        resolve();
      };
    });
  };

  const moveDirectorToMeetingSeat = (signal = null) => {
    return new Promise((resolve, reject) => {
      const dir = directorRef?.current;
      if (!dir) return resolve();

      const seat = MEETING_SEATS.director;
      if (Math.hypot(dir.x - seat.x, dir.y - seat.y) <= 8) {
        dir.x = seat.x;
        dir.y = seat.y;
        dir.pathQueue = [];
        dir.isMoving = false;
        dir.facing = seat.facing;
        dir.isSitting = true;
        return resolve();
      }

      if (signal?.aborted) {
        const err = new Error('ABORTED');
        err.name = 'AbortError';
        return reject(err);
      }

      const onAbort = () => {
        dir.pathQueue = [];
        dir.onArriveCallback = null;
        dir.isMoving = false;
        const err = new Error('ABORTED');
        err.name = 'AbortError';
        reject(err);
      };

      signal?.addEventListener('abort', onAbort, { once: true });
      dir.isSitting = false;
      dir.pathQueue = buildOfficePath(dir.x, dir.y, seat);
      dir.onArriveCallback = () => {
        signal?.removeEventListener('abort', onAbort);
        dir.x = seat.x;
        dir.y = seat.y;
        dir.facing = seat.facing;
        dir.isSitting = true;
        resolve();
      };
    });
  };

  const getAgentMeetingSeat = (agentId, extraIndex = 0) => {
    if (agentId === 'alex') return MEETING_SEATS.alex;
    if (agentId === 'raka') return MEETING_SEATS.raka;
    if (agentId === 'nadia') return MEETING_SEATS.nadia;
    return MEETING_SEATS.extra[extraIndex % MEETING_SEATS.extra.length];
  };

  // Kumpulkan Director + seluruh AI Agent ke meja rapat Ruang Director saat command selesai
  const gatherAllAtDirectorMeeting = async ({ leadReporterId, isApproved = true, signal }) => {
    let extraIdx = 0;
    const moves = [moveDirectorToMeetingSeat(signal)];

    for (let idx = 0; idx < agents.length; idx++) {
      const ag = agents[idx];
      const isCore = CORE_AGENT_IDS.includes(ag.id);
      const seat = getAgentMeetingSeat(ag.id, isCore ? 0 : extraIdx++);
      const isLeadReporter = ag.id === leadReporterId;

      moves.push(
        moveNpcTo(
          ag.id,
          { x: seat.x, y: seat.y },
          {
            carryingDoc: isLeadReporter,
            bubble: isLeadReporter
              ? isApproved
                ? '✅ Lapor ke Rapat...'
                : '⚠️ Lapor Revisi...'
              : '🪑 Ke Ruang Rapat...',
            endState: isLeadReporter ? 'REPORTING' : 'MEETING',
            endBubble: isLeadReporter ? '📋 Laporan selesai!' : '',
            showExclamation: isLeadReporter,
            endFacing: seat.facing,
            // Setelah rapat singkat (~7-8.5 detik), agen bubar kembali santai / roaming di kantor
            meetingDuration: 7 + idx * 0.6,
          },
          signal
        )
      );
    }

    await Promise.all(moves);
  };

  const runStreamingAgentCall = async ({
    sessionId,
    agent,
    roleLabel,
    prompt,
    recentLogs,
    attachedFileData,
    signal,
  }) => {
    const streamEntry = appendLogToSession(sessionId, {
      agentId: agent.id,
      agentName: agent.name,
      agentRole: roleLabel || agent.role,
      badgeClass: agent.badgeClass,
      borderHex: agent.accentHex,
      content: '',
      isStreaming: true,
      meta: null,
    });

    let latestPartial = '';

    try {
      const result = await executeAgentPrompt({
        agent,
        prompt,
        brief: projectBrief,
        recentLogs,
        apiMode,
        clientApiKey: geminiApiKey,
        simSpeed,
        provider: aiProvider,
        deepseekApiKey,
        agyAvailable: Boolean(agyStatus?.available),
        agyModel,
        fileData: attachedFileData,
        preferredModel: agent.preferredModel || 'auto',
        signal,
        onChunk: (partial) => {
          latestPartial = partial;
          updateLogInSession(sessionId, streamEntry.id, { content: partial });
        },
      });

      const finalLog = {
        ...streamEntry,
        content: result.text,
        isStreaming: false,
        meta: {
          modelUsed: result.modelUsed,
          durationMs: result.durationMs,
          usage: result.usage,
        },
      };

      updateLogInSession(sessionId, streamEntry.id, {
        content: result.text,
        isStreaming: false,
        meta: finalLog.meta,
      });

      return { result, logEntry: finalLog };
    } catch (err) {
      if (isAbortErr(err)) {
        if (latestPartial.trim()) {
          updateLogInSession(sessionId, streamEntry.id, {
            content: `${latestPartial}\n\n_(Dihentikan oleh Director)_`,
            isStreaming: false,
          });
        } else {
          removeLogFromSession(sessionId, streamEntry.id);
        }
      } else {
        removeLogFromSession(sessionId, streamEntry.id);
      }
      throw err;
    }
  };

  const resetWorkingNpcs = () => {
    npcRef.current.forEach((n) => {
      if (n.state === 'WORKING' || n.state === 'WALKING') {
        n.state = 'IDLE';
        n.statusBubble = '';
        n.pathQueue = [];
        n.carryingDoc = false;
      }
    });
  };

  const runSingleAgentExecution = async (agent, taskPrompt, modeLabel = 'Direct') => {
    if (!agent || isRelayRunning) return;

    const runSessionId = activeSession.id;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setSelectedNpcId(null);
    setIsRelayRunning(true);

    const dirLog = appendLogToSession(
      runSessionId,
      {
        agentId: 'director',
        agentName: 'Director (You)',
        agentRole: `${modeLabel} -> ${agent.name}`,
        badgeClass: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
        borderHex: '#ec4899',
        content: selectedFile
          ? `@${agent.name}: ${taskPrompt}\n\n📎 Lampiran: \`${selectedFile.name}\``
          : `@${agent.name}: ${taskPrompt}`,
      },
      taskPrompt
    );
    setPromptInput('');

    const currentLogs = [...logs, dirLog];
    const attachedFileData = filePayload || null;

    try {
      setPipelineStatus(`${modeLabel}: ${agent.name} menuju meja kerja...`);
      await moveNpcTo(
        agent.id,
        agent.deskSpot,
        {
          bubble: 'Menuju meja...',
          endState: 'WORKING',
          endBubble: modeLabel === 'Fast Mode' ? '⚡ Fast response...' : '⚙️ Memproses...',
          endFacing: agent.id === 'nadia' ? 'down' : 'up',
        },
        controller.signal
      );

      await runStreamingAgentCall({
        sessionId: runSessionId,
        agent,
        roleLabel: modeLabel === 'Fast Mode' ? `${agent.role} • Fast` : agent.role,
        prompt: taskPrompt,
        recentLogs: currentLogs,
        attachedFileData,
        signal: controller.signal,
      });

      setPipelineStatus(`Selesai • Seluruh tim AI berkumpul di Ruang Director...`);
      playRetroTone('report', fxEnabled);
      await gatherAllAtDirectorMeeting({
        leadReporterId: agent.id,
        isApproved: true,
        signal: controller.signal,
      });
      emitFx('confetti', 170, 178);
      setPipelineStatus(`Selesai • Semua agen AI berkumpul & melapor di Ruang Director.`);
    } catch (err) {
      if (isAbortErr(err)) {
        setPipelineStatus('Tugas dihentikan oleh Director.');
        showToast('Tugas dihentikan.', 'info');
      } else {
        setPipelineStatus(`Error: ${err.message}`);
        showToast(err.message, 'error');
      }
      resetWorkingNpcs();
    } finally {
      abortControllerRef.current = null;
      setIsRelayRunning(false);
      clearFile();
    }
  };

  const startAutoRelay = async () => {
    if (isRelayRunning) return;

    if (isReadingFile) {
      showToast('File sedang dibaca, tunggu sebentar...', 'info');
      return;
    }

    const taskPrompt = promptInput.trim();
    if (!taskPrompt) {
      showToast('Masukkan instruksi Director terlebih dahulu.', 'error');
      return;
    }

    if (selectedFile && !filePayload) {
      showToast('File belum siap. Coba pilih ulang file.', 'error');
      return;
    }

    if (workflowMode === 'fast') {
      const target = agents.find((a) => a.id === fastAgentId) || agents[1] || agents[0];
      await runSingleAgentExecution(target, taskPrompt, 'Fast Mode');
      return;
    }

    const runSessionId = activeSession.id;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsRelayRunning(true);
    npcRef.current.forEach((n) => {
      n.hasReportExclamation = false;
      n.statusBubble = '';
    });

    const directorEntry = appendLogToSession(
      runSessionId,
      {
        agentId: 'director',
        agentName: 'Director (You)',
        agentRole: 'Owner / Project Lead',
        badgeClass: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
        borderHex: '#ec4899',
        content: selectedFile ? `${taskPrompt}\n\n📎 Lampiran: \`${selectedFile.name}\`` : taskPrompt,
      },
      taskPrompt
    );
    setPromptInput('');

    const turnStartIdx = logs.length;
    const currentLogs = [...logs, directorEntry];
    const alex = agents.find((a) => a.id === 'alex') || agents[0];
    const raka = agents.find((a) => a.id === 'raka') || agents[1];
    const nadia = agents.find((a) => a.id === 'nadia') || agents[2];
    const specialists = agents.filter((a) => !CORE_AGENT_IDS.includes(a.id));
    const attachedFileData = filePayload || null;

    const isUsingLocalAgy =
      Boolean(agyStatus?.available) &&
      (aiProvider === 'agy' || (aiProvider === 'auto' && !geminiApiKey && !deepseekApiKey));

    try {
      // 1. ALEX (Tech Lead)
      setPipelineStatus(`1/3: ${alex.name} menuju Tech Lead Room...`);
      await moveNpcTo(
        alex.id,
        alex.deskSpot || WAYPOINTS.desk_alex,
        {
          bubble: 'Menuju ruang Lead...',
          endState: 'WORKING',
          endBubble: '⚙️ Analisis tugas...',
          endFacing: 'up',
        },
        controller.signal
      );

      const { logEntry: alexLog } = await runStreamingAgentCall({
        sessionId: runSessionId,
        agent: alex,
        prompt: taskPrompt,
        recentLogs: currentLogs,
        attachedFileData,
        signal: controller.signal,
      });
      currentLogs.push(alexLog);

      const firstNextTarget = specialists[0]?.deskSpot || raka.deskSpot || WAYPOINTS.desk_raka;
      setPipelineStatus(
        `Handoff: ${alex.name} menyerahkan arahan ke ${specialists[0]?.name || raka.name}...`
      );
      playRetroTone('handoff', fxEnabled);
      await moveNpcTo(
        alex.id,
        { x: firstNextTarget.x - 45, y: firstNextTarget.y + 10 },
        {
          carryingDoc: true,
          bubble: `📄 Handoff ke ${specialists[0]?.name || raka.name}...`,
          endState: 'IDLE',
        },
        controller.signal
      );
      emitFx('handoff', firstNextTarget.x - 20, firstNextTarget.y);

      const alexBack = moveNpcTo(alex.id, alex.homeSpot || WAYPOINTS.lounge_alex, {
        bubble: '☕ Ke Lounge',
        endState: 'IDLE',
        endBubble: '',
      }).catch(() => {});

      // 1B. SPECIALIST AGENTS (Opsional)
      const specialistBacks = [];
      for (let sIdx = 0; sIdx < specialists.length; sIdx++) {
        const spec = specialists[sIdx];
        setPipelineStatus(`Spesialis: ${spec.name} (${spec.role}) menuju meja kerja...`);
        await moveNpcTo(
          spec.id,
          spec.deskSpot,
          {
            bubble: 'Menuju meja...',
            endState: 'WORKING',
            endBubble: '✨ Kontribusi spesialis...',
            endFacing: 'up',
          },
          controller.signal
        );

        if (apiMode === 'live' && !isUsingLocalAgy) {
          setPipelineStatus(`Cooldown API 3 detik sebelum ${spec.name} bekerja...`);
          await abortableSleep(3000, controller.signal);
        }

        const { logEntry: specLog } = await runStreamingAgentCall({
          sessionId: runSessionId,
          agent: spec,
          prompt: taskPrompt,
          recentLogs: currentLogs,
          attachedFileData,
          signal: controller.signal,
        });
        currentLogs.push(specLog);

        const nextSpecOrRaka = specialists[sIdx + 1] || raka;
        playRetroTone('handoff', fxEnabled);
        await moveNpcTo(
          spec.id,
          { x: nextSpecOrRaka.deskSpot.x - 42, y: nextSpecOrRaka.deskSpot.y + 10 },
          {
            carryingDoc: true,
            bubble: `📄 Handoff ke ${nextSpecOrRaka.name}...`,
            endState: 'IDLE',
          },
          controller.signal
        );
        emitFx('handoff', nextSpecOrRaka.deskSpot.x - 20, nextSpecOrRaka.deskSpot.y);

        specialistBacks.push(
          moveNpcTo(spec.id, spec.homeSpot, {
            bubble: '☕ Ke Lounge',
            endState: 'IDLE',
            endBubble: '',
          }).catch(() => {})
        );
      }

      // 2 & 3. RAKA <-> NADIA QA REVISION LOOP
      let attempt = 0;
      let isApproved = false;
      let lastNadiaFeedback = '';

      while (attempt <= maxRevisions && !isApproved) {
        const isRevision = attempt > 0;
        const isFinalRevision = isRevision && attempt === maxRevisions;

        setPipelineStatus(
          isRevision
            ? `Revisi #${attempt}/${maxRevisions}: ${raka.name} ${isFinalRevision ? 'mengunci fitur utama' : 'memperbaiki hasil'}...`
            : `2/3: ${raka.name} menuju Engineering Pod...`
        );

        await moveNpcTo(
          raka.id,
          raka.deskSpot || WAYPOINTS.desk_raka,
          {
            bubble: isRevision ? `🔧 Revisi #${attempt}...` : 'Menuju meja...',
            endState: 'WORKING',
            endBubble: isFinalRevision
              ? '🎯 Finalisasi fitur inti...'
              : isRevision
                ? `🛠️ Perbaikan #${attempt}...`
                : '💻 Eksekusi solusi...',
            endFacing: 'up',
          },
          controller.signal
        );

        if (apiMode === 'live' && !isUsingLocalAgy) {
          setPipelineStatus(`Cooldown API 3 detik sebelum ${raka.name} bekerja...`);
          await abortableSleep(3000, controller.signal);
        }

        const rakaPrompt = !isRevision
          ? taskPrompt
          : isFinalRevision
            ? `${taskPrompt}\n\n[PRIORITAS REVISI TERAKHIR #${attempt}/${maxRevisions} — KUNCI FITUR UTAMA DARI QA (${nadia.name})]:\nIni adalah kesempatan revisi terakhir. Pastikan 100% FITUR PENTING / INTI dari Perintah Director sudah benar, berfungsi baik, bebas bug logika, dan kode/dokumen TERTULIS LENGKAP UTUH sampai penutup akhir tanpa terpotong atau placeholder. Jika ada detail kosmetik sekunder yang berisiko merusak fitur utama atau memotong kode, sederhanakan bagian sekunder tersebut agar hasil akhir benar-benar solid dan siap pakai.\n\nTemuan QA yang wajib dibereskan:\n${lastNadiaFeedback}`
            : `${taskPrompt}\n\n[INSTRUKSI REVISI #${attempt}/${maxRevisions} DARI QA (${nadia.name})]:\nPerbaiki seluruh temuan fitur inti & bug di bawah ini secara tuntas dan pastikan output lengkap utuh dari awal sampai akhir:\n\n${lastNadiaFeedback}`;

        const focusedLogsForRaka = buildFocusedRelayLogs(
          currentLogs,
          turnStartIdx,
          raka.id,
          nadia.id
        );

        const { logEntry: rakaLog } = await runStreamingAgentCall({
          sessionId: runSessionId,
          agent: raka,
          roleLabel: isFinalRevision
            ? `${raka.role} • Finalisasi #${attempt}`
            : isRevision
              ? `${raka.role} • Revisi #${attempt}`
              : raka.role,
          prompt: rakaPrompt,
          recentLogs: focusedLogsForRaka,
          attachedFileData,
          signal: controller.signal,
        });
        currentLogs.push(rakaLog);

        setPipelineStatus(`Handoff: ${raka.name} menyerahkan hasil ke QA Lab (${nadia.name})...`);
        playRetroTone('handoff', fxEnabled);
        await moveNpcTo(
          raka.id,
          {
            x: (nadia.deskSpot?.x ?? WAYPOINTS.desk_nadia.x) + 48,
            y: (nadia.deskSpot?.y ?? WAYPOINTS.desk_nadia.y) - 12,
          },
          {
            carryingDoc: true,
            bubble: isRevision ? `📄 Kirim Revisi #${attempt}...` : '📄 Handoff ke Nadia...',
            endState: 'IDLE',
          },
          controller.signal
        );
        emitFx(
          'handoff',
          (nadia.deskSpot?.x ?? WAYPOINTS.desk_nadia.x) + 20,
          nadia.deskSpot?.y ?? WAYPOINTS.desk_nadia.y
        );

        setPipelineStatus(
          isRevision
            ? `Audit Ulang #${attempt}: ${nadia.name} memeriksa kelayakan fitur utama...`
            : `3/3: ${nadia.name} menuju QA & Review Lab...`
        );

        await moveNpcTo(
          nadia.id,
          nadia.deskSpot || WAYPOINTS.desk_nadia,
          {
            bubble: 'Menuju QA Lab...',
            endState: 'WORKING',
            endBubble: isRevision ? `🔍 Audit ulang #${attempt}...` : '🔍 Verifikasi QA...',
            endFacing: 'down',
          },
          controller.signal
        );

        if (apiMode === 'live' && !isUsingLocalAgy) {
          setPipelineStatus(`Cooldown API 3 detik sebelum ${nadia.name} mengaudit...`);
          await abortableSleep(3000, controller.signal);
        }

        const nadiaAgentWithStatusRule = {
          ...nadia,
          sop: `${nadia.sop}\n\nATURAN OUTPUT WAJIB QA:
1. Periksa hasil kerja terakhir ${raka.name} terhadap Perintah Director dengan memisahkan antara FITUR PENTING/INTI (kebenaran logika, syarat utama, kode utuh tidak terpotong) dan detail kosmetik minor.
2. Jika seluruh fitur penting sudah benar, utuh, dan layak pakai, akhiri respons Anda dengan label persis: [STATUS: VERIFIED] (saran kosmetik minor boleh ditulis singkat tanpa menggagalkan status).
3. Jika masih ada kekurangan pada FITUR PENTING, bug fungsional, atau output terpotong, tuliskan poin perbaikan inti yang jelas dan fokus untuk ${raka.name}, lalu akhiri respons dengan label persis: [STATUS: REVISED]`,
        };

        const nadiaPrompt = isFinalRevision
          ? `${taskPrompt}\n\n[AUDIT AKHIR PASCA REVISI MAKSIMAL #${attempt}/${maxRevisions}]: Verifikasi apakah seluruh FITUR PENTING / UTAMA pada hasil terakhir ${raka.name} sudah benar, utuh (tidak terpotong), dan layak digunakan Director. Jika fitur utama sudah oke dan berfungsi baik meskipun ada catatan estetika minor, luluskan dengan [STATUS: VERIFIED]. Hanya berikan [STATUS: REVISED] jika fitur utama benar-benar salah fatal atau terpotong.`
          : isRevision
            ? `${taskPrompt}\n\n[AUDIT ULANG REVISI #${attempt}/${maxRevisions}]: Periksa apakah ${raka.name} sudah menuntaskan perbaikan fitur inti sebelumnya. Jika masih perlu revisi berikutnya, berikan daftar perbaikan prioritas utama yang paling krusial agar tuntas pada revisi terakhir. Akhiri dengan [STATUS: VERIFIED] atau [STATUS: REVISED].`
            : `${taskPrompt}\n\nLakukan audit QA pada hasil kerja ${raka.name} dengan fokus pada fitur penting, kebenaran logika, dan kelengkapan kode utuh. Akhiri dengan [STATUS: VERIFIED] jika lulus, atau [STATUS: REVISED] beserta daftar perbaikan fitur inti yang harus diprioritaskan jika gagal.`;

        const focusedLogsForNadia = buildFocusedRelayLogs(
          currentLogs,
          turnStartIdx,
          raka.id,
          nadia.id
        );

        const { result: nadiaRes, logEntry: nadiaLog } = await runStreamingAgentCall({
          sessionId: runSessionId,
          agent: nadiaAgentWithStatusRule,
          roleLabel: `${nadia.role} • Mengaudit...`,
          prompt: nadiaPrompt,
          recentLogs: focusedLogsForNadia,
          attachedFileData,
          signal: controller.signal,
        });

        const verified = /\[STATUS:\s*VERIFIED\]/i.test(nadiaRes.text);
        const finalNadiaRole = verified
          ? `${nadia.role} • APPROVED`
          : `${nadia.role} • REJECTED (#${attempt + 1})`;
        updateLogInSession(runSessionId, nadiaLog.id, { agentRole: finalNadiaRole });
        currentLogs.push({ ...nadiaLog, agentRole: finalNadiaRole });

        if (verified) {
          isApproved = true;
        } else {
          lastNadiaFeedback = nadiaRes.text;
          attempt++;

          if (attempt <= maxRevisions) {
            setPipelineStatus(
              `QA Gagal: ${nadia.name} mengembalikan tugas ke ${raka.name} untuk Revisi #${attempt}...`
            );
            playRetroTone('handoff', fxEnabled);
            await moveNpcTo(
              nadia.id,
              {
                x: (raka.deskSpot?.x ?? WAYPOINTS.desk_raka.x) + 45,
                y: (raka.deskSpot?.y ?? WAYPOINTS.desk_raka.y) + 10,
              },
              {
                carryingDoc: true,
                bubble: `❌ Revisi #${attempt} ke Raka`,
                endState: 'IDLE',
              },
              controller.signal
            );
          }
        }
      }

      if (!isApproved) {
        appendLogToSession(runSessionId, {
          agentId: nadia.id,
          agentName: nadia.name,
          agentRole: `${nadia.role} • Escalation`,
          badgeClass: nadia.badgeClass,
          borderHex: '#f59e0b',
          content: `⚠️ **Peringatan QA:** Batas maksimal **${maxRevisions}x revisi** telah tercapai namun kriteria QA belum terpenuhi sepenuhnya. Mohon Director meninjau hasil terakhir ${raka.name} secara manual.`,
        });
      }

      setPipelineStatus(
        isApproved
          ? 'Selesai (QA Approved): Seluruh tim AI berkumpul di Ruang Director!'
          : 'Selesai (Batas Revisi): Seluruh tim AI berkumpul di Ruang Director!'
      );
      playRetroTone('report', fxEnabled);
      await gatherAllAtDirectorMeeting({
        leadReporterId: nadia.id,
        isApproved,
        signal: controller.signal,
      });

      if (isApproved) {
        emitFx('confetti', 170, 178);
      }

      await Promise.all([alexBack, ...specialistBacks]);

      if (isApproved) {
        setPipelineStatus(
          attempt > 0
            ? `Estafet Selesai • Lulus QA setelah ${attempt}x revisi (!)`
            : 'Estafet Selesai • Lulus QA pada percobaan pertama (!)'
        );
        showToast(
          attempt > 0 ? `Tugas lulus QA setelah ${attempt}x revisi!` : 'Tugas langsung lulus QA!',
          'success'
        );
      } else {
        setPipelineStatus(`Estafet Selesai • Batas ${maxRevisions}x revisi tercapai (!)`);
        showToast(`Batas maksimal ${maxRevisions}x revisi tercapai. Silakan tinjau laporan.`, 'info');
      }
    } catch (err) {
      if (isAbortErr(err)) {
        setPipelineStatus('Estafet dihentikan oleh Director.');
        showToast('Simulasi dihentikan.', 'info');
      } else {
        setPipelineStatus(`Error: ${err.message}`);
        showToast(err.message, 'error');
      }
      resetWorkingNpcs();
    } finally {
      abortControllerRef.current = null;
      setIsRelayRunning(false);
      clearFile();
    }
  };

  const dispatchSingleAgent = async () => {
    if (!selectedNpcId || isRelayRunning) return;
    if (isReadingFile) {
      showToast('File sedang dibaca, tunggu sebentar...', 'info');
      return;
    }
    if (selectedFile && !filePayload) {
      showToast('File belum siap. Coba pilih ulang file.', 'error');
      return;
    }
    const agent = agents.find((a) => a.id === selectedNpcId);
    if (!agent) return;
    const taskPrompt =
      promptInput.trim() || 'Berikan ringkasan evaluasi singkat sesuai peran Anda.';
    await runSingleAgentExecution(agent, taskPrompt, 'Direct');
  };

  return {
    isRelayRunning,
    setIsRelayRunning,
    pipelineStatus,
    setPipelineStatus,
    startAutoRelay,
    dispatchSingleAgent,
    stopActiveRun,
  };
}
