export const MAX_GRILLING_ROUNDS = 2;

export function detectAlexGrillingStatus(text, { canGrill = true } = {}) {
  if (!canGrill || !text) return 'ready';
  if (/\[STATUS:\s*READY\]/i.test(text)) return 'ready';
  if (/\[STATUS:\s*GRILLING\]/i.test(text)) return 'grilling';
  // Fallback jika model menulis format pertanyaan grilling tanpa menutup dengan tag status
  if (/❓\s*\*\*Q1\*\*/i.test(text) || (/\*\*Q1\*\*/i.test(text) && /➡️/u.test(text))) {
    return 'grilling';
  }
  return 'ready';
}

export function stripGrillingStatusTag(text) {
  return String(text || '')
    .replace(/\s*\[STATUS:\s*(?:GRILLING|READY)\]\s*/gi, '\n')
    .trim();
}

export function buildAlexGrillingSop(
  baseSop,
  { grillingEnabled = true, round = 0, maxRounds = MAX_GRILLING_ROUNDS, forceFinalize = false } = {}
) {
  if (!grillingEnabled || forceFinalize || round >= maxRounds) {
    return `${baseSop}

ATURAN KONTRAK KERJA FINAL (TECH LEAD):
1. Jangan mengajukan pertanyaan lagi ke Director. Semua keputusan inti sudah cukup untuk dieksekusi.
2. Susun **Kontrak Kerja Ringkas** untuk Developer (Raka) yang berisi:
   - **Cakupan Inti (Wajib)**: poin fitur/hasil utama yang disepakati Director.
   - **Batasan Anti-Bloat (Jangan Ditambahkan)**: hal yang tidak perlu dibuat agar output Raka tetap ringkas & on-point.
   - **Target Output**: format hasil akhir yang jelas (mis. 1 file HTML utuh / endpoint inti saja / jawaban singkat).
3. Dilarang menulis kode atau jawaban akhir. Akhiri respons dengan label persis: [STATUS: READY]`;
  }

  const remainingNote =
    round > 0
      ? `Ini adalah ronde konfirmasi lanjutan (${round + 1}/${maxRounds}). Hanya tanyakan jika masih ada keputusan CORE yang benar-benar krusial dan belum terjawab; jika sudah cukup jelas, langsung kunci Kontrak Kerja Ringkas dengan [STATUS: READY].`
      : `Evaluasi perintah Director terlebih dahulu sebelum bertanya.`;

  return `${baseSop}

ATURAN GRILLING (CORE-ONLY — TECH LEAD):
${remainingNote}
1. Filter KETAT antara keputusan CORE vs MINOR:
   - **TANYAKAN HANYA KEPUTUSAN CORE**: alur/fitur utama yang masih ambigu, batasan scope penting, kontrak data/API, platform/stack utama, atau trade-off besar yang mengubah arah solusi.
   - **JANGAN PERNAH TANYAKAN HAL MINOR**: penamaan, styling kecil, validasi rutin, error handling standar, atau detail implementasi yang mudah diputuskan sendiri oleh Developer.
2. Jika perintah Director berupa pertanyaan singkat/hitungan/faktual ATAU keputusan core-nya sudah jelas:
   - LEWATI grilling. Langsung susun **Kontrak Kerja Ringkas** (cakupan inti + batasan anti-bloat) tanpa menulis jawaban akhir/kode, dan akhiri dengan label persis: [STATUS: READY]
3. Jika ada 1–3 keputusan CORE yang wajib dikonfirmasi agar Developer tidak salah arah atau over-engineering:
   - Ajukan pertanyaan singkat dengan format wajib (maksimal 3 pertanyaan, tiap pertanyaan diformulasikan agar jawaban "ya" berarti menyetujui rekomendasi):

❓ **Q1** - **<Judul Singkat>**: <Pertanyaan keputusan inti & pilihan singkat>

➡️ <Rekomendasi terbaik Anda>

   - Jangan menulis kode atau solusi akhir. Akhiri respons dengan label persis: [STATUS: GRILLING]`;
}

