export const VILLAGE_W = 3000;
export const VILLAGE_H = 2000;

export const VILLAGE_NAME = 'Antigravity Village';

export const VILLAGE_DISTRICTS = [
  { id: 'center', name: 'Pusat Desa & Office HQ', x: 1490, y: 460 },
  { id: 'west', name: 'Gerbang Stasiun & Kreatif', x: 350, y: 820 },
  { id: 'east', name: 'Perkebunan & Kincir Angin', x: 2560, y: 780 },
  { id: 'south', name: 'Danau, Dermaga & Kuliner', x: 1320, y: 1580 },
];

export const VILLAGE_BUILDINGS = [
  // === DISTRIK PUSAT (UTARA-TENGAH) ===
  {
    id: 'office_hq',
    name: 'Virtual Office HQ',
    subtitle: 'Kantor Tim AI (11 Ruangan)',
    x: 1210,
    y: 120,
    w: 560,
    h: 280,
    roofColor: '#4338ca',
    roofTrim: '#312e81',
    wallColor: '#f8fafc',
    wallShade: '#e2e8f0',
    accentColor: '#10b981',
    enterable: true,
    door: { x: 1453, y: 350, w: 74, h: 50 },
    doorZone: { x: 1440, y: 390, w: 100, h: 48 },
    entrySpot: { x: 1490, y: 424 },
    spawnOutside: { x: 1490, y: 468 },
  },
  {
    id: 'cafe',
    name: 'Kopi Senja',
    subtitle: 'Kafe & Teras Santai',
    x: 700,
    y: 175,
    w: 280,
    h: 210,
    roofColor: '#b45309',
    roofTrim: '#78350f',
    wallColor: '#fef3c7',
    wallShade: '#fde68a',
    accentColor: '#ea580c',
    enterable: false,
    door: { x: 816, y: 337, w: 48, h: 48 },
    doorZone: { x: 804, y: 374, w: 72, h: 44 },
    visitSpot: { x: 840, y: 430 },
    infoBubble: '☕ Kopi Senja — Cappuccino & croissant hangat! (Interior segera hadir)',
  },
  {
    id: 'cowork',
    name: 'Maker Hub',
    subtitle: 'Bengkel Kreatif & IoT',
    x: 1920,
    y: 180,
    w: 320,
    h: 220,
    roofColor: '#0f766e',
    roofTrim: '#134e4a',
    wallColor: '#f0fdfa',
    wallShade: '#ccfbf1',
    accentColor: '#14b8a6',
    enterable: false,
    door: { x: 2056, y: 352, w: 48, h: 48 },
    doorZone: { x: 2044, y: 388, w: 72, h: 44 },
    visitSpot: { x: 2080, y: 446 },
    infoBubble: '🛠️ Maker Hub — Bengkel eksperimen hardware & workshop komunitas!',
  },

  // === DISTRIK BARAT (STASIUN, GALERI, BUKU) ===
  {
    id: 'station',
    name: 'Stasiun Trem Desa',
    subtitle: 'Gerbang Barat Antigravity Village',
    x: 120,
    y: 160,
    w: 380,
    h: 210,
    roofColor: '#15803d',
    roofTrim: '#14532d',
    wallColor: '#fefce8',
    wallShade: '#fef08a',
    accentColor: '#22c55e',
    enterable: false,
    door: { x: 282, y: 322, w: 56, h: 48 },
    doorZone: { x: 270, y: 360, w: 80, h: 44 },
    visitSpot: { x: 310, y: 416 },
    infoBubble: '🚋 Stasiun Trem Desa — Trem wisata melintas tiap beberapa detik di rel utara!',
  },
  {
    id: 'gallery',
    name: 'Galeri & Studio Seni',
    subtitle: 'Pameran Karya & Musik',
    x: 130,
    y: 760,
    w: 300,
    h: 220,
    roofColor: '#7e22ce',
    roofTrim: '#581c87',
    wallColor: '#faf5ff',
    wallShade: '#f3e8ff',
    accentColor: '#a855f7',
    enterable: false,
    door: { x: 256, y: 932, w: 48, h: 48 },
    doorZone: { x: 244, y: 968, w: 72, h: 44 },
    visitSpot: { x: 280, y: 1026 },
    infoBubble: '🎨 Galeri & Studio Seni — Ruang pameran ilustrasi & studio musik desa!',
  },
  {
    id: 'bookshop',
    name: 'Toko Buku & Kios',
    subtitle: 'Pustaka, Buah & Gadget',
    x: 160,
    y: 1240,
    w: 290,
    h: 215,
    roofColor: '#1d4ed8',
    roofTrim: '#1e3a8a',
    wallColor: '#eff6ff',
    wallShade: '#dbeafe',
    accentColor: '#3b82f6',
    enterable: false,
    door: { x: 281, y: 1407, w: 48, h: 48 },
    doorZone: { x: 269, y: 1442, w: 72, h: 44 },
    visitSpot: { x: 305, y: 1502 },
    infoBubble: '📚 Toko Buku & Kios — Koleksi buku tech & buah segar tiap pagi!',
  },

  // === DISTRIK TIMUR (KINCIR ANGIN, GREENHOUSE, HUNIAN) ===
  {
    id: 'windmill',
    name: 'Kincir Angin Timur',
    subtitle: 'Lumbung & Ladang Gandum',
    x: 2490,
    y: 150,
    w: 240,
    h: 250,
    roofColor: '#9a3412',
    roofTrim: '#7c2d12',
    wallColor: '#fef3c7',
    wallShade: '#fde68a',
    accentColor: '#f59e0b',
    enterable: false,
    door: { x: 2586, y: 352, w: 48, h: 48 },
    doorZone: { x: 2574, y: 388, w: 72, h: 44 },
    visitSpot: { x: 2610, y: 446 },
    infoBubble: '🌾 Kincir Angin Timur — Pemasok tepung & energi angin ramah lingkungan!',
  },
  {
    id: 'villa',
    name: 'Villa Melati',
    subtitle: 'Pondok & Kebun Bunga',
    x: 2040,
    y: 740,
    w: 270,
    h: 210,
    roofColor: '#be123c',
    roofTrim: '#881337',
    wallColor: '#fff1f2',
    wallShade: '#ffe4e6',
    accentColor: '#f43f5e',
    enterable: false,
    door: { x: 2151, y: 902, w: 48, h: 48 },
    doorZone: { x: 2139, y: 938, w: 72, h: 44 },
    visitSpot: { x: 2175, y: 996 },
    infoBubble: '🏡 Villa Melati — Aroma sup hangat dari cerobong & kebun labu!',
  },
  {
    id: 'greenhouse',
    name: 'Rumah Kaca Botani',
    subtitle: 'Taman Anggrek & Hidroponik',
    x: 2480,
    y: 720,
    w: 320,
    h: 220,
    roofColor: '#0284c7',
    roofTrim: '#0369a1',
    wallColor: '#ecfeff',
    wallShade: '#cffafe',
    accentColor: '#06b6d4',
    enterable: false,
    door: { x: 2616, y: 892, w: 48, h: 48 },
    doorZone: { x: 2604, y: 928, w: 72, h: 44 },
    visitSpot: { x: 2640, y: 986 },
    infoBubble: '🌿 Rumah Kaca Botani — Koleksi tanaman tropis & kebun hidroponik desa!',
  },
  {
    id: 'homestead',
    name: 'Rumah Kayu Pak RT',
    subtitle: 'Balai Warga & Kebun Sayur',
    x: 2490,
    y: 1250,
    w: 285,
    h: 215,
    roofColor: '#92400e',
    roofTrim: '#78350f',
    wallColor: '#fffbeb',
    wallShade: '#fef3c7',
    accentColor: '#d97706',
    enterable: false,
    door: { x: 2608, y: 1417, w: 48, h: 48 },
    doorZone: { x: 2596, y: 1452, w: 72, h: 44 },
    visitSpot: { x: 2632, y: 1512 },
    infoBubble: '🏠 Rumah Kayu Pak RT — Pusat silaturahmi warga timur desa!',
  },

  // === DISTRIK SELATAN (KULINER TEPI DANAU) ===
  {
    id: 'foodtruck',
    name: 'Food Truck Danau',
    subtitle: 'Ramen, Sate & Es Kelapa',
    x: 880,
    y: 1660,
    w: 240,
    h: 120,
    roofColor: '#f59e0b',
    roofTrim: '#b45309',
    wallColor: '#fef9c3',
    wallShade: '#fde047',
    accentColor: '#eab308',
    enterable: false,
    door: { x: 964, y: 1732, w: 72, h: 48 },
    doorZone: { x: 952, y: 1766, w: 96, h: 44 },
    visitSpot: { x: 1000, y: 1824 },
    infoBubble: '🍜 Food Truck Danau — Ramen hangat & es kelapa sambil menikmati pemandangan danau!',
  },
];

