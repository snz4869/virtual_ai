import React, { useEffect, useState } from 'react';
import { CheckCheck, HelpCircle, Send, SkipForward, Square, X } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { stripGrillingStatusTag } from '../utils/grilling';

export default function GrillingModal({
  grilling,
  onSubmitAnswer,
  onApproveRecommendations,
  onSkip,
  onMinimize,
  onStopRun,
}) {
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    setAnswer('');
  }, [grilling?.round, grilling?.content]);

  if (!grilling) return null;

  const cleanedContent = stripGrillingStatusTag(grilling.content);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!answer.trim()) return;
    onSubmitAnswer(answer.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
      <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* HEADER */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white truncate">
                  Konfirmasi Inti — {grilling.alexName} ({grilling.alexRole})
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold">
                  Ronde {grilling.round}/{grilling.maxRounds}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Jawab singkat keputusan inti di bawah, atau langsung setujui rekomendasi agar hasil tetap ringkas &amp; on-point.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onMinimize}
            title="Sembunyikan sementara untuk melihat kantor / log"
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QUESTIONS BODY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-900/70">
          <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px] text-slate-300">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Perintah Director
            </span>
            <p className="text-slate-200 leading-relaxed">{grilling.taskPrompt}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <MarkdownRenderer content={cleanedContent} />
          </div>
        </div>

        {/* ANSWER FORM & ACTIONS */}
        <form
          onSubmit={handleSubmit}
          className="p-4 border-t border-slate-800 bg-slate-950/90 space-y-3 shrink-0"
        >
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
              Jawaban / Koreksi Director (opsional jika ingin ubah rekomendasi)
            </label>
            <textarea
              rows={2}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && answer.trim()) {
                  e.preventDefault();
                  onSubmitAnswer(answer.trim());
                }
              }}
              placeholder='Contoh: "Q1 ya, Q2 cukup 2 paket saja (Gratis & Pro), fokus tampilan ringan"'
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 resize-none"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSkip}
                className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5"
                title="Lewati konfirmasi dan langsung teruskan ke Developer"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>{grilling.skipLabel || 'Lewati ke Raka'}</span>
              </button>
              <button
                type="button"
                onClick={onStopRun}
                className="px-3 py-2 rounded-xl text-xs font-medium bg-rose-600/15 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 flex items-center gap-1.5"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Stop</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onApproveRecommendations}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Setujui Semua Rekomendasi</span>
              </button>
              <button
                type="submit"
                disabled={!answer.trim()}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Jawaban</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