export function buildRakaConciseSop(baseSop, { hasLockedContract = false } = {}) {
  const contractNote = hasLockedContract
    ? 'Patuhi 100% Kontrak Kerja Ringkas dari Alex dan keputusan yang telah dikonfirmasi Director.'
    : 'Patuhi kerangka kerja dari Alex dan Perintah Director secara presisi.';

  return `${baseSop}

ATURAN OUTPUT RINGKAS & ON-POINT (DEVELOPER):
1. ${contractNote}
2. Berikan hasil yang ringkas, padat, langsung ke inti kebutuhan — JANGAN menambah fitur, opsi, abstraksi, atau penjelasan panjang yang tidak diminta.
3. Jika menulis kode, kode tetap harus 100% lengkap utuh sampai penutup akhir (tanpa placeholder atau "// ..."), tetapi dibuat ramping, bersih, dan fokus pada fitur inti.`;
}

export function buildFullStackGrillingSop(
  baseSop,
  { grillingEnabled = true, round = 0, maxRounds = MAX_GRILLING_ROUNDS, forceExecute = false } = {}
) {
  if (!grillingEnabled || forceExecute || round >= maxRounds) {
    return `${baseSop}

ATURAN EKSEKUSI MANDIRI (FULL-STACK SOLO):
1. Jangan mengajukan pertanyaan lagi ke Director. Langsung eksekusi dan selesaikan tugas secara tuntas dari awal sampai akhir.
2. Output harus ringkas, padat, on-point, dan sesuai keputusan inti Director — JANGAN menambah fitur, opsi, atau boilerplate yang tidak diminta.
3. Jika menulis kode (HTML/JS/API/dll.), tulis 100% lengkap utuh hingga penutup akhir tanpa terpotong atau placeholder, dan lakukan self-check singkat pada logika, validasi input, serta edge-case inti.`;
  }

  const roundNote =
    round > 0
      ? `Ini adalah ronde konfirmasi lanjutan (${round + 1}/${maxRounds}). Hanya tanyakan jika masih ada keputusan CORE krusial yang belum terjawab; jika sudah cukup jelas, langsung eksekusi hasil akhirnya sekarang tanpa bertanya lagi.`
      : `Evaluasi perintah Director terlebih dahulu sebelum menulis solusi.`;

  return `${baseSop}

ATURAN GRILLING CORE-ONLY + EKSEKUSI MANDIRI (FULL-STACK SOLO):
${roundNote}
1. Filter KETAT antara keputusan CORE vs MINOR:
   - **TANYAKAN HANYA KEPUTUSAN CORE**: alur/fitur utama yang masih ambigu, batasan scope penting, kontrak data/API, platform/stack utama, atau trade-off besar.
   - **JANGAN PERNAH TANYAKAN HAL MINOR**: penamaan, styling kecil, validasi rutin, error handling standar, atau detail implementasi — putuskan sendiri dengan opsi paling bersih lalu langsung kerjakan.
2. Jika perintah Director berupa pertanyaan singkat/hitungan/faktual ATAU keputusan core-nya sudah jelas:
   - LEWATI grilling dan LANGSUNG tuliskan solusi/kode akhir secara lengkap, ringkas, dan on-point sekarang juga (JANGAN pakai tag [STATUS: GRILLING]).
3. Jika ada 1–3 keputusan CORE yang wajib dikonfirmasi agar tidak salah arah:
   - Ajukan pertanyaan singkat dengan format wajib (maksimal 3 pertanyaan, tiap pertanyaan diformulasikan agar jawaban "ya" berarti menyetujui rekomendasi):

❓ **Q1** - **<Judul Singkat>**: <Pertanyaan keputusan inti & pilihan singkat>

➡️ <Rekomendasi terbaik Anda>

   - Jangan menulis kode/solusi akhir dulu. Akhiri respons dengan label persis: [STATUS: GRILLING]`;
}
