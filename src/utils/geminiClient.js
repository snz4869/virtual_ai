const GEMINI_CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.6-flash',
  'gemini-3.8-flash',
];

const GEMINI_INLINE_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
]);

export function abortableSleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      const err = new Error('ABORTED');
      err.name = 'AbortError';
      return reject(err);
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      const err = new Error('ABORTED');
      err.name = 'AbortError';
      reject(err);
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function isAbortError(err) {
  return err?.name === 'AbortError' || err?.message === 'ABORTED';
}

function buildPromptWithAttachment(userPrompt, fileData, { forDeepSeek = false } = {}) {
  if (!fileData) return userPrompt;

  const fileLabel = fileData.fileName || 'lampiran';
  if (fileData.extractedText) {
    return `${userPrompt}\n\n[ISI LAMPIRAN FILE: ${fileLabel}]\n${fileData.extractedText}`;
  }

  if (forDeepSeek && fileData.base64) {
    return `${userPrompt}\n\n[Catatan: Director melampirkan file biner "${fileLabel}" (${fileData.mimeType || 'unknown'}), namun DeepSeek hanya mendukung input teks. Gunakan Gemini untuk analisis gambar/PDF.]`;
  }

  return userPrompt;
}

function buildGeminiUserParts(userPrompt, fileData) {
  const textPrompt = buildPromptWithAttachment(userPrompt, fileData);
  const parts = [{ text: textPrompt }];

  if (
    fileData?.base64 &&
    fileData?.mimeType &&
    GEMINI_INLINE_MIME_TYPES.has(fileData.mimeType)
  ) {
    parts.push({
      inlineData: {
        mimeType: fileData.mimeType,
        data: fileData.base64,
      },
    });
  }

  return parts;
}

function resolveGeminiModelOrder(preferredModel) {
  if (preferredModel && preferredModel !== 'auto' && preferredModel.startsWith('gemini-')) {
    return [preferredModel, ...GEMINI_CANDIDATE_MODELS.filter((m) => m !== preferredModel)];
  }
  return [...GEMINI_CANDIDATE_MODELS];
}

function normalizeGeminiUsage(usageMetadata) {
  if (!usageMetadata) return null;
  return {
    promptTokens: usageMetadata.promptTokenCount || 0,
    outputTokens: usageMetadata.candidatesTokenCount || 0,
    totalTokens:
      usageMetadata.totalTokenCount ||
      (usageMetadata.promptTokenCount || 0) + (usageMetadata.candidatesTokenCount || 0),
  };
}

function normalizeDeepSeekUsage(usage) {
  if (!usage) return null;
  return {
    promptTokens: usage.prompt_tokens || 0,
    outputTokens: usage.completion_tokens || 0,
    totalTokens: usage.total_tokens || (usage.prompt_tokens || 0) + (usage.completion_tokens || 0),
  };
}

async function consumeSSEStream(body, onDataJson, signal) {
  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  const onAbort = () => {
    reader.cancel().catch(() => {});
  };
  signal?.addEventListener('abort', onAbort, { once: true });

  try {
    while (true) {
      if (signal?.aborted) {
        const err = new Error('ABORTED');
        err.name = 'AbortError';
        throw err;
      }
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          onDataJson(JSON.parse(payload));
        } catch {
          // Ignore malformed chunk
        }
      }
    }
  } finally {
    signal?.removeEventListener('abort', onAbort);
  }
}

