import React from 'react';
import {
  Clock,
  Cpu,
  GitBranch,
  HelpCircle,
  MessageSquarePlus,
  Play,
  Square,
  Trash2,
  User,
} from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { FULLSTACK_AGENT_ID, PRESET_PROMPTS } from '../constants/officeConfig';

function formatDuration(ms) {
  if (!ms || ms < 0) return null;
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

function formatTokens(usage) {
  if (!usage || !usage.totalTokens) return null;
  return `${usage.totalTokens.toLocaleString('id-ID')} tok`;
}

export default function WorkPanel({
  sessions,
  activeSession,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  promptInput,
  onChangePromptInput,
  fileInputRef,
  selectedFile,
  isReadingFile,
  onFileChange,
  onClearFile,
  workflowMode,
  onChangeWorkflowMode,
  grillingEnabled,
  onToggleGrilling,
  pendingGrilling,
  onOpenGrillingModal,
  agents,
  isRelayRunning,
  onStartRelay,
  onStopRelay,
  logFilter,
  onChangeLogFilter,
  logs,
  filteredLogs,
  onPreviewHtml,
  logEndRef,
}) {
  return (
    <section className="w-full lg:w-[40%] flex-1 lg:h-full bg-slate-900/50 flex flex-col min-h-0">
      {/* SESSION SWITCHER BAR */}
      <div className="px-3.5 py-2 border-b border-slate-800 bg-slate-950/90 flex items-center gap-2 shrink-0">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 shrink-0">
          Sesi:
        </span>
        <select
          disabled={isRelayRunning}
          value={activeSession.id}
          onChange={(e) => onSelectSession(e.target.value)}
          className="flex-1 min-w-0 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-100 focus:outline-none focus:border-indigo-500 truncate"
        >
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title} ({s.logs.length} log)
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={isRelayRunning}
          onClick={onNewSession}
          className="px-2 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-300 border border-indigo-500/40 text-[11px] font-semibold flex items-center gap-1 shrink-0 disabled:opacity-50"
          title="Buat sesi baru dengan konteks bersih"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          <span>Baru</span>
        </button>
        <button
          type="button"
          disabled={isRelayRunning}
          onClick={onDeleteSession}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950/70 text-slate-400 hover:text-rose-300 border border-slate-800 shrink-0 disabled:opacity-50"
          title="Hapus / bersihkan sesi ini"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* DIRECTOR COMMAND BAR */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-900/90 space-y-2.5 shrink-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-bold text-white">Perintah Director</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => onChangePromptInput(PRESET_PROMPTS[0])}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            >
              Tes Ringkas (Akar 34)
            </button>
            <button
              onClick={() => onChangePromptInput(PRESET_PROMPTS[1])}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            >
              Tes Teknis (API)
            </button>
            <button
              onClick={() => onChangePromptInput(PRESET_PROMPTS[2])}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            >
              Landing Page (SaaS)
            </button>
          </div>
        </div>

        <textarea
          rows={2}
          value={promptInput}
          onChange={(e) => onChangePromptInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onStartRelay();
            }
          }}
          placeholder="Ketik pertanyaan ringkas atau spesifikasi sistem..."
          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
        />

        {/* WORKFLOW MODE + ATTACHMENT ROW */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <label className="cursor-pointer text-[10px] px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700">
              📎 Lampirkan File
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,.webp"
                onChange={onFileChange}
                className="hidden"
              />
            </label>
            {isReadingFile && (
              <span className="text-[10px] text-amber-300 animate-pulse">Membaca file...</span>
            )}
            {selectedFile && !isReadingFile && (
              <div className="flex items-center gap-1 text-[10px] text-emerald-300">
                <span className="truncate max-w-[110px]">{selectedFile.name}</span>
                <button onClick={onClearFile} className="text-rose-400 hover:text-rose-300">
                  ✕
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <div className="bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex items-center text-[10px]">
              <button
                type="button"
                disabled={isRelayRunning}
                onClick={() => onChangeWorkflowMode('relay')}
                className={`px-2 py-1 rounded-md font-semibold flex items-center gap-1 ${
                  workflowMode === 'relay'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Alur tim 3 agen: Alex → Spesialis → Raka ↔ Nadia QA"
              >
                <GitBranch className="w-3 h-3" />
                <span>Tim (3 Agen)</span>
              </button>
              <button
                type="button"
                disabled={isRelayRunning}
                onClick={() => onChangeWorkflowMode('solo')}
                className={`px-2 py-1 rounded-md font-semibold flex items-center gap-1 ${
                  workflowMode === 'solo'
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="1 Agen Full-Stack menangani analisis, kode & self-check sendirian (lebih hemat token)"
              >
                <User className="w-3 h-3" />
                <span>Solo Full-Stack</span>
              </button>
            </div>

            <button
              type="button"
              disabled={isRelayRunning}
              onClick={onToggleGrilling}
              className={`px-2 py-1 rounded-lg text-[10px] font-semibold border flex items-center gap-1 disabled:opacity-50 ${
                grillingEnabled
                  ? 'bg-indigo-500/20 text-indigo-200 border-indigo-500/50 hover:bg-indigo-500/30'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="Konfirmasi keputusan inti (core-only) sebelum eksekusi akhir"
            >
              <HelpCircle className="w-3 h-3" />
              <span>Grilling: {grillingEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {pendingGrilling && (
          <div className="p-2.5 rounded-xl bg-indigo-950/70 border border-indigo-500/50 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-indigo-200 truncate">
                ❓ {pendingGrilling.alexName} menunggu konfirmasi inti (Ronde {pendingGrilling.round}/{pendingGrilling.maxRounds})
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenGrillingModal}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold shrink-0"
            >
              Buka Pertanyaan
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            disabled={isRelayRunning || isReadingFile}
            onClick={onStartRelay}
            className={`flex-1 py-2 px-3.5 rounded-xl disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2 ${
              workflowMode === 'solo'
                ? 'bg-sky-600 hover:bg-sky-500'
                : 'bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            {workflowMode === 'solo' ? (
              <>
                <User className="w-3.5 h-3.5" />
                <span>
                  Jalankan Solo (
                  {agents.find((a) => a.id === FULLSTACK_AGENT_ID)?.name || 'Kael'} • Full-Stack)
                </span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Jalankan Tim (3 Agen Relay)</span>
              </>
            )}
          </button>
          {isRelayRunning && (
            <button
              onClick={onStopRelay}
              className="py-2 px-3.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/35 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1.5"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Stop</span>
            </button>
          )}
        </div>
      </div>

      {/* LOG FILTER BAR */}
      <div className="px-3.5 py-2 border-b border-slate-800 bg-slate-925 flex items-center gap-1.5 overflow-x-auto shrink-0">
        <button
          onClick={() => onChangeLogFilter('all')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 ${
            logFilter === 'all'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Semua ({logs.length})
        </button>
        {agents.map((ag) => (
          <button
            key={ag.id}
            onClick={() => onChangeLogFilter(ag.id)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 ${
              logFilter === ag.id
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {ag.name}
          </button>
        ))}
      </div>

      {/* LOG FEED */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 text-center text-xs text-slate-400 my-4 space-y-1.5">
            <p>
              Belum ada log pada <strong>{activeSession.title}</strong>.
            </p>
            <p className="text-[11px] text-slate-500">
              Pilih <strong>Tim (3 Agen)</strong> untuk kolaborasi penuh dengan QA, atau{' '}
              <strong>Solo Full-Stack</strong> untuk 1 agen mandiri yang lebih ringkas &amp; hemat token.
            </p>
          </div>
        ) : (
          filteredLogs.map((item) => {
            const durText = formatDuration(item.meta?.durationMs);
            const tokText = formatTokens(item.meta?.usage);
            const tokTitle = item.meta?.usage
              ? `Input: ${item.meta.usage.promptTokens} • Output: ${item.meta.usage.outputTokens}`
              : '';

            return (
              <div
                key={item.id}
                className="bg-slate-900/95 border border-slate-800 rounded-2xl p-3.5"
                style={{ borderLeftWidth: 4, borderLeftColor: item.borderHex }}
              >
                <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <span className="text-xs font-bold text-white">{item.agentName}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${item.badgeClass}`}>
                      {item.agentRole}
                    </span>
                    {item.isStreaming && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 animate-pulse">
                        Mengetik...
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    {item.timestamp}
                  </span>
                </div>

                {item.content ? (
                  <MarkdownRenderer content={item.content} onPreviewHtml={onPreviewHtml} />
                ) : (
                  <div className="text-[11px] text-slate-500 italic animate-pulse">
                    Menunggu respons pertama...
                  </div>
                )}

                {item.meta && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap text-[10px] font-mono text-slate-400">
                    {item.meta.modelUsed && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-indigo-300 flex items-center gap-1">
                        <Cpu className="w-2.5 h-2.5" />
                        {item.meta.modelUsed}
                      </span>
                    )}
                    {durText && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {durText}
                      </span>
                    )}
                    {tokText && (
                      <span
                        title={tokTitle}
                        className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-emerald-300"
                      >
                        {tokText}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={logEndRef} />
      </div>
    </section>
  );
}
