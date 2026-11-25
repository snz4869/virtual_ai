import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const FALLBACK_AGY_MODELS = [
  { id: 'gemini-3.8-flash-medium', label: 'Gemini 3.8 Flash (Medium)' },
  { id: 'gemini-3.8-flash-low', label: 'Gemini 3.8 Flash (Low — Cepat)' },
  { id: 'gemini-3.8-flash-high', label: 'Gemini 3.8 Flash (High)' },
  { id: 'gemini-4-carbon-medium', label: 'Gemini 4 Carbon (Medium)' },
  { id: 'gemini-4-neon-high', label: 'Gemini 4 Neon (High)' },
  { id: 'claude-sonnet-5-5-medium', label: 'Claude Sonnet 5.5 (Medium)' },
];

let cachedStatus = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_PROMPT_CHARS = 26000;

function getIsolatedSandboxDir() {
  const dir = path.join(os.tmpdir(), 'virtual-office-agy-sandbox');
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch {
    return os.tmpdir();
  }
  return dir;
}

function probeAgyModels() {
  return new Promise((resolve) => {
    let stdout = '';
    let settled = false;
    const finish = (val) => {
      if (settled) return;
      settled = true;
      resolve(val);
    };

    let child;
    try {
      child = spawn('agy', ['models'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      });
    } catch {
      return finish({ available: false, models: [] });
    }

    const timer = setTimeout(() => {
      try {
        child.kill();
      } catch {}
      // Jika binary ditemukan tapi list models lambat, tetap tandai available dengan daftar default
      finish({ available: true, models: FALLBACK_AGY_MODELS });
    }, 6500);

    child.stdout.on('data', (d) => {
      stdout += d.toString('utf8');
    });

    child.on('error', () => {
      clearTimeout(timer);
      finish({ available: false, models: [] });
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0 && !stdout.trim()) {
        return finish({ available: false, models: [] });
      }
      const parsed = [];
      for (const rawLine of stdout.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('Fetching')) continue;
        const tabIdx = line.indexOf('\t');
        if (tabIdx > 0) {
          const id = line.slice(0, tabIdx).trim();
          const label = line.slice(tabIdx + 1).trim();
          if (id) parsed.push({ id, label: label || id });
        }
      }
      finish({
        available: true,
        models: parsed.length > 0 ? parsed : FALLBACK_AGY_MODELS,
      });
    });
  });
}

