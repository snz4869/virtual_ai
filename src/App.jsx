import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Square,
  Download,
  RotateCcw,
  FileText,
  Users,
  Volume2,
  VolumeX,
  X
} from 'lucide-react';
import OfficeCanvas2D from './components/OfficeCanvas2D';
import {
  DEFAULT_AGENTS,
  DEFAULT_BRIEF,
  PRESET_PROMPTS,
  WAYPOINTS
} from './constants/officeConfig';
import { buildOfficePath } from './utils/pathfinding';
import { executeAgentPrompt } from './utils/geminiClient';
import { playRetroTone } from './utils/audio';

const STORAGE_KEY = 'virtual_office_ai_v2_1';

function formatMarkdownLite(rawText) {
  let text = String(rawText || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const codeBlocks = [];
  text = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const token = `__CODE_${codeBlocks.length}__`;
    codeBlocks.push(
      `<div class="my-2 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950">
        <div class="px-2.5 py-1 bg-slate-800/80 border-b border-slate-700/70 text-[10px] font-mono text-slate-400">${lang || 'code'}</div>
        <pre class="p-2.5 overflow-x-auto text-[11px] font-mono text-emerald-300 leading-relaxed"><code>${code.trim()}</code></pre>
      </div>`
    );
    return token;
  });

  text = text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>');
  text = text.replace(/\*(.+?)\*/g, '<em class="italic text-slate-300">$1</em>');
  text = text.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-[11px]">$1</code>');
  text = text.replace(/\n/g, '<br>');

  codeBlocks.forEach((b, i) => {
    text = text.replace(`__CODE_${i}__`, b);
  });
  return text;
}

