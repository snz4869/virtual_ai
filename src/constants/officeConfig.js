export const WORLD_W = 1880;
export const WORLD_H = 1220;

export const OFFICE_ROOMS = [
  {
    id: 'director',
    label: 'Meeting & Director',
    x: 24,
    y: 24,
    w: 310,
    h: 320,
    floorColor: '#e5d5c5',
    tileAlt: '#decbb8',
    door: { x: 250, y: 344, w: 48, side: 'bottom' },
  },
  {
    id: 'product',
    label: 'Product Team',
    x: 350,
    y: 24,
    w: 370,
    h: 590,
    floorColor: '#f5ebd6',
    tileAlt: '#efe2c6',
    floatingTag: 'Product Team',
  },
  {
    id: 'lounge',
    label: 'Relaxation Lounge',
    x: 736,
    y: 24,
    w: 240,
    h: 300,
    floorColor: '#e3edd8',
    tileAlt: '#d7e4c9',
  },
  {
    id: 'cx',
    label: 'CX Team',
    x: 736,
    y: 340,
    w: 240,
    h: 856,
    floorColor: '#f5ebd6',
    tileAlt: '#efe2c6',
    floatingTag: 'CX Team',
  },
  {
    id: 'pantry',
    label: 'Utility & Storage',
    x: 24,
    y: 364,
    w: 210,
    h: 410,
    floorColor: '#e7e2f0',
    tileAlt: '#dcd6e8',
    door: { x: 234, y: 476, h: 52, side: 'right' },
  },
  {
    id: 'recreation',
    label: 'Recreation Area',
    x: 360,
    y: 770,
    w: 350,
    h: 426,
    floorColor: '#d9e6f2',
    tileAlt: '#cddceb',
    door: { x: 510, y: 770, w: 54, side: 'top' },
  },
  {
    id: 'extra_office',
    label: 'Full-Stack Studio (Kael)',
    x: 24,
    y: 794,
    w: 210,
    h: 402,
    floorColor: '#dce7f3',
    tileAlt: '#d1dfee',
    door: { x: 234, y: 840, h: 48, side: 'right' },
    floatingTag: 'Full-Stack Lab',
  },
  // === EAST WING (Perluasan kantor widescreen) ===
  {
    id: 'server_lab',
    label: 'AI & Server Lab',
    x: 1020,
    y: 24,
    w: 436,
    h: 416,
    floorColor: '#dbe6f0',
    tileAlt: '#cfdceb',
    floatingTag: 'AI & Server Lab',
  },
  {
    id: 'cafe_terrace',
    label: 'Office Cafe & Bar',
    x: 1476,
    y: 24,
    w: 380,
    h: 516,
    floorColor: '#f1e4cd',
    tileAlt: '#e7d7bc',
    floatingTag: 'Office Cafe',
  },
  {
    id: 'design_studio',
    label: 'Design & Creative Studio',
    x: 1020,
    y: 460,
    w: 436,
    h: 360,
    floorColor: '#f6eadc',
    tileAlt: '#eedfcd',
    floatingTag: 'Design Studio',
  },
  {
    id: 'townhall',
    label: 'Townhall & Demo Stage',
    x: 1020,
    y: 840,
    w: 836,
    h: 356,
    floorColor: '#dfe4f2',
    tileAlt: '#d4dbe9',
    floatingTag: 'Townhall Stage',
  },
];

// Kursi meja rapat di Ruang Director (3 kiri, 3 kanan)
export const MEETING_SEATS = {
  director: { x: 92, y: 178, facing: 'right' }, // Kiri tengah
  alex: { x: 248, y: 178, facing: 'left' },     // Kanan tengah (Tech Lead)
  raka: { x: 248, y: 133, facing: 'left' },     // Kanan atas (Developer)
  nadia: { x: 248, y: 223, facing: 'left' },    // Kanan bawah (QA)
  kael: { x: 170, y: 92, facing: 'down' },      // Sisi atas meja (Full-Stack)
  extra: [
    { x: 92, y: 133, facing: 'right' },         // Kiri atas (Spesialis 1)
    { x: 92, y: 223, facing: 'right' },         // Kiri bawah (Spesialis 2)
    { x: 170, y: 92, facing: 'down' },          // Sisi atas meja (Spesialis 3)
  ],
};

