import React from 'react';
import { X } from 'lucide-react';
import OfficeCanvas2D from './OfficeCanvas2D';
import { OFFICE_ROOMS } from '../constants/officeConfig';
import { VILLAGE_BUILDINGS, VILLAGE_NAME } from '../constants/villageConfig';

export default function OfficeViewport({
  isEmbed = false,
  activeScene = 'village',
  villageTime = 'day',
  onEnterOffice = null,
  onExitToVillage = null,
  onVillageNotice = null,
  onOpenVillageGuide = null,
  npcRef,
  directorRef,
  fxEventsRef,
  simSpeed,
  fxEnabled,
  showAmbientStaff,
  cameraZoom,
  onChangeCameraZoom,
  followDirector,
  onDisableFollow,
  selectedNpcId,
  inspectedAgent,
  onSelectNpc,
  onClearInspector,
  onDirectorSit,
  onDirectorStand,
  isRelayRunning,
  onDispatchSingleAgent,
  workflowMode,
  maxRevisions,
  pipelineStatus,
}) {
  return (
    <section className="w-full flex-1 h-full bg-slate-950 relative flex flex-col shrink-0 min-h-0">
      <div className="flex-1 min-h-0 relative">
        <OfficeCanvas2D
          activeScene={activeScene}
          villageTime={villageTime}
          onEnterOffice={onEnterOffice}
          onExitToVillage={onExitToVillage}
          onVillageNotice={onVillageNotice}
          onOpenVillageGuide={onOpenVillageGuide}
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
          onDirectorSit={onDirectorSit}
          onDirectorStand={onDirectorStand}
        />
      </div>

      {activeScene === 'office' && inspectedAgent && (
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

      {!isEmbed && (
        <div className="bg-slate-900/95 border-t border-slate-800 px-4 py-1.5 flex items-center justify-between gap-2 text-[11px] shrink-0">
          <span className="text-slate-400 shrink-0">
            {activeScene === 'village'
              ? `${VILLAGE_NAME} • ${VILLAGE_BUILDINGS.length} Bangunan • Klik Virtual Office HQ untuk masuk`
              : `${OFFICE_ROOMS.length} Rooms • ${
                  workflowMode === 'solo'
                    ? 'Solo Full-Stack'
                    : `Tim Relay • QA Loop (max ${maxRevisions}x)`
                }`}
          </span>
          <span className="font-mono text-indigo-400 truncate">{pipelineStatus}</span>
        </div>
      )}
    </section>
  );
}
