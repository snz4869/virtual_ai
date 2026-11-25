import React, { useState } from 'react';
import { Check, Copy, Download, Eye } from 'lucide-react';

const LANG_EXT_MAP = {
  html: 'html',
  htm: 'html',
  svg: 'svg',
  css: 'css',
  js: 'js',
  javascript: 'js',
  jsx: 'jsx',
  ts: 'ts',
  typescript: 'ts',
  tsx: 'tsx',
  json: 'json',
  py: 'py',
  python: 'py',
  sql: 'sql',
  sh: 'sh',
  bash: 'sh',
  md: 'md',
  markdown: 'md',
  yaml: 'yaml',
  yml: 'yml',
  xml: 'xml',
};

function isPreviewableHtml(lang, code) {
  const normalized = (lang || '').toLowerCase();
  if (normalized === 'html' || normalized === 'htm' || normalized === 'svg') return true;
  const trimmed = (code || '').trim();
  return /^<!doctype\s+html/i.test(trimmed) || /^<html[\s>]/i.test(trimmed) || /^<svg[\s>]/i.test(trimmed);
}

function CodeBlock({ lang, code, onPreviewHtml }) {
  const [copied, setCopied] = useState(false);
  const canPreview = isPreviewableHtml(lang, code);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback copy
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleDownload = () => {
    const ext = LANG_EXT_MAP[(lang || '').toLowerCase()] || (canPreview ? 'html' : 'txt');
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `virtual-office-output.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="my-2.5 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950">
      <div className="px-2.5 py-1.5 bg-slate-800/85 border-b border-slate-700/70 flex items-center justify-between gap-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
          {lang || 'code'}
        </span>
        <div className="flex items-center gap-1.5">
          {canPreview && onPreviewHtml && (
            <button
              type="button"
              onClick={() => onPreviewHtml(code)}
              className="px-2 py-0.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/35 text-[10px] font-semibold flex items-center gap-1 transition-colors"
              title="Buka Live Preview HTML"
            >
              <Eye className="w-3 h-3" />
              <span>Live Preview</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleDownload}
            className="px-1.5 py-0.5 rounded-md bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-[10px] font-medium flex items-center gap-1 transition-colors"
            title="Unduh kode"
          >
            <Download className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="px-2 py-0.5 rounded-md bg-slate-700/60 hover:bg-slate-700 text-slate-200 text-[10px] font-medium flex items-center gap-1 transition-colors"
            title="Salin kode"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-300">Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
      <pre className="p-2.5 overflow-x-auto text-[11px] font-mono text-emerald-300 leading-relaxed max-h-96">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderInline(text, keyPrefix = 'in') {
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`\n]+`|\[[^\]]+\]\((https?:\/\/[^\s)]+)\))/g;
  let lastIndex = 0;
  let match;
  let idx = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={`${keyPrefix}-${idx++}`} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={`${keyPrefix}-${idx++}`} className="italic text-slate-300">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={`${keyPrefix}-${idx++}`}
          className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-[11px]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('[')) {
      const labelMatch = token.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
      if (labelMatch) {
        parts.push(
          <a
            key={`${keyPrefix}-${idx++}`}
            href={labelMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 underline hover:text-indigo-300"
          >
            {labelMatch[1]}
          </a>
        );
      } else {
        parts.push(token);
      }
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

function renderTextBlocks(segment, baseKey, onPreviewHtml) {
  const lines = segment.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      elements.push(<hr key={`${baseKey}-hr-${i}`} className="my-2.5 border-slate-800" />);
      i++;
      continue;
    }

    // Heading
    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const cls =
        level === 1
          ? 'text-sm font-bold text-white mt-2.5 mb-1'
          : level === 2
            ? 'text-[13px] font-bold text-white mt-2 mb-1'
            : 'text-xs font-semibold text-indigo-200 mt-1.5 mb-0.5';
      elements.push(
        <div key={`${baseKey}-h-${i}`} className={cls}>
          {renderInline(headingMatch[2], `${baseKey}-h-${i}`)}
        </div>
      );
      i++;
      continue;
    }

    // Table (header | separator | rows)
    if (
      trimmed.includes('|') &&
      i + 1 < lines.length &&
      /^\s*\|?(\s*:?-{2,}:?\s*\|)+\s*:?-{2,}:?\s*\|?\s*$/.test(lines[i + 1])
    ) {
      const parseCells = (rowStr) =>
        rowStr
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((c) => c.trim());

      const headers = parseCells(lines[i]);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim() && lines[i].includes('|')) {
        rows.push(parseCells(lines[i]));
        i++;
      }

      elements.push(
        <div key={`${baseKey}-tbl-${i}`} className="my-2 overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead className="bg-slate-800/80 text-slate-200">
              <tr>
                {headers.map((h, hIdx) => (
                  <th key={hIdx} className="px-2.5 py-1.5 font-semibold border-b border-slate-700">
                    {renderInline(h, `${baseKey}-th-${i}-${hIdx}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-950/50">
              {rows.map((r, rIdx) => (
                <tr key={rIdx}>
                  {headers.map((_, cIdx) => (
                    <td key={cIdx} className="px-2.5 py-1.5 text-slate-300 align-top">
                      {renderInline(r[cIdx] || '', `${baseKey}-td-${i}-${rIdx}-${cIdx}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      elements.push(
        <blockquote
          key={`${baseKey}-bq-${i}`}
          className="my-1.5 pl-3 border-l-2 border-indigo-500/60 text-slate-300 italic"
        >
          {quoteLines.map((ql, qIdx) => (
            <div key={qIdx}>{renderInline(ql, `${baseKey}-bq-${i}-${qIdx}`)}</div>
          ))}
        </blockquote>
      );
      continue;
    }

    // Unordered list
    if (/^[-*+]\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*+]\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={`${baseKey}-ul-${i}`} className="my-1.5 pl-4 list-disc space-y-1 text-slate-200">
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `${baseKey}-ul-${i}-${idx}`)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      elements.push(
        <ol key={`${baseKey}-ol-${i}`} className="my-1.5 pl-4 list-decimal space-y-1 text-slate-200">
          {items.map((it, idx) => (
            <li key={idx}>{renderInline(it, `${baseKey}-ol-${i}-${idx}`)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Normal paragraph (collect consecutive plain lines)
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,4}\s+|[-*+]\s+|\d+\.\s+|>|-{3,}$|\*{3,}$)/.test(lines[i].trim())
    ) {
      // Stop if next line starts a table
      if (
        lines[i].includes('|') &&
        i + 1 < lines.length &&
        /^\s*\|?(\s*:?-{2,}:?\s*\|)+\s*:?-{2,}:?\s*\|?\s*$/.test(lines[i + 1])
      ) {
        break;
      }
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      elements.push(
        <p key={`${baseKey}-p-${i}`} className="my-1 whitespace-pre-wrap break-words">
          {paraLines.map((pl, pIdx) => (
            <React.Fragment key={pIdx}>
              {pIdx > 0 && <br />}
              {renderInline(pl, `${baseKey}-p-${i}-${pIdx}`)}
            </React.Fragment>
          ))}
        </p>
      );
    } else {
      i++;
    }
  }

  return elements;
}

export default function MarkdownRenderer({ content, onPreviewHtml }) {
  const raw = String(content || '');
  const segments = [];
  const fenceRegex = /```([\w-]*)\n?([\s\S]*?)```/g;
  let lastIdx = 0;
  let match;

  while ((match = fenceRegex.exec(raw)) !== null) {
    if (match.index > lastIdx) {
      segments.push({ type: 'text', value: raw.slice(lastIdx, match.index) });
    }
    segments.push({
      type: 'code',
      lang: match[1] || '',
      value: match[2].replace(/\n$/, ''),
    });
    lastIdx = fenceRegex.lastIndex;
  }

  // Tangani fenced code block yang masih terbuka saat streaming berlangsung
  if (lastIdx < raw.length) {
    const tail = raw.slice(lastIdx);
    const openFence = tail.match(/^([\s\S]*?)```([\w-]*)\n?([\s\S]*)$/);
    if (openFence) {
      if (openFence[1]) segments.push({ type: 'text', value: openFence[1] });
      segments.push({ type: 'code', lang: openFence[2] || '', value: openFence[3] });
    } else {
      segments.push({ type: 'text', value: tail });
    }
  }

  return (
    <div className="text-xs text-slate-200 leading-relaxed space-y-1">
      {segments.map((seg, idx) =>
        seg.type === 'code' ? (
          <CodeBlock
            key={`cb-${idx}`}
            lang={seg.lang}
            code={seg.value}
            onPreviewHtml={onPreviewHtml}
          />
        ) : (
          <React.Fragment key={`txt-${idx}`}>
            {renderTextBlocks(seg.value, `seg-${idx}`, onPreviewHtml)}
          </React.Fragment>
        )
      )}
    </div>
  );
}