export const DIRECTOR_SEAT_ZONE = {
  x: 66,
  y: 152,
  w: 76,
  h: 54,
};

// Pintu utama di koridor bawah untuk keluar kembali ke peta Village
export const OFFICE_EXIT_ZONE = {
  x: 254,
  y: 1146,
  w: 88,
  h: 58,
};

export const WAYPOINTS = {
  directorDesk: { x: 92, y: 178 },
  director_home: { x: 92, y: 178 },
  directorStand: { x: 170, y: 300 },
  directorDoor: { x: 274, y: 375 },
  director_report: { x: 248, y: 223 },
  officeEntrance: { x: 298, y: 1124 },
  officeExitDoor: { x: 298, y: 1178 },

  hallwayNorth: { x: 285, y: 420 },
  hallwayCenter: { x: 285, y: 690 },
  hallwaySouth: { x: 535, y: 690 },

  // Product Team Desks (Berdiri tepat di depan kursi, tidak menumpuk meja)
  leadDesk: { x: 463, y: 92 },
  desk_alex: { x: 463, y: 92 },
  devDesk: { x: 593, y: 92 },
  desk_raka: { x: 593, y: 92 },

  // Full-Stack Studio (Kael - ruang pribadi kiri bawah)
  desk_kael: { x: 124, y: 930 },

  // CX Team Desk (Nadia - berdiri di depan kursi baris pertama)
  qaDesk: { x: 808, y: 515 },
  desk_nadia: { x: 808, y: 515 },

  // Lounge & Recreation (Di ruang kosong tengah karpet lounge)
  loungeSofa: { x: 860, y: 115 },
  lounge_alex: { x: 815, y: 112 },
  lounge_raka: { x: 860, y: 122 },
  lounge_nadia: { x: 902, y: 112 },
  lounge_kael: { x: 860, y: 100 },
  recreationDoor: { x: 537, y: 745 },
  pingPongSpot: { x: 535, y: 868 },
  pingPongSouth: { x: 535, y: 1068 },
  pantrySpot: { x: 130, y: 500 },

  // East Wing Waypoints
  eastHallway: { x: 998, y: 450 },
  serverLabSpot: { x: 1235, y: 210 },
  cafeBarSpot: { x: 1650, y: 185 },
  designStudioSpot: { x: 1240, y: 635 },
  townhallSpot: { x: 1440, y: 985 },
};

