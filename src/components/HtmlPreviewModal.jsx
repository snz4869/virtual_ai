import React, { useState } from 'react';
import { Download, ExternalLink, Monitor, Smartphone, Tablet, X } from 'lucide-react';

export default function HtmlPreviewModal({ htmlCode, onClose }) {
  const [viewport, setViewport] = useState('desktop');

  if (!htmlCode) return null;

  const widthClass =
    viewport === 'mobile'
      ? 'w-[390px]'
      : viewport === 'tablet'
        ? 'w-[768px]'
        : 'w-full';

  const handleDownload = () => {
    const blob = new Blob([htmlCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `virtual-office-preview-${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenTab = () => {
    const blob = new Blob([htmlCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl h-[88vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-900 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <h3 className="text-xs sm:text-sm font-bold text-white">Live HTML Preview (Sandboxed)</h3>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              className={`px-2 py-1 rounded-lg text-[11px] flex items-center gap-1 ${
                viewport === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Desktop"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setViewport('tablet')}
              className={`px-2 py-1 rounded-lg text-[11px] flex items-center gap-1 ${
                viewport === 'tablet' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Tablet (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tablet</span>
            </button>
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              className={`px-2 py-1 rounded-lg text-[11px] flex items-center gap-1 ${
                viewport === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Mobile (390px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mobile</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleDownload}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Unduh .html</span>
            </button>
            <button
              type="button"
              onClick={handleOpenTab}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 flex items-center gap-1.5"
              title="Buka di tab baru"
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-950 p-3 flex items-center justify-center overflow-auto">
          <iframe
            title="Live HTML Preview"
            sandbox="allow-scripts"
            srcDoc={htmlCode}
            className={`${widthClass} max-w-full h-full bg-white rounded-xl border border-slate-700 shadow-xl transition-all duration-200`}
          />
        </div>
      </div>
    </div>
  );
}
