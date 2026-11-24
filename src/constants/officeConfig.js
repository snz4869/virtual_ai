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
  directorDesk: { x: 175, y: 185 },
  directorDoor: { x: 274, y: 375 },
  hallwayNorth: { x: 285, y: 420 },
  hallwayCenter: { x: 285, y: 690 },
  hallwaySouth: { x: 535, y: 690 },

  // Product Team Desks (Alex & Raka)
  leadDesk: { x: 470, y: 235 },
  devDesk: { x: 605, y: 235 },
  devDesk2: { x: 470, y: 415 },

  // CX Team Desk (Nadia)
  qaDesk: { x: 850, y: 650 },
  qaDesk2: { x: 850, y: 920 },

  // Lounge & Recreation
  loungeSofa: { x: 855, y: 175 },
  recreationDoor: { x: 537, y: 745 },
  pingPongSpot: { x: 535, y: 960 },
  pantrySpot: { x: 130, y: 500 },
};

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

export const DEFAULT_BRIEF =
  'Bangun aplikasi Web Dashboard untuk monitoring tugas harian dengan fitur tambah tugas, filter status, dan ringkasan progres.';

export const PRESET_PROMPTS = [
  {
    label: 'Landing Page SaaS',
    brief: 'Buat landing page modern untuk produk SaaS manajemen keuangan UMKM lengkap dengan bagian Hero, Fitur Utama, dan Tabel Harga.',
  },
  {
    label: 'REST API & Auth',
    brief: 'Rancang arsitektur dan kode endpoint REST API untuk sistem autentikasi JWT (Login, Register, Refresh Token) beserta validasi input.',
  },
  {
    label: 'Dashboard Analytics',
    brief: 'Bangun komponen dashboard interaktif untuk menampilkan metrik penjualan harian, grafik tren bulanan, dan tabel transaksi terbaru.',
  },
];