export const OFFICE_HQ_BUILDING = VILLAGE_BUILDINGS.find((b) => b.id === 'office_hq');

export const VILLAGE_FOUNTAIN = {
  x: 1444,
  y: 586,
  w: 92,
  h: 86,
};

export const VILLAGE_NOTICE_BOARD = {
  x: 1646,
  y: 518,
  w: 58,
  h: 36,
  interactZone: { x: 1636, y: 510, w: 78, h: 66 },
  visitSpot: { x: 1675, y: 580 },
  notices: [
    '📌 Papan Desa: Virtual Office HQ buka 24/7 — klik gedung untuk mulai rapat tim AI!',
    '📌 Distrik Baru: Kunjungi Kincir Angin & Rumah Kaca di Timur, serta Dermaga Danau di Selatan!',
    '📌 Transportasi: Stasiun Trem di Barat melayani rute lintas utara desa tiap menit 🚋',
    '📌 Hewan Desa: Elus Mochi si Kucing di Alun-Alun & Bubu si Shiba di Tepi Danau! 🐾',
  ],
};

// Patio outdoor Kopi Senja
export const VILLAGE_CAFE_TABLES = [
  { x: 1018, y: 238, w: 44, h: 44, umbrella: '#ea580c' },
  { x: 1054, y: 326, w: 44, h: 44, umbrella: '#0284c7' },
];