function buildDemoResponse({ agent, taskInput, fileData }) {
  const agentId = agent?.id || '';
  const agentName = agent?.name || 'Agen';
  const role = agent?.role || 'Anggota Tim';
  const attachmentNote = fileData?.fileName ? `\nLampiran terdeteksi: \`${fileData.fileName}\`.` : '';
  const isLandingTask = /landing\s*page|html|umkm|saas/i.test(taskInput);

  if (agentId === 'alex') {
    return (
      `### Kerangka Kerja — ${agentName} (${role})${attachmentNote}\n` +
      `Target tugas: "${taskInput}"\n` +
      `1. Tetapkan cakupan inti sesuai perintah Director (anti-overengineering).\n` +
      `2. Serahkan ke tim Executor untuk implementasi utuh & siap diverifikasi QA.`
    );
  }

  if (agentId === 'raka') {
    if (isLandingTask) {
      return (
        `### Implementasi Solusi — ${agentName} (${role})${attachmentNote}\n` +
        `Berikut contoh landing page demo yang bisa langsung Anda lihat lewat tombol **Live Preview**:\n` +
        '```html\n' +
        `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>KasFlow UMKM — Demo Preview</title>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; }
    .hero { padding: 56px 24px; text-align: center; background: linear-gradient(135deg,#312e81,#0f172a); }
    .hero h1 { font-size: 2rem; margin: 0 0 12px; }
    .hero p { color: #cbd5e1; max-width: 540px; margin: 0 auto 24px; }
    .cta { display: inline-block; padding: 12px 24px; border-radius: 10px; background: #10b981; color: #052e16; font-weight: 700; text-decoration: none; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); gap: 16px; max-width: 860px; margin: 32px auto; padding: 0 20px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 14px; padding: 20px; }
  </style>
</head>
<body>
  <section class="hero">
    <h1>Kelola Keuangan UMKM Lebih Rapi</h1>
    <p>Catat arus kas, invoice otomatis, dan laporan laba rugi dalam satu dasbor ringan.</p>
    <a class="cta" href="#harga">Coba Gratis 14 Hari</a>
  </section>
  <section class="grid" id="harga">
    <div class="card"><h3>Starter</h3><p>Gratis • Pencatatan kas harian & laporan bulanan.</p></div>
    <div class="card"><h3>Pro UMKM</h3><p>Rp 99rb/bln • Multi-cabang, pajak, dan ekspor Excel.</p></div>
    <div class="card"><h3>Enterprise</h3><p>Rp 299rb/bln • Integrasi API & dukungan prioritas.</p></div>
  </section>
</body>
</html>\n` +
        '```'
      );
    }

    return (
      `### Implementasi Solusi — ${agentName} (${role})${attachmentNote}\n` +
      `Solusi untuk "${taskInput}" telah disusun sesuai arahan Tech Lead.\n` +
      '```txt\nStatus Implementasi: Selesai (Mode Simulasi Demo)\nAktifkan Live AI API di menu Brief & API untuk output Gemini / DeepSeek sungguhan.\n```'
    );
  }

  if (agentId === 'nadia') {
    return (
      `### Audit QA — ${agentName} (${role})${attachmentNote}\n` +
      `- Kesesuaian dengan instruksi Director: Terpenuhi (simulasi demo).\n` +
      `- Kelengkapan format & tidak ada error terdeteksi.\n\n` +
      `[STATUS: VERIFIED]`
    );
  }

  return (
    `### Kontribusi — ${agentName} (${role})${attachmentNote}\n` +
    `Menyelesaikan tinjauan spesialis sesuai SOP untuk: "${taskInput}".`
  );
}

async function callDeepSeekDirect({
  deepseekApiKey,
  systemPrompt,
  userPrompt,
  fileData,
  signal,
  onChunk,
}) {
  if (!deepseekApiKey || deepseekApiKey.trim() === '') {
    throw new Error('DeepSeek API Key kosong. Silakan isi di menu Brief & API.');
  }

  const dsPrompt = buildPromptWithAttachment(userPrompt, fileData, { forDeepSeek: true });
  const useStream = Boolean(onChunk);

  const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${deepseekApiKey.trim()}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
        { role: 'user', content: dsPrompt },
      ],
      max_tokens: 8192,
      temperature: 0.4,
      ...(useStream ? { stream: true, stream_options: { include_usage: true } } : {}),
    }),
  });

  if (!dsRes.ok) {
    const dsErr = await dsRes.json().catch(() => ({}));
    throw new Error(dsErr?.error?.message || `DeepSeek Error ${dsRes.status}`);
  }

  if (useStream && dsRes.body) {
    let fullText = '';
    let usage = null;
    await consumeSSEStream(
      dsRes.body,
      (chunk) => {
        const delta = chunk?.choices?.[0]?.delta?.content || '';
        if (delta) {
          fullText += delta;
          onChunk(fullText, delta);
        }
        if (chunk?.usage) usage = normalizeDeepSeekUsage(chunk.usage);
      },
      signal
    );
    if (!fullText) throw new Error('Respons DeepSeek kosong.');
    return { text: fullText, modelUsed: 'deepseek-chat', usage };
  }

  const dsData = await dsRes.json().catch(() => ({}));
  const text = dsData?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Respons DeepSeek kosong.');
  return {
    text,
    modelUsed: 'deepseek-chat',
    usage: normalizeDeepSeekUsage(dsData?.usage),
  };
}