export default function App() {
  const [projectBrief, setProjectBrief] = useState(DEFAULT_BRIEF);
  const [apiMode, setApiMode] = useState('demo');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [agents, setAgents] = useState(DEFAULT_AGENTS);
  const [logs, setLogs] = useState([]);
  const [promptInput, setPromptInput] = useState(PRESET_PROMPTS[0]);

  const [simSpeed, setSimSpeed] = useState(1);
  const [fxEnabled, setFxEnabled] = useState(true);
  const [logFilter, setLogFilter] = useState('all');
  const [isRelayRunning, setIsRelayRunning] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState('Kantor Siap • Gerakkan Director (WASD/Klik) atau Jalankan Tim');
  const [selectedNpcId, setSelectedNpcId] = useState(null);
  const [toast, setToast] = useState(null);

  const [activeModal, setActiveModal] = useState(null); // 'settings' | 'sop' | null
  const [draftBrief, setDraftBrief] = useState(DEFAULT_BRIEF);
  const [draftMode, setDraftMode] = useState('demo');
  const [draftKey, setDraftKey] = useState('');
  const [draftAgents, setDraftAgents] = useState(DEFAULT_AGENTS);

  const abortRef = useRef(false);
  const logEndRef = useRef(null);

  const directorRef = useRef({
    name: 'Director (You)',
    accentHex: '#ec4899',
    hairColor: '#f8fafc',
    skinColor: '#fde68a',
    x: WAYPOINTS?.director_home?.x ?? WAYPOINTS?.directorDesk?.x ?? 175,
    y: WAYPOINTS?.director_home?.y ?? WAYPOINTS?.directorDesk?.y ?? 185,
    facing: 'right',
    walkPhase: 0,
    isMoving: false,
    pathQueue: [],
    targetMarker: null
  });

  const npcRef = useRef(
    DEFAULT_AGENTS.map((a) => ({
      ...a,
      x: a.homeSpot?.x ?? WAYPOINTS.lounge_alex.x,
      y: a.homeSpot?.y ?? WAYPOINTS.lounge_alex.y,
      homeSpot: a.homeSpot || WAYPOINTS.lounge_alex,
      deskSpot: a.deskSpot || WAYPOINTS.desk_alex,
      state: 'IDLE',
      statusBubble: '',
      carryingDoc: false,
      hasReportExclamation: false,
      pathQueue: [],
      onArriveCallback: null,
      walkPhase: Math.random() * 6,
      facing: 'down',
      roamTarget: null,
      roamCooldown: 1 + Math.random() * 2
    }))
  );

  // Load saved state
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved) {
        if (saved.projectBrief) setProjectBrief(saved.projectBrief);
        if (saved.apiMode) setApiMode(saved.apiMode);
        if (saved.geminiApiKey) setGeminiApiKey(saved.geminiApiKey);
        if (Array.isArray(saved.logs)) setLogs(saved.logs);
        if (Array.isArray(saved.agents) && saved.agents.length === 3) {
          const mergedAgents = DEFAULT_AGENTS.map((def, idx) => ({
            ...def,
            name: saved.agents[idx]?.name || def.name,
            role: saved.agents[idx]?.role || def.role,
            sop: saved.agents[idx]?.sop || def.sop,
          }));
          setAgents(mergedAgents);
          npcRef.current.forEach((npc, idx) => {
            npc.name = mergedAgents[idx].name;
            npc.role = mergedAgents[idx].role;
            npc.sop = mergedAgents[idx].sop;
            npc.homeSpot = mergedAgents[idx].homeSpot;
            npc.deskSpot = mergedAgents[idx].deskSpot;
          });
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);
  
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ projectBrief, apiMode, geminiApiKey, agents, logs })
      );
    } catch {
      // ignore
    }
  }, [projectBrief, apiMode, geminiApiKey, agents, logs]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, logFilter]);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const moveNpcTo = (npcId, targetPoint, options = {}) => {
    return new Promise((resolve) => {
      const npc = npcRef.current.find((n) => n.id === npcId);
      if (!npc) return resolve();

      npc.roamTarget = null;
      npc.state = 'WALKING';
      npc.carryingDoc = Boolean(options.carryingDoc);
      npc.statusBubble = options.bubble || '';
      npc.hasReportExclamation = false;
      npc.pathQueue = buildOfficePath(npc.x, npc.y, targetPoint);
      npc.onArriveCallback = () => {
        npc.state = options.endState || 'IDLE';
        npc.carryingDoc = false;
        npc.statusBubble = options.endBubble || '';
        npc.hasReportExclamation = Boolean(options.showExclamation);
        if (options.endFacing) npc.facing = options.endFacing;
        resolve();
      };
    });
  };

  const appendLog = (entry) => {
    setLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        ...entry
      }
    ]);
  };

  const startAutoRelay = async () => {
    if (isRelayRunning) return;
    const taskPrompt = promptInput.trim();
    if (!taskPrompt) {
      showToast('Masukkan instruksi Director terlebih dahulu.', 'error');
      return;
    }

    setIsRelayRunning(true);
    abortRef.current = false;
    npcRef.current.forEach((n) => {
      n.hasReportExclamation = false;
      n.statusBubble = '';
    });

    const directorEntry = {
      agentId: 'director',
      agentName: 'Director (You)',
      agentRole: 'Owner / Project Lead',
      badgeClass: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
      borderHex: '#ec4899',
      content: taskPrompt
    };
    appendLog(directorEntry);
    setPromptInput('');

    const currentLogs = [...logs, directorEntry];
    const [alex, raka, nadia] = agents;

    try {
      // 1. Alex (Tech Lead Room)
      if (abortRef.current) throw new Error('ABORTED');
      setPipelineStatus(`1/3: ${alex.name} menuju Tech Lead Room...`);
      await moveNpcTo('alex', WAYPOINTS.desk_alex, {
        bubble: 'Menuju ruang Lead...',
        endState: 'WORKING',
        endBubble: '⚙️ Analisis tugas...',
        endFacing: 'up'
      });

      const alexOut = await executeAgentPrompt({
        agent: alex,
        prompt: taskPrompt,
        brief: projectBrief,
        recentLogs: currentLogs,
        apiMode,
        clientApiKey: geminiApiKey,
        simSpeed
      });
      if (abortRef.current) throw new Error('ABORTED');

      const alexLog = {
        agentId: alex.id,
        agentName: alex.name,
        agentRole: alex.role,
        badgeClass: alex.badgeClass,
        borderHex: alex.accentHex,
        content: alexOut
      };
      appendLog(alexLog);
      currentLogs.push(alexLog);

      // Handoff to Raka
      setPipelineStatus(`Handoff: ${alex.name} menyerahkan arahan ke Engineering Pod (${raka.name})...`);
      playRetroTone('handoff', fxEnabled);
      await moveNpcTo('alex', { x: WAYPOINTS.desk_raka.x - 45, y: WAYPOINTS.desk_raka.y + 10 }, {
        carryingDoc: true,
        bubble: '📄 Handoff ke Raka...',
        endState: 'IDLE'
      });
      const alexBack = moveNpcTo('alex', WAYPOINTS.lounge_alex, {
        bubble: '☕ Ke Lounge',
        endState: 'IDLE',
        endBubble: ''
      });

      // 2. Raka (Engineering Pod)
      if (abortRef.current) throw new Error('ABORTED');
      setPipelineStatus(`2/3: ${raka.name} menuju Engineering Pod...`);
      await moveNpcTo('raka', WAYPOINTS.desk_raka, {
        bubble: 'Menuju meja...',
        endState: 'WORKING',
        endBubble: '💻 Eksekusi solusi...',
        endFacing: 'up'
      });

      if (apiMode === 'live') {
        setPipelineStatus(`Cooldown API 3 detik sebelum ${raka.name} bekerja...`);
        await new Promise((r) => setTimeout(r, 3000));
      }

      const rakaOut = await executeAgentPrompt({
        agent: raka,
        prompt: taskPrompt,
        brief: projectBrief,
        recentLogs: currentLogs,
        apiMode,
        clientApiKey: geminiApiKey,
        simSpeed
      });
      if (abortRef.current) throw new Error('ABORTED');

      const rakaLog = {
        agentId: raka.id,
        agentName: raka.name,
        agentRole: raka.role,
        badgeClass: raka.badgeClass,
        borderHex: raka.accentHex,
        content: rakaOut
      };
      appendLog(rakaLog);
      currentLogs.push(rakaLog);

      // Handoff to Nadia
      setPipelineStatus(`Handoff: ${raka.name} menyerahkan hasil ke QA Lab (${nadia.name})...`);
      playRetroTone('handoff', fxEnabled);
      await moveNpcTo('raka', { x: WAYPOINTS.desk_nadia.x + 48, y: WAYPOINTS.desk_nadia.y - 12 }, {
        carryingDoc: true,
        bubble: '📄 Handoff ke Nadia...',
        endState: 'IDLE'
      });
      const rakaBack = moveNpcTo('raka', WAYPOINTS.lounge_raka, {
        bubble: '☕ Ke Lounge',
        endState: 'IDLE',
        endBubble: ''
      });

      // 3. Nadia (QA & Review Lab)
      if (abortRef.current) throw new Error('ABORTED');
      setPipelineStatus(`3/3: ${nadia.name} menuju QA & Review Lab...`);
      await moveNpcTo('nadia', WAYPOINTS.desk_nadia, {
        bubble: 'Menuju QA Lab...',
        endState: 'WORKING',
        endBubble: '🔍 Verifikasi QA...',
        endFacing: 'down'
      });

      if (apiMode === 'live') {
        setPipelineStatus(`Cooldown API 3 detik sebelum ${nadia.name} bekerja...`);
        await new Promise((r) => setTimeout(r, 3000));
      }

      const nadiaOut = await executeAgentPrompt({
        agent: nadia,
        prompt: taskPrompt,
        brief: projectBrief,
        recentLogs: currentLogs,
        apiMode,
        clientApiKey: geminiApiKey,
        simSpeed
      });
      if (abortRef.current) throw new Error('ABORTED');

      const nadiaLog = {
        agentId: nadia.id,
        agentName: nadia.name,
        agentRole: nadia.role,
        badgeClass: nadia.badgeClass,
        borderHex: nadia.accentHex,
        content: nadiaOut
      };
      appendLog(nadiaLog);

      // Report to Director Office
      setPipelineStatus(`Selesai: ${nadia.name} melapor ke Director Office!`);
      playRetroTone('report', fxEnabled);
      await moveNpcTo('nadia', WAYPOINTS.director_report, {
        carryingDoc: true,
        bubble: '📋 Melapor ke Director...',
        endState: 'REPORTING',
        showExclamation: true,
        endFacing: 'left'
      });

      await Promise.all([alexBack, rakaBack]);
      setPipelineStatus('Estafet Selesai • Laporan siap direview (!)');
      showToast('Seluruh tim telah menyelesaikan tugas secara proporsional!', 'success');
    } catch (err) {
      if (err.message === 'ABORTED') {
        setPipelineStatus('Estafet dihentikan oleh Director.');
        showToast('Simulasi dihentikan.', 'info');
      } else {
        setPipelineStatus(`Error: ${err.message}`);
        showToast(err.message, 'error');
      }
      npcRef.current.forEach((n) => {
        if (n.state === 'WORKING') {
          n.state = 'IDLE';
          n.statusBubble = '';
        }
      });
    } finally {
      setIsRelayRunning(false);
    }
  };

  const dispatchSingleAgent = async () => {
    if (!selectedNpcId || isRelayRunning) return;
    const agent = agents.find((a) => a.id === selectedNpcId);
    if (!agent) return;

    const taskPrompt =
      promptInput.trim() || 'Berikan ringkasan evaluasi singkat sesuai peran Anda.';
    setSelectedNpcId(null);
    setIsRelayRunning(true);
    abortRef.current = false;

    const dirLog = {
      agentId: 'director',
      agentName: 'Director (You)',
      agentRole: `Direct -> ${agent.name}`,
      badgeClass: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
      borderHex: '#ec4899',
      content: `@${agent.name}: ${taskPrompt}`
    };
    appendLog(dirLog);
    setPromptInput('');

    try {
      setPipelineStatus(`Tugas Langsung: ${agent.name} menuju meja kerja...`);
      await moveNpcTo(agent.id, agent.deskSpot, {
        bubble: 'Menuju meja...',
        endState: 'WORKING',
        endBubble: '⚙️ Memproses...',
        endFacing: agent.id === 'nadia' ? 'down' : 'up'
      });

      const out = await executeAgentPrompt({
        agent,
        prompt: taskPrompt,
        brief: projectBrief,
        recentLogs: [...logs, dirLog],
        apiMode,
        clientApiKey: geminiApiKey,
        simSpeed
      });
      if (abortRef.current) throw new Error('ABORTED');

      appendLog({
        agentId: agent.id,
        agentName: agent.name,
        agentRole: agent.role,
        badgeClass: agent.badgeClass,
        borderHex: agent.accentHex,
        content: out
      });

      playRetroTone('report', fxEnabled);
      await moveNpcTo(agent.id, WAYPOINTS.director_report, {
        carryingDoc: true,
        bubble: '📋 Melapor...',
        endState: 'REPORTING',
        showExclamation: true,
        endFacing: 'left'
      });
      setPipelineStatus(`Selesai • ${agent.name} melapor di Director Office.`);
    } catch (err) {
      if (err.message !== 'ABORTED') showToast(err.message, 'error');
    } finally {
      setIsRelayRunning(false);
    }
  };

  const resetOffice = () => {
    abortRef.current = true;
    setIsRelayRunning(false);
    setLogs([]);
    setSelectedNpcId(null);
    directorRef.current.x = WAYPOINTS?.director_home?.x ?? 175;
    directorRef.current.y = WAYPOINTS?.director_home?.y ?? 185;
    directorRef.current.pathQueue = [];

    npcRef.current.forEach((npc, idx) => {
      const def = agents[idx];
      npc.x = def.homeSpot.x;
      npc.y = def.homeSpot.y;
      npc.state = 'IDLE';
      npc.statusBubble = '';
      npc.carryingDoc = false;
      npc.hasReportExclamation = false;
      npc.pathQueue = [];
      npc.roamTarget = null;
    });
    setPipelineStatus('Kantor Direset • Semua karakter kembali ke posisi awal');
    playRetroTone('click', fxEnabled);
    showToast('Kantor dan log berhasil direset.', 'info');
  };

  const exportMarkdown = () => {
    if (logs.length === 0) {
      showToast('Belum ada log untuk diekspor.', 'info');
      return;
    }
    let md = `# Virtual Office AI (BRD v2.1) — Transkrip Kerja\n\n`;
    logs.forEach((l) => {
      md += `### [${l.agentName} — ${l.agentRole}] (${l.timestamp})\n${l.content}\n\n---\n\n`;
    });
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `virtual-office-v2.1-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Laporan Markdown (.md) diunduh.', 'success');
  };

  const inspectedAgent = agents.find((a) => a.id === selectedNpcId);
  const filteredLogs = logFilter === 'all' ? logs : logs.filter((l) => l.agentId === logFilter);

  return (
    <div className="bg-slate-950 text-slate-200 font-sans lg:h-screen lg:overflow-hidden flex flex-col">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-medium text-white shadow-2xl">
          {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-emerald-500 to-amber-500 p-0.5">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-mono font-bold text-xs text-white">
              VO<span className="text-emerald-400">2D</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm text-white">Virtual Office AI</h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                BRD v2.1 • 5 Rooms
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Adaptive Multi-Agent Workspace (Anti-Overengineering)</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs">
            <button
              onClick={() => setSimSpeed(1)}
              className={`px-2.5 py-1 rounded-lg font-mono font-semibold ${
                simSpeed === 1 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              1x
            </button>
            <button
              onClick={() => setSimSpeed(2)}
              className={`px-2.5 py-1 rounded-lg font-mono font-semibold ${
                simSpeed === 2 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              2x
            </button>
          </div>

          <button
            onClick={() => setFxEnabled(!fxEnabled)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium border border-slate-700 flex items-center gap-1.5"
          >
            {fxEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            <span className="hidden sm:inline">{fxEnabled ? 'Audio: ON' : 'Audio: OFF'}</span>
          </button>

          <button
            onClick={() => {
              setDraftBrief(projectBrief);
              setDraftMode(apiMode);
              setDraftKey(geminiApiKey);
              setActiveModal('settings');
            }}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border ${
              apiMode === 'live'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${apiMode === 'live' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span>{apiMode === 'live' ? 'Live: Interactions API' : 'Demo Mode'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setDraftBrief(projectBrief);
              setDraftMode(apiMode);
              setDraftKey(geminiApiKey);
              setActiveModal('settings');
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium border border-slate-700 flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Brief & API</span>
          </button>
          <button
            onClick={() => {
              setDraftAgents(JSON.parse(JSON.stringify(agents)));
              setActiveModal('sop');
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium border border-slate-700 flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">SOP Agen</span>
          </button>
          <button
            onClick={exportMarkdown}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium border border-slate-700 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
          </button>
          <button
            onClick={resetOffice}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/70 text-xs font-medium border border-slate-700 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* MAIN SPLIT VIEW */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT 60%: 2D CANVAS */}
        <section className="w-full lg:w-[60%] h-[54vh] lg:h-full bg-slate-950 relative flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 shrink-0">
          <div className="absolute top-3 left-3 z-10 pointer-events-none">
            <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-1.5 text-[11px] text-slate-300">
              Gerakkan <strong>Director</strong> via <strong>WASD / Arrow / Klik Lantai</strong> &bull; Klik <strong>NPC</strong> untuk inspeksi
            </div>
          </div>

          <OfficeCanvas2D
            npcRef={npcRef}
            directorRef={directorRef}
            simSpeed={simSpeed}
            fxEnabled={fxEnabled}
            selectedNpcId={selectedNpcId}
            onSelectNpc={setSelectedNpcId}
            onClearInspector={() => setSelectedNpcId(null)}
          />

          {inspectedAgent && (
            <div className="absolute bottom-12 left-3 w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl p-3.5 shadow-2xl z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white">{inspectedAgent.name}</h3>
                  <p className="text-[11px] text-indigo-300">{inspectedAgent.role}</p>
                </div>
                <button onClick={() => setSelectedNpcId(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 line-clamp-3 bg-slate-950 p-2 rounded-lg border border-slate-800">
                {inspectedAgent.sop}
              </p>
              <button
                onClick={dispatchSingleAgent}
                className="mt-2.5 w-full py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Tugaskan Langsung {inspectedAgent.name}
              </button>
            </div>
          )}

          <div className="bg-slate-900/95 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-[11px] shrink-0">
            <span className="text-slate-400">5 Rooms • Idle Roaming Active</span>
            <span className="font-mono text-indigo-400 truncate">{pipelineStatus}</span>
          </div>
        </section>

        {/* RIGHT 40%: DIRECTOR INPUT & WORK LOGS */}
        <section className="w-full lg:w-[40%] flex-1 lg:h-full bg-slate-900/50 flex flex-col min-h-0">
          <div className="p-3.5 border-b border-slate-800 bg-slate-900/90 space-y-2.5 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Perintah Director</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPromptInput(PRESET_PROMPTS[0])}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  Tes Ringkas (Akar 34)
                </button>
                <button
                  onClick={() => setPromptInput(PRESET_PROMPTS[1])}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  Tes Teknis (API)
                </button>
              </div>
            </div>

            <textarea
              rows={2}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  startAutoRelay();
                }
              }}
              placeholder="Ketik pertanyaan ringkas atau spesifikasi sistem..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
            />

            <div className="flex items-center gap-2">
              <button
                disabled={isRelayRunning}
                onClick={startAutoRelay}
                className="flex-1 py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Jalankan Tim (Auto-Relay)</span>
              </button>
              {isRelayRunning && (
                <button
                  onClick={() => {
                    abortRef.current = true;
                  }}
                  className="py-2 px-3.5 rounded-xl bg-rose-600/20 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Stop</span>
                </button>
              )}
            </div>
          </div>

          <div className="px-3.5 py-2 border-b border-slate-800 bg-slate-925 flex items-center gap-1.5 overflow-x-auto shrink-0">
            {['all', 'alex', 'raka', 'nadia'].map((id) => (
              <button
                key={id}
                onClick={() => setLogFilter(id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize ${
                  logFilter === id ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-white'
                }`}
              >
                {id === 'all' ? `Semua (${logs.length})` : id}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {filteredLogs.length === 0 ? (
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 text-center text-xs text-slate-400 my-4">
                Belum ada log kerja. Coba tombol <strong>Tes Ringkas (Akar 34)</strong> atau <strong>Tes Teknis (API)</strong> untuk melihat mode adaptif anti-overengineering.
              </div>
            ) : (
              filteredLogs.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900/95 border border-slate-800 rounded-2xl p-3.5"
                  style={{ borderLeftWidth: 4, borderLeftColor: item.borderHex }}
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{item.agentName}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${item.badgeClass}`}>
                        {item.agentRole}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{item.timestamp}</span>
                  </div>
                  <div
                    className="text-xs text-slate-200 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatMarkdownLite(item.content) }}
                  />
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        </section>
      </div>

      {/* MODAL SETTINGS */}
      {activeModal === 'settings' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Konfigurasi Project Brief & Gemini API</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Project Brief (Aturan Global)</label>
              <textarea
                rows={4}
                value={draftBrief}
                onChange={(e) => setDraftBrief(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs font-mono text-slate-200"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                <input
                  type="radio"
                  checked={draftMode === 'demo'}
                  onChange={() => setDraftMode('demo')}
                />
                <span>Demo Mode (Simulasi Adaptif Tanpa API Key)</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
                <input
                  type="radio"
                  checked={draftMode === 'live'}
                  onChange={() => setDraftMode('live')}
                />
                <span>Live Gemini Interactions API</span>
              </label>

              {draftMode === 'live' && (
                <input
                  type="password"
                  value={draftKey}
                  onChange={(e) => setDraftKey(e.target.value)}
                  placeholder="Tempel Gemini API Key (AQ.Ab8... atau AIzaSy...)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                />
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setActiveModal(null)} className="px-3.5 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800">
                Batal
              </button>
              <button
                onClick={() => {
                  setProjectBrief(draftBrief);
                  setApiMode(draftMode);
                  setGeminiApiKey(draftKey);
                  setActiveModal(null);
                  showToast('Pengaturan disimpan.', 'success');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SOP AGEN */}
      {activeModal === 'sop' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Edit SOP Karakter NPC</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {draftAgents.map((ag, idx) => (
              <div key={ag.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={ag.name}
                    onChange={(e) => {
                      const next = [...draftAgents];
                      next[idx].name = e.target.value;
                      setDraftAgents(next);
                    }}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                  <input
                    value={ag.role}
                    onChange={(e) => {
                      const next = [...draftAgents];
                      next[idx].role = e.target.value;
                      setDraftAgents(next);
                    }}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <textarea
                  rows={3}
                  value={ag.sop}
                  onChange={(e) => {
                    const next = [...draftAgents];
                    next[idx].sop = e.target.value;
                    setDraftAgents(next);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                />
              </div>
            ))}

            <div className="flex justify-end gap-2">
              <button onClick={() => setActiveModal(null)} className="px-3.5 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800">
                Batal
              </button>
              <button
                onClick={() => {
                  setAgents(draftAgents);
                  npcRef.current.forEach((npc, idx) => {
                    npc.name = draftAgents[idx].name;
                    npc.role = draftAgents[idx].role;
                    npc.sop = draftAgents[idx].sop;
                  });
                  setActiveModal(null);
                  showToast('SOP agen diperbarui.', 'success');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white"
              >
                Simpan SOP
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
