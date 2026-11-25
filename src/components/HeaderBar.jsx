import React from 'react';
import { Download, FileText, RotateCcw, Users, Volume2, VolumeX } from 'lucide-react';
import { OFFICE_ROOMS } from '../constants/officeConfig';

export default function HeaderBar({
  agentCount,
  simSpeed,
  onChangeSimSpeed,
  fxEnabled,
  onToggleFx,
  apiMode,
  aiProvider,
  agyAvailable,
  onOpenSettings,
  onOpenTeamModal,
  onExportMarkdown,
  onResetOffice,
}) {
  const isAgyActive = apiMode === 'live' && agyAvailable && aiProvider === 'agy';
  return (
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
              v2.3 • {OFFICE_ROOMS.length} Rooms • {agentCount} Agen
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Streaming Multi-Agent Workspace • Live Preview • Isolated Sessions
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs">
          <button
            onClick={() => onChangeSimSpeed(1)}
            className={`px-2.5 py-1 rounded-lg font-mono font-semibold ${
              simSpeed === 1 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            1x
          </button>
          <button
            onClick={() => onChangeSimSpeed(2)}
            className={`px-2.5 py-1 rounded-lg font-mono font-semibold ${
              simSpeed === 2 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            2x
          </button>
        </div>

        <button
          onClick={onToggleFx}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium border border-slate-700 flex items-center gap-1.5"
        >
          {fxEnabled ? (
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-slate-400" />
          )}
          <span className="hidden sm:inline">{fxEnabled ? 'Audio: ON' : 'Audio: OFF'}</span>
        </button>

        <button
          onClick={onOpenSettings}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border ${
            isAgyActive
              ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
              : apiMode === 'live'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isAgyActive ? 'bg-cyan-400' : apiMode === 'live' ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          <span>
            {isAgyActive
              ? 'Live: AGY Local'
              : apiMode === 'live'
                ? 'Live: Streaming API'
                : 'Demo Mode'}
          </span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSettings}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium border border-slate-700 flex items-center gap-1.5"
        >
          <FileText className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">Brief & API</span>
        </button>
        <button
          onClick={onOpenTeamModal}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium border border-slate-700 flex items-center gap-1.5"
        >
          <Users className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">Tim & SOP</span>
        </button>
        <button
          onClick={onExportMarkdown}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium border border-slate-700 flex items-center gap-1.5"
          title="Ekspor sesi aktif ke Markdown"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
        </button>
        <button
          onClick={onResetOffice}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/70 text-xs font-medium border border-slate-700 flex items-center gap-1.5"
          title="Reset seluruh kantor & sesi"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