async function callGeminiDirect({
  apiKey,
  preferredModel,
  systemPrompt,
  userPrompt,
  fileData,
  signal,
  onChunk,
}) {
  const trimmedKey = apiKey?.trim() || '';
  if (!trimmedKey) {
    throw new Error('Gemini API Key kosong. Silakan isi di menu Brief & API.');
  }

  const userParts = buildGeminiUserParts(userPrompt, fileData);
  const candidateModels = resolveGeminiModelOrder(preferredModel);
  const useStream = Boolean(onChunk);
  let lastError = null;

  for (const modelName of candidateModels) {
    if (signal?.aborted) {
      const err = new Error('ABORTED');
      err.name = 'AbortError';
      throw err;
    }

    if (useStream) {
      const streamUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${encodeURIComponent(trimmedKey)}`;
      const gRes = await fetch(streamUrl, {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: userParts }],
          generationConfig: { maxOutputTokens: 8192, temperature: 0.4 },
        }),
      });

      if (gRes.ok && gRes.body) {
        let finalText = '';
        let finishReason = null;
        let usage = null;

        await consumeSSEStream(
          gRes.body,
          (chunk) => {
            const candidate = chunk?.candidates?.[0];
            const delta = candidate?.content?.parts?.map((p) => p.text || '').join('') || '';
            if (delta) {
              finalText += delta;
              onChunk(finalText, delta);
            }
            if (candidate?.finishReason) finishReason = candidate.finishReason;
            if (chunk?.usageMetadata) usage = normalizeGeminiUsage(chunk.usageMetadata);
          },
          signal
        );

        if (finalText && finishReason === 'MAX_TOKENS') {
          const contRes = await fetch(streamUrl, {
            method: 'POST',
            signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents: [
                { role: 'user', parts: userParts },
                { role: 'model', parts: [{ text: finalText }] },
                {
                  role: 'user',
                  parts: [
                    {
                      text: 'Lanjutkan persis dari karakter terakhir yang terpotong hingga selesai tanpa mengulang.',
                    },
                  ],
                },
              ],
              generationConfig: { maxOutputTokens: 8192, temperature: 0.4 },
            }),
          });
          if (contRes.ok && contRes.body) {
            await consumeSSEStream(
              contRes.body,
              (chunk) => {
                const candidate = chunk?.candidates?.[0];
                const delta = candidate?.content?.parts?.map((p) => p.text || '').join('') || '';
                if (delta) {
                  finalText += delta;
                  onChunk(finalText, delta);
                }
                if (chunk?.usageMetadata) {
                  const contUsage = normalizeGeminiUsage(chunk.usageMetadata);
                  if (usage && contUsage) {
                    usage = {
                      promptTokens: usage.promptTokens + contUsage.promptTokens,
                      outputTokens: usage.outputTokens + contUsage.outputTokens,
                      totalTokens: usage.totalTokens + contUsage.totalTokens,
                    };
                  }
                }
              },
              signal
            );
          }
        }

        if (finalText) {
          return { text: finalText, modelUsed: modelName, usage };
        }
      }

      const gErr = await gRes.json().catch(() => ({}));
      lastError = gErr?.error?.message || `Gemini Error ${gRes.status}`;
      if ([404, 429, 503].includes(gRes.status)) {
        await abortableSleep(1200, signal);
        continue;
      }
      break;
    }

    // Non-stream direct fallback
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(trimmedKey)}`;
    const gRes = await fetch(geminiUrl, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: userParts }],
        generationConfig: { maxOutputTokens: 8192, temperature: 0.4 },
      }),
    });

    const gData = await gRes.json().catch(() => ({}));
    if (gRes.ok) {
      const candidate = gData?.candidates?.[0];
      let finalText = candidate?.content?.parts?.map((p) => p.text || '').join('') || '';
      let usage = normalizeGeminiUsage(gData?.usageMetadata);

      if (finalText && candidate?.finishReason === 'MAX_TOKENS') {
        const contRes = await fetch(geminiUrl, {
          method: 'POST',
          signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [
              { role: 'user', parts: userParts },
              { role: 'model', parts: [{ text: finalText }] },
              {
                role: 'user',
                parts: [
                  {
                    text: 'Lanjutkan persis dari karakter terakhir yang terpotong hingga selesai tanpa mengulang.',
                  },
                ],
              },
            ],
            generationConfig: { maxOutputTokens: 8192, temperature: 0.4 },
          }),
        });
        if (contRes.ok) {
          const contData = await contRes.json().catch(() => ({}));
          finalText +=
            contData?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
          const contUsage = normalizeGeminiUsage(contData?.usageMetadata);
          if (usage && contUsage) {
            usage = {
              promptTokens: usage.promptTokens + contUsage.promptTokens,
              outputTokens: usage.outputTokens + contUsage.outputTokens,
              totalTokens: usage.totalTokens + contUsage.totalTokens,
            };
          }
        }
      }

      if (finalText) {
        return { text: finalText, modelUsed: modelName, usage };
      }
    }

    lastError = gData?.error?.message || `Gemini Error ${gRes.status}`;
    if ([404, 429, 503].includes(gRes.status)) {
      await abortableSleep(1200, signal);
      continue;
    }
    break;
  }

  throw new Error(lastError || 'Semua model Gemini gagal merespons.');
}

