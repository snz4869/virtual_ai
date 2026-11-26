import React, { useEffect } from 'react';
import {
  Anchor,
  Armchair,
  Bot,
  Building2,
  Compass,
  TrainFront,
  Trophy,
  X,
} from 'lucide-react';
import { OFFICE_ROOMS } from '../constants/officeConfig';
import { VILLAGE_BUILDINGS, VILLAGE_DISTRICTS, VILLAGE_NAME } from '../constants/villageConfig';

function PushPin({ color = 'bg-rose-500 border-rose-800' }) {
  return (
    <span
      aria-hidden="true"
      className={`w-3.5 h-3.5 rounded-full border-2 shadow-md ${color} inline-block`}
    />
  );
}

export default function VillageGuideModal({ onClose, onEnterOffice }) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1a140f]/75 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      {/* Bingkai Kayu Papan Pengumuman Desa */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-2xl w-full max-h-[90vh] flex flex-col rounded-2xl bg-[#6c4328] p-2.5 sm:p-3.5 border-[3px] border-[#3b2110] shadow-[0_24px_60px_rgba(0,0,0,0.65)]"
      >
        {/* Paku Sudut Bingkai Kayu */}
        <span className="hidden sm:block absolute top-2 left-2 w-2.5 h-2.5 rounded-full bg-[#3b2110] border border-[#a46e4c]" />
        <span className="hidden sm:block absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#3b2110] border border-[#a46e4c]" />
        <span className="hidden sm:block absolute bottom-2 left-2 w-2.5 h-2.5 rounded-full bg-[#3b2110] border border-[#a46e4c]" />
        <span className="hidden sm:block absolute bottom-2 right-2 w-2.5 h-2.5 rounded-full bg-[#3b2110] border border-[#a46e4c]" />

        {/* Papan Gabus Dalam (Corkboard) */}
        <div
          className="flex-1 min-h-0 flex flex-col rounded-xl border-2 border-[#4a2b16] overflow-hidden"
          style={{
            backgroundColor: '#c99c6b',
            backgroundImage:
              'radial-gradient(rgba(92, 55, 27, 0.22) 1.2px, transparent 1.2px), radial-gradient(rgba(255, 243, 214, 0.25) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
            backgroundPosition: '0 0, 9px 9px',
          }}
        >
          {/* Header Papan Kayu Ukir */}
          <div className="px-4 sm:px-5 py-3 bg-[#7c4d2c] border-b-[3px] border-[#4a2b16] flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#fef3c7] border-2 border-[#4a2b16] flex items-center justify-center text-lg shadow-inner shrink-0">
                📌
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-extrabold tracking-wide text-[#fffbeb] drop-shadow-sm truncate">
                  Papan Pengumuman — {VILLAGE_NAME}
                </h2>
                <p className="text-[11px] text-[#fde68a]/90 truncate">
                  Informasi Web Virtual Office AI &amp; Aktivitas Warga Desa
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#5c361d] hover:bg-[#4a2b16] text-[#fef3c7] border border-[#3b2110] transition-colors shrink-0"
              aria-label="Tutup papan desa"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Kertas-Kertas Catatan yang Ditempel di Papan Gabus */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs text-[#3b2617]">
            {/* Kertas Utama: Tentang Web Ini */}
            <div className="relative bg-[#fffbeb] border-2 border-[#b58b57] rounded-lg p-3.5 pt-4 shadow-[3px_4px_0_rgba(59,33,16,0.3)]">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                <PushPin color="bg-rose-500 border-rose-900" />
              </div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#9a3412] mb-1">
                🏡 Selamat Datang di {VILLAGE_NAME}
              </p>
              <p className="leading-relaxed text-[#452c1a]">
                <strong className="text-[#1e1b4b]">Virtual Office AI</strong> adalah simulasi kantor
                tim multi-agent AI 2D interaktif bergaya RPG yang kini berdiri di jantung desa{' '}
                <strong className="text-[#15803d]">{VILLAGE_NAME}</strong> (peta luas{' '}
                <span className="font-mono font-bold bg-[#fef3c7] px-1 rounded">3000×2000</span>,{' '}
                {VILLAGE_DISTRICTS.length} distrik &amp; {VILLAGE_BUILDINGS.length} bangunan). Kamu
                berperan sebagai <strong className="text-[#be185d]">Director</strong> yang bisa
                menjelajahi desa, mencoba berbagai wahana, lalu masuk ke{' '}
                <strong className="text-[#3730a3]">Virtual Office HQ</strong> untuk menjalankan tim
                AI secara langsung.
              </p>
            </div>

            {/* 2 Kertas Berdampingan: Fitur Aplikasi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="relative bg-[#eef2ff] border-2 border-[#818cf8] rounded-lg p-3.5 pt-4 shadow-[3px_4px_0_rgba(59,33,16,0.28)] sm:-rotate-[0.6deg]">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                  <PushPin color="bg-indigo-500 border-indigo-950" />
                </div>
                <div className="flex items-center gap-1.5 font-extrabold text-[#312e81] mb-1">
                  <Bot className="w-3.5 h-3.5" />
                  <span>Tim Multi-Agent AI</span>
                </div>
                <ul className="text-[11px] text-[#334155] space-y-1 list-disc list-inside leading-snug">
                  <li>
                    <strong>Mode Tim Relay:</strong> Alex (Tech Lead) → Raka (Dev) → Nadia (QA) +
                    Grilling Core-Only &amp; auto-revisi.
                  </li>
                  <li>
                    <strong>Mode Solo Full-Stack:</strong> Kael mengeksekusi tugas end-to-end.
                  </li>
                  <li>
                    Dukungan <strong>AGY Local, Gemini, DeepSeek, Demo</strong>, unggah file &amp;
                    Preview HTML langsung.
                  </li>
                </ul>
              </div>

              <div className="relative bg-[#ecfdf5] border-2 border-[#34d399] rounded-lg p-3.5 pt-4 shadow-[3px_4px_0_rgba(59,33,16,0.28)] sm:rotate-[0.6deg]">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                  <PushPin color="bg-emerald-500 border-emerald-950" />
                </div>
                <div className="flex items-center gap-1.5 font-extrabold text-[#065f46] mb-1">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Office HQ &amp; 4 Distrik Desa</span>
                </div>
                <ul className="text-[11px] text-[#1e3a2f] space-y-1 list-disc list-inside leading-snug">
                  <li>
                    <strong>{OFFICE_ROOMS.length} Ruangan Kantor:</strong> Meeting Director, Product,
                    CX, Server Lab, Office Cafe, Townhall + BGM Lo-Fi/Hujan.
                  </li>
                  <li>
                    <strong>4 Distrik:</strong> Pusat Desa, Stasiun Barat, Kincir &amp; Rumah Kaca
                    Timur, serta Danau &amp; Kuliner Selatan.
                  </li>
                  <li>
                    <Compass className="w-3 h-3 inline mr-0.5 text-[#047857]" />
                    Klik <strong>Minimap</strong> di pojok kanan bawah untuk mengintip distrik lain.
                  </li>
                </ul>
              </div>
            </div>

            {/* Kertas Aktivitas Interaktif Desa */}
            <div className="relative bg-[#fef9e7] border-2 border-[#d4a359] rounded-lg p-3.5 pt-4 shadow-[3px_4px_0_rgba(59,33,16,0.3)]">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                <PushPin color="bg-amber-500 border-amber-900" />
              </div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#92400e] mb-2">
                ✨ Aktivitas Seru yang Bisa Kamu Coba di Desa
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-start gap-2 bg-[#fffdf5] border border-[#e6cc9e] rounded-lg p-2">
                  <Anchor className="w-4 h-4 text-[#0284c7] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#2c1a0e]">Naik Perahu di Danau</p>
                    <p className="text-[#6b4c35]">
                      Ke Dermaga Selatan, klik perahu / tekan <strong>E</strong>. Dayung bebas pakai{' '}
                      <strong>WASD / klik air</strong>!
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-[#fffdf5] border border-[#e6cc9e] rounded-lg p-2">
                  <TrainFront className="w-4 h-4 text-[#15803d] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#2c1a0e]">Naik Kereta Trem Wisata</p>
                    <p className="text-[#6b4c35]">
                      Klik <strong>Stasiun Trem Barat</strong> atau trem yang lewat di rel utara
                      (atau tekan <strong>E</strong> di stasiun).
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-[#fffdf5] border border-[#e6cc9e] rounded-lg p-2">
                  <Trophy className="w-4 h-4 text-[#d97706] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#2c1a0e]">Main Basket Mini</p>
                    <p className="text-[#6b4c35]">
                      Ke Lapangan Basket Barat lalu klik ring atau tekan <strong>E / Space</strong>{' '}
                      untuk lempar bola (+2 &amp; +3 poin!).
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-[#fffdf5] border border-[#e6cc9e] rounded-lg p-2">
                  <Armchair className="w-4 h-4 text-[#be185d] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[#2c1a0e]">Duduk Santai &amp; Elus Hewan</p>
                    <p className="text-[#6b4c35]">
                      Klik bangku taman, teras Kopi Senja, atau kayu api unggun. Klik{' '}
                      <strong>Mochi</strong> (kucing) &amp; <strong>Bubu</strong> (shiba)!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Kayu */}
          <div className="px-4 sm:px-5 py-2.5 bg-[#7c4d2c] border-t-[3px] border-[#4a2b16] flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] font-medium text-[#fde68a]">
              🎮 WASD / Klik Peta untuk jalan • Tekan <strong className="text-white">E</strong>{' '}
              untuk berinteraksi
            </span>
            <div className="flex items-center gap-2">
              {onEnterOffice && (
                <button
                  type="button"
                  onClick={() => {
                    onClose?.();
                    onEnterOffice();
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold border-2 border-[#052e16] shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Masuk Office HQ</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg bg-[#fef3c7] hover:bg-[#fde68a] text-[#451a03] text-xs font-bold border-2 border-[#4a2b16] shadow-sm transition-colors"
              >
                Tutup Papan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
