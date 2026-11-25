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

async function consumeSSEStream(body, onDataJson) {
  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
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
        // Ignore partial/malformed SSE chunk
      }
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const {
    provider = 'auto',
    preferredModel = 'auto',
    stream = false,
    systemPrompt,
    userPrompt,
    apiKey,
    deepseekApiKey,
    fileData = null, // { base64, mimeType, fileName, extractedText }
  } = req.body || {};

  const effectiveProvider =
    preferredModel === 'deepseek-chat'
      ? 'deepseek'
      : preferredModel && preferredModel !== 'auto' && preferredModel.startsWith('gemini-')
        ? 'gemini'
        : provider;

  const finalGeminiKey = apiKey?.trim() || process.env.GEMINI_API_KEY || '';
  const finalDeepseekKey = deepseekApiKey?.trim() || process.env.DEEPSEEK_API_KEY || '';

  let sseStarted = false;
  const startSSE = () => {
    if (sseStarted) return;
    sseStarted = true;
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    if (typeof res.flushHeaders === 'function') res.flushHeaders();
  };
  const writeSSE = (payload) => {
    startSSE();
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  try {
    const callDeepSeek = async () => {
      if (!finalDeepseekKey) {
        throw new Error('DeepSeek API Key belum diisi. Silakan isi di menu Brief & API.');
      }

      const dsPrompt = buildPromptWithAttachment(userPrompt, fileData, { forDeepSeek: true });

      if (stream) {
        const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${finalDeepseekKey}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
              { role: 'user', content: dsPrompt },
            ],
            max_tokens: 8192,
            temperature: 0.4,
            stream: true,
            stream_options: { include_usage: true },
          }),
        });

        if (!dsRes.ok) {
          const dsErr = await dsRes.json().catch(() => ({}));
          throw new Error(dsErr?.error?.message || `DeepSeek HTTP ${dsRes.status}`);
        }

        let usage = null;
        let fullText = '';
        await consumeSSEStream(dsRes.body, (chunk) => {
          const delta = chunk?.choices?.[0]?.delta?.content || '';
          if (delta) {
            fullText += delta;
            writeSSE({ type: 'delta', text: delta });
          }
          if (chunk?.usage) usage = normalizeDeepSeekUsage(chunk.usage);
        });

        if (!fullText) throw new Error('Respons DeepSeek kosong.');
        writeSSE({ type: 'done', modelUsed: 'deepseek-chat', usage });
        res.end();
        return null;
      }

      const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${finalDeepseekKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
            { role: 'user', content: dsPrompt },
          ],
          max_tokens: 8192,
          temperature: 0.4,
        }),
      });

      const dsData = await dsRes.json().catch(() => ({}));
      if (!dsRes.ok) throw new Error(dsData?.error?.message || `DeepSeek HTTP ${dsRes.status}`);
      const text = dsData?.choices?.[0]?.message?.content;
      if (!text) throw new Error('Respons DeepSeek kosong.');
      return {
        text,
        modelUsed: 'deepseek-chat',
        usage: normalizeDeepSeekUsage(dsData?.usage),
      };
    };

    if (effectiveProvider === 'deepseek') {
      const result = await callDeepSeek();
      if (result) return res.status(200).json(result);
      return;
    }

    if (!finalGeminiKey) {
      if (effectiveProvider === 'auto' && finalDeepseekKey) {
        const result = await callDeepSeek();
        if (result) return res.status(200).json(result);
        return;
      }
      return res.status(400).json({
        error:
          effectiveProvider === 'gemini'
            ? 'Gemini API Key belum dikonfigurasi. Silakan isi di menu Brief & API.'
            : 'API Key belum dikonfigurasi. Silakan isi Gemini atau DeepSeek API Key di menu Brief & API.',
      });
    }

    const userParts = buildGeminiUserParts(userPrompt, fileData);
    const candidateModels = resolveGeminiModelOrder(preferredModel);
    let lastError = null;

    for (const modelName of candidateModels) {
      if (stream) {
        const streamUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${encodeURIComponent(finalGeminiKey)}`;
        const gRes = await fetch(streamUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt || '' }] },
            contents: [{ role: 'user', parts: userParts }],
            generationConfig: { maxOutputTokens: 8192, temperature: 0.4 },
          }),
        });

        if (gRes.ok && gRes.body) {
          let fullText = '';
          let finishReason = null;
          let usage = null;

          await consumeSSEStream(gRes.body, (chunk) => {
            const candidate = chunk?.candidates?.[0];
            const delta = candidate?.content?.parts?.map((p) => p.text || '').join('') || '';
            if (delta) {
              fullText += delta;
              writeSSE({ type: 'delta', text: delta });
            }
            if (candidate?.finishReason) finishReason = candidate.finishReason;
            if (chunk?.usageMetadata) usage = normalizeGeminiUsage(chunk.usageMetadata);
          });

          if (fullText && finishReason === 'MAX_TOKENS') {
            const contRes = await fetch(streamUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt || '' }] },
                contents: [
                  { role: 'user', parts: userParts },
                  { role: 'model', parts: [{ text: fullText }] },
                  {
                    role: 'user',
                    parts: [
                      {
                        text: 'Lanjutkan persis dari karakter terakhir yang terpotong hingga selesai tanpa mengulang bagian sebelumnya.',
                      },
                    ],
                  },
                ],
                generationConfig: { maxOutputTokens: 8192, temperature: 0.4 },
              }),
            });

            if (contRes.ok && contRes.body) {
              await consumeSSEStream(contRes.body, (chunk) => {
                const candidate = chunk?.candidates?.[0];
                const delta = candidate?.content?.parts?.map((p) => p.text || '').join('') || '';
                if (delta) {
                  fullText += delta;
                  writeSSE({ type: 'delta', text: delta });
                }
                if (chunk?.usageMetadata) {
                  const contUsage = normalizeGeminiUsage(chunk.usageMetadata);
                  if (usage && contUsage) {
                    usage = {
                      promptTokens: usage.promptTokens + contUsage.promptTokens,
                      outputTokens: usage.outputTokens + contUsage.outputTokens,
                      totalTokens: usage.totalTokens + contUsage.totalTokens,
                    };
                  } else if (contUsage) {
                    usage = contUsage;
                  }
                }
              });
            }
          }

          if (fullText) {
            writeSSE({ type: 'done', modelUsed: modelName, usage });
            res.end();
            return;
          }
        }

        const errBody = await gRes.json().catch(() => ({}));
        lastError = errBody?.error?.message || `Gemini HTTP ${gRes.status}`;
        if (!sseStarted && [404, 429, 503].includes(gRes.status)) {
          await new Promise((r) => setTimeout(r, 1200));
          continue;
        }
        break;
      }

      // Non-streaming path
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(finalGeminiKey)}`;
      const gRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt || '' }] },
          contents: [{ role: 'user', parts: userParts }],
          generationConfig: { maxOutputTokens: 8192, temperature: 0.4 },
        }),
      });

      const gData = await gRes.json().catch(() => ({}));
      if (gRes.ok) {
        const candidate = gData?.candidates?.[0];
        let text = candidate?.content?.parts?.map((p) => p.text || '').join('') || '';
        let usage = normalizeGeminiUsage(gData?.usageMetadata);

        if (text && candidate?.finishReason === 'MAX_TOKENS') {
          const contRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt || '' }] },
              contents: [
                { role: 'user', parts: userParts },
                { role: 'model', parts: [{ text }] },
                {
                  role: 'user',
                  parts: [
                    {
                      text: 'Lanjutkan persis dari karakter terakhir yang terpotong hingga selesai tanpa mengulang bagian sebelumnya.',
                    },
                  ],
                },
              ],
              generationConfig: { maxOutputTokens: 8192, temperature: 0.4 },
            }),
          });

          if (contRes.ok) {
            const contData = await contRes.json().catch(() => ({}));
            const extraText =
              contData?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
            text += extraText;
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

        if (text) {
          return res.status(200).json({ text, modelUsed: modelName, usage });
        }
      }

      lastError = gData?.error?.message || `Gemini HTTP ${gRes.status}`;
      if ([404, 429, 503].includes(gRes.status)) {
        await new Promise((r) => setTimeout(r, 1200));
        continue;
      }
      break;
    }

    if (!sseStarted && effectiveProvider === 'auto' && finalDeepseekKey) {
      const result = await callDeepSeek();
      if (result) return res.status(200).json(result);
      return;
    }

    if (sseStarted) {
      writeSSE({ type: 'error', error: lastError || 'Semua model Gemini gagal merespons.' });
      res.end();
      return;
    }

    return res.status(502).json({ error: lastError || 'Semua model Gemini gagal merespons.' });
  } catch (err) {
    if (sseStarted) {
      writeSSE({ type: 'error', error: err.message || 'Internal Server Error' });
      res.end();
      return;
    }
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