// Props & kebun di berbagai distrik
export const VILLAGE_PROPS = {
  officeBikeRack: { x: 1144, y: 316, w: 50, h: 44 },
  makerYard: { x: 1852, y: 292, w: 52, h: 74 },
  marketStall: { x: 472, y: 1310, w: 112, h: 64 },
  villaGarden: { x: 1906, y: 780, w: 112, h: 122 },
  homesteadGarden: { x: 2350, y: 1310, w: 116, h: 110 },
  basketballHoop: { x: 616, y: 768, w: 48, h: 22 },
  wheatFieldWest: { x: 2306, y: 214, w: 154, h: 158 },
  wheatFieldEast: { x: 2752, y: 214, w: 144, h: 158 },
  campfire: { x: 1630, y: 1726, w: 46, h: 46 },
};

// Danau Besar (dibagi 3 collider agar dermaga kayu di tengah x:1225..1315, y:1140..1265 WALKABLE!)
export const VILLAGE_LAKE = {
  x: 960,
  y: 1190,
  w: 620,
  h: 350,
};

export const VILLAGE_PIER = {
  x: 1225,
  y: 1140,
  w: 90,
  h: 125,
};

export const VILLAGE_LAKE_COLLIDERS = [
  { x: 960, y: 1190, w: 265, h: 350 }, // Sisi barat dermaga
  { x: 1225, y: 1265, w: 90, h: 275 }, // Air di selatan ujung dermaga
  { x: 1315, y: 1190, w: 265, h: 350 }, // Sisi timur dermaga
];

// Sungai Barat & Timur dengan 2 Jembatan Kayu WALKABLE (x:740..844 dan x:1700..1804)
export const VILLAGE_CREEK_SEGMENTS = [
  { x: 640, y: 1330, w: 100, h: 56 },
  { x: 844, y: 1330, w: 116, h: 56 },
  { x: 1580, y: 1330, w: 120, h: 56 },
  { x: 1804, y: 1330, w: 396, h: 56 },
];

export const VILLAGE_BRIDGES = [
  { id: 'bridge-west', x: 740, y: 1304, w: 104, h: 112 },
  { id: 'bridge-east', x: 1700, y: 1304, w: 104, h: 112 },
];