export const OFFICE_COLLIDERS = [
  // Dinding luar kantor (Widescreen 1880 x 1220)
  { x: 0, y: 0, w: 1880, h: 20 },
  { x: 0, y: 1200, w: 1880, h: 20 },
  { x: 0, y: 0, w: 20, h: 1220 },
  { x: 1860, y: 0, w: 20, h: 1220 },

  // Dinding & Meja Meeting / Director (pintu bawah di x: 250..298)
  { x: 330, y: 20, w: 10, h: 328 },
  { x: 20, y: 340, w: 230, h: 10 },
  { x: 298, y: 340, w: 42, h: 10 },
  { x: 105, y: 115, w: 130, h: 145 },

  // Dinding & Furnitur Pantry / Archive (pintu kanan di y: 476..528 & 840..888)
  { x: 20, y: 360, w: 218, h: 10 },
  { x: 230, y: 360, w: 10, h: 116 },
  { x: 230, y: 528, w: 10, h: 250 },
  { x: 20, y: 770, w: 218, h: 28 },
  { x: 230, y: 790, w: 10, h: 50 },
  { x: 230, y: 888, w: 10, h: 315 },
  // Furnitur Pantry & Full-Stack Studio (Kael)
  { x: 42, y: 395, w: 168, h: 62 },
  { x: 56, y: 650, w: 96, h: 46 },
  { x: 76, y: 952, w: 96, h: 46 },
  { x: 34, y: 1136, w: 84, h: 44 },
  { x: 146, y: 1126, w: 72, h: 54 },

  // Meja Workstation Product Team
  { x: 415, y: 115, w: 96, h: 100 },
  { x: 545, y: 115, w: 96, h: 100 },
  { x: 415, y: 295, w: 96, h: 100 },
  { x: 545, y: 295, w: 96, h: 100 },
  { x: 415, y: 475, w: 96, h: 100 },
  { x: 545, y: 475, w: 96, h: 100 },

  // Sofa & Rak Buku Lounge
  { x: 754, y: 42, w: 198, h: 42 },
  { x: 756, y: 130, w: 38, h: 86 },
  { x: 924, y: 120, w: 38, h: 86 },
  { x: 825, y: 152, w: 70, h: 40 },
  { x: 820, y: 225, w: 95, h: 36 },

  // Meja Workstation CX Team
  { x: 756, y: 355, w: 205, h: 44 },
  { x: 760, y: 540, w: 96, h: 100 },
  { x: 866, y: 540, w: 96, h: 100 },
  { x: 760, y: 790, w: 96, h: 100 },
  { x: 866, y: 790, w: 96, h: 100 },
  { x: 760, y: 1020, w: 96, h: 100 },
  { x: 866, y: 1020, w: 96, h: 100 },

  // Dinding & Meja Pingpong Recreation Area (pintu atas di x: 510..564)
  { x: 356, y: 766, w: 154, h: 10 },
  { x: 564, y: 766, w: 150, h: 10 },
  { x: 356, y: 766, w: 10, h: 434 },
  { x: 706, y: 766, w: 10, h: 434 },
  { x: 478, y: 895, w: 114, h: 150 },
  { x: 645, y: 905, w: 42, h: 115 },

  // === EAST WING COLLIDERS ===
  // AI & Server Lab (racks di atas, 2 workstation di bawah)
  { x: 1055, y: 50, w: 220, h: 52 },
  { x: 1320, y: 50, w: 108, h: 52 },
  { x: 1070, y: 270, w: 96, h: 46 },
  { x: 1280, y: 270, w: 96, h: 46 },

  // Office Cafe & Bar (bar counter atas + 3 meja bundar)
  { x: 1510, y: 52, w: 310, h: 58 },
  { x: 1530, y: 250, w: 68, h: 68 },
  { x: 1715, y: 250, w: 68, h: 68 },
  { x: 1620, y: 390, w: 72, h: 68 },

  // Design & Creative Studio (2 workstation + meja kolaborasi tengah)
  { x: 1065, y: 520, w: 96, h: 46 },
  { x: 1295, y: 520, w: 96, h: 46 },
  { x: 1150, y: 690, w: 168, h: 64 },

  // Townhall & Demo Stage (panggung kanan + 2 blok kursi penonton)
  { x: 1690, y: 905, w: 130, h: 220 },
  { x: 1110, y: 940, w: 190, h: 54 },
  { x: 1110, y: 1045, w: 190, h: 54 },
  { x: 1365, y: 1045, w: 190, h: 54 },
];

