export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const {
      provider = 'auto',
      systemPrompt,
      userPrompt,
      apiKey,
      deepseekApiKey,
      fileData, // { base64, mimeType, fileName }
    } = req.body || {};

    const finalGeminiKey = apiKey?.trim() || process.env.GEMINI_API_KEY;
    const finalDeepseekKey = deepseekApiKey?.trim() || process.env.DEEPSEEK_API_KEY;

    const callDeepSeek = async () => {
      if (!finalDeepseekKey) throw new Error('DeepSeek API Key belum diisi.');
      
      // DeepSeek tidak mendukung inlineData secara native, jadi kita hanya kirim teks
      // (Untuk file, gunakan Gemini)
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
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 8192,
          temperature: 0.4,
        }),
      });

      const dsData = await dsRes.json();
      if (!dsRes.ok) throw new Error(dsData?.error?.message || `DeepSeek HTTP ${dsRes.status}`);
      const text = dsData?.choices?.[0]?.message?.content;
      if (!text) throw new Error('Respons DeepSeek kosong.');
      return { text, modelUsed: 'deepseek-chat' };
    };

    if (provider === 'deepseek') {
      return res.status(200).json(await callDeepSeek());
    }

    if (!finalGeminiKey) {
      if (finalDeepseekKey) return res.status(200).json(await callDeepSeek());
      return res.status(400).json({ error: 'Gemini API Key belum dikonfigurasi.' });
    }

    // Model 3.5 Flash-Lite (2.5 sudah tidak tersedia untuk proyek baru)
    const candidateModels = ['gemini-3.5-flash-lite'];

    let lastError = null;
    for (const modelName of candidateModels) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(finalGeminiKey)}`;
      
      // Susun parts: file dulu (jika ada), lalu teks prompt
      const parts = [];
      if (fileData && fileData.base64) {
        parts.push({
          inlineData: {
            mimeType: fileData.mimeType,
            data: fileData.base64,
          },
        });
      }
      parts.push({ text: userPrompt || '' });

      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt || '' }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.4,
        },
      }),

      const gData = await gRes.json();
      if (gRes.ok) {
        const text = gData?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return res.status(200).json({ text, modelUsed: modelName });
        }
      }

      lastError = gData?.error?.message || `Gemini HTTP ${gRes.status}`;
      if ([404, 429, 503].includes(gRes.status)) {
        await new Promise((r) => setTimeout(r, 1200));
        continue;
      }
      break;
    }

    if (finalDeepseekKey) {
      return res.status(200).json(await callDeepSeek());
    }

    return res.status(502).json({ error: lastError || 'Semua model Gemini gagal merespons.' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
