import React from 'react';
import { LocateFixed, Maximize2, Users, X, ZoomIn, ZoomOut } from 'lucide-react';
import OfficeCanvas2D from './OfficeCanvas2D';
import { OFFICE_ROOMS } from '../constants/officeConfig';

export default function OfficeViewport({
  npcRef,
  directorRef,
  fxEventsRef,
  simSpeed,
  fxEnabled,
  showAmbientStaff,
  onToggleAmbientStaff,
  cameraZoom,
  onChangeCameraZoom,
  followDirector,
  onToggleFollowDirector,
  onDisableFollow,
  selectedNpcId,
  inspectedAgent,
  onSelectNpc,
  onClearInspector,
  isRelayRunning,
  onDispatchSingleAgent,
  workflowMode,
  maxRevisions,
  pipelineStatus,
}) {
  const zoomOut = () => onChangeCameraZoom((z) => Math.max(1, Number((z - 0.2).toFixed(1))));
  const zoomIn = () => onChangeCameraZoom((z) => Math.min(2.2, Number((z + 0.2).toFixed(1))));

  return (
    <section className="w-full lg:w-[60%] h-[58vh] lg:h-full bg-slate-950 relative flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 shrink-0">
      {/* MOBILE TOP BAR: Statis di atas kanvas agar tidak menutupi ruangan office di HP */}
      <div className="lg:hidden px-3 py-1.5 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between gap-2 text-[10px] text-slate-300 shrink-0">
        <span className="truncate">
          <strong>Tap lantai</strong>: gerak Director &bull; <strong>Tap NPC</strong>: inspeksi
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={zoomOut}
            disabled={cameraZoom <= 1}
            className="p-1 rounded-md bg-slate-800 border border-slate-700 text-slate-200 disabled:opacity-40"
            title="Zoom Out"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="font-mono text-[10px] w-8 text-center text-slate-300">
            {Math.round(cameraZoom * 100)}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            disabled={cameraZoom >= 2.2}
            className="p-1 rounded-md bg-slate-800 border border-slate-700 text-slate-200 disabled:opacity-40"
            title="Zoom In"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onToggleAmbientStaff}
            className={`p-1 rounded-md border ${
              showAmbientStaff
                ? 'bg-emerald-600/25 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title={showAmbientStaff ? 'Sembunyikan karyawan ambient' : 'Tampilkan karyawan ambient'}
          >
            <Users className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={onToggleFollowDirector}
            className={`p-1 rounded-md border ${
              followDirector
                ? 'bg-pink-600/25 border-pink-500/50 text-pink-300'
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
            title="Ikuti Director"
          >
            <LocateFixed className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* DESKTOP OVERLAY HINT (Kiri Atas) */}
      <div className="hidden lg:block absolute top-3 left-3 z-10 pointer-events-none">
        <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-1.5 text-[11px] text-slate-300 shadow-lg">
          Gerakkan <strong>Director</strong> via <strong>WASD / Arrow / Klik Lantai</strong> &bull; Klik{' '}
          <strong>NPC</strong> untuk inspeksi/sapa &bull; <strong>Space/E</strong> interaksi
        </div>
      </div>

      {/* DESKTOP CAMERA & CROWD CONTROLS (Kanan Atas) */}
      <div className="hidden lg:flex absolute top-3 right-3 z-10 items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 shadow-lg">
        <button
          type="button"
          onClick={onToggleAmbientStaff}
          className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors ${
            showAmbientStaff
              ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:bg-slate-800'
          }`}
          title="Tampilkan / sembunyikan karyawan non-AI yang meramaikan kantor"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Staf</span>
        </button>
        <div className="w-px h-4 bg-slate-700 mx-0.5" />
        <button
          type="button"
          onClick={zoomOut}
          disabled={cameraZoom <= 1}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-40"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            onChangeCameraZoom(1);
            onDisableFollow();
          }}
          className="px-1.5 py-1 rounded-lg hover:bg-slate-800 text-[10px] font-mono text-slate-200 flex items-center gap-1"
          title="Reset tampilan Fit 100%"
        >
          <Maximize2 className="w-3 h-3 text-slate-400" />
          <span>{Math.round(cameraZoom * 100)}%</span>
        </button>
        <button
          type="button"
          onClick={zoomIn}
          disabled={cameraZoom >= 2.2}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-40"
          title="Zoom In (atau Ctrl + Scroll)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-slate-700 mx-0.5" />
        <button
          type="button"
          onClick={onToggleFollowDirector}
          className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors ${
            followDirector
              ? 'bg-pink-600/25 text-pink-300 border border-pink-500/40'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
          title="Kamera mengikuti Director"
        >
          <LocateFixed className="w-3.5 h-3.5" />
          <span>Follow</span>
        </button>
      </div>

      <div className="flex-1 min-h-0 relative">
        <OfficeCanvas2D
          npcRef={npcRef}
          directorRef={directorRef}
          fxEventsRef={fxEventsRef}
          simSpeed={simSpeed}
          fxEnabled={fxEnabled}
          showAmbientStaff={showAmbientStaff}
          cameraZoom={cameraZoom}
          followDirector={followDirector}
          onDisableFollow={onDisableFollow}
          onZoomChange={onChangeCameraZoom}
          selectedNpcId={selectedNpcId}
          onSelectNpc={onSelectNpc}
          onClearInspector={onClearInspector}
        />
      </div>

      {inspectedAgent && (
        <div className="absolute bottom-11 left-2 right-2 sm:left-3 sm:right-auto sm:w-80 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl p-3.5 shadow-2xl z-10">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xs font-bold text-white">{inspectedAgent.name}</h3>
              <p className="text-[11px] text-indigo-300">
                {inspectedAgent.role}
                {inspectedAgent.preferredModel && inspectedAgent.preferredModel !== 'auto'
                  ? ` • ${inspectedAgent.preferredModel}`
                  : ''}
              </p>
            </div>
            <button onClick={onClearInspector} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 line-clamp-3 bg-slate-950 p-2 rounded-lg border border-slate-800">
            {inspectedAgent.sop}
          </p>
          <button
            disabled={isRelayRunning}
            onClick={onDispatchSingleAgent}
            className="mt-2.5 w-full py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold"
          >
            Tugaskan Langsung {inspectedAgent.name}
          </button>
        </div>
      )}

      <div className="bg-slate-900/95 border-t border-slate-800 px-4 py-2 flex items-center justify-between gap-2 text-[11px] shrink-0">
        <span className="text-slate-400 shrink-0">
          {OFFICE_ROOMS.length} Rooms •{' '}
          {workflowMode === 'fast' ? 'Fast Mode' : `QA Loop (max ${maxRevisions}x)`}
        </span>
        <span className="font-mono text-indigo-400 truncate">{pipelineStatus}</span>
      </div>
    </section>
  );
}
