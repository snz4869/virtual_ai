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

const GEMINI_MAX_OUTPUT_TOKENS = 32768;

function isTextTruncated(text, finishReason = '') {
  if (finishReason === 'MAX_TOKENS') return true;
  const trimmed = (text || '').trim();
  if (!trimmed) return false;
  const fences = trimmed.match(/```/g);
  if (fences && fences.length % 2 === 1) return true;
  if (/(<!doctype\s+html|<html[\s>])/i.test(trimmed) && !/<\/html\s*>/i.test(trimmed)) return true;
  return false;
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

function buildDemoResponse({ agent, taskInput, fileData, sop = '' }) {
  const agentId = agent?.id || '';
  const agentName = agent?.name || 'Agen';
  const role = agent?.role || 'Anggota Tim';
  const attachmentNote = fileData?.fileName ? `\nLampiran terdeteksi: \`${fileData.fileName}\`.` : '';
  const isLandingTask = /landing\s*page|html|umkm|saas/i.test(taskInput);
  const isApiTask = /api|endpoint|antrean|backend|rest/i.test(taskInput);
  const isComplexBuildTask =
    isLandingTask || isApiTask || /\b(buat|buatkan|bangun|sistem|aplikasi|fitur|dashboard)\b/i.test(taskInput);

  if (agentId === 'alex') {
    const canGrillInDemo = /\[STATUS:\s*GRILLING\]/i.test(sop);
    const hasDirectorAnswer = /\[JAWABAN GRILLING DIRECTOR/i.test(taskInput);

    if (canGrillInDemo && !hasDirectorAnswer && isComplexBuildTask) {
      if (isLandingTask) {
        return (
          `### Konfirmasi Keputusan Inti — ${agentName} (${role})${attachmentNote}\n` +
          `Sebelum Raka mengeksekusi, mohon konfirmasi 2 keputusan inti berikut (detail minor seperti warna/spacing akan langsung ditangani tim):\n\n` +
          `❓ **Q1** - **Fokus CTA & Alur Utama**: Apakah target utama halaman ini cukup 1 alur konversi (**Coba Gratis 14 Hari** langsung ke bagian Harga) tanpa form registrasi backend?\n\n` +
          `➡️ Ya, 1 CTA utama menuju tabel harga agar halaman ringkas, cepat, dan siap preview langsung dalam 1 file HTML.\n\n` +
          `---\n\n` +
          `❓ **Q2** - **Struktur Paket Harga**: Apakah cukup tampilkan **3 paket inti** (Starter, Pro UMKM, Enterprise) tanpa toggle bulanan/tahunan?\n\n` +
          `➡️ Ya, 3 paket inti saja supaya fokus dan tidak bertele-tele.\n\n` +
          `[STATUS: GRILLING]`
        );
      }

      return (
        `### Konfirmasi Keputusan Inti — ${agentName} (${role})${attachmentNote}\n` +
        `Sebelum Raka mengeksekusi, mohon konfirmasi 2 keputusan inti berikut (detail minor langsung dieksekusi tim):\n\n` +
        `❓ **Q1** - **Penyimpanan Data & Scope**: Apakah implementasi awal cukup menggunakan **in-memory store** (tanpa setup database eksternal) dengan validasi input inti?\n\n` +
        `➡️ Ya, pakai in-memory store dulu agar kode ringkas, langsung jalan, dan mudah diuji.\n\n` +
        `---\n\n` +
        `❓ **Q2** - **Autentikasi & Fitur Tambahan**: Apakah endpoint cukup fokus pada fungsi inti yang diminta **tanpa auth/dashboard tambahan**?\n\n` +
        `➡️ Ya, fokus pada fungsi inti saja agar output Dev tepat sasaran.\n\n` +
        `[STATUS: GRILLING]`
      );
    }

    if (hasDirectorAnswer) {
      return (
        `### Kontrak Kerja Ringkas — ${agentName} (${role})${attachmentNote}\n` +
        `- **Cakupan Inti (Disetujui Director)**: Eksekusi tepat sesuai keputusan inti yang baru dikonfirmasi Director.\n` +
        `- **Batasan Anti-Bloat**: Jangan tambah fitur, opsi, atau boilerplate di luar kontrak.\n` +
        `- **Target Output Raka**: Implementasi utuh, ringkas, dan siap verifikasi QA.\n\n` +
        `[STATUS: READY]`
      );
    }

    return (
      `### Kontrak Kerja Ringkas — ${agentName} (${role})${attachmentNote}\n` +
      `Target tugas: "${taskInput}"\n` +
      `1. Cakupan inti sudah jelas — langsung eksekusi secara ringkas dan akurat (anti-overengineering).\n` +
      `2. Serahkan ke tim Executor untuk hasil utuh & siap diverifikasi QA.\n\n` +
      `[STATUS: READY]`
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

  if (agentId === 'kael') {
    const canGrillInDemo = /\[STATUS:\s*GRILLING\]/i.test(sop);
    const hasDirectorAnswer = /\[JAWABAN GRILLING DIRECTOR/i.test(taskInput);

    if (canGrillInDemo && !hasDirectorAnswer && isComplexBuildTask) {
      return (
        `### Konfirmasi Cepat — ${agentName} (${role})${attachmentNote}\n` +
        `Sebelum saya kerjakan end-to-end sendirian, konfirmasi 2 keputusan inti berikut (detail minor langsung saya tangani):\n\n` +
        `❓ **Q1** - **Cakupan Fitur Inti**: Apakah fokus cukup pada fungsi utama yang diminta tanpa modul tambahan (auth/admin panel)?\n\n` +
        `➡️ Ya, fokus ke fungsi inti saja agar hasil ringkas, cepat selesai, dan langsung bisa dipakai.\n\n` +
        `---\n\n` +
        `❓ **Q2** - **Format Output**: Apakah hasil akhir cukup dikemas dalam 1 blok kode utuh siap jalan (siap Live Preview untuk HTML)?\n\n` +
        `➡️ Ya, 1 blok kode utuh yang ramping dan sudah melewati self-check.\n\n` +
        `[STATUS: GRILLING]`
      );
    }

    if (isLandingTask) {
      return (
        `### Solusi End-to-End — ${agentName} (${role})${attachmentNote}\n` +
        `Berikut implementasi landing page ringkas siap pakai (sudah self-check struktur & responsivitas, klik **Live Preview**):\n` +
        '```html\n' +
        `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>KasFlow UMKM — Solo Full-Stack</title>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; }
    .hero { padding: 56px 24px; text-align: center; background: #1e293b; border-bottom: 1px solid #334155; }
    .hero h1 { font-size: 2rem; margin: 0 0 12px; }
    .hero p { color: #cbd5e1; max-width: 520px; margin: 0 auto 24px; }
    .cta { display: inline-block; padding: 12px 24px; border-radius: 10px; background: #0ea5e9; color: #082f49; font-weight: 700; text-decoration: none; }
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
        '```\n' +
        `_Self-check: struktur HTML utuh, responsif, tanpa bloat tambahan._`
      );
    }

    return (
      `### Solusi End-to-End — ${agentName} (${role})${attachmentNote}\n` +
      `Tugas "${taskInput}" telah dianalisis, dieksekusi, dan di-self-check secara mandiri dalam mode **Solo Full-Stack**.\n` +
      '```txt\nStatus: Selesai Mandiri (Mode Simulasi Demo)\nAktifkan Live AI API di menu Brief & API untuk eksekusi Gemini / DeepSeek / AGY sungguhan.\n```'
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
          generationConfig: { maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS, temperature: 0.4 },
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

        if (finalText && isTextTruncated(finalText, finishReason)) {
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
              generationConfig: { maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS, temperature: 0.4 },
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
        generationConfig: { maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS, temperature: 0.4 },
      }),
    });

    const gData = await gRes.json().catch(() => ({}));
    if (gRes.ok) {
      const candidate = gData?.candidates?.[0];
      let finalText = candidate?.content?.parts?.map((p) => p.text || '').join('') || '';
      let usage = normalizeGeminiUsage(gData?.usageMetadata);

      if (finalText && isTextTruncated(finalText, candidate?.finishReason)) {
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
            generationConfig: { maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS, temperature: 0.4 },
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

async function callAgyLocal({
  agyModel,
  systemPrompt,
  userPrompt,
  fileData,
  signal,
  onChunk,
}) {
  const useStream = Boolean(onChunk);
  const res = await fetch('/api/agy/interact', {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: agyModel || 'default',
      stream: useStream,
      systemPrompt,
      userPrompt,
      fileData,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `AGY Local Error ${res.status}`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (useStream && contentType.includes('text/event-stream') && res.body) {
    let fullText = '';
    let modelUsed = agyModel && agyModel !== 'default' ? `agy:${agyModel}` : 'agy:local';
    let usage = null;
    let streamError = null;

    await consumeSSEStream(
      res.body,
      (evt) => {
        if (evt.type === 'delta' && evt.text) {
          fullText += evt.text;
          onChunk(fullText.trimStart(), evt.text);
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
    return { text: fullText.trim(), modelUsed, usage };
  }

  const data = await res.json();
  if (onChunk && data.text) onChunk(data.text, data.text);
  return {
    text: (data.text || '').trim(),
    modelUsed: data.modelUsed || 'agy:local',
    usage: data.usage || null,
  };
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
  agyAvailable = false,
  agyModel = 'default',
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
  const rawModelPref = preferredModel || agent?.preferredModel || 'auto';

  // Jika di Vercel (agyAvailable === false), abaikan preferensi model/provider AGY
  const isAgentAgyPref = rawModelPref.startsWith('agy:');
  const modelPref = isAgentAgyPref && !agyAvailable ? 'auto' : rawModelPref;
  const safeProvider = provider === 'agy' && !agyAvailable ? 'auto' : provider;

  const shouldUseAgy =
    agyAvailable &&
    (isAgentAgyPref ||
      safeProvider === 'agy' ||
      (safeProvider === 'auto' && !apiKey && !dsKey));

  const effectiveProvider = shouldUseAgy
    ? 'agy'
    : modelPref === 'deepseek-chat'
      ? 'deepseek'
      : modelPref !== 'auto' && modelPref.startsWith('gemini-')
        ? 'gemini'
        : safeProvider;

  if (apiMode === 'demo') {
    const fullDemo = buildDemoResponse({ agent, taskInput, fileData, sop });
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

  // Untuk AGY lokal izinkan jendela konteks jauh lebih besar (hingga 24 log); cloud 12 log
  const maxContextLogs = effectiveProvider === 'agy' ? 24 : 12;
  const trimmedLogs = recentLogs.slice(-maxContextLogs);
  const previousContext = trimmedLogs
    .map((l) => `[${l.agentName || 'Anggota'}]: ${l.content}`)
    .join('\n\n');

  const userPrompt = previousContext
    ? `Instruksi Director:\n${taskInput}\n\nHasil Kerja Tim Sebelumnya:\n${previousContext}\n\nLanjutkan bagianmu secara ringkas, akurat, dan sesuai SOP.`
    : `Instruksi Director:\n${taskInput}\n\nKerjakan bagianmu sesuai SOP.`;

  // 0. Jalur khusus AGY Local CLI (hanya aktif saat running lokal & agy terdeteksi)
  if (effectiveProvider === 'agy') {
    const selectedAgyModel = isAgentAgyPref ? rawModelPref.slice(4) : agyModel || 'default';
    const agyRes = await callAgyLocal({
      agyModel: selectedAgyModel,
      systemPrompt,
      userPrompt,
      fileData,
      signal,
      onChunk,
    });
    return {
      text: agyRes.text,
      modelUsed: agyRes.modelUsed,
      durationMs: Math.round(performance.now() - startedAt),
      usage: agyRes.usage || null,
    };
  }

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