export const VILLAGE_BENCHES = [
  { id: 'bench-plaza-w', x: 1332, y: 616, w: 44, h: 18, seatSpot: { x: 1354, y: 616 }, approachSpot: { x: 1354, y: 646 }, facing: 'right', bubble: '⛲ Santai di alun-alun' },
  { id: 'bench-plaza-e', x: 1588, y: 634, w: 44, h: 18, seatSpot: { x: 1610, y: 634 }, approachSpot: { x: 1610, y: 664 }, facing: 'left', bubble: '🌤️ Angin sore sejuk' },
  { id: 'bench-lake-w', x: 1054, y: 1126, w: 44, h: 18, seatSpot: { x: 1076, y: 1126 }, approachSpot: { x: 1076, y: 1106 }, facing: 'down', bubble: '🌊 Nikmati angin danau' },
  { id: 'bench-lake-e', x: 1446, y: 1126, w: 44, h: 18, seatSpot: { x: 1468, y: 1126 }, approachSpot: { x: 1468, y: 1106 }, facing: 'down', bubble: '🦆 Lihat bebek berenang' },
  { id: 'bench-food-w', x: 1176, y: 1716, w: 44, h: 18, seatSpot: { x: 1198, y: 1716 }, approachSpot: { x: 1198, y: 1696 }, facing: 'up', bubble: '🍜 Makan santai tepi danau' },
  { id: 'bench-food-e', x: 1264, y: 1716, w: 44, h: 18, seatSpot: { x: 1286, y: 1716 }, approachSpot: { x: 1286, y: 1696 }, facing: 'up', bubble: '🥥 Es kelapa segar~' },
  { id: 'bench-gallery', x: 462, y: 866, w: 18, h: 48, seatSpot: { x: 471, y: 890 }, approachSpot: { x: 496, y: 890 }, facing: 'right', bubble: '🏀 Nonton main basket' },
  { id: 'bench-east', x: 2406, y: 820, w: 18, h: 48, seatSpot: { x: 2415, y: 844 }, approachSpot: { x: 2382, y: 844 }, facing: 'right', bubble: '🌿 Adem dekat rumah kaca' },
];

// Titik duduk tambahan: batang kayu api unggun & kursi patio Kopi Senja
export const VILLAGE_EXTRA_SEATS = [
  { id: 'log-west', x: 1564, y: 1726, w: 28, h: 44, seatSpot: { x: 1582, y: 1748 }, approachSpot: { x: 1582, y: 1748 }, facing: 'right', bubble: '🔥 Hangat di api unggun' },
  { id: 'log-east', x: 1708, y: 1726, w: 28, h: 44, seatSpot: { x: 1722, y: 1748 }, approachSpot: { x: 1722, y: 1748 }, facing: 'left', bubble: '🎸 Santai dekat api unggun' },
  { id: 'patio-1', x: 998, y: 244, w: 22, h: 32, seatSpot: { x: 1006, y: 260 }, approachSpot: { x: 998, y: 286 }, facing: 'right', bubble: '☕ Ngopi di teras Senja' },
  { id: 'patio-2', x: 1030, y: 332, w: 24, h: 32, seatSpot: { x: 1036, y: 348 }, approachSpot: { x: 1012, y: 332 }, facing: 'right', bubble: '🥐 Istirahat sambil ngopi' },
];

// Area interaktif aktivitas desa: perahu danau, trem wisata, lapangan basket
export const VILLAGE_BOAT_CONFIG = {
  dockZone: { x: 1220, y: 1185, w: 176, h: 108 },
  dockPoint: { x: 1270, y: 1234 },
  mooredPos: { x: 1354, y: 1246 },
  sailBounds: { minX: 996, maxX: 1544, minY: 1218, maxY: 1506 },
  pierAvoidBox: { x: 1212, y: 1140, w: 114, h: 130 },
};

export const VILLAGE_TRAM_CONFIG = {
  trackY: 50,
  rideY: 70,
  speed: 145,
  loopSpan: VILLAGE_W + 520,
  startOffset: 260,
  stationZone: { x: 104, y: 124, w: 412, h: 300 },
  stationNearBox: { x: 96, y: 345, w: 428, h: 120 },
  stationDropSpot: { x: 310, y: 416 },
};

export const VILLAGE_BASKETBALL_CONFIG = {
  courtZone: { x: 520, y: 768, w: 236, h: 218 },
  hoopZone: { x: 598, y: 756, w: 84, h: 52 },
  hoopTarget: { x: 640, y: 790 },
  threePointY: 882,
  defaultShootSpot: { x: 640, y: 894 },
};