export async function executeAgentPrompt({
  agent,
  prompt,
  brief,
  recentLogs = [],
  apiMode = 'live',
  clientApiKey = '',
  simSpeed = 1,
  provider = 'auto',
  deepseekApiKey = '',
  fileData = null,
  preferredModel = 'auto',
  signal = null,
  onChunk = null,
}) {
  const startedAt = performance.now();
  const agentName = agent?.name || 'Agen';
  const role = agent?.role || 'Anggota Tim';
  const sop = agent?.sop || '';
  const projectBrief = brief || '';
  const taskInput = prompt || '';
  const apiKey = clientApiKey?.trim() || '';
  const dsKey = deepseekApiKey?.trim() || '';
  const modelPref = preferredModel || agent?.preferredModel || 'auto';

  const effectiveProvider =
    modelPref === 'deepseek-chat'
      ? 'deepseek'
      : modelPref !== 'auto' && modelPref.startsWith('gemini-')
        ? 'gemini'
        : provider;

  if (apiMode === 'demo') {
    const fullDemo = buildDemoResponse({ agent, taskInput, fileData });
    if (onChunk) {
      const tokens = fullDemo.split(/(\s+)/);
      let acc = '';
      const stepMs = Math.max(8, Math.round(18 / Math.max(1, simSpeed)));
      for (let i = 0; i < tokens.length; i += 3) {
        acc += tokens.slice(i, i + 3).join('');
        onChunk(acc, tokens.slice(i, i + 3).join(''));
        await abortableSleep(stepMs, signal);
      }
    } else {
      const delayMs = Math.max(250, Math.round(900 / Math.max(1, simSpeed)));
      await abortableSleep(delayMs, signal);
    }
    return {
      text: fullDemo,
      modelUsed: 'demo-simulator',
      durationMs: Math.round(performance.now() - startedAt),
      usage: {
        promptTokens: Math.ceil(taskInput.length / 4),
        outputTokens: Math.ceil(fullDemo.length / 4),
        totalTokens: Math.ceil((taskInput.length + fullDemo.length) / 4),
      },
    };
  }

  const systemPrompt = `Kamu adalah ${agentName}, berperan sebagai ${role} di dalam tim Virtual Office AI.
SOP Kamu: ${sop}
Project Brief Kantor:
${projectBrief}`;

  // Ambil maks 12 log terakhir dari sesi aktif agar konteks tidak membengkak
  const trimmedLogs = recentLogs.slice(-12);
  const previousContext = trimmedLogs
    .map((l) => `[${l.agentName || 'Anggota'}]: ${l.content}`)
    .join('\n\n');

  const userPrompt = previousContext
    ? `Instruksi Director:\n${taskInput}\n\nHasil Kerja Tim Sebelumnya:\n${previousContext}\n\nLanjutkan bagianmu secara ringkas, akurat, dan sesuai SOP.`
    : `Instruksi Director:\n${taskInput}\n\nKerjakan bagianmu sesuai SOP.`;

  // 1. Coba lewat Vercel Serverless Route (/api/interact)
  const useStream = Boolean(onChunk);
  try {
    const res = await fetch('/api/interact', {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: effectiveProvider,
        preferredModel: modelPref,
        stream: useStream,
        systemPrompt,
        userPrompt,
        apiKey,
        deepseekApiKey: dsKey,
        fileData,
      }),
    });

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (useStream && contentType.includes('text/event-stream') && res.body) {
        let fullText = '';
        let modelUsed = modelPref !== 'auto' ? modelPref : 'gemini-3.5-flash-lite';
        let usage = null;
        let streamError = null;

        await consumeSSEStream(
          res.body,
          (evt) => {
            if (evt.type === 'delta' && evt.text) {
              fullText += evt.text;
              onChunk(fullText, evt.text);
            } else if (evt.type === 'done') {
              if (evt.modelUsed) modelUsed = evt.modelUsed;
              if (evt.usage) usage = evt.usage;
            } else if (evt.type === 'error') {
              streamError = evt.error;
            }
          },
          signal
        );

        if (streamError) throw new Error(streamError);
        return {
          text: fullText,
          modelUsed,
          durationMs: Math.round(performance.now() - startedAt),
          usage,
        };
      }

      const data = await res.json();
      if (onChunk && data.text) onChunk(data.text, data.text);
      return {
        text: data.text,
        modelUsed: data.modelUsed || 'unknown',
        durationMs: Math.round(performance.now() - startedAt),
        usage: data.usage || null,
      };
    }

    const errData = await res.json().catch(() => ({}));
    if (res.status !== 404) {
      throw new Error(errData.error || `Server Error ${res.status}`);
    }
  } catch (err) {
    if (isAbortError(err)) throw err;
    if (
      !String(err.message).includes('404') &&
      !String(err.message).includes('Failed to fetch')
    ) {
      throw err;
    }
  }

  // 2. Fallback Direct Browser Call (untuk local Vite dev)
  let result;
  if (effectiveProvider === 'deepseek') {
    result = await callDeepSeekDirect({
      deepseekApiKey: dsKey,
      systemPrompt,
      userPrompt,
      fileData,
      signal,
      onChunk,
    });
  } else if (effectiveProvider === 'gemini') {
    result = await callGeminiDirect({
      apiKey,
      preferredModel: modelPref,
      systemPrompt,
      userPrompt,
      fileData,
      signal,
      onChunk,
    });
  } else if (!apiKey && dsKey) {
    result = await callDeepSeekDirect({
      deepseekApiKey: dsKey,
      systemPrompt,
      userPrompt,
      fileData,
      signal,
      onChunk,
    });
  } else if (!apiKey && !dsKey) {
    throw new Error('API Key belum diisi. Silakan isi Gemini atau DeepSeek API Key di menu Brief & API.');
  } else {
    try {
      result = await callGeminiDirect({
        apiKey,
        preferredModel: modelPref,
        systemPrompt,
        userPrompt,
        fileData,
        signal,
        onChunk,
      });
    } catch (geminiErr) {
      if (isAbortError(geminiErr)) throw geminiErr;
      if (dsKey) {
        result = await callDeepSeekDirect({
          deepseekApiKey: dsKey,
          systemPrompt,
          userPrompt,
          fileData,
          signal,
          onChunk,
        });
      } else {
        throw geminiErr;
      }
    }
  }

  return {
    text: result.text,
    modelUsed: result.modelUsed,
    durationMs: Math.round(performance.now() - startedAt),
    usage: result.usage || null,
  };
}
