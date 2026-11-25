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
}) {
  const agentName = agent?.name || 'Agen';
  const role = agent?.role || 'Anggota Tim';
  const sop = agent?.sop || '';
  const projectBrief = brief || '';
  const taskInput = prompt || '';
  const apiKey = clientApiKey;

  if (apiMode === 'demo') {
    await new Promise((r) => setTimeout(r, 900));
    return `[DEMO - ${agentName} (${role})]\nMenjalankan tugas berdasarkan SOP: ${sop}\nHasil untuk: "${taskInput}"`;
  }

  // Validasi API Key sebelum mengirim request (mencegah error 403 karena key kosong)
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Gemini API Key kosong. Silakan isi di menu Brief & API.');
  }

  const systemPrompt = `Kamu adalah ${agentName}, berperan sebagai ${role} di dalam tim Virtual Office AI.
SOP Kamu: ${sop}
Project Brief Kantor:
${projectBrief}`;

  // PERBAIKAN: Bangun previousContext dari recentLogs (sebelumnya variabel ini tidak terdefinisi)
  const previousContext = recentLogs
    .map((l) => `[${l.agentName || 'Anggota'}]: ${l.content}`)
    .join('\n\n');

  const userPrompt = previousContext
    ? `Instruksi Director:\n${taskInput}\n\nHasil Kerja Tim Sebelumnya:\n${previousContext}\n\nLanjutkan bagianmu secara ringkas, akurat, dan sesuai SOP.`
    : `Instruksi Director:\n${taskInput}\n\nKerjakan bagianmu sesuai SOP.`;

  // 1. Coba lewat Vercel Serverless Route (/api/interact)
  try {
    const res = await fetch('/api/interact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        systemPrompt,
        userPrompt,
        apiKey,
        deepseekApiKey,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return `${data.text}\n\n_(Model: ${data.modelUsed})_`;
    }

    const errData = await res.json().catch(() => ({}));
    // Jika 404 (Vite lokal tanpa serverless), lanjut ke direct fetch
    if (res.status !== 404) {
      throw new Error(errData.error || `Server Error ${res.status}`);
    }
  } catch (err) {
    if (!String(err.message).includes('404') && !String(err.message).includes('Failed to fetch')) {
      throw err;
    }
  }

  // 2. Fallback Direct Browser Call (untuk local Vite dev)
  // Prioritas DeepSeek jika provider diset 'deepseek' atau Gemini key kosong tapi ada DeepSeek key
  if (provider === 'deepseek' || (!apiKey && deepseekApiKey)) {
    if (!deepseekApiKey || deepseekApiKey.trim() === '') {
      throw new Error('DeepSeek API Key kosong.');
    }
    const dsRes = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${deepseekApiKey.trim()}`,
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
    if (!dsRes.ok) throw new Error(dsData?.error?.message || `DeepSeek Error ${dsRes.status}`);
    return `${dsData.choices[0].message.content}\n\n_(Model: deepseek-chat)_`;
  }

  // PERBAIKAN: Ganti model ke gemini-3.5-flash-lite (model 2.5 sudah tidak tersedia untuk proyek baru)
  const gRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${encodeURIComponent(apiKey.trim())}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt || '' }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.4,
        },
      }),
    }
  );
  const gData = await gRes.json();
  if (!gRes.ok) throw new Error(gData?.error?.message || `Gemini Error ${gRes.status}`);
  return `${gData.candidates[0].content.parts[0].text}\n\n_(Model: gemini-3.5-flash-lite)_`;
}