export const VILLAGE_TREES = [
  // Hutan perbatasan utara & barat
  { x: 64, y: 204, kind: 'pine' },
  { x: 560, y: 210, kind: 'sakura' },
  { x: 632, y: 274, kind: 'oak' },
  { x: 1138, y: 178, kind: 'sakura' },
  { x: 1834, y: 186, kind: 'sakura' },
  { x: 2292, y: 158, kind: 'pine' },
  { x: 2934, y: 178, kind: 'pine' },
  { x: 2932, y: 382, kind: 'oak' },
  // Tepian barat & selatan-barat
  { x: 68, y: 468, kind: 'oak' },
  { x: 68, y: 696, kind: 'sakura' },
  { x: 68, y: 970, kind: 'pine' },
  { x: 74, y: 1226, kind: 'oak' },
  { x: 74, y: 1474, kind: 'pine' },
  { x: 96, y: 1756, kind: 'pine' },
  { x: 266, y: 1866, kind: 'oak' },
  { x: 512, y: 1866, kind: 'sakura' },
  { x: 752, y: 1882, kind: 'oak' },
  // Sekitar taman tengah, danau & perkemahan
  { x: 874, y: 760, kind: 'sakura' },
  { x: 1110, y: 958, kind: 'oak' },
  { x: 1830, y: 944, kind: 'sakura' },
  { x: 904, y: 1144, kind: 'oak' },
  { x: 1626, y: 1146, kind: 'sakura' },
  { x: 1364, y: 1684, kind: 'pine' },
  { x: 1898, y: 1712, kind: 'pine' },
  { x: 1966, y: 1844, kind: 'oak' },
  { x: 1280, y: 1900, kind: 'oak' },
  { x: 1656, y: 1906, kind: 'sakura' },
  // Distrik timur & selatan-timur
  { x: 2928, y: 678, kind: 'sakura' },
  { x: 2928, y: 952, kind: 'pine' },
  { x: 2926, y: 1244, kind: 'oak' },
  { x: 2920, y: 1546, kind: 'pine' },
  { x: 2844, y: 1838, kind: 'pine' },
  { x: 2560, y: 1866, kind: 'sakura' },
  { x: 2248, y: 1852, kind: 'oak' },
  { x: 2266, y: 1256, kind: 'sakura' },
];

export const VILLAGE_WAYPOINTS = {
  // Pusat Desa
  officeFront: { x: 1490, y: 468 },
  officeEntry: { x: 1490, y: 424 },
  plazaNorth: { x: 1490, y: 534 },
  plazaWest: { x: 1404, y: 628 },
  plazaEast: { x: 1574, y: 604 },
  plazaSouth: { x: 1490, y: 724 },
  noticeBoard: { x: 1675, y: 580 },
  cafeFront: { x: 840, y: 430 },
  cafePatio: { x: 1012, y: 332 },
  coworkFront: { x: 2080, y: 446 },

  // Distrik Barat
  stationFront: { x: 310, y: 416 },
  galleryFront: { x: 280, y: 1026 },
  basketballCourt: { x: 640, y: 888 },
  bookshopFront: { x: 305, y: 1502 },
  marketStallFront: { x: 528, y: 1408 },

  // Distrik Timur
  windmillFront: { x: 2610, y: 446 },
  villaFront: { x: 2175, y: 996 },
  villaGardenSpot: { x: 1962, y: 938 },
  greenhouseFront: { x: 2640, y: 986 },
  homesteadFront: { x: 2632, y: 1512 },

  // Distrik Selatan (Danau, Dermaga, 2 Jembatan, Kuliner, Api Unggun)
  lakeNorthShore: { x: 1170, y: 1120 },
  pierTip: { x: 1270, y: 1234 },
  bridgeWestCenter: { x: 792, y: 1358 },
  bridgeEastCenter: { x: 1752, y: 1358 },
  foodTruckFront: { x: 1000, y: 1824 },
  campfireWest: { x: 1582, y: 1748 },
  campfireEast: { x: 1722, y: 1748 },
};

