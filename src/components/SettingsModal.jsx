import React, { useState } from 'react';
import { ShieldCheck, Terminal, X } from 'lucide-react';

export default function SettingsModal({
  initialBrief,
  initialMode,
  initialProvider,
  initialAgyModel,
  agyStatus,
  initialGeminiKey,
  initialDeepseekKey,
  initialMaxRevisions,
  initialRememberKeys,
  onClose,
  onSave,
}) {
  const agyAvailable = Boolean(agyStatus?.available);
  const agyModels = Array.isArray(agyStatus?.models) ? agyStatus.models : [];

  const [draftBrief, setDraftBrief] = useState(initialBrief);
  const [draftMode, setDraftMode] = useState(initialMode);
  const [draftProvider, setDraftProvider] = useState(
    initialProvider === 'agy' && !agyAvailable ? 'auto' : initialProvider
  );
  const [draftAgyModel, setDraftAgyModel] = useState(initialAgyModel || 'gemini-3.8-flash-medium');
  const [draftKey, setDraftKey] = useState(initialGeminiKey);
  const [draftDeepseekKey, setDraftDeepseekKey] = useState(initialDeepseekKey);
  const [draftMaxRevisions, setDraftMaxRevisions] = useState(initialMaxRevisions);
  const [draftRememberKeys, setDraftRememberKeys] = useState(initialRememberKeys);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Konfigurasi Project Brief &amp; AI API</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Project Brief (Aturan Global)
          </label>
          <textarea
            rows={4}
            value={draftBrief}
            onChange={(e) => setDraftBrief(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs font-mono text-slate-200"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Maksimal Siklus Revisi QA (Full Relay)
          </label>
          <select
            value={draftMaxRevisions}
            onChange={(e) => setDraftMaxRevisions(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value={0}>0x Revisi (Audit 1 kali saja, hemat kuota)</option>
            <option value={1}>1x Revisi (Maks. 2 percobaan Raka)</option>
            <option value={2}>2x Revisi (Default — Maks. 3 percobaan Raka)</option>
            <option value={3}>3x Revisi (Ketat — Maks. 4 percobaan Raka)</option>
          </select>
        </div>

        <div className="space-y-2.5">
          <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
            <input
              type="radio"
              checked={draftMode === 'demo'}
              onChange={() => setDraftMode('demo')}
            />
            <span>Demo Mode (Simulasi Streaming Tanpa API Key)</span>
          </label>
          <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
            <input
              type="radio"
              checked={draftMode === 'live'}
              onChange={() => setDraftMode('live')}
            />
            <span>
              Live AI API ({agyAvailable ? 'AGY Local, Gemini & DeepSeek' : 'Gemini & DeepSeek'})
            </span>
          </label>

          {draftMode === 'live' && (
            <div className="space-y-3 pt-1 pl-4 border-l-2 border-slate-800">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Prioritas AI Provider
                </label>
                <select
                  value={draftProvider}
                  onChange={(e) => setDraftProvider(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="agy" disabled={!agyAvailable}>
                    {agyAvailable
                      ? 'AGY — Antigravity Local CLI (Aktif • Tanpa API Key)'
                      : 'AGY — Antigravity Local CLI (Nonaktif di Vercel / Cloud)'}
                  </option>
                  <option value="auto">Auto (Gemini Utama → Pindah DeepSeek jika Limit)</option>
                  <option value="gemini">Hanya Gemini (Google AI Studio)</option>
                  <option value="deepseek">Hanya DeepSeek (deepseek-chat)</option>
                </select>
              </div>

              {draftProvider === 'agy' && agyAvailable ? (
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Model Default AGY Local
                    </label>
                    <select
                      value={draftAgyModel}
                      onChange={(e) => setDraftAgyModel(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-cyan-200 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="default">Default CLI (Ikuti konfigurasi agy aktif)</option>
                      {agyModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label} ({m.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-[10px] text-cyan-200 flex items-start gap-2 leading-relaxed">
                    <Terminal className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>
                      Terhubung langsung ke <strong>AGY CLI lokal</strong> di komputer Anda (tanpa perlu API key). Saat dideploy ke Vercel, fitur AGY otomatis dinonaktifkan.
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  {!agyAvailable && (
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-400">
                      ℹ️ Mode <strong>AGY Local CLI</strong> otomatis dinonaktifkan karena aplikasi tidak berjalan di server lokal yang memiliki runtime <code>agy</code> (mis. deploy Vercel).
                    </div>
                  )}

                  {draftProvider !== 'deepseek' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Gemini API Key {draftProvider === 'auto' ? '(Utama)' : ''}
                      </label>
                      <input
                        type="password"
                        value={draftKey}
                        onChange={(e) => setDraftKey(e.target.value)}
                        placeholder="Tempel Gemini API Key (AIzaSy...) atau kosongkan jika pakai env Vercel"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                      />
                    </div>
                  )}

                  {draftProvider !== 'gemini' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        DeepSeek API Key {draftProvider === 'auto' ? '(Cadangan Otomatis)' : ''}
                      </label>
                      <input
                        type="password"
                        value={draftDeepseekKey}
                        onChange={(e) => setDraftDeepseekKey(e.target.value)}
                        placeholder="Tempel DeepSeek API Key (sk-...)"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white"
                      />
                    </div>
                  )}

                  {/* KEAMANAN PENYIMPANAN API KEY */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <label className="flex items-start gap-2 text-[11px] text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draftRememberKeys}
                        onChange={(e) => setDraftRememberKeys(e.target.checked)}
                        className="mt-0.5"
                      />
                      <span>
                        Simpan API Key secara permanen di browser (
                        <code className="text-indigo-300">localStorage</code>)
                      </span>
                    </label>
                    <p className="text-[10px] text-slate-400 flex items-start gap-1.5 leading-relaxed">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        {draftRememberKeys
                          ? 'Key tetap tersimpan setelah tab ditutup. Untuk deploy produksi, disarankan memakai environment variable Vercel.'
                          : 'Mode aman aktif: API Key hanya disimpan di sessionStorage dan otomatis terhapus saat tab browser ditutup.'}
                      </span>
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800"
          >
            Batal
          </button>
          <button
            onClick={() =>
              onSave({
                projectBrief: draftBrief,
                apiMode: draftMode,
                aiProvider: draftProvider === 'agy' && !agyAvailable ? 'auto' : draftProvider,
                agyModel: draftAgyModel,
                geminiApiKey: draftKey,
                deepseekApiKey: draftDeepseekKey,
                maxRevisions: draftMaxRevisions,
                rememberKeys: draftRememberKeys,
              })
            }
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
