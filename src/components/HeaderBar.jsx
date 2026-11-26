import React, { useEffect, useRef, useState } from 'react';
import {
  Building2,
  Download,
  FileText,
  HelpCircle,
  LocateFixed,
  Map,
  Maximize2,
  Music,
  PanelRightClose,
  PanelRightOpen,
  RotateCcw,
  Settings,
  Users,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { OFFICE_ROOMS } from '../constants/officeConfig';
import { VILLAGE_BUILDINGS } from '../constants/villageConfig';
import { OFFICE_BGM_TRACKS } from '../utils/audio';

export default function HeaderBar({
  activeScene = 'village',
  onEnterOffice = null,
  onExitToVillage = null,
  agentCount,
  simSpeed,
  onChangeSimSpeed,
  fxEnabled,
  onToggleFx,
  bgmTrack,
  onChangeBgmTrack,
  bgmVolume = 0.75,
  onChangeBgmVolume,
  sfxVolume = 0.8,
  onChangeSfxVolume,
  onPreviewSfx,
  showAmbientStaff,
  onToggleAmbientStaff,
  cameraZoom,
  onChangeCameraZoom,
  followDirector,
  onToggleFollowDirector,
  onDisableFollow,
  isWorkPanelOpen,
  onToggleWorkPanel,
  apiMode,
  aiProvider,
  agyAvailable,
  onOpenSettings,
  onOpenTeamModal,
  onExportMarkdown,
  onResetOffice,
}) {
  const [openPopover, setOpenPopover] = useState(null); // null | 'settings' | 'help'
  const popoversRef = useRef(null);
  const isAgyActive = apiMode === 'live' && agyAvailable && aiProvider === 'agy';

  const zoomOut = () => onChangeCameraZoom((z) => Math.max(1, Number((z - 0.2).toFixed(1))));
  const zoomIn = () => onChangeCameraZoom((z) => Math.min(2.2, Number((z + 0.2).toFixed(1))));

  useEffect(() => {
    if (!openPopover) return;
    const onPointerDown = (e) => {
      if (popoversRef.current && !popoversRef.current.contains(e.target)) {
        setOpenPopover(null);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpenPopover(null);
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [openPopover]);

  const runAction = (fn) => {
    setOpenPopover(null);
    fn?.();
  };

  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-md px-3.5 py-2 flex items-center justify-between gap-2 shrink-0 z-40">
      {/* KIRI: BRAND + LIVE/DEMO STATUS */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-emerald-500 to-amber-500 p-0.5 shrink-0">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-mono font-bold text-[11px] text-white">
            VO<span className="text-emerald-400">2D</span>
          </div>
        </div>
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <h1 className="font-bold text-sm text-white truncate">Virtual Office AI</h1>
          <span className="hidden xl:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {activeScene === 'village'
              ? `Village • ${VILLAGE_BUILDINGS.length} Bangunan`
              : `${OFFICE_ROOMS.length} Rooms • ${agentCount} Agen`}
          </span>
          <button
            type="button"
            onClick={onOpenSettings}
            className={`flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border transition-colors ${
              isAgyActive
                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20'
                : apiMode === 'live'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
            }`}
            title="Buka konfigurasi Brief & AI API"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isAgyActive ? 'bg-cyan-400' : apiMode === 'live' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span>
              {isAgyActive ? 'AGY Local' : apiMode === 'live' ? 'Live API' : 'Demo Mode'}
            </span>
          </button>
        </div>
      </div>

      {/* TENGAH: SWITCH LOKASI (VILLAGE <-> OFFICE HQ) + KONTROL KAMERA */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="flex items-center gap-0.5 bg-slate-950/90 border border-slate-800 rounded-xl p-0.5">
          <button
            type="button"
            onClick={onExitToVillage}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors ${
              activeScene === 'village'
                ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-300 hover:bg-slate-800 border border-transparent'
            }`}
            title="Peta Antigravity Village (Outdoor)"
          >
            <Map className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Village</span>
          </button>
          <button
            type="button"
            onClick={onEnterOffice}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors ${
              activeScene === 'office'
                ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40'
                : 'text-slate-300 hover:bg-slate-800 border border-transparent'
            }`}
            title="Masuk ke Interior Virtual Office HQ"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Office HQ</span>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-1 bg-slate-950/90 border border-slate-800 rounded-xl p-0.5 shrink-0">
        <button
          type="button"
          onClick={zoomOut}
          disabled={cameraZoom <= 1}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition-colors"
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
          className="px-1.5 py-1 rounded-lg hover:bg-slate-800 text-[10px] font-mono text-slate-200 flex items-center gap-1 transition-colors"
          title="Reset tampilan Fit 100%"
        >
          <Maximize2 className="w-3 h-3 text-slate-400" />
          <span>{Math.round(cameraZoom * 100)}%</span>
        </button>
        <button
          type="button"
          onClick={zoomIn}
          disabled={cameraZoom >= 2.2}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition-colors"
          title="Zoom In (atau Ctrl + Scroll)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-slate-800 mx-0.5" />
        <button
          type="button"
          onClick={onToggleFollowDirector}
          className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors ${
            followDirector
              ? 'bg-pink-600/25 text-pink-300 border border-pink-500/40'
              : 'text-slate-300 hover:bg-slate-800 border border-transparent'
          }`}
          title="Kamera mengikuti Director"
        >
          <LocateFixed className="w-3.5 h-3.5" />
          <span>Follow</span>
        </button>
        </div>
      </div>

      {/* KANAN: BANTUAN KONTROL (?) + PERINTAH DIRECTOR + PENGATURAN */}
      <div className="flex items-center gap-1.5 shrink-0" ref={popoversRef}>
        {/* Panduan Interaksi Director (Popover di sebelah kiri Perintah Director) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenPopover((v) => (v === 'help' ? null : 'help'))}
            aria-expanded={openPopover === 'help'}
            className={`p-1.5 rounded-xl border transition-colors ${
              openPopover === 'help'
                ? 'bg-indigo-600/25 text-indigo-200 border-indigo-500/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Panduan kontrol & interaksi Director"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {openPopover === 'help' && (
            <div className="absolute right-0 mt-2 w-72 z-50 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-3.5 space-y-2.5 text-xs">
              <p className="text-[11px] font-bold text-white">Kontrol &amp; Interaksi Director</p>
              <div className="space-y-1.5 text-[11px] text-slate-300">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400">Jalan keliling</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-200">
                    WASD / Arrow / Klik Lantai
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400">Masuk / keluar gedung</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-emerald-300">
                    Jalan ke Pintu / Klik / E
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400">Duduk &amp; perintah</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-pink-300">
                    Klik Kursi / E
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400">Sapa / tugaskan NPC</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-200">
                    Klik NPC
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400">Tegur NPC dekat</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-200">
                    Space / E
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-400">Zoom &amp; geser peta</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-200">
                    Ctrl + Scroll / Drag
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleWorkPanel}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
            isWorkPanelOpen
              ? 'bg-pink-600/20 hover:bg-pink-600/30 text-pink-200 border-pink-500/50'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400/50 shadow-lg shadow-indigo-950/50'
          }`}
          title="Shortcut duduk di meja Director & buka/tutup panel Perintah Director"
        >
          {isWorkPanelOpen ? (
            <PanelRightClose className="w-3.5 h-3.5" />
          ) : (
            <PanelRightOpen className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">
            {isWorkPanelOpen ? 'Tutup Perintah' : 'Perintah Director'}
          </span>
        </button>

        {/* Pengaturan Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenPopover((v) => (v === 'settings' ? null : 'settings'))}
            aria-expanded={openPopover === 'settings'}
            className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors ${
              openPopover === 'settings'
                ? 'bg-slate-700 text-white border-slate-500'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Pengaturan simulasi, audio, tim & ekspor"
          >
            <Settings className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden sm:inline">Pengaturan</span>
          </button>

          {openPopover === 'settings' && (
            <div className="absolute right-0 mt-2 w-72 z-50 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-3 space-y-3">
              {/* KAMERA (khusus layar kecil tempat kontrol tengah tersembunyi) */}
              <div className="md:hidden space-y-2 pb-2 border-b border-slate-800">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1">
                  Kamera Kantor
                </p>
                <div className="flex items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={zoomOut}
                      disabled={cameraZoom <= 1}
                      className="p-1 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-40"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-mono px-1.5 text-slate-200">
                      {Math.round(cameraZoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={zoomIn}
                      disabled={cameraZoom >= 2.2}
                      className="p-1 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-40"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleFollowDirector}
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1 ${
                      followDirector
                        ? 'bg-pink-600/25 text-pink-300 border-pink-500/40'
                        : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}
                  >
                    <LocateFixed className="w-3 h-3" />
                    <span>Follow</span>
                  </button>
                </div>
              </div>

              {/* SIMULASI & TAMPILAN */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1">
                  Simulasi &amp; Kantor
                </p>

                <div className="flex items-center justify-between gap-2 px-1">
                  <span className="text-xs text-slate-200">Kecepatan</span>
                  <div className="bg-slate-950 p-0.5 rounded-lg border border-slate-800 flex items-center text-[11px]">
                    <button
                      type="button"
                      onClick={() => onChangeSimSpeed(1)}
                      className={`px-2.5 py-0.5 rounded-md font-mono font-semibold ${
                        simSpeed === 1 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      1x
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeSimSpeed(2)}
                      className={`px-2.5 py-0.5 rounded-md font-mono font-semibold ${
                        simSpeed === 2 ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      2x
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 px-1">
                  <span className="text-xs text-slate-200">Staf &amp; Warga</span>
                  <button
                    type="button"
                    onClick={onToggleAmbientStaff}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 transition-colors ${
                      showAmbientStaff
                        ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Users className="w-3 h-3" />
                    <span>{showAmbientStaff ? 'Tampil' : 'Sembunyi'}</span>
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-800" />

              {/* AUDIO & MUSIK */}
              <div className="space-y-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-1">
                  Audio &amp; Musik
                </p>

                <div className="px-1 space-y-1">
                  <label className="flex items-center gap-1.5 text-xs text-slate-200">
                    <Music className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Musik Latar (BGM)</span>
                  </label>
                  <select
                    aria-label="Pilih audio latar kantor"
                    value={bgmTrack || 'off'}
                    onChange={(e) => onChangeBgmTrack(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {OFFICE_BGM_TRACKS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="px-1 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300">Volume Musik</span>
                    <span className="font-mono text-indigo-300 font-semibold">
                      {Math.round((bgmVolume ?? 0.75) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    aria-label="Volume Musik Latar"
                    min="0"
                    max="100"
                    step="5"
                    value={Math.round((bgmVolume ?? 0.75) * 100)}
                    onChange={(e) => onChangeBgmVolume?.(Number(e.target.value) / 100)}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 px-1 pt-0.5">
                  <span className="text-xs text-slate-200">Efek Suara (SFX)</span>
                  <button
                    type="button"
                    onClick={onToggleFx}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5 transition-colors ${
                      fxEnabled
                        ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {fxEnabled ? (
                      <Volume2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <VolumeX className="w-3 h-3 text-slate-400" />
                    )}
                    <span>{fxEnabled ? 'ON' : 'OFF'}</span>
                  </button>
                </div>

                <div className="px-1 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300">Volume Efek (SFX)</span>
                    <span className="font-mono text-emerald-300 font-semibold">
                      {Math.round((sfxVolume ?? 0.8) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    aria-label="Volume Efek Suara"
                    min="0"
                    max="100"
                    step="5"
                    disabled={!fxEnabled}
                    value={Math.round((sfxVolume ?? 0.8) * 100)}
                    onChange={(e) => onChangeSfxVolume?.(Number(e.target.value) / 100)}
                    onPointerUp={() => onPreviewSfx?.()}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-40"
                  />
                </div>
              </div>

              <div className="border-t border-slate-800" />

              {/* KONFIGURASI & AKSI */}
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => runAction(onOpenSettings)}
                  className="w-full px-2.5 py-2 rounded-xl hover:bg-slate-800 text-xs text-slate-200 flex items-center gap-2 transition-colors text-left"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Brief &amp; AI API</span>
                </button>
                <button
                  type="button"
                  onClick={() => runAction(onOpenTeamModal)}
                  className="w-full px-2.5 py-2 rounded-xl hover:bg-slate-800 text-xs text-slate-200 flex items-center gap-2 transition-colors text-left"
                >
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tim &amp; SOP Agen</span>
                </button>
                <button
                  type="button"
                  onClick={() => runAction(onExportMarkdown)}
                  className="w-full px-2.5 py-2 rounded-xl hover:bg-slate-800 text-xs text-slate-200 flex items-center gap-2 transition-colors text-left"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Ekspor Log (.md)</span>
                </button>
                <button
                  type="button"
                  onClick={() => runAction(onResetOffice)}
                  className="w-full px-2.5 py-2 rounded-xl hover:bg-rose-950/70 text-xs text-rose-300 flex items-center gap-2 transition-colors text-left"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Kantor &amp; Sesi</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
