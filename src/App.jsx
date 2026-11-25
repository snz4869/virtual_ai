import React, { useEffect, useRef, useState } from 'react';
import HeaderBar from './components/HeaderBar';
import OfficeViewport from './components/OfficeViewport';
import WorkPanel from './components/WorkPanel';
import SettingsModal from './components/SettingsModal';
import TeamSopModal from './components/TeamSopModal';
import HtmlPreviewModal from './components/HtmlPreviewModal';
import { MEETING_SEATS, PRESET_PROMPTS } from './constants/officeConfig';
import { createSession, useOfficeState } from './hooks/useOfficeState';
import { useOfficeRelay } from './hooks/useOfficeRelay';
import { playRetroTone } from './utils/audio';
import { ALLOWED_FILE_TYPES, prepareFilePayload } from './utils/fileParser';

export default function App() {
  const office = useOfficeState();

  const [promptInput, setPromptInput] = useState(PRESET_PROMPTS[0]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePayload, setFilePayload] = useState(null);
  const [isReadingFile, setIsReadingFile] = useState(false);

  const [simSpeed, setSimSpeed] = useState(1);
  const [fxEnabled, setFxEnabled] = useState(true);
  const [logFilter, setLogFilter] = useState('all');
  const [selectedNpcId, setSelectedNpcId] = useState(null);
  const [toast, setToast] = useState(null);
  const [previewHtmlCode, setPreviewHtmlCode] = useState(null);
  const [cameraZoom, setCameraZoom] = useState(1);
  const [followDirector, setFollowDirector] = useState(false);
  const [showAmbientStaff, setShowAmbientStaff] = useState(true);
  const [activeModal, setActiveModal] = useState(null);

  const fxEventsRef = useRef([]);
  const logEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const toastTimerRef = useRef(null);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3200);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setFilePayload(null);
    setIsReadingFile(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      showToast('Tipe file tidak didukung. Gunakan PDF, DOCX, XLSX, PNG, JPG, atau WEBP.', 'error');
      e.target.value = '';
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      showToast('File terlalu besar (maks ~3MB untuk mode serverless).', 'error');
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    setFilePayload(null);
    setIsReadingFile(true);

    try {
      const payload = await prepareFilePayload(file);
      setFilePayload(payload);
      showToast(`File "${file.name}" siap dikirim.`, 'success');
    } catch (err) {
      showToast(err?.message || 'Gagal membaca file.', 'error');
      setSelectedFile(null);
      setFilePayload(null);
      e.target.value = '';
    } finally {
      setIsReadingFile(false);
    }
  };

  const relay = useOfficeRelay({
    directorRef: office.directorRef,
    npcRef: office.npcRef,
    fxEventsRef,
    agents: office.agents,
    activeSession: office.activeSession,
    logs: office.logs,
    projectBrief: office.projectBrief,
    apiMode: office.apiMode,
    aiProvider: office.aiProvider,
    geminiApiKey: office.geminiApiKey,
    deepseekApiKey: office.deepseekApiKey,
    simSpeed,
    fxEnabled,
    maxRevisions: office.maxRevisions,
    workflowMode: office.workflowMode,
    fastAgentId: office.fastAgentId,
    promptInput,
    setPromptInput,
    selectedFile,
    filePayload,
    isReadingFile,
    clearFile,
    selectedNpcId,
    setSelectedNpcId,
    appendLogToSession: office.appendLogToSession,
    updateLogInSession: office.updateLogInSession,
    removeLogFromSession: office.removeLogFromSession,
    showToast,
  });

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [office.logs.length, logFilter, office.activeSessionId]);

  const handleNewSession = () => {
    if (relay.isRelayRunning) {
      showToast('Hentikan simulasi dulu sebelum membuat sesi baru.', 'info');
      return;
    }
    const fresh = createSession(`Sesi ${office.sessions.length + 1}`);
    office.setSessions((prev) => [fresh, ...prev]);
    office.setActiveSessionId(fresh.id);
    setLogFilter('all');
    showToast('Sesi kerja baru dibuat (konteks bersih).', 'success');
  };

  const handleDeleteSession = () => {
    if (relay.isRelayRunning) {
      showToast('Hentikan simulasi dulu sebelum menghapus sesi.', 'info');
      return;
    }
    if (office.sessions.length <= 1) {
      const fresh = createSession('Sesi 1');
      office.setSessions([fresh]);
      office.setActiveSessionId(fresh.id);
      showToast('Log sesi dibersihkan.', 'info');
      return;
    }
    const remaining = office.sessions.filter((s) => s.id !== office.activeSession.id);
    office.setSessions(remaining);
    office.setActiveSessionId(remaining[0].id);
    showToast('Sesi dihapus.', 'info');
  };

  const resetOffice = () => {
    relay.stopActiveRun();
    relay.setIsRelayRunning(false);
    const fresh = createSession('Sesi 1');
    office.setSessions([fresh]);
    office.setActiveSessionId(fresh.id);
    setSelectedNpcId(null);
    clearFile();

    office.directorRef.current.x = MEETING_SEATS.director.x;
    office.directorRef.current.y = MEETING_SEATS.director.y;
    office.directorRef.current.facing = MEETING_SEATS.director.facing;
    office.directorRef.current.isSitting = true;
    office.directorRef.current.pathQueue = [];
    office.directorRef.current.onArriveCallback = null;

    office.npcRef.current.forEach((npc, idx) => {
      const def = office.agents[idx] || {};
      const fallbackX = [815, 865, 895][idx] ?? 850;
      const fallbackY = [185, 205, 165][idx] ?? 185;
      npc.x = def.homeSpot?.x ?? fallbackX;
      npc.y = def.homeSpot?.y ?? fallbackY;
      npc.state = 'IDLE';
      npc.statusBubble = '';
      npc.carryingDoc = false;
      npc.hasReportExclamation = false;
      npc.pathQueue = [];
      npc.roamTarget = null;
      npc.roamPath = [];
      npc.pendingIdleBubble = '';
    });

    relay.setPipelineStatus('Kantor Direset • Semua karakter kembali ke posisi awal');
    playRetroTone('click', fxEnabled);
    showToast('Kantor dan semua sesi berhasil direset.', 'info');
  };

  const exportMarkdown = () => {
    if (office.logs.length === 0) {
      showToast('Belum ada log pada sesi ini untuk diekspor.', 'info');
      return;
    }
    let md = `# Virtual Office AI — ${office.activeSession.title}\n\n`;
    office.logs.forEach((l) => {
      const metaParts = [];
      if (l.meta?.modelUsed) metaParts.push(`Model: ${l.meta.modelUsed}`);
      if (l.meta?.durationMs) {
        metaParts.push(
          `Durasi: ${l.meta.durationMs < 1000 ? `${l.meta.durationMs}ms` : `${(l.meta.durationMs / 1000).toFixed(1)}s`}`
        );
      }
      if (l.meta?.usage?.totalTokens) metaParts.push(`Token: ${l.meta.usage.totalTokens}`);
      const metaLine = metaParts.length > 0 ? `\n_${metaParts.join(' • ')}_\n` : '';
      md += `### [${l.agentName} — ${l.agentRole}] (${l.timestamp})${metaLine}\n${l.content}\n\n---\n\n`;
    });
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `virtual-office-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Laporan Markdown (.md) diunduh.', 'success');
  };

  const inspectedAgent = office.agents.find((a) => a.id === selectedNpcId);
  const filteredLogs =
    logFilter === 'all' ? office.logs : office.logs.filter((l) => l.agentId === logFilter);

  return (
    <div className="bg-slate-950 text-slate-200 font-sans lg:h-screen lg:overflow-hidden flex flex-col">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl border text-xs font-medium text-white shadow-2xl ${
            toast.type === 'error'
              ? 'bg-rose-950/95 border-rose-500/50 text-rose-100'
              : toast.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-100'
                : 'bg-slate-900 border-slate-700'
          }`}
        >
          {toast.msg}
        </div>
      )}

      <HeaderBar
        agentCount={office.agents.length}
        simSpeed={simSpeed}
        onChangeSimSpeed={setSimSpeed}
        fxEnabled={fxEnabled}
        onToggleFx={() => setFxEnabled((v) => !v)}
        apiMode={office.apiMode}
        onOpenSettings={() => setActiveModal('settings')}
        onOpenTeamModal={() => setActiveModal('sop')}
        onExportMarkdown={exportMarkdown}
        onResetOffice={resetOffice}
      />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <OfficeViewport
          npcRef={office.npcRef}
          directorRef={office.directorRef}
          fxEventsRef={fxEventsRef}
          simSpeed={simSpeed}
          fxEnabled={fxEnabled}
          showAmbientStaff={showAmbientStaff}
          onToggleAmbientStaff={() => setShowAmbientStaff((v) => !v)}
          cameraZoom={cameraZoom}
          onChangeCameraZoom={setCameraZoom}
          followDirector={followDirector}
          onToggleFollowDirector={() => {
            const next = !followDirector;
            setFollowDirector(next);
            if (next && cameraZoom === 1) setCameraZoom(1.4);
          }}
          onDisableFollow={() => setFollowDirector(false)}
          selectedNpcId={selectedNpcId}
          inspectedAgent={inspectedAgent}
          onSelectNpc={setSelectedNpcId}
          onClearInspector={() => setSelectedNpcId(null)}
          isRelayRunning={relay.isRelayRunning}
          onDispatchSingleAgent={relay.dispatchSingleAgent}
          workflowMode={office.workflowMode}
          maxRevisions={office.maxRevisions}
          pipelineStatus={relay.pipelineStatus}
        />

        <WorkPanel
          sessions={office.sessions}
          activeSession={office.activeSession}
          onSelectSession={(id) => {
            office.setActiveSessionId(id);
            setLogFilter('all');
          }}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          promptInput={promptInput}
          onChangePromptInput={setPromptInput}
          fileInputRef={fileInputRef}
          selectedFile={selectedFile}
          isReadingFile={isReadingFile}
          onFileChange={handleFileChange}
          onClearFile={clearFile}
          workflowMode={office.workflowMode}
          onChangeWorkflowMode={office.setWorkflowMode}
          fastAgentId={office.fastAgentId}
          onChangeFastAgentId={office.setFastAgentId}
          agents={office.agents}
          isRelayRunning={relay.isRelayRunning}
          onStartRelay={relay.startAutoRelay}
          onStopRelay={relay.stopActiveRun}
          logFilter={logFilter}
          onChangeLogFilter={setLogFilter}
          logs={office.logs}
          filteredLogs={filteredLogs}
          onPreviewHtml={setPreviewHtmlCode}
          logEndRef={logEndRef}
        />
      </div>

      <HtmlPreviewModal htmlCode={previewHtmlCode} onClose={() => setPreviewHtmlCode(null)} />

      {activeModal === 'settings' && (
        <SettingsModal
          initialBrief={office.projectBrief}
          initialMode={office.apiMode}
          initialProvider={office.aiProvider}
          initialGeminiKey={office.geminiApiKey}
          initialDeepseekKey={office.deepseekApiKey}
          initialMaxRevisions={office.maxRevisions}
          initialRememberKeys={office.rememberKeys}
          onClose={() => setActiveModal(null)}
          onSave={(cfg) => {
            office.setProjectBrief(cfg.projectBrief);
            office.setApiMode(cfg.apiMode);
            office.setAiProvider(cfg.aiProvider);
            office.setGeminiApiKey(cfg.geminiApiKey);
            office.setDeepseekApiKey(cfg.deepseekApiKey);
            office.setMaxRevisions(cfg.maxRevisions);
            office.setRememberKeys(cfg.rememberKeys);
            setActiveModal(null);
            showToast('Pengaturan disimpan.', 'success');
          }}
        />
      )}

      {activeModal === 'sop' && (
        <TeamSopModal
          initialAgents={office.agents}
          onClose={() => setActiveModal(null)}
          onNotify={showToast}
          onSave={(nextAgents) => {
            office.setAgents(nextAgents);
            office.syncNpcsWithAgents(nextAgents);
            if (!nextAgents.some((a) => a.id === office.fastAgentId)) {
              office.setFastAgentId(nextAgents[0]?.id || 'raka');
            }
            if (logFilter !== 'all' && !nextAgents.some((a) => a.id === logFilter)) {
              setLogFilter('all');
            }
            setActiveModal(null);
            showToast('Tim & SOP agen diperbarui.', 'success');
          }}
        />
      )}
    </div>
  );
}