export const VILLAGE_COLLIDERS = [
  // Batas luar peta 3000x2000 (rel trem di utara y:0..140 tertutup pagar)
  { x: 0, y: 0, w: VILLAGE_W, h: 24 },
  { x: 0, y: VILLAGE_H - 24, w: VILLAGE_W, h: 24 },
  { x: 0, y: 0, w: 24, h: VILLAGE_H },
  { x: VILLAGE_W - 24, y: 0, w: 24, h: VILLAGE_H },

  // Semua bangunan di 4 distrik
  ...VILLAGE_BUILDINGS.map((b) => ({ x: b.x, y: b.y, w: b.w, h: b.h })),

  // Air mancur, papan desa, patio cafe, props halaman & ladang
  VILLAGE_FOUNTAIN,
  {
    x: VILLAGE_NOTICE_BOARD.x,
    y: VILLAGE_NOTICE_BOARD.y,
    w: VILLAGE_NOTICE_BOARD.w,
    h: VILLAGE_NOTICE_BOARD.h,
  },
  ...VILLAGE_CAFE_TABLES.map((t) => ({ x: t.x, y: t.y, w: t.w, h: t.h })),
  VILLAGE_PROPS.officeBikeRack,
  VILLAGE_PROPS.makerYard,
  VILLAGE_PROPS.marketStall,
  VILLAGE_PROPS.villaGarden,
  VILLAGE_PROPS.homesteadGarden,
  VILLAGE_PROPS.basketballHoop,
  VILLAGE_PROPS.wheatFieldWest,
  VILLAGE_PROPS.wheatFieldEast,
  VILLAGE_PROPS.campfire,

  // Danau (terbuka di dermaga kayu) & sungai (terbuka di 2 jembatan kayu)
  ...VILLAGE_LAKE_COLLIDERS,
  ...VILLAGE_CREEK_SEGMENTS,

  // Bangku taman
  ...VILLAGE_BENCHES,

  // Batang pohon
  ...VILLAGE_TREES.map((t) => ({ x: t.x - 14, y: t.y - 4, w: 28, h: 20 })),
];

export const VILLAGE_PETS = [
  {
    id: 'pet-mochi',
    name: 'Mochi',
    species: 'cat',
    bodyColor: '#fb923c',
    accentColor: '#ea580c',
    startSpot: { x: 1356, y: 556 },
    spots: [
      { x: 1356, y: 556 },
      { x: 1184, y: 540 },
      { x: 1012, y: 410 },
      { x: 1490, y: 740 },
      { x: 1620, y: 690 },
    ],
    purrs: ['Meong~ 🐱', 'Purrr... ❤️', 'Minta elus! 🐾', 'Zzz... ☀️'],
  },
  {
    id: 'pet-bubu',
    name: 'Bubu',
    species: 'dog',
    bodyColor: '#eab308',
    accentColor: '#a16207',
    startSpot: { x: 1582, y: 1700 },
    spots: [
      { x: 1582, y: 1700 },
      { x: 1470, y: 1660 },
      { x: 1210, y: 1640 },
      { x: 1752, y: 1560 },
      { x: 1722, y: 1748 },
    ],
    purrs: ['Guk guk! 🐶', 'Seneng banget! ❤️', 'Main lempar bola yuk! 🎾', 'Woof~ 🐾'],
  },
];

// Alias backward-compatible untuk test lama
export const VILLAGE_PET = VILLAGE_PETS[0];

