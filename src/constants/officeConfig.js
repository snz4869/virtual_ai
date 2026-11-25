export const WORLD_W = 1000;
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
    door: { x: 234, y: 410, h: 48, side: 'right' },
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
    label: 'Archive & Ops',
    x: 24,
    y: 794,
    w: 210,
    h: 402,
    floorColor: '#e7e2f0',
    tileAlt: '#dcd6e8',
    door: { x: 234, y: 840, h: 48, side: 'right' },
  },
];

export const WAYPOINTS = {
  directorDesk: { x: 175, y: 92 },
  director_home: { x: 175, y: 92 },
  directorDoor: { x: 274, y: 375 },
  director_report: { x: 265, y: 185 },

  hallwayNorth: { x: 285, y: 420 },
  hallwayCenter: { x: 285, y: 690 },
  hallwaySouth: { x: 535, y: 690 },

  // Product Team Desks (Berdiri tepat di depan kursi, tidak menumpuk meja)
  leadDesk: { x: 463, y: 92 },
  desk_alex: { x: 463, y: 92 },
  devDesk: { x: 593, y: 92 },
  desk_raka: { x: 593, y: 92 },

  // CX Team Desk (Nadia - berdiri di depan kursi baris pertama)
  qaDesk: { x: 808, y: 515 },
  desk_nadia: { x: 808, y: 515 },

  // Lounge & Recreation (Di ruang kosong tengah karpet lounge)
  loungeSofa: { x: 860, y: 115 },
  lounge_alex: { x: 815, y: 112 },
  lounge_raka: { x: 860, y: 122 },
  lounge_nadia: { x: 902, y: 112 },
  recreationDoor: { x: 537, y: 745 },
  pingPongSpot: { x: 535, y: 860 },
  pantrySpot: { x: 130, y: 500 },
};

export const OFFICE_COLLIDERS = [
  // Dinding luar kantor
  { x: 0, y: 0, w: 1000, h: 20 },
  { x: 0, y: 1200, w: 1000, h: 20 },
  { x: 0, y: 0, w: 20, h: 1220 },
  { x: 980, y: 0, w: 20, h: 1220 },

  // Dinding & Meja Meeting / Director (pintu bawah di x: 250..298)
  { x: 330, y: 20, w: 10, h: 328 },
  { x: 20, y: 340, w: 230, h: 10 },
  { x: 298, y: 340, w: 42, h: 10 },
  { x: 105, y: 115, w: 130, h: 145 },

  // Dinding & Furnitur Pantry / Archive (pintu kanan di y: 410..458 & 840..888)
  { x: 20, y: 360, w: 218, h: 10 },
  { x: 230, y: 360, w: 10, h: 50 },
  { x: 230, y: 458, w: 10, h: 320 },
  { x: 20, y: 770, w: 218, h: 28 },
  { x: 230, y: 790, w: 10, h: 50 },
  { x: 230, y: 888, w: 10, h: 315 },
  { x: 42, y: 395, w: 168, h: 62 },
  { x: 56, y: 650, w: 96, h: 46 },

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
];

export const DEFAULT_AGENTS = [
  {
    id: 'alex',
    name: 'Alex',
    role: 'Tech Lead',
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
    sop: 'Pecah Project Brief secara proporsional: ringkas (maks. 3 poin) untuk hitungan/pertanyaan cepat, atau kontrak teknis lengkap untuk permintaan fitur/sistem.',
  },
  {
    id: 'raka',
    name: 'Raka',
    role: 'Developer / Executor',
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
    sop: 'Tulis jawaban langsung dengan langkah cepat untuk pertanyaan ringkas, atau kode bersih dan aman sesuai kontrak Tech Lead untuk proyek teknis.',
  },
  {
    id: 'nadia',
    name: 'Nadia',
    role: 'CX & QA Lead',
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
    sop: 'Verifikasi akurasi perhitungan/logika secara mandiri (status VERIFIED) untuk tugas ringkas, atau audit edge-case & keamanan untuk kode teknis.',
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
