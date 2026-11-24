export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { systemInstruction, prompt, context, clientApiKey } = req.body || {};
    const apiKey = (clientApiKey || process.env.GEMINI_API_KEY || '').trim();

    if (!apiKey) {
      return res.status(401).json({
        error: 'API Key Gemini belum dikonfigurasi. Isi melalui Settings atau Environment Variable GEMINI_API_KEY.'
      });
    }

    const candidateModels = [
      'gemini-3.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.5-flash',
      'gemini-4-hydrogen'
    ];

    const fullInput = `[SYSTEM / SOP PERAN ANDA]\n${systemInstruction}\n\n[INSTRUKSI DIRECTOR]\n${prompt}\n\n[RIWAYAT KERJA TIM]\n${context || 'Belum ada riwayat sebelumnya.'}`;

    let lastError = 'Unknown error';

    for (const modelName of candidateModels) {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          model: modelName,
          input: fullInput
        })
      });

      if (response.ok) {
        const data = await response.json();
        let text = data.output_text;

        if (!text && Array.isArray(data.steps)) {
          for (const step of data.steps) {
            if (step.type === 'model_output' && Array.isArray(step.content)) {
              const block = step.content.find((c) => c.type === 'text');
              if (block?.text) text = block.text;
            }
          }
        }
        if (!text && Array.isArray(data.outputs)) {
          const out = data.outputs.find((o) => o.type === 'text' || o.text);
          if (out?.text) text = out.text;
        }

        if (!text) {
          return res.status(502).json({ error: 'Format respons Gemini Interactions API tidak terbaca.' });
        }

        return res.status(200).json({ text, modelUsed: modelName });
      }

      const errBody = await response.json().catch(() => ({}));
      lastError = errBody.error?.message || `HTTP ${response.status}`;

      if (response.status === 503 || response.status === 429) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }

      return res.status(response.status).json({ error: lastError });
    }

    return res.status(503).json({
      error: `Semua model Gemini sedang sibuk. Detail terakhir: ${lastError}`
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