export const VILLAGE_RESIDENTS = [
  {
    id: 'villager-bagas',
    name: 'Bagas',
    role: 'Warga Alun-Alun',
    spriteKey: 'npc_villager_bagas',
    accentHex: '#10b981',
    shirtColor: '#059669',
    hairColor: '#1e293b',
    skinColor: '#f1c27d',
    startSpot: VILLAGE_WAYPOINTS.plazaWest,
    bubbles: ['🌤️ Desa makin luas & asri!', '⛲ Air mancur jernih banget', '🏢 Office HQ sibuk terus ya'],
  },
  {
    id: 'villager-nina',
    name: 'Nina',
    role: 'Barista Kopi Senja',
    spriteKey: 'npc_barista_f',
    accentHex: '#f59e0b',
    shirtColor: '#d97706',
    hairColor: '#451a03',
    skinColor: '#fde68a',
    startSpot: VILLAGE_WAYPOINTS.cafePatio,
    bubbles: ['☕ Latte hangat buat Director?', '🥐 Croissant baru matang!', '✨ Teras kafe nyaman banget'],
  },
  {
    id: 'villager-rudi',
    name: 'Rudi',
    role: 'Maker Komunitas',
    spriteKey: 'npc_maker',
    accentHex: '#14b8a6',
    shirtColor: '#0d9488',
    hairColor: '#0f172a',
    skinColor: '#e5b887',
    startSpot: VILLAGE_WAYPOINTS.coworkFront,
    bubbles: ['🛠️ Turbin angin lancar jaya!', '💡 Lagi rakit drone taman', '🚀 Mampir ke Maker Hub yuk'],
  },
  {
    id: 'villager-tari',
    name: 'Tari',
    role: 'Pecinta Buku',
    spriteKey: 'npc_booklover',
    accentHex: '#3b82f6',
    shirtColor: '#2563eb',
    hairColor: '#292524',
    skinColor: '#ffdbac',
    startSpot: VILLAGE_WAYPOINTS.marketStallFront,
    bubbles: ['📚 Banyak novel baru di kios!', '🍊 Jeruknya segar banget', '🌉 Habis ini ke jembatan barat'],
  },
  {
    id: 'villager-galih',
    name: 'Galih',
    role: 'Penjaga Dermaga',
    spriteKey: 'npc_sailor',
    accentHex: '#0ea5e9',
    shirtColor: '#0284c7',
    hairColor: '#3f2e21',
    skinColor: '#f5cba7',
    startSpot: VILLAGE_WAYPOINTS.pierTip,
    bubbles: ['🚣 Perahu siap berlayar!', '🦆 Bebek danau makin banyak', '🌊 Angin danau sejuk banget'],
  },
  {
    id: 'villager-mila',
    name: 'Mila',
    role: 'Pekebun Villa',
    spriteKey: 'npc_gardener',
    accentHex: '#ec4899',
    shirtColor: '#db2777',
    hairColor: '#7c2d12',
    skinColor: '#f8cba6',
    startSpot: VILLAGE_WAYPOINTS.villaGardenSpot,
    bubbles: ['🌻 Bunga matahari mekar!', '🎃 Labu kebun siap panen', '👋 Halo Director!'],
  },
  {
    id: 'villager-deni',
    name: 'Deni',
    role: 'Penumpang Trem',
    spriteKey: 'npc_villager_deni',
    accentHex: '#22c55e',
    shirtColor: '#16a34a',
    hairColor: '#1e1b4b',
    skinColor: '#f5cba7',
    startSpot: VILLAGE_WAYPOINTS.stationFront,
    bubbles: ['🚋 Nunggu trem lewat utara', '📌 Tadi baca papan desa', '☕ Mau mampir ke Kopi Senja'],
  },
  {
    id: 'villager-putri',
    name: 'Putri',
    role: 'Pelukis Studio',
    spriteKey: 'npc_painter',
    accentHex: '#a855f7',
    shirtColor: '#9333ea',
    hairColor: '#3f2e21',
    skinColor: '#ffdbac',
    startSpot: VILLAGE_WAYPOINTS.galleryFront,
    bubbles: ['🎨 Lagi melukis danau desa', '🌸 Warna sakura bagus banget', '🎵 Musik di studio bikin fokus'],
  },
  {
    id: 'villager-farhan',
    name: 'Farhan',
    role: 'Atlet Basket',
    spriteKey: 'npc_athlete',
    accentHex: '#f97316',
    shirtColor: '#ea580c',
    hairColor: '#0f172a',
    skinColor: '#e5b887',
    startSpot: VILLAGE_WAYPOINTS.basketballCourt,
    bubbles: ['🏀 Shoot 3 poin masuk!', '💪 Olahraga pagi dulu', '🥤 Habis ini beli es kelapa'],
  },
  {
    id: 'villager-pakrt',
    name: 'Pak Budi',
    role: 'Ketua RT Timur',
    spriteKey: 'npc_elder_rt',
    accentHex: '#eab308',
    shirtColor: '#b45309',
    hairColor: '#475569',
    skinColor: '#f1c27d',
    startSpot: VILLAGE_WAYPOINTS.homesteadFront,
    bubbles: ['🌾 Panen gandum tahun ini melimpah!', '🏠 Kerja bakti minggu depan ya', '👋 Selamat datang di distrik timur!'],
  },
  {
    id: 'villager-siska',
    name: 'Siska',
    role: 'Botanis',
    spriteKey: 'npc_botanist',
    accentHex: '#06b6d4',
    shirtColor: '#0891b2',
    hairColor: '#1e293b',
    skinColor: '#fde68a',
    startSpot: VILLAGE_WAYPOINTS.greenhouseFront,
    bubbles: ['🌿 Anggrek di rumah kaca mekar!', '💧 Cek irigasi hidroponik', '🦋 Kupu-kupu suka banget ke sini'],
  },
  {
    id: 'villager-chef',
    name: 'Chef Edo',
    role: 'Koki Food Truck',
    spriteKey: 'npc_chef',
    accentHex: '#f59e0b',
    shirtColor: '#ca8a04',
    hairColor: '#292524',
    skinColor: '#f8cba6',
    startSpot: VILLAGE_WAYPOINTS.foodTruckFront,
    bubbles: ['🍜 Ramen kuah kaldu siap!', '🥥 Es kelapa muda segar~', '🔥 Api unggun sudah nyala!'],
  },
  {
    id: 'villager-nando',
    name: 'Nando',
    role: 'Musisi Api Unggun',
    spriteKey: 'npc_musician',
    accentHex: '#f43f5e',
    shirtColor: '#e11d48',
    hairColor: '#451a03',
    skinColor: '#ffdbac',
    startSpot: VILLAGE_WAYPOINTS.campfireWest,
    bubbles: ['🎸 Akustikan di tepi danau~', '🔥 Hangat banget dekat api unggun', '🐶 Bubu ikutan dengerin!'],
  },
  {
    id: 'villager-lara',
    name: 'Lara',
    role: 'Petani Kincir',
    spriteKey: 'npc_farmer',
    accentHex: '#84cc16',
    shirtColor: '#65a30d',
    hairColor: '#7c2d12',
    skinColor: '#f5cba7',
    startSpot: VILLAGE_WAYPOINTS.windmillFront,
    bubbles: ['🌾 Angin timur pas buat kincir!', '🍞 Gandum segar buat Kopi Senja', '☀️ Pemandangan bukit indah'],
  },
];