async function getAgyStatus() {
  if (cachedStatus && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedStatus;
  }
  cachedStatus = await probeAgyModels();
  cachedAt = Date.now();
  return cachedStatus;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk.toString('utf8');
      if (raw.length > 8 * 1024 * 1024) {
        reject(new Error('Payload terlalu besar.'));
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function buildAgyCombinedPrompt({ systemPrompt, userPrompt, fileData }) {
  let attachmentSection = '';
  if (fileData?.extractedText) {
    attachmentSection = `\n\n[ISI LAMPIRAN FILE: ${fileData.fileName || 'lampiran'}]\n${fileData.extractedText}`;
  } else if (fileData?.fileName) {
    attachmentSection = `\n\n[Catatan: Director melampirkan file "${fileData.fileName}" (${fileData.mimeType || 'binary'}).]`;
  }

  const combined =
    `[INSTRUKSI SISTEM VIRTUAL OFFICE — JAWAB LANGSUNG DALAM TEKS/MARKDOWN TANPA MEMANGGIL TOOL FILE/TERMINAL/BROWSER]\n` +
    `${systemPrompt || ''}\n\n` +
    `---\n` +
    `${userPrompt || ''}${attachmentSection}`;

  return combined.length > MAX_PROMPT_CHARS
    ? combined.slice(0, MAX_PROMPT_CHARS)
    : combined;
}

export function normalizeAgyEventLine(line) {
  const trimmed = (line || '').trim();
  if (!trimmed) return null;
  try {
    const obj = JSON.parse(trimmed);
    if (obj.event === 'init' && obj.init?.model) {
      return { type: 'init', model: obj.init.model };
    }
    if (
      obj.event === 'step_update' &&
      obj.step_update?.step_type === 'agent_response'
    ) {
      const su = obj.step_update;
      return {
        type: 'delta',
        text: su.text_delta || '',
        usage: su.usage
          ? {
              promptTokens: su.usage.input_tokens || 0,
              outputTokens: su.usage.output_tokens || 0,
              totalTokens: su.usage.total_tokens || 0,
            }
          : null,
      };
    }
    if (obj.event === 'result' && obj.result) {
      const r = obj.result;
      return {
        type: 'result',
        status: r.status,
        response: r.response || '',
        error: r.error || null,
        usage: r.usage
          ? {
              promptTokens: r.usage.input_tokens || 0,
              outputTokens: r.usage.output_tokens || 0,
              totalTokens: r.usage.total_tokens || 0,
            }
          : null,
      };
    }
  } catch {
    // Ignore non-JSON lines
  }
  return null;
}

function attachAgyMiddleware(middlewares) {
  middlewares.use(async (req, res, next) => {
    const url = (req.url || '').split('?')[0];

    if (url === '/api/agy/status' && req.method === 'GET') {
      // Pastikan hanya dijalankan di non-serverless lokal
      if (process.env.VERCEL) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ available: false, models: [] }));
        return;
      }
      const status = await getAgyStatus();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(status));
      return;
    }

    if (url === '/api/agy/interact' && req.method === 'POST') {
      if (process.env.VERCEL) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'AGY hanya tersedia saat berjalan di lokal.' }));
        return;
      }

      let body;
      try {
        body = await readJsonBody(req);
      } catch (err) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: err.message || 'Invalid JSON' }));
        return;
      }

      const {
        systemPrompt = '',
        userPrompt = '',
        model = '',
        fileData = null,
        stream = true,
      } = body;

      const fullPrompt = buildAgyCombinedPrompt({ systemPrompt, userPrompt, fileData });
      const args = ['--disable-slash-commands', '--output-format', 'stream-json'];
      if (model && model !== 'auto' && model !== 'default') {
        args.push('--model', model);
      }
      args.push('-p', fullPrompt);

      const sandboxDir = getIsolatedSandboxDir();
      let child;
      try {
        child = spawn('agy', args, {
          cwd: sandboxDir,
          stdio: ['ignore', 'pipe', 'pipe'],
          windowsHide: true,
        });
      } catch (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: `Gagal menjalankan agy: ${err.message}` }));
        return;
      }

      let clientClosed = false;
      req.on('close', () => {
        clientClosed = true;
        if (!child.killed) {
          try {
            child.kill();
          } catch {}
        }
      });

      if (stream) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
      }

      const writeSSE = (payload) => {
        if (clientClosed || !stream) return;
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      };

      let buffer = '';
      let fullText = '';
      let resolvedModel = model && model !== 'default' ? model : 'agy-local';
      let finalUsage = null;
      let stderrBuf = '';

      child.stdout.on('data', (chunk) => {
        buffer += chunk.toString('utf8');
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || '';

        for (const line of lines) {
          const evt = normalizeAgyEventLine(line);
          if (!evt) continue;
          if (evt.type === 'init' && evt.model) {
            resolvedModel = evt.model;
          } else if (evt.type === 'delta') {
            if (evt.text) {
              fullText += evt.text;
              writeSSE({ type: 'delta', text: evt.text });
            }
            if (evt.usage) finalUsage = evt.usage;
          } else if (evt.type === 'result') {
            if (!fullText && evt.response) {
              fullText = evt.response;
              writeSSE({ type: 'delta', text: evt.response });
            }
            if (evt.usage) finalUsage = evt.usage;
          }
        }
      });

      child.stderr.on('data', (chunk) => {
        stderrBuf += chunk.toString('utf8');
      });

      child.on('error', (err) => {
        if (clientClosed) return;
        if (stream) {
          writeSSE({ type: 'error', error: `AGY CLI Error: ${err.message}` });
          res.end();
        } else {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: `AGY CLI Error: ${err.message}` }));
        }
      });

      child.on('close', (code) => {
        if (clientClosed) return;

        // Proses sisa buffer terakhir jika ada
        if (buffer.trim()) {
          const evt = normalizeAgyEventLine(buffer);
          if (evt?.type === 'result' && !fullText && evt.response) {
            fullText = evt.response;
            writeSSE({ type: 'delta', text: evt.response });
          }
        }

        const trimmedText = fullText.trim();
        if (!trimmedText) {
          const errMsg =
            stderrBuf.trim() || `AGY selesai tanpa respons teks (exit code ${code}).`;
          if (stream) {
            writeSSE({ type: 'error', error: errMsg });
            res.end();
          } else {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: errMsg }));
          }
          return;
        }

        const modelTag = `agy:${resolvedModel}`;
        if (stream) {
          writeSSE({ type: 'done', modelUsed: modelTag, usage: finalUsage });
          res.end();
        } else {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(
            JSON.stringify({
              text: trimmedText,
              modelUsed: modelTag,
              usage: finalUsage,
            })
          );
        }
      });

      return;
    }

    next();
  });
}

export function agyLocalPlugin() {
  return {
    name: 'virtual-office-agy-local',
    configureServer(server) {
      attachAgyMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      attachAgyMiddleware(server.middlewares);
    },
  };
}
