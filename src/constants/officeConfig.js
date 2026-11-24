export const WORLD_W = 1120;
export const WORLD_H = 680;

export const DEFAULT_BRIEF = `Standar Kerja Kantor Virtual Office AI (BRD v2.1):
1. Terapkan prinsip Adaptive Complexity (Anti-Overengineering):
   - Jika tugas bersifat hitungan, pertanyaan faktual, atau logika singkat: jawab langsung, ringkas, dan akurat tanpa membuat arsitektur/API yang tidak diminta.
   - Jika tugas meminta sistem, aplikasi, atau fitur teknis: gunakan Tech Stack modern (Node.js/Express atau Spring Boot, PostgreSQL, REST JSON) lengkap dengan validasi dan edge-case.
2. Gunakan Bahasa Indonesia yang jelas, objektif, dan terstruktur.`;

export const PRESET_PROMPTS = [
  'Hitung akar pangkat 3 dari 34 beserta langkah cepatnya.',
  'Buatkan spesifikasi dan kode endpoint REST API untuk sistem manajemen antrean (ambil nomor, panggil berikutnya, cek sisa antrean).'
];

// 5 Rooms Layout (BRD v2.1)
export const OFFICE_ROOMS = {
  director: {
    id: 'director',
    x: 36,
    y: 36,
    w: 270,
    h: 245,
    label: '1. DIRECTOR OFFICE',
    border: 'rgba(236, 72, 153, 0.45)',
    bg: 'rgba(131, 24, 67, 0.16)',
    door: { x: 306, y: 185 }
  },
  lounge: {
    id: 'lounge',
    x: 36,
    y: 380,
    w: 270,
    h: 264,
    label: '2. LOUNGE & PANTRY',
    border: 'rgba(99, 102, 241, 0.4)',
    bg: 'rgba(30, 27, 75, 0.22)',
    door: { x: 306, y: 470 }
  },
  leadRoom: {
    id: 'leadRoom',
    x: 410,
    y: 36,
    w: 315,
    h: 245,
    label: '3. TECH LEAD ROOM (ALEX)',
    border: 'rgba(99, 102, 241, 0.45)',
    bg: 'rgba(49, 46, 129, 0.18)',
    door: { x: 565, y: 281 }
  },
  devPod: {
    id: 'devPod',
    x: 765,
    y: 36,
    w: 319,
    h: 245,
    label: '4. ENGINEERING POD (RAKA)',
    border: 'rgba(16, 185, 129, 0.45)',
    bg: 'rgba(6, 78, 59, 0.18)',
    door: { x: 920, y: 281 }
  },
  qaLab: {
    id: 'qaLab',
    x: 540,
    y: 380,
    w: 544,
    h: 264,
    label: '5. QA & REVIEW LAB (NADIA)',
    border: 'rgba(245, 158, 11, 0.45)',
    bg: 'rgba(120, 53, 15, 0.18)',
    door: { x: 760, y: 380 }
  }
};

// Central Hallway runs horizontally at y = 330 and vertically at x = 358
export const WAYPOINTS = {
  director_home: { x: 165, y: 155 },
  director_door_out: { x: 358, y: 185 },
  director_report: { x: 245, y: 185 },

  lounge_alex: { x: 105, y: 525 },
  lounge_raka: { x: 170, y: 550 },
  lounge_nadia: { x: 235, y: 525 },
  lounge_coffee: { x: 245, y: 440 },
  lounge_sofa: { x: 125, y: 455 },
  lounge_door_out: { x: 358, y: 470 },

  hub_west: { x: 358, y: 330 },
  hub_lead: { x: 565, y: 330 },
  hub_qa: { x: 760, y: 330 },
  hub_dev: { x: 920, y: 330 },

  desk_alex: { x: 565, y: 175 },
  desk_raka: { x: 920, y: 175 },
  desk_nadia: { x: 760, y: 510 }
};

export const DEFAULT_AGENTS = [
  {
    id: 'alex',
    name: 'Alex',
    role: 'Tech Lead',
    accentHex: '#6366f1',
    accentLight: '#a5b4fc',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    avatarBg: 'bg-indigo-600',
    hairColor: '#1e293b',
    skinColor: '#fcd34d',
    homeSpot: WAYPOINTS.lounge_alex,
    deskSpot: WAYPOINTS.desk_alex,
    deskRect: { x: 505, y: 105, w: 120, h: 50 },
    sop: `Anda adalah Tech Lead. Terapkan aturan ADAPTIVE COMPLEXITY (Anti-Overengineering):
- Jika perintah Director berupa hitungan/pertanyaan singkat: tentukan rumus/pendekatan paling langsung dalam maksimal 3 poin singkat tanpa merancang API/sistem.
- Jika perintah Director meminta pembuatan fitur/sistem teknis: pecah menjadi spesifikasi kontrak data/API, edge-case, dan Acceptance Criteria yang terukur untuk Developer.`
  },
  {
    id: 'raka',
    name: 'Raka',
    role: 'Developer / Executor',
    accentHex: '#10b981',
    accentLight: '#6ee7b7',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    avatarBg: 'bg-emerald-600',
    hairColor: '#0f172a',
    skinColor: '#fbbf24',
    homeSpot: WAYPOINTS.lounge_raka,
    deskSpot: WAYPOINTS.desk_raka,
    deskRect: { x: 860, y: 105, w: 120, h: 50 },
    sop: `Anda adalah Executor / Developer. Ikuti skala arahan Tech Lead secara proporsional:
- Untuk hitungan/pertanyaan singkat: tulis langkah penyelesaian yang jernih dan hasil akhirnya langsung.
- Untuk proyek/fitur teknis: tulis implementasi kode bersih, aman, dan siap dijalankan sesuai kontrak Tech Lead.`
  },
  {
    id: 'nadia',
    name: 'Nadia',
    role: 'QA / Reviewer',
    accentHex: '#f59e0b',
    accentLight: '#fcd34d',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    avatarBg: 'bg-amber-600',
    hairColor: '#78350f',
    skinColor: '#fde68a',
    homeSpot: WAYPOINTS.lounge_nadia,
    deskSpot: WAYPOINTS.desk_nadia,
    deskRect: { x: 700, y: 555, w: 120, h: 50 },
    sop: `Anda adalah QA & Reviewer. Sesuaikan kedalaman audit dengan skala tugas:
- Untuk hitungan/pertanyaan singkat: verifikasi akurasi angka/logika final secara mandiri, lalu beri status VERIFIED atau koreksi singkat.
- Untuk kode/sistem teknis: audit keamanan, edge-case, dan konsistensi kode terhadap spesifikasi Tech Lead tanpa mengulang kode yang sama persis kecuali ada perbaikan.`
  }
];