export const AVAILABLE_MODELS = [
  { id: 'auto', label: 'Auto (Ikuti Pengaturan Global)' },
  { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash-Lite (Cepat)' },
  { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash (Seimbang)' },
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash (Coding / Kompleks)' },
  { id: 'deepseek-chat', label: 'DeepSeek Chat' },
];

export const FULLSTACK_AGENT_ID = 'kael';
export const CORE_AGENT_IDS = ['alex', 'raka', 'nadia', FULLSTACK_AGENT_ID];

export const EXTRA_AGENT_SLOTS = [
  {
    accentHex: '#06b6d4',
    accentLight: '#67e8f9',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    avatarBg: 'bg-cyan-600',
    shirtColor: '#06b6d4',
    hairColor: '#0f172a',
    skinColor: '#f5cba7',
    homeSpot: { x: 838, y: 102 },
    deskSpot: { x: 463, y: 272 },
    deskRect: { x: 415, y: 295, w: 96, h: 46 },
    defaultName: 'Sinta',
    defaultRole: 'UI/UX Designer',
    defaultSop:
      'Berikan arahan desain UI/UX, tata letak visual, palet warna, dan aksesibilitas secara ringkas sesuai Perintah Director agar Raka dapat mengeksekusinya dengan presisi.',
  },
  {
    accentHex: '#f43f5e',
    accentLight: '#fda4af',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    avatarBg: 'bg-rose-600',
    shirtColor: '#f43f5e',
    hairColor: '#451a03',
    skinColor: '#fde68a',
    homeSpot: { x: 882, y: 102 },
    deskSpot: { x: 593, y: 272 },
    deskRect: { x: 545, y: 295, w: 96, h: 46 },
    defaultName: 'Bima',
    defaultRole: 'Data & Security Analyst',
    defaultSop:
      'Analisis kebutuhan data, validasi input, edge-case keamanan, dan performa secara ringkas sesuai Perintah Director sebelum atau saat implementasi.',
  },
  {
    accentHex: '#f59e0b',
    accentLight: '#fcd34d',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    avatarBg: 'bg-amber-600',
    shirtColor: '#f59e0b',
    hairColor: '#1e293b',
    skinColor: '#f1c27d',
    homeSpot: { x: 535, y: 860 },
    deskSpot: { x: 914, y: 515 },
    deskRect: { x: 866, y: 540, w: 96, h: 46 },
    defaultName: 'Dina',
    defaultRole: 'Copywriter & Growth',
    defaultSop:
      'Susun copywriting, headline, CTA, dan struktur pesan yang persuasif, singkat, dan sesuai target audiens pada Perintah Director.',
  },
];

export const DEFAULT_AGENTS = [
  {
    id: 'alex',
    name: 'Alex',
    role: 'Tech Lead',
    preferredModel: 'auto',
    accentHex: '#3b82f6',
    accentLight: '#93c5fd',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    avatarBg: 'bg-indigo-600',
    shirtColor: '#3b82f6',
    hairColor: '#1e293b',
    skinColor: '#f8cba6',
    homeSpot: WAYPOINTS.lounge_alex,
    deskSpot: WAYPOINTS.desk_alex,
    deskRect: { x: 415, y: 115, w: 96, h: 46 },
    sop: 'Fokus HANYA pada Perintah Director. Terapkan Grilling Core-Only: (1) Jika tugas singkat/hitungan atau keputusan inti sudah jelas, langsung susun Kontrak Kerja Ringkas (cakupan inti + batasan anti-bloat) lalu tutup dengan [STATUS: READY]; (2) Jika ada keputusan CORE/penting yang masih ambigu, ajukan maks. 3 pertanyaan singkat (format ❓ Q1 + ➡️ rekomendasi) khusus fitur inti saja (hal minor langsung serahkan ke Raka) lalu tutup dengan [STATUS: GRILLING]. Dilarang menulis hasil akhir atau kode.',
  },
  {
    id: 'raka',
    name: 'Raka',
    role: 'Developer / Executor',
    preferredModel: 'auto',
    accentHex: '#10b981',
    accentLight: '#6ee7b7',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    avatarBg: 'bg-emerald-600',
    shirtColor: '#10b981',
    hairColor: '#92400e',
    skinColor: '#f1c27d',
    homeSpot: WAYPOINTS.lounge_raka,
    deskSpot: WAYPOINTS.desk_raka,
    deskRect: { x: 545, y: 115, w: 96, h: 46 },
    sop: 'Eksekusi hasil akhir secara langsung, ringkas, dan on-point berdasarkan Kontrak Kerja Alex serta keputusan Director. Jangan mengulang rencana Alex dan jangan menambah fitur di luar kontrak. Tulis kode lengkap 100% dari awal hingga penutup akhir (seperti </html>) tanpa terpotong, tanpa "// ...", dan tanpa placeholder, dengan struktur yang ramping dan padat.',
  },
  {
    id: 'nadia',
    name: 'Nadia',
    role: 'CX & QA Lead',
    preferredModel: 'auto',
    accentHex: '#a855f7',
    accentLight: '#d8b4fe',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    avatarBg: 'bg-amber-600',
    shirtColor: '#a855f7',
    hairColor: '#7c2d12',
    skinColor: '#ffdbac',
    homeSpot: WAYPOINTS.lounge_nadia,
    deskSpot: WAYPOINTS.desk_nadia,
    deskRect: { x: 760, y: 540, w: 96, h: 46 },
    sop: 'Audit hasil kerja Raka terhadap Perintah Director. Jika semua syarat terpenuhi, akurat, dan bebas bug, tutup laporan dengan label persis: [STATUS: VERIFIED]. Jika ada kekurangan, bug, atau syarat belum terpenuhi, tuliskan poin perbaikan spesifik yang harus dikerjakan Raka dan tutup dengan label persis: [STATUS: REVISED].'
  },
  {
    id: FULLSTACK_AGENT_ID,
    name: 'Kael',
    role: 'Full-Stack Engineer (Solo)',
    preferredModel: 'auto',
    accentHex: '#0ea5e9',
    accentLight: '#7dd3fc',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    avatarBg: 'bg-sky-600',
    shirtColor: '#0284c7',
    hairColor: '#0f172a',
    skinColor: '#f5cba7',
    homeSpot: WAYPOINTS.lounge_kael,
    deskSpot: WAYPOINTS.desk_kael,
    deskRect: { x: 76, y: 952, w: 96, h: 46 },
    sop: 'Tangani seluruh tugas secara mandiri dari awal hingga selesai (analisis inti, eksekusi kode/solusi lengkap, dan self-check kualitas) dengan prinsip ringkas, on-point, dan anti-overengineering. Tulis kode lengkap 100% sampai penutup akhir tanpa placeholder atau "// ...", serta sertakan catatan singkat validasi/edge-case jika relevan.',
  },
];

export const DEFAULT_BRIEF = `ATURAN KERJA GLOBAL (ADAPTIVE TO DIRECTOR COMMAND):
  1. Fokus Mutlak pada Perintah: Kerjakan HANYA topik, masalah, atau spesifikasi yang diminta pada "Instruksi Director". Jangan menambah fitur, arsitektur, atau konteks di luar permintaan.
  2. Skala Respons Proporsional (Anti-Overengineering):
     - Jika perintah berupa pertanyaan faktual, hitungan, analisis singkat, atau ide: jawab langsung, padat, akurat, dan terstruktur tanpa membuat boilerplate aplikasi.
     - Jika perintah meminta pembuatan kode, fitur, atau sistem teknis: berikan desain ringkas, kode bersih siap pakai, penanganan edge-case, dan validasi keamanan.
  3. Kolaborasi Berantai:
     - Alex (Tech Lead): Pecah perintah Director menjadi rencana eksekusi/kontrak kerja yang presisi sesuai skala permintaan.
     - Raka (Executor): Eksekusi solusi atau kode secara langsung berdasarkan rencana Alex dan instruksi asli Director.
     - Nadia (QA & CX Lead): Verifikasi akurasi logika/hitungan, kelengkapan syarat perintah, serta potensi bug sebelum dilaporkan ke Director.
  4. Bahasa & Gaya: Gunakan Bahasa Indonesia yang profesional, lugas, dan tanpa basa-basi.`;

export const PRESET_PROMPTS = [
  'Hitung akar pangkat 3 dari 34 beserta langkah cepatnya.',
  'Buatkan spesifikasi dan kode endpoint REST API untuk sistem manajemen antrean (ambil nomor, panggil berikutnya, cek sisa antrean).',
  'Buat landing page modern untuk produk SaaS manajemen keuangan UMKM lengkap dengan bagian Hero, Fitur Utama, dan Tabel Harga.',
];

// Karyawan ambient (Non-AI) untuk meramaikan kantor — menempati meja kosong & beraktivitas mandiri
export const AMBIENT_STAFF = [
  {
    id: 'staff-reza',
    name: 'Reza',
    role: 'Frontend Staff',
    accentHex: '#38bdf8',
    accentLight: '#7dd3fc',
    shirtColor: '#0284c7',
    hairColor: '#1e293b',
    skinColor: '#f5cba7',
    deskSpot: { x: 463, y: 230 },
    deskFacing: 'up',
    deskRect: { x: 415, y: 169, w: 96, h: 46 },
    initialMode: 'SITTING_DESK',
    workBubbles: ['💻 Ngoding UI...', '🎨 Rapihin CSS', '☕ Fokus sprint'],
  },
  {
    id: 'staff-maya',
    name: 'Maya',
    role: 'Product Ops',
    accentHex: '#fb7185',
    accentLight: '#fda4af',
    shirtColor: '#e11d48',
    hairColor: '#451a03',
    skinColor: '#fde68a',
    deskSpot: { x: 593, y: 230 },
    deskFacing: 'up',
    deskRect: { x: 545, y: 169, w: 96, h: 46 },
    initialMode: 'SITTING_DESK',
    workBubbles: ['📊 Update roadmap', '📝 Cek tiket', '💻 Review spec'],
  },
  {
    id: 'staff-budi',
    name: 'Budi',
    role: 'Backend Dev',
    accentHex: '#2dd4bf',
    accentLight: '#99f6e4',
    shirtColor: '#0d9488',
    hairColor: '#0f172a',
    skinColor: '#f1c27d',
    deskSpot: { x: 463, y: 410 },
    deskFacing: 'up',
    deskRect: { x: 415, y: 349, w: 96, h: 46 },
    initialMode: 'SITTING_DESK',
    workBubbles: ['⚙️ Optimasi DB', '🧪 Jalanin test', '💻 Debug API'],
  },
  {
    id: 'staff-citra',
    name: 'Citra',
    role: 'UI Designer',
    accentHex: '#c084fc',
    accentLight: '#e9d5ff',
    shirtColor: '#9333ea',
    hairColor: '#7c2d12',
    skinColor: '#ffdbac',
    deskSpot: { x: 593, y: 410 },
    deskFacing: 'up',
    deskRect: { x: 545, y: 349, w: 96, h: 46 },
    initialMode: 'ACTIVITY',
    workBubbles: ['🎨 Desain Figma', '✨ Poles ikon', '💻 Prototipe'],
  },
  {
    id: 'staff-doni',
    name: 'Doni',
    role: 'DevOps',
    accentHex: '#facc15',
    accentLight: '#fef08a',
    shirtColor: '#ca8a04',
    hairColor: '#1e293b',
    skinColor: '#e5b887',
    deskSpot: { x: 463, y: 452 },
    deskFacing: 'down',
    deskRect: { x: 415, y: 475, w: 96, h: 46 },
    initialMode: 'SITTING_DESK',
    workBubbles: ['🖥️ Pantau server', '🚀 Deploy CI/CD', '📈 Cek log'],
  },
  {
    id: 'staff-sari',
    name: 'Sari',
    role: 'CX Support',
    accentHex: '#4ade80',
    accentLight: '#bbf7d0',
    shirtColor: '#16a34a',
    hairColor: '#292524',
    skinColor: '#f8cba6',
    deskSpot: { x: 808, y: 655 },
    deskFacing: 'up',
    deskRect: { x: 760, y: 594, w: 96, h: 46 },
    initialMode: 'SITTING_DESK',
    workBubbles: ['💬 Balas chat user', '🎧 Bantu klien', '📋 Catat feedback'],
  },
  {
    id: 'staff-fajar',
    name: 'Fajar',
    role: 'Account Exec',
    accentHex: '#fb923c',
    accentLight: '#fed7aa',
    shirtColor: '#ea580c',
    hairColor: '#3f2e21',
    skinColor: '#f1c27d',
    deskSpot: { x: 808, y: 765 },
    deskFacing: 'down',
    deskRect: { x: 760, y: 790, w: 96, h: 46 },
    initialMode: 'ACTIVITY',
    workBubbles: ['📞 Follow-up klien', '📑 Siapin pitch', '💻 Kirim proposal'],
  },
  {
    id: 'staff-lala',
    name: 'Lala',
    role: 'Office Ops',
    accentHex: '#f472b6',
    accentLight: '#fbcfe8',
    shirtColor: '#db2777',
    hairColor: '#1e1b4b',
    skinColor: '#ffdbac',
    deskSpot: { x: 104, y: 626 },
    deskFacing: 'down',
    deskRect: { x: 56, y: 650, w: 96, h: 46 },
    initialMode: 'SITTING_DESK',
    workBubbles: ['📦 Cek inventaris', '☕ Stok kopi aman', '📅 Atur jadwal'],
  },
  // Staf ambient East Wing
  {
    id: 'staff-rina',
    name: 'Rina',
    role: 'AI Infra',
    accentHex: '#38bdf8',
    accentLight: '#bae6fd',
    shirtColor: '#0369a1',
    hairColor: '#0f172a',
    skinColor: '#f8cba6',
    deskSpot: { x: 1118, y: 246 },
    deskFacing: 'down',
    deskRect: { x: 1070, y: 270, w: 96, h: 46 },
    initialMode: 'SITTING_DESK',
    workBubbles: ['🖥️ Pantau GPU', '⚡ Latensi aman', '📊 Cek metrik'],
  },
  {
    id: 'staff-hendra',
    name: 'Hendra',
    role: 'Cloud Eng',
    accentHex: '#2dd4bf',
    accentLight: '#99f6e4',
    shirtColor: '#0f766e',
    hairColor: '#1e293b',
    skinColor: '#e5b887',
    deskSpot: { x: 1328, y: 246 },
    deskFacing: 'down',
    deskRect: { x: 1280, y: 270, w: 96, h: 46 },
    initialMode: 'SITTING_DESK',
    workBubbles: ['☁️ Scaling node', '🔒 Audit firewall', '⚙️ Backup OK'],
  },
  {
    id: 'staff-vina',
    name: 'Vina',
    role: 'Brand Designer',
    accentHex: '#f472b6',
    accentLight: '#fbcfe8',
    shirtColor: '#be185d',
    hairColor: '#451a03',
    skinColor: '#fde68a',
    deskSpot: { x: 1113, y: 496 },
    deskFacing: 'down',
    deskRect: { x: 1065, y: 520, w: 96, h: 46 },
    initialMode: 'SITTING_DESK',
    workBubbles: ['🎨 Eksplor warna', '✏️ Sketsa ikon', '🖼️ Susun moodboard'],
  },
  {
    id: 'staff-tio',
    name: 'Tio',
    role: 'Office Barista',
    accentHex: '#f59e0b',
    accentLight: '#fde68a',
    shirtColor: '#b45309',
    hairColor: '#1c1917',
    skinColor: '#f1c27d',
    deskSpot: { x: 1655, y: 145 },
    deskFacing: 'up',
    deskRect: { x: 1510, y: 52, w: 310, h: 58 },
    initialMode: 'SITTING_DESK',
    workBubbles: ['☕ Seduh latte', '🥐 Siapin snack', '✨ Cafe buka!'],
  },
];

export const AMBIENT_ACTIVITIES = [
  { spot: { x: 130, y: 500 }, facing: 'up', bubble: '☕ Seduh kopi' },
  { spot: { x: 860, y: 115 }, facing: 'down', bubble: '🛋️ Istirahat' },
  { spot: { x: 838, y: 102 }, facing: 'up', bubble: '📖 Baca buku' },
  { spot: { x: 535, y: 868 }, facing: 'down', bubble: '🏓 Main pingpong!' },
  { spot: { x: 535, y: 1068 }, facing: 'up', bubble: '🏓 Smash!' },
  { spot: { x: 175, y: 92 }, facing: 'up', bubble: '📝 Cek whiteboard' },
  { spot: { x: 914, y: 905 }, facing: 'up', bubble: '💬 Diskusi singkat' },
  { spot: { x: 1650, y: 185 }, facing: 'up', bubble: '☕ Pesan espresso' },
  { spot: { x: 1235, y: 210 }, facing: 'up', bubble: '🖥️ Cek server lab' },
  { spot: { x: 1240, y: 635 }, facing: 'down', bubble: '🎨 Lihat desain' },
  { spot: { x: 1440, y: 985 }, facing: 'right', bubble: '🎤 Latihan demo' },
];