export const VILLAGE_ACTIVITIES = [
  { spot: VILLAGE_WAYPOINTS.plazaNorth, facing: 'down', bubble: '⛲ Lihat air mancur' },
  { spot: VILLAGE_WAYPOINTS.plazaWest, facing: 'right', bubble: '🌤️ Santai di alun-alun' },
  { spot: VILLAGE_WAYPOINTS.noticeBoard, facing: 'up', bubble: '📌 Baca papan desa' },
  { spot: VILLAGE_WAYPOINTS.cafePatio, facing: 'up', bubble: '☕ Ngopi di teras' },
  { spot: VILLAGE_WAYPOINTS.coworkFront, facing: 'up', bubble: '🛠️ Cek Maker Hub' },
  { spot: VILLAGE_WAYPOINTS.stationFront, facing: 'up', bubble: '🚋 Lihat trem melintas' },
  { spot: VILLAGE_WAYPOINTS.galleryFront, facing: 'up', bubble: '🎨 Lihat pameran seni' },
  { spot: VILLAGE_WAYPOINTS.basketballCourt, facing: 'up', bubble: '🏀 Main basket sebentar' },
  { spot: VILLAGE_WAYPOINTS.marketStallFront, facing: 'up', bubble: '🍊 Belanja buah & buku' },
  { spot: VILLAGE_WAYPOINTS.windmillFront, facing: 'up', bubble: '🌾 Lihat kincir angin' },
  { spot: VILLAGE_WAYPOINTS.villaGardenSpot, facing: 'up', bubble: '🌻 Kagumi kebun bunga' },
  { spot: VILLAGE_WAYPOINTS.greenhouseFront, facing: 'up', bubble: '🌿 Cek rumah kaca' },
  { spot: VILLAGE_WAYPOINTS.homesteadFront, facing: 'up', bubble: '🏠 Sapa Pak RT' },
  { spot: VILLAGE_WAYPOINTS.pierTip, facing: 'down', bubble: '🚣 Nikmati pemandangan danau' },
  { spot: VILLAGE_WAYPOINTS.bridgeWestCenter, facing: 'right', bubble: '🌉 Lewat jembatan barat' },
  { spot: VILLAGE_WAYPOINTS.bridgeEastCenter, facing: 'left', bubble: '🌉 Lewat jembatan timur' },
  { spot: VILLAGE_WAYPOINTS.foodTruckFront, facing: 'up', bubble: '🍜 Pesan ramen danau' },
  { spot: VILLAGE_WAYPOINTS.campfireWest, facing: 'right', bubble: '🔥 Hangatkan diri' },
  { spot: VILLAGE_WAYPOINTS.campfireEast, facing: 'left', bubble: '🎸 Dengerin musik akustik' },
];
