export async function executeAgentPrompt({ agent, prompt, brief, recentLogs, apiMode, clientApiKey, simSpeed }) {
  if (apiMode === 'demo') {
    return simulateProportionalWork(agent, prompt, simSpeed);
  }

  const recentContext = recentLogs
    .slice(-4)
    .map((l) => `[${l.agentName} - ${l.agentRole}]:\n${l.content}`)
    .join('\n\n---\n\n');

  const systemInstruction = `Anda adalah ${agent.name}, berperan sebagai ${agent.role} dalam tim Virtual Office AI.
SOP & Peran Anda:
${agent.sop}

Konteks Global Kantor (Project Brief):
${brief}

Aturan Penting: Jawab dalam Bahasa Indonesia yang terstruktur dengan Markdown, langsung pada inti tugas tanpa basa-basi pembuka.`;

  // Try Vercel Serverless Function first, fallback to direct browser call when running pure Vite dev without Vercel CLI
  try {
    const res = await fetch('/api/interact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction,
        prompt,
        context: recentContext,
        clientApiKey
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.text) return data.text;
    } else if (res.status !== 404 && res.status !== 405) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }
  } catch (err) {
    if (!clientApiKey?.trim()) {
      throw err;
    }
  }

  // Direct browser fallback using Gemini Interactions API (/v1beta/interactions)
  return callDirectInteractionsApi({
    systemInstruction,
    prompt,
    context: recentContext,
    apiKey: clientApiKey.trim()
  });
}

async function callDirectInteractionsApi({ systemInstruction, prompt, context, apiKey }) {
  const candidateModels = [
    'gemini-3.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-4-hydrogen'
  ];

  const fullInput = `[SYSTEM / SOP PERAN ANDA]\n${systemInstruction}\n\n[INSTRUKSI DIRECTOR]\n${prompt}\n\n[RIWAYAT KERJA TIM]\n${context || 'Belum ada riwayat sebelumnya.'}`;
  let lastErr = 'Unknown error';

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

      if (!text) throw new Error('Format respons Gemini Interactions API tidak terbaca.');
      return text;
    }

    const errObj = await response.json().catch(() => ({}));
    lastErr = errObj.error?.message || `HTTP ${response.status}`;

    if (response.status === 503 || response.status === 429) {
      await new Promise((r) => setTimeout(r, 2000));
      continue;
    }
    throw new Error(lastErr);
  }

  throw new Error(`Semua model sedang sibuk (${lastErr})`);
}

function simulateProportionalWork(agent, prompt, simSpeed) {
  return new Promise((resolve) => {
    const duration = (1500 + Math.random() * 500) / simSpeed;
    const isSimpleMathOrFact =
      prompt.length < 70 &&
      !/api|endpoint|kode|code|sistem|system|database|fitur|aplikasi|backend|frontend/i.test(prompt);

    setTimeout(() => {
      if (isSimpleMathOrFact) {
        if (agent.id === 'alex') {
          resolve(`**Arahan Penyelesaian Ringkas** (*Mode Ringkas — Anti-Overengineering*)
1. Identifikasi operasi matematika/logika inti dari perintah: *"${prompt}"*.
2. Gunakan metode perhitungan langsung tanpa membuat lapisan sistem/API tambahan.
3. Teruskan ke **Raka** untuk kalkulasi presisi.`);
        } else if (agent.id === 'raka') {
          resolve(`**Hasil Perhitungan** (*oleh ${agent.name}*)
- Operasi: $\sqrt[3]{34} = 34^{1/3}$
- Estimasi kubik terdekat: $3^3 = 27$ dan $4^3 = 64$
- Hasil presisi (6 desimal): **3.239612**`);
        } else {
          resolve(`**Verifikasi QA** (*oleh ${agent.name}*)
- Cek balik: $3.239612^3 \approx 34.000006$ (akurat hingga 5 desimal).
- **Status:** **VERIFIED** — Siap dilaporkan ke **Director**.`);
        }
        return;
      }

      if (agent.id === 'alex') {
        resolve(`**Spesifikasi Teknis & Kontrak API** (*Mode Proyek Teknis*)
1. **Endpoint Utama:**
   - \`POST /api/v1/queues/tickets\` (Ambil nomor antrean baru)
   - \`POST /api/v1/queues/next\` (Panggil nomor antrean berikutnya)
   - \`GET /api/v1/queues/status\` (Cek sisa antrean aktif)
2. **Aturan Concurrency:** Gunakan penguncian baris atomik (\`FOR UPDATE SKIP LOCKED\`) agar dua loket tidak memanggil tiket ganda.
3. **Acceptance Criteria:** Kode HTTP standar (\`201\`, \`200\`, \`404\`) dan validasi input wajib.`);
      } else if (agent.id === 'raka') {
        resolve(`**Implementasi Kode Backend** (*oleh ${agent.name}*)
\`\`\`javascript
export async function callNextTicket(req, res) {
  const { counterId } = req.body;
  if (!counterId || !/^[a-zA-Z0-9_-]{1,20}$/.test(counterId)) {
    return res.status(400).json({ error: 'counterId tidak valid' });
  }
  const ticket = await db.query(\`
    UPDATE queue_tickets
    SET status = 'CALLED', counter_id = $1, called_at = NOW()
    WHERE id = (
      SELECT id FROM queue_tickets
      WHERE status = 'WAITING' AND queue_date = CURRENT_DATE
      ORDER BY ticket_number ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING id, ticket_number, counter_id;
  \`, [counterId]);

  if (ticket.rowCount === 0) {
    return res.status(404).json({ message: 'Antrean kosong' });
  }
  return res.status(200).json({ data: ticket.rows[0] });
}
\`\`\``);
      } else {
        resolve(`**Laporan Audit QA** (*oleh ${agent.name}*)
- **Concurrency & SQL Safety:** Parameterized query \`$1\` dan \`SKIP LOCKED\` sudah aman dari SQL Injection & race condition.
- **Sanitasi Input:** Regex \`counterId\` sudah mencegah payload berlebih.
- **Status QA:** **APPROVED** — Siap dilaporkan kepada **Director**.`);
      }
    }, duration);
  });
}
