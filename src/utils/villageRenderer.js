import { WORLD_H, WORLD_W } from '../constants/officeConfig';
import {
  OFFICE_HQ_BUILDING,
  VILLAGE_BASKETBALL_CONFIG,
  VILLAGE_BENCHES,
  VILLAGE_BOAT_CONFIG,
  VILLAGE_BRIDGES,
  VILLAGE_BUILDINGS,
  VILLAGE_CAFE_TABLES,
  VILLAGE_CREEK_SEGMENTS,
  VILLAGE_DISTRICTS,
  VILLAGE_EXTRA_SEATS,
  VILLAGE_FOUNTAIN,
  VILLAGE_H,
  VILLAGE_LAKE,
  VILLAGE_NAME,
  VILLAGE_NOTICE_BOARD,
  VILLAGE_PIER,
  VILLAGE_PROPS,
  VILLAGE_TRAM_CONFIG,
  VILLAGE_TREES,
  VILLAGE_W,
} from '../constants/villageConfig';
import { getVillageSprite } from './villageAssets';

export const VILLAGE_MINIMAP_RECT = {
  x: WORLD_W - 256,
  y: WORLD_H - 184,
  w: 234,
  h: 156,
};

function drawBox(ctx, x, y, w, h, fill, stroke = '#2c221e', lineWidth = 2) {
  ctx.fillStyle = fill;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(
      Math.round(x) + 0.5,
      Math.round(y) + 0.5,
      Math.round(w) - 1,
      Math.round(h) - 1
    );
  }
}

// Jaringan jalan terpadu (semua segmen dirender dalam 3 pass agar menyatu mulus tanpa garis tumpang tindih)
const VILLAGE_ROAD_SEGMENTS = [
  // 3 Jalan Utama Horizontal (Barat -> Timur)
  { x: 220, y: 540, w: 2450, h: 106, r: 28 }, // Jalan Raya Utama Utara
  { x: 220, y: 1018, w: 2480, h: 78, r: 24 }, // Jalan Lintas Tengah
  { x: 248, y: 1558, w: 2440, h: 82, r: 26 }, // Jalan Lintas Selatan

  // Jalan Vertikal Penghubung Distrik (dimulai rapi dari Jalan Utama y=560 ke selatan, tidak menumpuk teras gedung utara!)
  { x: 752, y: 560, w: 80, h: 1060, r: 20 }, // Koridor Barat + Jembatan Barat (center x=792)
  { x: 1712, y: 560, w: 80, h: 1060, r: 20 }, // Koridor Tengah-Timur + Jembatan Timur (center x=1752)
  { x: 2324, y: 560, w: 72, h: 520, r: 18 }, // Penghubung Timur Atas (Utama -> Tengah)
  { x: 2236, y: 1036, w: 78, h: 586, r: 18 }, // Penghubung Timur Bawah (Tengah -> Selatan)

  // Alun-Alun Tengah simetris tepat di depan Virtual Office HQ (center x=1490)
  { x: 1260, y: 396, w: 460, h: 350, r: 30 },

  // Halaman Depan Kopi Senja simetris (persis gaya Stasiun Trem) + Patio Outdoor terhubung rapi
  { x: 760, y: 382, w: 160, h: 176, r: 20 },
  { x: 982, y: 214, w: 148, h: 216, r: 18 },
  { x: 900, y: 382, w: 220, h: 54, r: 16 },

  // Akses / Halaman Depan Bangunan & Landmark Lainnya (simetris ke pintu masing-masing)
  { x: 230, y: 368, w: 160, h: 196, r: 20 }, // Stasiun Trem -> Jalan Utama
  { x: 2020, y: 396, w: 120, h: 168, r: 20 }, // Maker Hub -> Jalan Utama
  { x: 2550, y: 396, w: 120, h: 168, r: 20 }, // Kincir Angin -> Jalan Utama
  { x: 232, y: 972, w: 96, h: 72, r: 16 }, // Galeri Seni -> Jalan Tengah
  { x: 596, y: 980, w: 88, h: 56, r: 14 }, // Lapangan Basket -> Jalan Tengah
  { x: 2124, y: 944, w: 102, h: 98, r: 16 }, // Villa Melati -> Jalan Tengah
  { x: 2584, y: 936, w: 112, h: 104, r: 16 }, // Rumah Kaca -> Jalan Tengah
  { x: 1228, y: 1076, w: 84, h: 74, r: 14 }, // Jalan Tengah -> Dermaga Danau
  { x: 250, y: 1446, w: 322, h: 134, r: 20 }, // Toko Buku & Kios Pasar -> Jalan Selatan
  { x: 2576, y: 1456, w: 112, h: 126, r: 16 }, // Rumah Pak RT -> Jalan Selatan
  { x: 924, y: 1620, w: 156, h: 216, r: 20 }, // Jalan Selatan -> Food Truck Danau
  { x: 1612, y: 1620, w: 82, h: 74, r: 16 }, // Jalan Selatan -> Taman Api Unggun
];

function drawUnifiedRoadNetwork(ctx) {
  // Pass 1: Tepian kerikil / curb luar menyatu tanpa memotong persimpangan
  ctx.fillStyle = '#ad9670';
  VILLAGE_ROAD_SEGMENTS.forEach((s) => {
    ctx.beginPath();
    ctx.roundRect(s.x - 6, s.y - 6, s.w + 12, s.h + 12, s.r + 5);
    ctx.fill();
  });

  // Pass 2: Permukaan dasar jalan sandstone seragam di atas seluruh curb
  ctx.fillStyle = '#e6d9be';
  VILLAGE_ROAD_SEGMENTS.forEach((s) => {
    ctx.beginPath();
    ctx.roundRect(s.x, s.y, s.w, s.h, s.r);
    ctx.fill();
  });

  // Pass 3: Pola batu paving global (koordinat dunia yang sama, nol sambungan patah!)
  ctx.save();
  ctx.beginPath();
  VILLAGE_ROAD_SEGMENTS.forEach((s) => {
    ctx.roundRect(s.x + 2, s.y + 2, s.w - 4, s.h - 4, Math.max(4, s.r - 2));
  });
  ctx.clip();

  const roadTile = getVillageSprite('road_tile');
  let pattern = null;
  if (roadTile) {
    pattern = ctx.createPattern(roadTile, 'repeat');
  } else {
    const tileCanvas = document.createElement('canvas');
    tileCanvas.width = 64;
    tileCanvas.height = 48;
    const tctx = tileCanvas.getContext('2d');
    tctx.fillStyle = '#e5d8bc';
    tctx.fillRect(0, 0, 64, 48);
    const stones = [
      [2, 2, 28, 20, '#ede2ca'],
      [34, 2, 28, 20, '#dfd0b0'],
      [18, 26, 28, 20, '#e8dcc2'],
      [-14, 26, 28, 20, '#dfd0b0'],
      [50, 26, 28, 20, '#ede2ca'],
    ];
    stones.forEach(([sx, sy, sw, sh, col]) => {
      tctx.fillStyle = col;
      tctx.beginPath();
      tctx.roundRect(sx, sy, sw, sh, 4);
      tctx.fill();
      tctx.strokeStyle = 'rgba(139, 115, 85, 0.16)';
      tctx.lineWidth = 1;
      tctx.stroke();
    });
    pattern = ctx.createPattern(tileCanvas, 'repeat');
  }
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, VILLAGE_W, VILLAGE_H);
  }
  ctx.restore();
}

function drawSteppingStones(ctx, points) {
  points.forEach(([sx, sy, rx = 12, ry = 8]) => {
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(sx + 1, sy + 2, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#dfd5c0';
    ctx.beginPath();
    ctx.ellipse(sx, sy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#9c8a6b';
    ctx.lineWidth = 1.4;
    ctx.stroke();
  });
}

function drawTree(ctx, x, y, kind = 'oak') {
  const sprite = getVillageSprite(`tree_${kind}`);
  if (sprite) {
    ctx.fillStyle = 'rgba(20, 45, 25, 0.24)';
    ctx.beginPath();
    ctx.ellipse(x + 3, y + 14, kind === 'pine' ? 24 : 30, 11, 0, 0, Math.PI * 2);
    ctx.fill();

    const drawH = kind === 'pine' ? 92 : 84;
    const drawW = Math.round(drawH * (sprite.naturalWidth / sprite.naturalHeight));
    const drawX = Math.round(x - drawW / 2);
    const drawY = Math.round(y + 18 - drawH);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sprite, drawX, drawY, drawW, drawH);
    ctx.restore();
    return;
  }

  ctx.fillStyle = 'rgba(20, 45, 25, 0.22)';
  ctx.beginPath();
  ctx.ellipse(x + 3, y + 14, kind === 'pine' ? 22 : 27, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  drawBox(ctx, x - 7, y - 4, 14, 20, '#855336', '#2c221e', 2);
  ctx.fillStyle = '#a46e4c';
  ctx.fillRect(x - 4, y - 2, 4, 16);

  if (kind === 'pine') {
    const tiers = [
      { dy: -6, halfW: 25, h: 24, c: '#1f5c35' },
      { dy: -20, halfW: 20, h: 22, c: '#287243' },
      { dy: -33, halfW: 14, h: 20, c: '#358c52' },
    ];
    tiers.forEach((t) => {
      ctx.fillStyle = t.c;
      ctx.beginPath();
      ctx.moveTo(x, y + t.dy - t.h);
      ctx.lineTo(x + t.halfW, y + t.dy);
      ctx.lineTo(x - t.halfW, y + t.dy);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#143d22';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    return;
  }

  const palette =
    kind === 'sakura'
      ? ['#f472b6', '#ec4899', '#f9a8d4', '#fbcfe8', '#fce7f3', '#9d174d']
      : ['#2f7a38', '#276a30', '#3d9444', '#4ca952', '#6ec468', '#1b4332'];

  const puffs = [
    { dx: -16, dy: -16, r: 17, c: palette[0] },
    { dx: 16, dy: -16, r: 17, c: palette[1] },
    { dx: 0, dy: -29, r: 22, c: palette[2] },
    { dx: -10, dy: -27, r: 14, c: palette[3] },
    { dx: 9, dy: -33, r: 12, c: palette[4] },
  ];
  puffs.forEach((p) => {
    ctx.fillStyle = p.c;
    ctx.beginPath();
    ctx.arc(x + p.dx, y + p.dy, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = palette[5];
    ctx.lineWidth = 1.8;
    ctx.stroke();
  });
}

function drawBush(ctx, x, y, hasBerries = false) {
  ctx.fillStyle = 'rgba(20,45,25,0.18)';
  ctx.beginPath();
  ctx.ellipse(x, y + 6, 15, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  [
    { dx: -7, dy: 0, r: 9, c: '#358840' },
    { dx: 7, dy: 0, r: 9, c: '#2c7436' },
    { dx: 0, dy: -4, r: 10, c: '#48a450' },
  ].forEach((b) => {
    ctx.fillStyle = b.c;
    ctx.beginPath();
    ctx.arc(x + b.dx, y + b.dy, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1b4332';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
  if (hasBerries) {
    ctx.fillStyle = '#fb7185';
    ctx.fillRect(x - 5, y - 4, 3, 3);
    ctx.fillRect(x + 3, y - 2, 3, 3);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x, y - 7, 3, 3);
  }
}

function drawFlowerPatch(ctx, x, y, color = '#f472b6') {
  ctx.fillStyle = '#4c9a52';
  ctx.fillRect(x - 8, y, 16, 4);
  ctx.fillStyle = color;
  ctx.fillRect(x - 7, y - 3, 4, 4);
  ctx.fillRect(x + 2, y - 5, 4, 4);
  ctx.fillRect(x + 7, y - 2, 4, 4);
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(x - 2, y - 2, 3, 3);
}

function drawRock(ctx, x, y, w = 18, h = 12) {
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(x + 2, y + 3, w * 0.55, h * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.ellipse(x, y, w * 0.52, h * 0.48, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.ellipse(x - 3, y - 2, w * 0.24, h * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawBench(ctx, b) {
  ctx.save();
  // Bayangan lembut di bawah kursi
  ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
  ctx.beginPath();
  ctx.roundRect(b.x + 2, b.y + 5, b.w, b.h, 4);
  ctx.fill();

  if (b.w >= b.h) {
    // Kursi taman horizontal 16-bit: sandaran & dudukan bilah kayu cedar + sandaran tangan besi tempa
    drawBox(ctx, b.x + 3, b.y - 3, b.w - 6, 8, '#a46338', '#2c1d13', 1.6);
    ctx.fillStyle = '#c98855';
    ctx.fillRect(b.x + 5, b.y - 1, b.w - 10, 2);

    drawBox(ctx, b.x + 2, b.y + 5, b.w - 4, b.h - 4, '#8d522c', '#2c1d13', 1.6);
    ctx.fillStyle = '#b97745';
    ctx.fillRect(b.x + 4, b.y + 7, b.w - 8, 4);
    ctx.fillStyle = '#d49a6a';
    ctx.fillRect(b.x + 4, b.y + 7, b.w - 8, 1.5);
    // Garis sambungan bilah kayu
    ctx.fillStyle = '#4a2914';
    ctx.fillRect(b.x + 4, b.y + 12, b.w - 8, 1.5);

    // Sandaran tangan & kaki besi tempa kiri-kanan
    [b.x, b.x + b.w - 5].forEach((lx) => {
      drawBox(ctx, lx, b.y - 2, 5, b.h + 4, '#334155', '#0f172a', 1.2);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(lx + 1, b.y, 2, b.h);
    });
  } else {
    // Kursi taman vertikal 16-bit (menghadap kanan)
    drawBox(ctx, b.x - 2, b.y + 2, 7, b.h - 4, '#a46338', '#2c1d13', 1.6);
    ctx.fillStyle = '#c98855';
    ctx.fillRect(b.x, b.y + 4, 2, b.h - 8);

    drawBox(ctx, b.x + 5, b.y + 2, b.w - 3, b.h - 4, '#8d522c', '#2c1d13', 1.6);
    ctx.fillStyle = '#b97745';
    ctx.fillRect(b.x + 7, b.y + 4, 5, b.h - 8);
    ctx.fillStyle = '#d49a6a';
    ctx.fillRect(b.x + 7, b.y + 4, 2, b.h - 8);

    // Sandaran tangan besi tempa atas-bawah
    [b.y, b.y + b.h - 5].forEach((ly) => {
      drawBox(ctx, b.x - 1, ly, b.w + 3, 5, '#334155', '#0f172a', 1.2);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(b.x + 1, ly + 1, b.w - 1, 2);
    });
  }
  ctx.restore();
}

function drawStreetLamp(ctx, x, y) {
  ctx.save();
  // Bayangan dasar lampu
  ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
  ctx.beginPath();
  ctx.ellipse(x + 2, y + 6, 10, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Alas pedestal besi tempa oktagonal
  drawBox(ctx, x - 7, y - 2, 14, 7, '#1e293b', '#0f172a', 1.4);
  drawBox(ctx, x - 5, y - 8, 10, 7, '#334155', '#0f172a', 1.3);
  ctx.fillStyle = '#64748b';
  ctx.fillRect(x - 3, y - 7, 2, 5);

  // Tiang besi beralur dengan aksen kuningan
  drawBox(ctx, x - 2.5, y - 34, 5, 27, '#1e293b', '#0f172a', 1.3);
  ctx.fillStyle = '#64748b';
  ctx.fillRect(x - 1, y - 33, 1.5, 25);
  // Cincin dekoratif & penopang lentera
  drawBox(ctx, x - 5, y - 28, 10, 3, '#475569', '#0f172a', 1);
  drawBox(ctx, x - 6, y - 36, 12, 3, '#334155', '#0f172a', 1.1);

  // Kaca lentera kuning hangat + pendar halus
  ctx.fillStyle = 'rgba(253, 224, 71, 0.22)';
  ctx.beginPath();
  ctx.arc(x, y - 42, 14, 0, Math.PI * 2);
  ctx.fill();

  drawBox(ctx, x - 7, y - 48, 14, 13, '#fef08a', '#78350f', 1.5);
  ctx.fillStyle = '#fffbeb';
  ctx.fillRect(x - 3, y - 46, 6, 9);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(x - 1, y - 43, 2, 4);
  // Rangka besi vertikal lentera
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x - 3, y - 48, 1.2, 13);
  ctx.fillRect(x + 2, y - 48, 1.2, 13);

  // Tudung atap lentera runcing klasik
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.moveTo(x - 10, y - 48);
  ctx.lineTo(x + 10, y - 48);
  ctx.lineTo(x + 5, y - 53);
  ctx.lineTo(x - 5, y - 53);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.3;
  ctx.stroke();
  ctx.fillStyle = '#facc15';
  ctx.fillRect(x - 1.5, y - 56, 3, 3);
  ctx.restore();
}

function drawNoticeBoard(ctx) {
  const nb = VILLAGE_NOTICE_BOARD;
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(nb.x + 4, nb.y + 8, nb.w, nb.h);
  drawBox(ctx, nb.x + 6, nb.y + 18, 7, 20, '#6c4328', '#2c221e', 1.5);
  drawBox(ctx, nb.x + nb.w - 13, nb.y + 18, 7, 20, '#6c4328', '#2c221e', 1.5);
  drawBox(ctx, nb.x, nb.y + 2, nb.w, 28, '#9a5b32', '#2c221e', 2);
  ctx.fillStyle = '#d4a373';
  ctx.fillRect(nb.x + 4, nb.y + 6, nb.w - 8, 20);
  drawBox(ctx, nb.x + 7, nb.y + 8, 12, 13, '#fef9c3', '#854d0e', 1);
  drawBox(ctx, nb.x + 22, nb.y + 9, 14, 14, '#e0f2fe', '#0369a1', 1);
  drawBox(ctx, nb.x + 39, nb.y + 8, 11, 12, '#fce7f3', '#9d174d', 1);
  drawBox(ctx, nb.x - 4, nb.y - 4, nb.w + 8, 9, '#78350f', '#2c221e', 1.6);
}

function drawSpriteBuilding(ctx, sprite, b, { padX = 16, overhangTop = 36, badgeText = null, badgeBorder = '#facc15' } = {}) {
  const targetW = b.w + padX * 2;
  const aspect = sprite.naturalHeight / sprite.naturalWidth;
  const maxH = b.h + overhangTop;
  let drawW = targetW;
  let drawH = drawW * aspect;
  if (drawH > maxH) {
    drawH = maxH;
    drawW = drawH / aspect;
  }
  const drawX = Math.round(b.x + (b.w - drawW) / 2);
  const drawY = Math.round(b.y + b.h - drawH + 4);

  // Bayangan lembut di dasar bangunan
  ctx.fillStyle = 'rgba(15, 23, 42, 0.24)';
  ctx.beginPath();
  ctx.roundRect(drawX + 12, b.y + b.h - 14, drawW - 14, 24, 10);
  ctx.fill();

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sprite, drawX, drawY, Math.round(drawW), Math.round(drawH));
  ctx.restore();

  if (badgeText) {
    ctx.font = 'bold 12px "Inter", system-ui, sans-serif';
    const bw = Math.max(126, ctx.measureText(badgeText).width + 24);
    const bx = Math.round(b.x + (b.w - bw) / 2);
    const by = Math.max(24, drawY - 10);
    drawBox(ctx, bx, by, bw, 24, 'rgba(15, 23, 42, 0.92)', badgeBorder, 1.8);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, b.x + b.w / 2, by + 16);
  }
}

function drawOfficeHq(ctx, b) {
  const sprite = getVillageSprite('office_hq');
  if (sprite) {
    // Pot tanaman & tangga sambut + rak sepeda tetap digambar rapi
    const d = b.door;
    drawBox(ctx, d.x - 10, b.y + b.h, d.w + 20, 14, '#cbd5e1', '#475569', 1.5);
    drawBox(ctx, d.x + 8, b.y + b.h + 12, d.w - 16, 12, '#4f46e5', '#1e1b4b', 1.5);

    drawSpriteBuilding(ctx, sprite, b, {
      padX: 14,
      overhangTop: 58,
      badgeText: '🏢 VIRTUAL OFFICE HQ',
      badgeBorder: '#10b981',
    });

    // Rak sepeda di sisi kiri gedung
    const br = VILLAGE_PROPS.officeBikeRack;
    drawBox(ctx, br.x, br.y, br.w, br.h, '#cbd5e1', '#475569', 1.5);
    [br.y + 10, br.y + 26].forEach((by, i) => {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(br.x + 6, by, 8, 5);
      ctx.fillRect(br.x + 32, by, 8, 5);
      ctx.fillStyle = i === 0 ? '#ec4899' : '#0ea5e9';
      ctx.fillRect(br.x + 12, by + 1, 22, 3);
    });
    return;
  }

  const roofH = 98;
  const wallY = b.y + roofH;
  const wallH = b.h - roofH;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.24)';
  ctx.fillRect(b.x + 12, b.y + 14, b.w, b.h);

  drawBox(ctx, b.x, wallY, b.w, wallH, '#f8fafc', '#2c221e', 2.5);
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(b.x + 3, wallY + wallH - 20, b.w - 6, 17);
  drawBox(ctx, b.x + 198, wallY + 8, 26, wallH - 12, '#b47643', '#5c3a21', 1.5);
  drawBox(ctx, b.x + b.w - 224, wallY + 8, 26, wallH - 12, '#b47643', '#5c3a21', 1.5);

  drawBox(ctx, b.x - 8, b.y, b.w + 16, roofH + 4, '#4338ca', '#1e1b4b', 2.5);
  ctx.fillStyle = '#312e81';
  ctx.fillRect(b.x - 6, b.y + roofH - 12, b.w + 12, 14);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(b.x, b.y + 6, b.w, 10);

  // Taman atap & panel surya
  drawBox(ctx, b.x + 18, b.y + 18, 126, 54, '#15803d', '#14532d', 1.8);
  ctx.fillStyle = '#4ade80';
  ctx.fillRect(b.x + 24, b.y + 24, 114, 42);
  drawBox(ctx, b.x + 32, b.y + 30, 42, 28, '#0f172a', '#94a3b8', 1.5);
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(b.x + 36, b.y + 34, 15, 20);
  ctx.fillRect(b.x + 55, b.y + 34, 15, 20);
  drawBush(ctx, b.x + 104, b.y + 44, true);

  [b.x + b.w - 152, b.x + b.w - 80].forEach((sx) => {
    drawBox(ctx, sx, b.y + 22, 60, 46, '#0f172a', '#94a3b8', 1.8);
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(sx + 4, b.y + 26, 24, 17);
    ctx.fillRect(sx + 32, b.y + 26, 24, 17);
    ctx.fillRect(sx + 4, b.y + 47, 24, 17);
    ctx.fillRect(sx + 32, b.y + 47, 24, 17);
  });

  const winCols = [b.x + 24, b.x + 108, b.x + b.w - 180, b.x + b.w - 96];
  [wallY + 20, wallY + 94].forEach((wy, rowIdx) => {
    winCols.forEach((wx) => {
      drawBox(ctx, wx, wy, 68, 48, rowIdx === 0 ? '#38bdf8' : '#7dd3fc', '#1e293b', 2);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(wx + 5, wy + 5, 26, 38);
      ctx.fillStyle = 'rgba(250, 204, 21, 0.25)';
      ctx.fillRect(wx + 36, wy + 12, 26, 30);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(wx + 33, wy, 2, 48);
    });
  });

  const d = b.door;
  drawBox(ctx, d.x - 18, d.y - 22, d.w + 36, 18, '#10b981', '#064e3b', 2);
  ctx.fillStyle = '#6ee7b7';
  ctx.fillRect(d.x - 14, d.y - 18, d.w + 28, 5);
  drawBox(ctx, d.x, d.y, d.w, d.h, '#0f172a', '#1e293b', 2);
  ctx.fillStyle = '#7dd3fc';
  ctx.fillRect(d.x + 5, d.y + 5, d.w / 2 - 7, d.h - 10);
  ctx.fillRect(d.x + d.w / 2 + 2, d.y + 5, d.w / 2 - 7, d.h - 10);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(d.x + d.w / 2 - 5, d.y + 24, 3, 9);
  ctx.fillRect(d.x + d.w / 2 + 2, d.y + 24, 3, 9);

  drawBox(ctx, d.x - 36, b.y + b.h - 14, 24, 18, '#9a5b32', '#2c221e', 1.5);
  drawBush(ctx, d.x - 24, b.y + b.h - 14, true);
  drawBox(ctx, d.x + d.w + 12, b.y + b.h - 14, 24, 18, '#9a5b32', '#2c221e', 1.5);
  drawBush(ctx, d.x + d.w + 24, b.y + b.h - 14, true);

  drawBox(ctx, d.x - 10, b.y + b.h, d.w + 20, 14, '#cbd5e1', '#475569', 1.5);
  drawBox(ctx, d.x + 8, b.y + b.h + 12, d.w - 16, 12, '#4f46e5', '#1e1b4b', 1.5);

  const signW = 242;
  const signX = b.x + (b.w - signW) / 2;
  drawBox(ctx, signX, b.y + 26, signW, 40, '#0f172a', '#818cf8', 2.5);
  ctx.fillStyle = '#10b981';
  ctx.fillRect(signX + 10, b.y + 39, 8, 14);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VIRTUAL OFFICE HQ', b.x + b.w / 2 + 6, b.y + 52);

  // Rak sepeda
  const br = VILLAGE_PROPS.officeBikeRack;
  drawBox(ctx, br.x, br.y, br.w, br.h, '#cbd5e1', '#475569', 1.5);
  [br.y + 10, br.y + 26].forEach((by, i) => {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(br.x + 6, by, 8, 5);
    ctx.fillRect(br.x + 32, by, 8, 5);
    ctx.fillStyle = i === 0 ? '#ec4899' : '#0ea5e9';
    ctx.fillRect(br.x + 12, by + 1, 22, 3);
  });
}

function drawCafeAndPatio(ctx, b) {
  const sprite = getVillageSprite('cafe');
  if (sprite) {
    drawSpriteBuilding(ctx, sprite, b, {
      padX: 12,
      overhangTop: 36,
      badgeText: '☕ KOPI SENJA',
      badgeBorder: '#fb923c',
    });
    VILLAGE_CAFE_TABLES.forEach((t) => {
      const cx = t.x + t.w / 2;
      const cy = t.y + t.h / 2;
      drawBox(ctx, t.x - 9, cy - 7, 9, 14, '#9a5b32', '#2c221e', 1.2);
      drawBox(ctx, t.x + t.w, cy - 7, 9, 14, '#9a5b32', '#2c221e', 1.2);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.arc(cx + 4, cy + 5, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = t.umbrella;
      ctx.beginPath();
      ctx.arc(cx, cy, 21, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fffbeb';
      for (let s = 0; s < 4; s++) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, 20, (s * Math.PI) / 2, (s * Math.PI) / 2 + Math.PI / 4);
        ctx.closePath();
        ctx.fill();
      }
      ctx.strokeStyle = '#2c221e';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(cx, cy, 21, 0, Math.PI * 2);
      ctx.stroke();
    });
    return;
  }

  const roofH = 76;
  const wallY = b.y + roofH;
  const wallH = b.h - roofH;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
  ctx.fillRect(b.x + 8, b.y + 10, b.w, b.h);
  drawBox(ctx, b.x, wallY, b.w, wallH, '#fef3c7', '#2c221e', 2.5);
  ctx.fillStyle = '#b45309';
  ctx.fillRect(b.x + 2, wallY, 8, wallH);
  ctx.fillRect(b.x + b.w - 10, wallY, 8, wallH);

  drawBox(ctx, b.x - 8, b.y, b.w + 16, roofH + 4, '#c2410c', '#431407', 2.5);
  ctx.fillStyle = '#9a3412';
  ctx.fillRect(b.x - 6, b.y + roofH - 12, b.w + 12, 14);

  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#ea580c' : '#fffbeb';
    ctx.fillRect(b.x + 12 + i * 32, wallY + 2, 32, 19);
  }
  ctx.strokeStyle = '#7c2d12';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(b.x + 12, wallY + 2, 256, 19);

  [b.x + 20, b.x + b.w - 82].forEach((wx) => {
    drawBox(ctx, wx, wallY + 36, 62, 46, '#fef08a', '#78350f', 2);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(wx + 5, wallY + 41, 52, 36);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(wx + 30, wallY + 36, 2, 46);
  });

  const d = b.door;
  drawBox(ctx, d.x, d.y, d.w, d.h, '#78350f', '#2c221e', 2);
  ctx.fillStyle = '#fde68a';
  ctx.fillRect(d.x + 8, d.y + 8, d.w - 16, 18);

  drawBox(ctx, b.x + 62, b.y + 20, 156, 30, '#431407', '#fb923c', 2);
  ctx.fillStyle = '#fffbeb';
  ctx.font = 'bold 13px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('☕ KOPI SENJA', b.x + b.w / 2, b.y + 40);

  VILLAGE_CAFE_TABLES.forEach((t) => {
    const cx = t.x + t.w / 2;
    const cy = t.y + t.h / 2;
    drawBox(ctx, t.x - 9, cy - 7, 9, 14, '#9a5b32', '#2c221e', 1.2);
    drawBox(ctx, t.x + t.w, cy - 7, 9, 14, '#9a5b32', '#2c221e', 1.2);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.arc(cx + 4, cy + 5, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = t.umbrella;
    ctx.beginPath();
    ctx.arc(cx, cy, 21, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fffbeb';
    for (let s = 0; s < 4; s++) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, 20, (s * Math.PI) / 2, (s * Math.PI) / 2 + Math.PI / 4);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = '#2c221e';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(cx, cy, 21, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawMakerHub(ctx, b) {
  const sprite = getVillageSprite('cowork');
  if (sprite) {
    drawSpriteBuilding(ctx, sprite, b, {
      padX: 12,
      overhangTop: 40,
      badgeText: '🛠️ MAKER HUB',
      badgeBorder: '#2dd4bf',
    });
    const my = VILLAGE_PROPS.makerYard;
    drawBox(ctx, my.x + 6, my.y + 6, 36, 30, '#b47643', '#5c3a21', 2);
    drawBox(ctx, my.x + 8, my.y + 46, 34, 18, '#2dd4bf', '#134e4a', 1.8);
    return;
  }

  const roofH = 82;
  const wallY = b.y + roofH;
  const wallH = b.h - roofH;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
  ctx.fillRect(b.x + 8, b.y + 10, b.w, b.h);
  drawBox(ctx, b.x, wallY, b.w, wallH, '#f0fdfa', '#134e4a', 2.5);
  ctx.fillStyle = '#b45309';
  ctx.fillRect(b.x + 3, wallY + wallH - 20, b.w - 6, 8);

  drawBox(ctx, b.x - 8, b.y, b.w + 16, roofH + 4, '#0f766e', '#134e4a', 2.5);
  ctx.fillStyle = '#115e59';
  ctx.fillRect(b.x - 6, b.y + roofH - 12, b.w + 12, 14);
  drawBox(ctx, b.x + 26, b.y + 18, 92, 34, '#99f6e4', '#134e4a', 2);

  [b.x + 22, b.x + b.w - 96].forEach((wx) => {
    drawBox(ctx, wx, wallY + 28, 74, 52, '#0f172a', '#134e4a', 2);
    ctx.fillStyle = '#5eead4';
    ctx.fillRect(wx + 5, wallY + 33, 64, 42);
  });

  const d = b.door;
  drawBox(ctx, d.x, d.y, d.w, d.h, '#1e293b', '#0f172a', 2);
  ctx.fillStyle = '#14b8a6';
  ctx.fillRect(d.x + 5, d.y + 6, d.w - 10, d.h - 10);

  drawBox(ctx, b.x + 146, b.y + 22, 148, 30, '#0f172a', '#2dd4bf', 2);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🛠️ MAKER HUB', b.x + 220, b.y + 42);

  const my = VILLAGE_PROPS.makerYard;
  drawBox(ctx, my.x + 6, my.y + 6, 36, 30, '#b47643', '#5c3a21', 2);
  drawBox(ctx, my.x + 8, my.y + 46, 34, 18, '#2dd4bf', '#134e4a', 1.8);
}

function drawStation(ctx, b) {
  // Peron kayu utara stasiun
  drawBox(ctx, b.x - 16, b.y - 24, b.w + 32, 24, '#cbd5e1', '#475569', 1.8);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(b.x - 12, b.y - 21, b.w + 24, 4);

  const sprite = getVillageSprite('station');
  if (sprite) {
    drawSpriteBuilding(ctx, sprite, b, {
      padX: 10,
      overhangTop: 28,
      badgeText: '🚋 STASIUN TREM DESA',
      badgeBorder: '#4ade80',
    });
    return;
  }

  const roofH = 74;
  const wallY = b.y + roofH;
  const wallH = b.h - roofH;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
  ctx.fillRect(b.x + 8, b.y + 10, b.w, b.h);
  drawBox(ctx, b.x, wallY, b.w, wallH, '#fefce8', '#14532d', 2.5);
  ctx.fillStyle = '#dcfce7';
  ctx.fillRect(b.x + 3, wallY + wallH - 18, b.w - 6, 15);

  drawBox(ctx, b.x - 10, b.y, b.w + 20, roofH + 4, '#15803d', '#14532d', 2.5);
  ctx.fillStyle = '#166534';
  ctx.fillRect(b.x - 8, b.y + roofH - 12, b.w + 16, 14);

  // Jam stasiun di menara mini tengah
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(b.x + 56, b.y + 36, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(b.x + 56, b.y + 36, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(b.x + 56, b.y + 36);
  ctx.lineTo(b.x + 56, b.y + 28);
  ctx.moveTo(b.x + 56, b.y + 36);
  ctx.lineTo(b.x + 63, b.y + 39);
  ctx.stroke();

  // Jendela loket & ruang tunggu
  [b.x + 28, b.x + 106, b.x + b.w - 156, b.x + b.w - 78].forEach((wx) => {
    drawBox(ctx, wx, wallY + 28, 56, 48, '#bae6fd', '#14532d', 2);
    ctx.fillStyle = '#fef9c3';
    ctx.fillRect(wx + 5, wallY + 33, 46, 38);
  });

  const d = b.door;
  drawBox(ctx, d.x, d.y, d.w, d.h, '#14532d', '#052e16', 2);
  ctx.fillStyle = '#bbf7d0';
  ctx.fillRect(d.x + 6, d.y + 6, d.w / 2 - 8, d.h - 10);
  ctx.fillRect(d.x + d.w / 2 + 2, d.y + 6, d.w / 2 - 8, d.h - 10);

  drawBox(ctx, b.x + 100, b.y + 20, 210, 32, '#052e16', '#4ade80', 2);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🚋 STASIUN TREM DESA', b.x + 205, b.y + 41);
}

function drawGalleryAndCourt(ctx, b) {
  const sprite = getVillageSprite('gallery');
  if (sprite) {
    drawSpriteBuilding(ctx, sprite, b, {
      padX: 12,
      overhangTop: 34,
      badgeText: '🎨 GALERI & STUDIO',
      badgeBorder: '#d8b4fe',
    });
  } else {
    const roofH = 78;
    const wallY = b.y + roofH;
    const wallH = b.h - roofH;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
    ctx.fillRect(b.x + 8, b.y + 10, b.w, b.h);
    drawBox(ctx, b.x, wallY, b.w, wallH, '#faf5ff', '#581c87', 2.5);
    // Mural warna-warni di dinding bawah galeri
    ['#f43f5e', '#f59e0b', '#10b981', '#0ea5e9', '#a855f7'].forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(b.x + 10 + i * 56, wallY + wallH - 18, 52, 12);
    });

    drawBox(ctx, b.x - 8, b.y, b.w + 16, roofH + 4, '#7e22ce', '#581c87', 2.5);
    drawBox(ctx, b.x + 30, b.y + 14, 72, 26, '#e9d5ff', '#581c87', 1.6);

    [b.x + 24, b.x + b.w - 92].forEach((wx) => {
      drawBox(ctx, wx, wallY + 24, 68, 54, '#f3e8ff', '#581c87', 2);
      // Bingkai lukisan di dalam jendela
      drawBox(ctx, wx + 8, wallY + 32, 22, 30, '#38bdf8', '#7c2d12', 1.5);
      drawBox(ctx, wx + 36, wallY + 36, 22, 26, '#fb7185', '#7c2d12', 1.5);
    });

    const d = b.door;
    drawBox(ctx, d.x, d.y, d.w, d.h, '#581c87', '#2e1065', 2);
    ctx.fillStyle = '#e9d5ff';
    ctx.fillRect(d.x + 7, d.y + 7, d.w - 14, 20);

    drawBox(ctx, b.x + 62, b.y + 42, 178, 28, '#2e1065', '#d8b4fe', 2);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px "Inter", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎨 GALERI & STUDIO', b.x + b.w / 2, b.y + 60.5);
  }

  // Lapangan Basket Mini di timur Galeri (walkable!)
  const courtSprite = getVillageSprite('basketball_court');
  if (courtSprite) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
    ctx.beginPath();
    ctx.roundRect(522, 772, 238, 220, 6);
    ctx.fill();
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    // Papan ring menjulur rapi ke atas lapangan, permukaan lapangan tetap selaras 520..756 x 768..986
    ctx.drawImage(courtSprite, 518, 720, 240, 268);
    ctx.restore();
  } else {
    drawBox(ctx, 520, 768, 236, 218, '#d97706', '#ffffff', 3);
    ctx.fillStyle = '#0d9488';
    ctx.fillRect(584, 774, 108, 92);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(584, 774, 108, 92);
    ctx.beginPath();
    ctx.arc(638, 866, 36, 0, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(638, 796, 86, 0.12 * Math.PI, 0.88 * Math.PI);
    ctx.stroke();
    // Ring & papan basket di atas lapangan
    const hp = VILLAGE_PROPS.basketballHoop;
    drawBox(ctx, hp.x, hp.y, hp.w, hp.h - 6, '#f8fafc', '#1e293b', 2);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(hp.x + hp.w / 2, hp.y + hp.h, 8, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawBookshopAndStall(ctx, b) {
  const sprite = getVillageSprite('bookshop');
  if (sprite) {
    drawSpriteBuilding(ctx, sprite, b, {
      padX: 12,
      overhangTop: 36,
      badgeText: '📚 TOKO BUKU & KIOS',
      badgeBorder: '#60a5fa',
    });
  } else {
    const roofH = 78;
    const wallY = b.y + roofH;
    const wallH = b.h - roofH;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
    ctx.fillRect(b.x + 8, b.y + 10, b.w, b.h);
    drawBox(ctx, b.x, wallY, b.w, wallH, '#eff6ff', '#1e3a8a', 2.5);
    drawBox(ctx, b.x - 8, b.y, b.w + 16, roofH + 4, '#1d4ed8', '#1e3a8a', 2.5);

    [b.x + 22, b.x + b.w - 86].forEach((wx) => {
      drawBox(ctx, wx, wallY + 26, 64, 52, '#fef9c3', '#1e3a8a', 2);
      const colors = ['#ef4444', '#f59e0b', '#10b981', '#6366f1', '#ec4899'];
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = colors[i % colors.length];
        ctx.fillRect(wx + 6 + i * 9, wallY + 42, 7, 16);
        ctx.fillStyle = colors[(i + 2) % colors.length];
        ctx.fillRect(wx + 6 + i * 9, wallY + 60, 7, 14);
      }
    });

    const d = b.door;
    drawBox(ctx, d.x, d.y, d.w, d.h, '#78350f', '#2c221e', 2);
    ctx.fillStyle = '#93c5fd';
    ctx.fillRect(d.x + 8, d.y + 8, d.w - 16, 18);

    drawBox(ctx, b.x + 50, b.y + 20, 190, 30, '#0f172a', '#60a5fa', 2);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px "Inter", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📚 TOKO BUKU & KIOS', b.x + b.w / 2, b.y + 40);
  }

  const ms = VILLAGE_PROPS.marketStall;
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(ms.x + 4, ms.y + 6, ms.w, ms.h);
  drawBox(ctx, ms.x, ms.y + 20, ms.w, ms.h - 20, '#8d5b3c', '#2c221e', 2);
  drawBox(ctx, ms.x + 8, ms.y + 26, 28, 30, '#c07d4b', '#5c3a21', 1.5);
  ctx.fillStyle = '#fb923c';
  ctx.fillRect(ms.x + 12, ms.y + 30, 8, 8);
  ctx.fillRect(ms.x + 22, ms.y + 32, 8, 8);
  drawBox(ctx, ms.x + 42, ms.y + 26, 28, 30, '#c07d4b', '#5c3a21', 1.5);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(ms.x + 46, ms.y + 30, 8, 8);
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(ms.x + 48, ms.y + 43, 12, 8);
  drawBox(ctx, ms.x + 76, ms.y + 26, 28, 30, '#c07d4b', '#5c3a21', 1.5);
  ctx.fillStyle = '#60a5fa';
  ctx.fillRect(ms.x + 80, ms.y + 30, 20, 6);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(ms.x + 80, ms.y + 38, 20, 6);
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#ef4444' : '#fffbeb';
    ctx.fillRect(ms.x - 4 + i * 20, ms.y, 20, 22);
  }
  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = 1.8;
  ctx.strokeRect(ms.x - 4, ms.y, 120, 22);
}

function drawWindmillAndWheat(ctx, b) {
  // 2 Ladang gandum keemasan di kiri & kanan Kincir Angin
  [VILLAGE_PROPS.wheatFieldWest, VILLAGE_PROPS.wheatFieldEast].forEach((wf) => {
    drawBox(ctx, wf.x, wf.y, wf.w, wf.h, '#d97706', '#92400e', 2.5);
    for (let ry = wf.y + 10; ry < wf.y + wf.h - 10; ry += 16) {
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(wf.x + 8, ry, wf.w - 16, 10);
      ctx.fillStyle = '#fde047';
      for (let gx = wf.x + 12; gx < wf.x + wf.w - 14; gx += 14) {
        ctx.fillRect(gx, ry + 2, 8, 5);
      }
    }
  });

  const sprite = getVillageSprite('windmill');
  if (sprite) {
    drawSpriteBuilding(ctx, sprite, b, {
      padX: 4,
      overhangTop: 48,
      badgeText: '🌾 KINCIR ANGIN',
      badgeBorder: '#fbbf24',
    });
    return;
  }

  // Menara Kincir Angin
  ctx.fillStyle = 'rgba(15, 23, 42, 0.24)';
  ctx.fillRect(b.x + 12, b.y + 14, b.w, b.h);
  drawBox(ctx, b.x + 20, b.y + 74, b.w - 40, b.h - 74, '#fef3c7', '#78350f', 2.5);
  // Dasar batu bata
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(b.x + 22, b.y + b.h - 46, b.w - 44, 44);
  // Atap kubah kerucut
  drawBox(ctx, b.x + 8, b.y, b.w - 16, 82, '#9a3412', '#431407', 2.5);
  ctx.fillStyle = '#7c2d12';
  ctx.fillRect(b.x + 10, b.y + 68, b.w - 20, 14);

  // Jendela bulat kincir
  ctx.fillStyle = '#bae6fd';
  ctx.beginPath();
  ctx.arc(b.x + b.w / 2, b.y + 132, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  const d = b.door;
  drawBox(ctx, d.x, d.y, d.w, d.h, '#78350f', '#2c221e', 2);

  drawBox(ctx, b.x + 36, b.y + 16, 168, 28, '#431407', '#fbbf24', 2);
  ctx.fillStyle = '#fef3c7';
  ctx.font = 'bold 13px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🌾 KINCIR ANGIN', b.x + b.w / 2, b.y + 34.5);
}

function drawGreenhouse(ctx, b) {
  const sprite = getVillageSprite('greenhouse');
  if (sprite) {
    drawSpriteBuilding(ctx, sprite, b, {
      padX: 12,
      overhangTop: 34,
      badgeText: '🌿 RUMAH KACA',
      badgeBorder: '#67e8f9',
    });
    return;
  }

  ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
  ctx.fillRect(b.x + 10, b.y + 12, b.w, b.h);

  // Dinding kaca bening dengan tanaman tropis & anggrek di dalam
  drawBox(ctx, b.x, b.y + 72, b.w, b.h - 72, '#cffafe', '#0369a1', 2.5);
  drawBox(ctx, b.x - 6, b.y, b.w + 12, 78, '#38bdf8', '#0369a1', 2.5);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(b.x, b.y + 8, b.w, 20);

  // Rangka baja kaca vertikal
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 2;
  for (let gx = b.x + 40; gx < b.x + b.w; gx += 48) {
    ctx.beginPath();
    ctx.moveTo(gx, b.y + 2);
    ctx.lineTo(gx, b.y + b.h - 2);
    ctx.stroke();
  }

  // Siluet tanaman hijau & bunga anggrek di balik kaca
  [b.x + 48, b.x + 114, b.x + 216, b.x + 272].forEach((px, i) => {
    drawBush(ctx, px, b.y + 126, i % 2 === 0);
  });

  const d = b.door;
  drawBox(ctx, d.x, d.y, d.w, d.h, '#0369a1', '#0f172a', 2);
  ctx.fillStyle = '#e0f2fe';
  ctx.fillRect(d.x + 6, d.y + 6, d.w - 12, d.h - 12);

  drawBox(ctx, b.x + 68, b.y + 22, 184, 28, '#0c4a6e', '#67e8f9', 2);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🌿 RUMAH KACA', b.x + b.w / 2, b.y + 40.5);
}

function drawVillaAndGarden(ctx, b) {
  const vg = VILLAGE_PROPS.villaGarden;
  const gardenSprite = getVillageSprite('villa_garden');
  if (gardenSprite) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';
    ctx.beginPath();
    ctx.roundRect(vg.x + 2, vg.y + 6, vg.w + 4, vg.h + 2, 6);
    ctx.fill();
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(gardenSprite, vg.x - 4, vg.y - 4, vg.w + 8, vg.h + 8);
    ctx.restore();
  } else {
    drawBox(ctx, vg.x, vg.y, vg.w, vg.h, '#91c978', '#f8fafc', 3);
    [vg.y + 18, vg.y + 68].forEach((ry, rowIdx) => {
      drawBox(ctx, vg.x + 12, ry, vg.w - 24, 34, '#7c5338', '#4a2e1b', 1.5);
      for (let i = 0; i < 3; i++) {
        const px = vg.x + 28 + i * 26;
        if (rowIdx === 0) {
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(px - 2, ry + 16, 4, 12);
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(px, ry + 12, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#713f12';
          ctx.beginPath();
          ctx.arc(px, ry + 12, 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.ellipse(px, ry + 18, 9, 7, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    });
  }

  const sprite = getVillageSprite('villa');
  if (sprite) {
    drawSpriteBuilding(ctx, sprite, b, {
      padX: 12,
      overhangTop: 36,
      badgeText: '🏡 VILLA MELATI',
      badgeBorder: '#fda4af',
    });
    return;
  }

  const roofH = 76;
  const wallY = b.y + roofH;
  const wallH = b.h - roofH;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
  ctx.fillRect(b.x + 8, b.y + 10, b.w, b.h);
  drawBox(ctx, b.x, wallY, b.w, wallH, '#fff1f2', '#4c0519', 2.5);
  drawBox(ctx, b.x - 8, b.y, b.w + 16, roofH + 4, '#be123c', '#4c0519', 2.5);
  drawBox(ctx, b.x + b.w - 54, b.y - 16, 26, 38, '#9a3412', '#2c221e', 2);

  [b.x + 24, b.x + b.w - 82].forEach((wx) => {
    drawBox(ctx, wx, wallY + 26, 56, 42, '#fef08a', '#78350f', 2);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(wx + 27, wallY + 26, 2, 42);
  });

  const d = b.door;
  drawBox(ctx, d.x, d.y, d.w, d.h, '#78350f', '#2c221e', 2);

  drawBox(ctx, b.x + 60, b.y + 20, 152, 28, '#4c0519', '#fda4af', 2);
  ctx.fillStyle = '#fff1f2';
  ctx.font = 'bold 13px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🏡 VILLA MELATI', b.x + b.w / 2, b.y + 39);
}

function drawHomestead(ctx, b) {
  // Kebun sayur rustic 16-bit di sebelah Rumah Pak RT (pagar kayu cedar, kol, wortel, peti panen & penyiram)
  const hg = VILLAGE_PROPS.homesteadGarden;
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';
  ctx.fillRect(hg.x + 3, hg.y + 5, hg.w, hg.h);

  // Rumput dasar kebun + tekstur helai rumput
  drawBox(ctx, hg.x, hg.y, hg.w, hg.h, '#6ab04c', '#3d2514', 2);
  ctx.fillStyle = '#55963c';
  for (let gx = hg.x + 10; gx < hg.x + hg.w - 10; gx += 18) {
    ctx.fillRect(gx, hg.y + 52, 3, 4);
    ctx.fillRect(gx + 4, hg.y + 54, 2, 3);
  }

  // 2 Bedengan tanah gembur dengan detail alur cangkul
  [hg.y + 15, hg.y + 60].forEach((ry, rowIdx) => {
    drawBox(ctx, hg.x + 12, ry, hg.w - 24, 32, '#6b4226', '#3b2110', 1.8);
    ctx.fillStyle = '#855333';
    ctx.fillRect(hg.x + 14, ry + 3, hg.w - 28, 6);
    ctx.fillStyle = '#57331b';
    ctx.fillRect(hg.x + 14, ry + 15, hg.w - 28, 3);
    ctx.fillRect(hg.x + 14, ry + 25, hg.w - 28, 3);

    for (let i = 0; i < 4; i++) {
      const px = hg.x + 24 + i * 22;
      if (rowIdx === 0) {
        // Kubis / kol hijau berlapis 16-bit
        ctx.fillStyle = '#14532d';
        ctx.beginPath();
        ctx.arc(px, ry + 17, 8.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(px, ry + 16, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#86efac';
        ctx.beginPath();
        ctx.arc(px - 1, ry + 14, 3.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#dcfce7';
        ctx.fillRect(px - 2, ry + 12, 2, 2);
      } else if (i < 3) {
        // Wortel oranye menyembul dengan daun berumbai
        ctx.fillStyle = '#15803d';
        ctx.fillRect(px - 4, ry + 7, 3, 7);
        ctx.fillRect(px, ry + 5, 3, 9);
        ctx.fillRect(px + 3, ry + 8, 3, 6);
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.ellipse(px + 1, ry + 18, 5.5, 6.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#7c2d12';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.fillStyle = '#fb923c';
        ctx.fillRect(px - 1, ry + 15, 3, 4);
      } else {
        // Peti kayu panen mini dengan tomat & wortel
        drawBox(ctx, px - 8, ry + 7, 18, 17, '#b47643', '#451a03', 1.4);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(px - 5, ry + 10, 5, 5);
        ctx.fillStyle = '#f97316';
        ctx.fillRect(px + 1, ry + 11, 5, 5);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(px - 2, ry + 16, 6, 4);
      }
    }
  });

  // Penyiram tanaman kaleng biru mungil di sudut kiri tengah
  drawBox(ctx, hg.x + 8, hg.y + 47, 10, 8, '#38bdf8', '#0c4a6e', 1.2);
  ctx.fillStyle = '#bae6fd';
  ctx.fillRect(hg.x + 10, hg.y + 49, 4, 2);

  // Pagar kayu cedar rustic dengan tiang-tiang berjarak rapi
  const drawCedarRail = (x, y, w, h) => {
    drawBox(ctx, x, y, w, h, '#9a5b32', '#3b2110', 1.4);
    ctx.fillStyle = '#c27e4b';
    ctx.fillRect(x + 1, y + 1, Math.max(1, w - 2), Math.min(2, h - 2));
  };
  drawCedarRail(hg.x - 2, hg.y - 2, hg.w + 4, 6);
  drawCedarRail(hg.x - 2, hg.y + hg.h - 4, hg.w + 4, 6);
  drawCedarRail(hg.x - 2, hg.y, 6, hg.h);
  drawCedarRail(hg.x + hg.w - 4, hg.y, 6, hg.h);
  for (let px = hg.x - 2; px <= hg.x + hg.w - 4; px += 28) {
    drawBox(ctx, px, hg.y - 5, 7, 10, '#b47643', '#3b2110', 1.3);
    drawBox(ctx, px, hg.y + hg.h - 6, 7, 10, '#b47643', '#3b2110', 1.3);
  }
  ctx.restore();

  const sprite = getVillageSprite('homestead');
  if (sprite) {
    drawSpriteBuilding(ctx, sprite, b, {
      padX: 12,
      overhangTop: 36,
      badgeText: '🏠 RUMAH PAK RT',
      badgeBorder: '#fcd34d',
    });
    return;
  }

  const roofH = 76;
  const wallY = b.y + roofH;
  const wallH = b.h - roofH;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
  ctx.fillRect(b.x + 8, b.y + 10, b.w, b.h);
  drawBox(ctx, b.x, wallY, b.w, wallH, '#fffbeb', '#78350f', 2.5);
  drawBox(ctx, b.x - 8, b.y, b.w + 16, roofH + 4, '#92400e', '#451a03', 2.5);

  [b.x + 24, b.x + b.w - 84].forEach((wx) => {
    drawBox(ctx, wx, wallY + 28, 60, 42, '#fef08a', '#78350f', 2);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(wx + 29, wallY + 28, 2, 42);
  });

  const d = b.door;
  drawBox(ctx, d.x, d.y, d.w, d.h, '#78350f', '#2c221e', 2);
  drawBox(ctx, b.x + 56, b.y + 20, 174, 28, '#451a03', '#fcd34d', 2);
  ctx.fillStyle = '#fffbeb';
  ctx.font = 'bold 13px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🏠 RUMAH PAK RT', b.x + b.w / 2, b.y + 39);
}

function drawFoodTruck(ctx, b) {
  const sprite = getVillageSprite('foodtruck');
  if (sprite) {
    drawSpriteBuilding(ctx, sprite, b, {
      padX: 10,
      overhangTop: 36,
      badgeText: '🍜 FOOD TRUCK DANAU',
      badgeBorder: '#facc15',
    });
    return;
  }

  ctx.fillStyle = 'rgba(15, 23, 42, 0.24)';
  ctx.fillRect(b.x + 10, b.y + 12, b.w, b.h);

  // Badan truk retro kuning-mint
  drawBox(ctx, b.x, b.y + 12, b.w - 42, b.h - 22, '#fef08a', '#854d0e', 2.5);
  drawBox(ctx, b.x + b.w - 46, b.y + 28, 46, b.h - 38, '#5eead4', '#0f766e', 2.5);
  // Kaca depan truk
  drawBox(ctx, b.x + b.w - 36, b.y + 36, 26, 30, '#bae6fd', '#0f172a', 1.8);
  // Roda
  [b.x + 36, b.x + b.w - 42].forEach((wx) => {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(wx, b.y + b.h - 8, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(wx, b.y + b.h - 8, 6, 0, Math.PI * 2);
    ctx.fill();
  });

  // Jendela layanan & kanopi bergaris
  drawBox(ctx, b.x + 26, b.y + 42, 134, 42, '#0f172a', '#78350f', 2);
  ctx.fillStyle = '#fde68a';
  ctx.fillRect(b.x + 30, b.y + 46, 126, 34);
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#f97316' : '#ffffff';
    ctx.fillRect(b.x + 20 + i * 24, b.y + 26, 24, 18);
  }
  ctx.strokeStyle = '#9a3412';
  ctx.lineWidth = 1.6;
  ctx.strokeRect(b.x + 20, b.y + 26, 144, 18);

  drawBox(ctx, b.x + 18, b.y - 6, 152, 24, '#0f172a', '#facc15', 1.8);
  ctx.fillStyle = '#fef9c3';
  ctx.font = 'bold 12px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🍜 FOOD TRUCK DANAU', b.x + 94, b.y + 10);
}

function drawLakeCreekPierAndBridges(ctx) {
  const lk = VILLAGE_LAKE;

  // 1. Tepi pantai pasir & kerikil pixel-art di sekitar danau & sungai
  ctx.fillStyle = '#b9a67c';
  ctx.beginPath();
  ctx.roundRect(lk.x - 18, lk.y - 18, lk.w + 36, lk.h + 36, 68);
  ctx.fill();
  ctx.fillRect(628, 1318, 1584, 80);

  ctx.fillStyle = '#dfd0ab';
  ctx.beginPath();
  ctx.roundRect(lk.x - 12, lk.y - 12, lk.w + 24, lk.h + 24, 62);
  ctx.fill();
  ctx.fillRect(634, 1324, 1572, 68);

  // Kerikil halus di tepian pasir danau
  ctx.fillStyle = '#c4b187';
  [
    [lk.x - 6, lk.y + 120],
    [lk.x + 140, lk.y - 8],
    [lk.x + 430, lk.y - 7],
    [lk.x + lk.w + 6, lk.y + 160],
    [lk.x + 220, lk.y + lk.h + 6],
    [lk.x + 480, lk.y + lk.h + 5],
  ].forEach(([px, py]) => {
    ctx.fillRect(px, py, 6, 4);
    ctx.fillRect(px + 9, py + 3, 4, 3);
  });

  // 2. Pola air 16-bit pixel-art berkilau (seamless 64x64 tile untuk danau & sungai)
  const waterTile = document.createElement('canvas');
  waterTile.width = 64;
  waterTile.height = 64;
  const wctx = waterTile.getContext('2d');
  wctx.fillStyle = '#1d9bf0';
  wctx.fillRect(0, 0, 64, 64);
  wctx.fillStyle = '#0ea5e9';
  for (let wy = 0; wy < 64; wy += 16) {
    wctx.fillRect(0, wy, 64, 8);
  }
  // Riak gelombang piksel lembut
  const waves = [
    [6, 10, 14, '#38bdf8'],
    [34, 18, 18, '#7dd3fc'],
    [14, 36, 16, '#7dd3fc'],
    [42, 46, 14, '#38bdf8'],
    [2, 54, 12, '#0284c7'],
    [28, 28, 14, '#0284c7'],
  ];
  waves.forEach(([wx, wy, ww, col]) => {
    wctx.fillStyle = col;
    wctx.fillRect(wx, wy, ww, 3);
    wctx.fillRect(wx + 3, wy - 2, ww - 6, 2);
  });
  // Kilau matahari piksel
  wctx.fillStyle = '#e0f2fe';
  wctx.fillRect(38, 17, 6, 2);
  wctx.fillRect(18, 35, 5, 2);

  const waterPattern = ctx.createPattern(waterTile, 'repeat');

  // Bentuk air danau & sungai dengan pinggiran air dangkal pirus
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(lk.x, lk.y, lk.w, lk.h, 54);
  ctx.rect(640, 1330, 1560, 56);
  ctx.fillStyle = waterPattern || '#0ea5e9';
  ctx.fill();

  // Garis tepi air dangkal berkilau + cekungan biru dalam di tengah danau
  ctx.clip();
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.55)';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.roundRect(lk.x + 2, lk.y + 2, lk.w - 4, lk.h - 4, 52);
  ctx.stroke();

  ctx.fillStyle = 'rgba(3, 105, 161, 0.28)';
  ctx.beginPath();
  ctx.roundRect(lk.x + 42, lk.y + 38, lk.w - 84, lk.h - 76, 42);
  ctx.fill();
  ctx.restore();

  // Garis tepi gelap pixel-art danau & sungai
  ctx.strokeStyle = '#075985';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.roundRect(lk.x, lk.y, lk.w, lk.h, 54);
  ctx.stroke();
  ctx.fillStyle = '#075985';
  ctx.fillRect(640, 1329, 322, 2.5);
  ctx.fillRect(640, 1385, 322, 2.5);
  ctx.fillRect(1578, 1329, 622, 2.5);
  ctx.fillRect(1578, 1385, 622, 2.5);

  // 3. Teratai berurat & bunga lotus mekar + alang-alang tepi air
  [
    { x: lk.x + 82, y: lk.y + 84, r: 16, flower: true },
    { x: lk.x + 148, y: lk.y + 272, r: 15, flower: false },
    { x: lk.x + 492, y: lk.y + 92, r: 17, flower: true },
    { x: lk.x + 528, y: lk.y + 258, r: 15, flower: true },
    { x: lk.x + 366, y: lk.y + 288, r: 13, flower: false },
    { x: lk.x + 112, y: lk.y + 106, r: 10, flower: false },
  ].forEach((lp) => {
    ctx.fillStyle = 'rgba(7, 89, 133, 0.35)';
    ctx.beginPath();
    ctx.arc(lp.x + 2, lp.y + 3, lp.r, 0.28, Math.PI * 2 - 0.28);
    ctx.lineTo(lp.x + 2, lp.y + 3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(lp.x, lp.y, lp.r, 0.28, Math.PI * 2 - 0.28);
    ctx.lineTo(lp.x, lp.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.arc(lp.x - 1, lp.y - 1, lp.r - 3, 0.4, Math.PI * 2 - 0.4);
    ctx.lineTo(lp.x - 1, lp.y - 1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    if (lp.flower) {
      ctx.fillStyle = '#ec4899';
      for (let p = 0; p < 5; p++) {
        const ang = (p * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.arc(lp.x - 2 + Math.cos(ang) * 4, lp.y - 2 + Math.sin(ang) * 4, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.arc(lp.x - 2, lp.y - 2, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(lp.x - 2, lp.y - 2, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Alang-alang / cattails di tepi danau
  [
    [lk.x + 28, lk.y + 38],
    [lk.x + lk.w - 30, lk.y + 42],
    [lk.x + 34, lk.y + lk.h - 28],
    [lk.x + lk.w - 36, lk.y + lk.h - 32],
  ].forEach(([rx, ry]) => {
    ctx.fillStyle = '#166534';
    ctx.fillRect(rx - 5, ry - 12, 2.5, 16);
    ctx.fillRect(rx, ry - 16, 2.5, 20);
    ctx.fillRect(rx + 5, ry - 10, 2.5, 14);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(rx - 1, ry - 18, 4.5, 8);
    ctx.fillRect(rx + 4, ry - 12, 4, 6);
  });

  // 4. DERMAGA KAYU 16-BIT WALKABLE menjorok ke tengah danau utara!
  const pr = VILLAGE_PIER;
  // Tiang pancang terendam air + cincin busa putih
  [
    [pr.x + 6, pr.y + pr.h - 2],
    [pr.x + pr.w - 16, pr.y + pr.h - 2],
    [pr.x + 6, pr.y + pr.h - 48],
    [pr.x + pr.w - 16, pr.y + pr.h - 48],
  ].forEach(([px, py]) => {
    ctx.fillStyle = 'rgba(224, 242, 254, 0.72)';
    ctx.beginPath();
    ctx.ellipse(px + 5, py + 12, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    drawBox(ctx, px, py, 10, 12, '#5c3a21', '#2c1d13', 1.4);
  });

  ctx.fillStyle = 'rgba(7, 89, 133, 0.34)';
  ctx.fillRect(pr.x + 6, pr.y + 8, pr.w, pr.h);
  drawBox(ctx, pr.x, pr.y, pr.w, pr.h, '#7c4826', '#2c1d13', 2.2);
  for (let py = pr.y + 5, idx = 0; py < pr.y + pr.h - 6; py += 11, idx++) {
    const col = idx % 3 === 0 ? '#be7e4c' : idx % 3 === 1 ? '#ad6c3c' : '#9c5d32';
    ctx.fillStyle = col;
    ctx.fillRect(pr.x + 4, py, pr.w - 8, 8);
    ctx.fillStyle = '#d69c6b';
    ctx.fillRect(pr.x + 5, py + 1, pr.w - 10, 2);
    // Paku besi di tepi papan dermaga
    ctx.fillStyle = '#334155';
    ctx.fillRect(pr.x + 8, py + 3, 2, 2);
    ctx.fillRect(pr.x + pr.w - 10, py + 3, 2, 2);
  }
  // Tiang tambat & gulungan tali di keempat sudut dermaga
  [
    [pr.x + 3, pr.y + pr.h - 14],
    [pr.x + pr.w - 15, pr.y + pr.h - 14],
    [pr.x + 3, pr.y + 4],
    [pr.x + pr.w - 15, pr.y + 4],
  ].forEach(([px, py]) => {
    drawBox(ctx, px, py, 12, 12, '#6c4328', '#2c1d13', 1.6);
    ctx.fillStyle = '#b98153';
    ctx.fillRect(px + 2, py + 2, 8, 4);
    ctx.fillStyle = '#e7d5a8';
    ctx.fillRect(px + 1, py + 7, 10, 2.5);
  });

  // 5. 2 JEMBATAN KAYU 16-BIT WALKABLE melintasi sungai barat & timur
  VILLAGE_BRIDGES.forEach((br) => {
    // Tumpuan batu di ujung utara & selatan jembatan agar menyatu dengan jalan cobblestone
    drawBox(ctx, br.x - 4, br.y - 6, br.w + 8, 10, '#94a3b8', '#334155', 1.8);
    drawBox(ctx, br.x - 4, br.y + br.h - 4, br.w + 8, 10, '#94a3b8', '#334155', 1.8);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(br.x, br.y - 4, br.w, 3);
    ctx.fillRect(br.x, br.y + br.h - 2, br.w, 3);

    // Bayangan jembatan di atas air sungai
    ctx.fillStyle = 'rgba(7, 89, 133, 0.36)';
    ctx.fillRect(br.x + 6, br.y + 8, br.w + 2, br.h - 6);

    // Dek papan kayu cedar bergaris & bertekstur paku
    drawBox(ctx, br.x, br.y, br.w, br.h, '#7c4826', '#2c1d13', 2.2);
    for (let py = br.y + 5, idx = 0; py < br.y + br.h - 5; py += 11, idx++) {
      const col = idx % 3 === 0 ? '#c98855' : idx % 3 === 1 ? '#b67542' : '#a46334';
      ctx.fillStyle = col;
      ctx.fillRect(br.x + 8, py, br.w - 16, 8);
      ctx.fillStyle = '#dfa574';
      ctx.fillRect(br.x + 10, py + 1, br.w - 20, 2);
      ctx.fillStyle = '#475569';
      ctx.fillRect(br.x + 11, py + 3, 2, 2);
      ctx.fillRect(br.x + br.w - 13, py + 3, 2, 2);
    }

    // Pegangan / pagar kayu 3D kokoh di sisi kiri & kanan jembatan + 4 tiang berukir
    [br.x - 5, br.x + br.w - 7].forEach((rx) => {
      drawBox(ctx, rx, br.y - 4, 12, br.h + 8, '#6c4328', '#2c1d13', 1.8);
      ctx.fillStyle = '#a46b3e';
      ctx.fillRect(rx + 2, br.y - 2, 5, br.h + 4);
      [br.y - 6, br.y + 28, br.y + 68, br.y + br.h - 6].forEach((postY) => {
        drawBox(ctx, rx - 1, postY, 14, 12, '#8d552e', '#2c1d13', 1.5);
        ctx.fillStyle = '#d49a6a';
        ctx.fillRect(rx + 1, postY + 2, 10, 4);
      });
    });
  });

  // Batu tepi danau
  drawRock(ctx, lk.x - 8, lk.y + 52, 24, 15);
  drawRock(ctx, lk.x + lk.w + 4, lk.y + 64, 24, 15);
  drawRock(ctx, lk.x + 90, lk.y + lk.h + 10, 22, 14);
  drawRock(ctx, 2196, 1330, 24, 14);
}

function drawCampfireArea(ctx) {
  const cf = VILLAGE_PROPS.campfire;
  const cx = cf.x + cf.w / 2;
  const cy = cf.y + cf.h / 2;

  // Area tanah hangat perkemahan
  ctx.fillStyle = '#c8b38a';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 134, 86, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d7c5a1';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 118, 72, 0, 0, Math.PI * 2);
  ctx.fill();

  // 4 Batang kayu duduk di sekeliling api unggun (dekor visual di luar collider tengah)
  drawBox(ctx, cx - 78, cy - 18, 18, 36, '#8d5b3c', '#3f2310', 1.6);
  drawBox(ctx, cx + 60, cy - 18, 18, 36, '#8d5b3c', '#3f2310', 1.6);
  drawBox(ctx, cx - 22, cy - 66, 44, 16, '#8d5b3c', '#3f2310', 1.6);
  drawBox(ctx, cx - 22, cy + 52, 44, 16, '#8d5b3c', '#3f2310', 1.6);

  // Lingkaran batu api unggun + kayu bakar
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI * 2) / 8;
    ctx.fillStyle = i % 2 === 0 ? '#64748b' : '#94a3b8';
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * 18, cy + Math.sin(a) * 16, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  ctx.fillStyle = '#5c3a21';
  ctx.fillRect(cx - 10, cy - 4, 20, 7);
  ctx.fillRect(cx - 4, cy - 9, 8, 18);
}

export function createVillageBackgroundBuffer() {
  const off = document.createElement('canvas');
  off.width = VILLAGE_W;
  off.height = VILLAGE_H;
  const ctx = off.getContext('2d');

  // 1. Padang rumput pixel-art asli (seamless tile) atau fallback organik
  const grassTile = getVillageSprite('grass_tile');
  if (grassTile) {
    const pattern = ctx.createPattern(grassTile, 'repeat');
    if (pattern) {
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, VILLAGE_W, VILLAGE_H);
    } else {
      ctx.fillStyle = '#84bd6b';
      ctx.fillRect(0, 0, VILLAGE_W, VILLAGE_H);
    }
  } else {
    ctx.fillStyle = '#84bd6b';
    ctx.fillRect(0, 0, VILLAGE_W, VILLAGE_H);

    [
      [420, 620, 340, 180, '#7bb463'],
      [1480, 940, 480, 220, '#7ab462'],
      [2520, 620, 360, 210, '#7eb766'],
      [2480, 1580, 420, 220, '#8dc674'],
      [520, 1620, 380, 200, '#79b260'],
      [1380, 1780, 520, 170, '#8ac371'],
    ].forEach(([mx, my, rx, ry, col]) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(mx, my, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#6ba354';
    for (let i = 0; i < 420; i++) {
      const gx = ((i * 251 + 43) % (VILLAGE_W - 80)) + 40;
      const gy = ((i * 173 + 150) % (VILLAGE_H - 190)) + 130;
      ctx.fillRect(gx, gy, 3, 6);
      ctx.fillRect(gx + 4, gy + 2, 3, 4);
    }
  }

  // 2. Rel Trem Wisata 16-bit di sisi paling utara (y: 44..102) + rongga gelap terowongan barat & timur
  ctx.fillStyle = '#6b655f';
  ctx.fillRect(52, 46, VILLAGE_W - 104, 56);
  ctx.fillStyle = '#857f78';
  ctx.fillRect(52, 48, VILLAGE_W - 104, 50);
  // Tekstur kerikil ballast rel
  for (let gx = 60; gx < VILLAGE_W - 60; gx += 18) {
    ctx.fillStyle = gx % 36 === 0 ? '#9c968e' : '#5e5852';
    ctx.fillRect(gx, 50, 4, 3);
    ctx.fillRect(gx + 7, 92, 4, 3);
  }
  // Bantalan kayu oak rel
  for (let rx = 58; rx < VILLAGE_W - 58; rx += 20) {
    drawBox(ctx, rx, 53, 8, 42, '#6b4226', '#2c1d13', 1.1);
    ctx.fillStyle = '#8c5a37';
    ctx.fillRect(rx + 2, 55, 3, 38);
  }
  // Dua rel baja berkilau
  ctx.fillStyle = '#475569';
  ctx.fillRect(52, 59, VILLAGE_W - 104, 6);
  ctx.fillRect(52, 83, VILLAGE_W - 104, 6);
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(52, 60, VILLAGE_W - 104, 2.5);
  ctx.fillRect(52, 84, VILLAGE_W - 104, 2.5);

  // Rongga gelap di belakang mulut terowongan barat & timur
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 32, 74, 78);
  ctx.fillRect(VILLAGE_W - 74, 32, 74, 78);

  // 3. Jaringan Jalan Paving Terpadu 4 Distrik (menyatu mulus tanpa tumpang tindih)
  drawUnifiedRoadNetwork(ctx);

  drawSteppingStones(ctx, [
    [1962, 956],
    [1962, 992],
    [1470, 1748],
    [1515, 1748],
  ]);

  // 4. Air Mancur Tengah, Papan Desa, Danau, Dermaga, Jembatan & Api Unggun
  const f = VILLAGE_FOUNTAIN;
  const fountainSprite = getVillageSprite('fountain');
  if (fountainSprite) {
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(f.x + f.w / 2 + 3, f.y + f.h / 2 + 8, f.w / 2 + 7, f.h / 2 + 3, 0, 0, Math.PI * 2);
    ctx.fill();
    const drawW = f.w + 18;
    const drawH = Math.round(drawW * (fountainSprite.naturalHeight / fountainSprite.naturalWidth));
    const drawX = Math.round(f.x + (f.w - drawW) / 2);
    const drawY = Math.round(f.y + f.h - drawH + 8);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(fountainSprite, drawX, drawY, drawW, drawH);
    ctx.restore();
  } else {
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(f.x + f.w / 2 + 3, f.y + f.h / 2 + 6, f.w / 2 + 4, f.h / 2 + 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.ellipse(f.x + f.w / 2, f.y + f.h / 2, f.w / 2, f.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(f.x + f.w / 2, f.y + f.h / 2, f.w / 2 - 9, f.h / 2 - 9, 0, 0, Math.PI * 2);
    ctx.fill();
    drawBox(ctx, f.x + f.w / 2 - 12, f.y + f.h / 2 - 14, 24, 24, '#e2e8f0', '#475569', 1.8);
  }

  drawNoticeBoard(ctx);
  drawLakeCreekPierAndBridges(ctx);
  drawCampfireArea(ctx);

  // 5. Bangku Taman & Lampu Jalan
  VILLAGE_BENCHES.forEach((b) => drawBench(ctx, b));
  [
    [1246, 514],
    [1734, 514],
    [1246, 728],
    [1734, 728],
    [736, 534],
    [2298, 534],
    [734, 1286],
    [1818, 1286],
    [1214, 1136],
    [1326, 1136],
    [864, 1648],
    [1490, 1666],
  ].forEach(([lx, ly]) => drawStreetLamp(ctx, lx, ly));

  // 6. Semak & Bunga
  [
    [1166, 446, true],
    [1808, 446, true],
    [472, 1006, false],
    [2442, 1006, true],
    [934, 1554, true],
    [1606, 1554, false],
  ].forEach(([bx, by, berries]) => drawBush(ctx, bx, by, berries));

  [
    [1184, 480, '#f472b6'],
    [1796, 480, '#60a5fa'],
    [526, 424, '#facc15'],
    [2442, 466, '#fb7185'],
    [1140, 1136, '#f472b6'],
    [1404, 1136, '#facc15'],
    [2410, 956, '#a78bfa'],
    [570, 1500, '#fb7185'],
  ].forEach(([fx, fy, c]) => drawFlowerPatch(ctx, fx, fy, c));

  // 7. Semua 11 Bangunan Unik di 4 Distrik
  VILLAGE_BUILDINGS.forEach((b) => {
    if (b.id === 'office_hq') drawOfficeHq(ctx, b);
    else if (b.id === 'cafe') drawCafeAndPatio(ctx, b);
    else if (b.id === 'cowork') drawMakerHub(ctx, b);
    else if (b.id === 'station') drawStation(ctx, b);
    else if (b.id === 'gallery') drawGalleryAndCourt(ctx, b);
    else if (b.id === 'bookshop') drawBookshopAndStall(ctx, b);
    else if (b.id === 'windmill') drawWindmillAndWheat(ctx, b);
    else if (b.id === 'greenhouse') drawGreenhouse(ctx, b);
    else if (b.id === 'villa') drawVillaAndGarden(ctx, b);
    else if (b.id === 'homestead') drawHomestead(ctx, b);
    else if (b.id === 'foodtruck') drawFoodTruck(ctx, b);
  });

  // 8. Pepohonan beragam (Oak, Pine, Sakura)
  VILLAGE_TREES.forEach((t) => drawTree(ctx, t.x, t.y, t.kind));

  // 9. Pagar kayu perimeter (berhenti rapi di bawah terowongan rel barat & timur)
  ctx.fillStyle = '#5c3d28';
  ctx.fillRect(88, 0, VILLAGE_W - 176, 18);
  ctx.fillRect(0, VILLAGE_H - 18, VILLAGE_W, 18);
  ctx.fillRect(0, 124, 18, VILLAGE_H - 124);
  ctx.fillRect(VILLAGE_W - 18, 124, 18, VILLAGE_H - 124);
  ctx.fillStyle = '#8d5b3c';
  for (let x = 96; x < VILLAGE_W - 96; x += 56) {
    ctx.fillRect(x, 4, 8, 14);
  }
  for (let x = 20; x < VILLAGE_W - 20; x += 56) {
    ctx.fillRect(x, VILLAGE_H - 18, 8, 14);
  }
  for (let y = 132; y < VILLAGE_H - 20; y += 56) {
    ctx.fillRect(4, y, 14, 8);
    ctx.fillRect(VILLAGE_W - 18, y, 14, 8);
  }

  return off;
}

export function drawVillagePet(ctx, pet, timeSec) {
  if (!pet) return;
  const isWalking = pet.state === 'WALKING';
  const bob = isWalking ? Math.abs(Math.sin(pet.walkPhase || 0)) * -2.5 : 0;
  const px = Math.round(pet.x);
  const py = Math.round(pet.y + bob);
  const facingLeft = pet.facing === 'left';
  const isDog = pet.species === 'dog';

  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(px, Math.round(pet.y) + 8, isDog ? 12 : 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  const wag = Math.sin(timeSec * (isWalking ? 12 : isDog ? 7 : 3.5)) * 4;
  ctx.strokeStyle = pet.accentColor || '#ea580c';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(facingLeft ? px + 8 : px - 8, py + 1);
  ctx.quadraticCurveTo(
    facingLeft ? px + 14 : px - 14,
    py - 6 + wag,
    facingLeft ? px + 11 : px - 11,
    py - 12 + wag
  );
  ctx.stroke();

  // Badan hewan
  drawBox(
    ctx,
    px - (isDog ? 9 : 8),
    py - 4,
    isDog ? 18 : 16,
    isDog ? 11 : 10,
    pet.bodyColor || '#fb923c',
    '#7c2d12',
    1.5
  );
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(px - 3, py - 2, 6, 6);

  // Kepala & telinga
  const hx = facingLeft ? px - 10 : px + 1;
  drawBox(ctx, hx, py - 12, 11, 10, pet.bodyColor || '#fb923c', '#7c2d12', 1.5);
  ctx.fillStyle = pet.accentColor || '#ea580c';
  ctx.fillRect(hx + 1, py - 15, 3, 4);
  ctx.fillRect(hx + 7, py - 15, 3, 4);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(hx + 2, py - 8, 2, 2);
  ctx.fillRect(hx + 7, py - 8, 2, 2);
  if (isDog) {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(hx + 4, py - 5, 3, 2);
  }

  if (pet.statusBubble) {
    ctx.font = '600 10px "Inter", system-ui, sans-serif';
    const bw = Math.max(44, ctx.measureText(pet.statusBubble).width + 14);
    const by = py - 38;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.strokeStyle = pet.accentColor || '#ea580c';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(px - bw / 2, by, bw, 19, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText(pet.statusBubble, px, by + 13);
  }
  ctx.restore();
}

export function drawVillageBoat(ctx, x, y, timeSec, isRowing = false, facing = 'right') {
  const bob = Math.sin(timeSec * (isRowing ? 5.5 : 2.1)) * (isRowing ? 1.8 : 2.6);
  const bx = Math.round(x);
  const by = Math.round(y + bob);

  ctx.save();
  // Riak air di sekeliling perahu
  if (isRowing) {
    const rPhase = (timeSec * 1.8) % 1;
    ctx.strokeStyle = `rgba(224, 242, 254, ${(1 - rPhase) * 0.7})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(bx, by + 5, 24 + rPhase * 22, 12 + rPhase * 12, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(3, 105, 161, 0.35)';
  ctx.beginPath();
  ctx.ellipse(bx + 2, by + 8, 32, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dayung bergerak saat mendayung
  const oarSwing = isRowing ? Math.sin(timeSec * 9) * 8 : 0;
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(bx - 6, by - 9);
  ctx.lineTo(bx - 12 + oarSwing, by - 22);
  ctx.moveTo(bx - 6, by + 9);
  ctx.lineTo(bx - 12 + oarSwing, by + 22);
  ctx.stroke();

  // Lambung perahu kayu
  ctx.fillStyle = '#9a5b32';
  ctx.beginPath();
  ctx.ellipse(bx, by, 30, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#3f2310';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Bagian dalam & papan duduk perahu
  ctx.fillStyle = '#b87647';
  ctx.beginPath();
  ctx.ellipse(bx, by, 23, 9.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d49a6a';
  ctx.fillRect(bx - 12, by - 8, 6, 16);
  ctx.fillRect(bx + 6, by - 8, 6, 16);
  if (facing === 'left' || facing === 'right') {
    ctx.fillStyle = '#facc15';
    ctx.fillRect(facing === 'right' ? bx + 22 : bx - 25, by - 2, 4, 4);
  }
  ctx.restore();
}

export function drawVillageDynamicOverlay(ctx, timeSec, dir, activityState = {}) {
  const {
    tramX: externalTramX = null,
    tramActive = false,
    boatActive = false,
    basketball = null,
  } = activityState;

  ctx.save();

  // 1. Trem Wisata Desa 16-bit (diklip rapi di mulut terowongan barat & timur agar tidak tembus map!)
  const tramX =
    typeof externalTramX === 'number'
      ? externalTramX
      : ((timeSec * VILLAGE_TRAM_CONFIG.speed) % VILLAGE_TRAM_CONFIG.loopSpan) -
        VILLAGE_TRAM_CONFIG.startOffset;
  const tramY = VILLAGE_TRAM_CONFIG.trackY;

  ctx.save();
  ctx.beginPath();
  ctx.rect(58, 0, VILLAGE_W - 116, 136);
  ctx.clip();

  // Bayangan trem di atas rel
  ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
  ctx.beginPath();
  ctx.roundRect(tramX + 4, tramY + 41, 174, 8, 4);
  ctx.fill();

  // Batang kopling besi penghubung antar gerbong
  drawBox(ctx, tramX + 78, tramY + 26, 12, 8, '#334155', '#0f172a', 1.4);

  // 2 Gerbong trem kayu klasik hijau zamrud & krem bergaya 16-bit
  [0, 88].forEach((offset, carIdx) => {
    const cx = tramX + offset;
    const isFront = carIdx === 1;

    // Roda bogie besi di bawah gerbong
    [14, 30, 52, 68].forEach((wx) => {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(cx + wx, tramY + 42, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(cx + wx, tramY + 42, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Rangka bawah gelap & bodi bawah hijau zamrud
    drawBox(ctx, cx, tramY + 2, 80, 39, '#15803d', '#052e16', 2);
    ctx.fillStyle = '#166534';
    ctx.fillRect(cx + 2, tramY + 33, 76, 6);
    // Garis emas vintage
    ctx.fillStyle = '#facc15';
    ctx.fillRect(cx + 2, tramY + 24, 76, 3);

    // Kabin atas krem hangat
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(cx + 3, tramY + 6, 74, 18);

    // Atap kayu clerestory melengkung + ventilasi kuningan
    drawBox(ctx, cx - 2, tramY - 3, 84, 9, '#78350f', '#2c1d13', 1.6);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(cx + 2, tramY - 1, 76, 3);
    drawBox(ctx, cx + 16, tramY - 7, 48, 5, '#92400e', '#2c1d13', 1.2);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(cx + 24, tramY - 9, 6, 3);
    ctx.fillRect(cx + 50, tramY - 9, 6, 3);

    // Pantograf kecil di atap gerbong depan
    if (isFront) {
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(cx + 34, tramY - 7);
      ctx.lineTo(cx + 40, tramY - 14);
      ctx.lineTo(cx + 46, tramY - 7);
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(cx + 32, tramY - 16, 16, 2.5);
    }

    // 3 Jendela berbingkai kayu + pantulan biru & cahaya hangat interior
    [7, 29, 51].forEach((wx) => {
      drawBox(ctx, cx + wx, tramY + 8, 18, 13, '#38bdf8', '#451a03', 1.4);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(cx + wx + 2, tramY + 13, 14, 6);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(cx + wx + 2, tramY + 9, 6, 4);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(cx + wx + 8.5, tramY + 8, 1.4, 13);
    });

    // Cowcatcher & lampu sorot kuningan di moncong gerbong depan
    if (isFront) {
      drawBox(ctx, cx + 79, tramY + 28, 7, 11, '#334155', '#0f172a', 1.3);
      drawBox(ctx, cx + 77, tramY + 20, 6, 8, '#facc15', '#78350f', 1.3);
      ctx.fillStyle = '#fef9c3';
      ctx.fillRect(cx + 79, tramY + 22, 3, 4);
    }

    if (tramActive && isFront) {
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(cx - 2, tramY - 4, 84, 47);
    }
  });

  // Kepulan uap putih lembut dari ventilasi gerbong depan
  for (let i = 0; i < 3; i++) {
    const sp = (timeSec * 1.4 + i * 0.33) % 1;
    ctx.fillStyle = `rgba(255, 255, 255, ${(1 - sp) * 0.55})`;
    ctx.beginPath();
    ctx.arc(tramX + 138 - sp * 26, tramY - 12 - sp * 14, 3 + sp * 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Label mungil di atas trem saat berada di area terbuka
  if (!tramActive && tramX > 50 && tramX < VILLAGE_W - 230) {
    const tLabel = '🚋 Klik Naik Trem';
    ctx.font = 'bold 10px "Inter", system-ui, sans-serif';
    const tlw = ctx.measureText(tLabel).width + 12;
    ctx.fillStyle = 'rgba(5, 46, 22, 0.9)';
    ctx.beginPath();
    ctx.roundRect(tramX + 84 - tlw / 2, tramY - 30, tlw, 17, 7);
    ctx.fill();
    ctx.fillStyle = '#bbf7d0';
    ctx.textAlign = 'center';
    ctx.fillText(tLabel, tramX + 84, tramY - 18);
  }
  ctx.restore();

  // 2. Tali lampu hias di Alun-Alun & Patio Kopi Senja
  [
    { x1: 1246, y1: 478, x2: 1734, y2: 478, sag: 26, bulbs: 10 },
    { x1: 986, y1: 222, x2: 1126, y2: 222, sag: 14, bulbs: 5 },
  ].forEach((s) => {
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(s.x1, s.y1);
    ctx.quadraticCurveTo((s.x1 + s.x2) / 2, s.y1 + s.sag, s.x2, s.y2);
    ctx.stroke();

    for (let i = 1; i <= s.bulbs; i++) {
      const t = i / (s.bulbs + 1);
      const bx = s.x1 + (s.x2 - s.x1) * t;
      const by = s.y1 + 4 * s.sag * t * (1 - t);
      const glow = 0.55 + 0.35 * Math.sin(timeSec * 3 + i * 0.9);
      ctx.fillStyle = `rgba(253, 224, 71, ${glow * 0.32})`;
      ctx.beginPath();
      ctx.arc(bx, by + 2, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = i % 2 === 0 ? '#fef08a' : '#fed7aa';
      ctx.beginPath();
      ctx.arc(bx, by + 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // 3. Bendera Virtual Office HQ berkibar
  if (OFFICE_HQ_BUILDING) {
    const poleX = OFFICE_HQ_BUILDING.x + OFFICE_HQ_BUILDING.w + 20;
    const poleY = OFFICE_HQ_BUILDING.y + OFFICE_HQ_BUILDING.h - 4;
    drawBox(ctx, poleX - 2, poleY - 52, 4, 52, '#cbd5e1', '#334155', 1.2);
    const wave = Math.sin(timeSec * 5.2) * 3.5;
    ctx.fillStyle = '#4f46e5';
    ctx.beginPath();
    ctx.moveTo(poleX + 2, poleY - 50);
    ctx.quadraticCurveTo(poleX + 18, poleY - 52 + wave, poleX + 34, poleY - 46 - wave * 0.6);
    ctx.lineTo(poleX + 34, poleY - 32 - wave * 0.6);
    ctx.quadraticCurveTo(poleX + 18, poleY - 38 + wave, poleX + 2, poleY - 36);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.fillRect(poleX + 8, poleY - 45 + wave * 0.3, 8, 6);
  }

  // 4. Kincir Angin Raksasa berputar di Distrik Timur!
  const wmX = 2610;
  const wmY = 238;
  ctx.save();
  ctx.translate(wmX, wmY);
  ctx.rotate(timeSec * 0.75);
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    drawBox(ctx, -4, -92, 8, 92, '#78350f', '#451a03', 1.5);
    drawBox(ctx, 4, -86, 22, 62, 'rgba(254, 249, 195, 0.92)', '#92400e', 1.4);
  }
  ctx.fillStyle = '#451a03';
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 5. Turbin angin mini di atap Maker Hub
  const hubX = 2192;
  const hubY = 210;
  drawBox(ctx, hubX - 2, hubY, 4, 24, '#e2e8f0', '#334155', 1.2);
  ctx.save();
  ctx.translate(hubX, hubY);
  ctx.rotate(timeSec * 2.4);
  for (let i = 0; i < 3; i++) {
    ctx.rotate((Math.PI * 2) / 3);
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#0f766e';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-3, -18);
    ctx.lineTo(3, -18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // 6. Asap cerobong Villa Melati, uap Kopi Senja, uap Food Truck
  for (let i = 0; i < 4; i++) {
    const phase = (timeSec * 0.45 + i * 0.25) % 1;
    ctx.fillStyle = `rgba(248, 250, 252, ${(1 - phase) * 0.55})`;
    ctx.beginPath();
    ctx.arc(2270 + Math.sin(timeSec * 1.6 + i) * 7 + phase * 12, 718 - phase * 44, 4 + phase * 8, 0, Math.PI * 2);
    ctx.fill();
    // Uap ramen Food Truck
    ctx.beginPath();
    ctx.arc(974 + Math.sin(timeSec * 2.2 + i) * 5, 1654 - phase * 26, 3 + phase * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  VILLAGE_CAFE_TABLES.forEach((t, idx) => {
    const phase = (timeSec * 1.1 + idx * 0.4) % 1;
    ctx.fillStyle = `rgba(255, 255, 255, ${(1 - phase) * 0.55})`;
    ctx.beginPath();
    ctx.arc(t.x + t.w / 2 + Math.sin(timeSec * 3 + idx) * 3, t.y - 4 - phase * 16, 2.5 + phase * 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // 7. Bola basket interaktif (memantul diam atau meluncur parabolik ke ring!)
  const court = VILLAGE_BASKETBALL_CONFIG.courtZone;
  const hoop = VILLAGE_BASKETBALL_CONFIG.hoopTarget;
  const isDirectorOnCourt =
    dir &&
    !dir.activity &&
    dir.x >= court.x &&
    dir.x <= court.x + court.w &&
    dir.y >= court.y &&
    dir.y <= court.y + court.h;

  if (basketball?.shot) {
    const sh = basketball.shot;
    const t = Math.min(1, Math.max(0, sh.progress));
    const bx = sh.sx + (hoop.x - sh.sx) * t;
    const groundY = sh.sy + (hoop.y - sh.sy) * t;
    const arc = Math.sin(t * Math.PI) * 96;
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(bx, groundY + 6, 7 - arc * 0.02, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(bx, groundY - arc, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7c2d12';
    ctx.lineWidth = 1.6;
    ctx.stroke();
  } else {
    const ballBounce = Math.abs(Math.sin(timeSec * 4.5)) * 11;
    const idleBallX = isDirectorOnCourt ? dir.x + 16 : 696;
    const idleBallY = isDirectorOnCourt ? dir.y + 4 : 862;
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath();
    ctx.ellipse(idleBallX, idleBallY, 7, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(idleBallX, idleBallY - 7 - ballBounce, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7c2d12';
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }

  // Flash ring basket saat masuk & papan skor mini
  if (basketball?.swishTimer > 0) {
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(hoop.x, hoop.y, 14 + (0.6 - basketball.swishTimer) * 18, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (isDirectorOnCourt || (basketball?.score || 0) > 0) {
    const scoreText = isDirectorOnCourt
      ? `🏀 Skor: ${basketball?.score || 0} • [E] / Klik Ring Lempar!`
      : `🏀 Skor Basket: ${basketball?.score || 0}`;
    ctx.font = 'bold 10px "Inter", system-ui, sans-serif';
    const sw = ctx.measureText(scoreText).width + 16;
    ctx.fillStyle = isDirectorOnCourt ? 'rgba(234, 88, 12, 0.94)' : 'rgba(15, 23, 42, 0.86)';
    ctx.beginPath();
    ctx.roundRect(hoop.x - sw / 2, court.y - 26, sw, 20, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(scoreText, hoop.x, court.y - 12.5);
  }

  // 8. Air Mancur Alun-Alun Tengah
  const fx = VILLAGE_FOUNTAIN.x + VILLAGE_FOUNTAIN.w / 2;
  const fy = VILLAGE_FOUNTAIN.y + VILLAGE_FOUNTAIN.h / 2;
  const ripple = (timeSec * 0.95) % 1;
  ctx.strokeStyle = `rgba(224, 242, 254, ${(1 - ripple) * 0.78})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(fx, fy, 12 + ripple * 26, 10 + ripple * 22, 0, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const phase = (timeSec * 2.2 + i * 0.2) % 1;
    const angle = (i * Math.PI * 2) / 5 + timeSec * 0.8;
    ctx.fillStyle = `rgba(224, 242, 254, ${1 - phase})`;
    ctx.beginPath();
    ctx.arc(fx + Math.cos(angle) * (6 + phase * 14), fy - 12 - Math.sin(phase * Math.PI) * 16 + phase * 11, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 9. Danau Besar: Perahu tertambat (jika belum dinaiki) + 3 Bebek + Sungai
  if (!boatActive) {
    const mp = VILLAGE_BOAT_CONFIG.mooredPos;
    drawVillageBoat(ctx, mp.x, mp.y, timeSec, false, 'right');
    // Tali tambat perahu ke dermaga
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(VILLAGE_PIER.x + VILLAGE_PIER.w - 4, VILLAGE_PIER.y + VILLAGE_PIER.h - 10);
    ctx.lineTo(mp.x - 26, mp.y + Math.sin(timeSec * 2.1) * 2.6);
    ctx.stroke();

    if (dir && !dir.activity) {
      const dp = VILLAGE_BOAT_CONFIG.dockPoint;
      const nearDock = Math.hypot(dir.x - dp.x, dir.y - dp.y) <= 92;
      const boatHint = nearDock ? '🚣 [E] / Klik Naik Perahu' : '🚣 Perahu Danau';
      ctx.font = 'bold 10px "Inter", system-ui, sans-serif';
      const bw = ctx.measureText(boatHint).width + 14;
      const by = mp.y - 34 + Math.sin(timeSec * 3.5) * 2;
      ctx.fillStyle = nearDock ? 'rgba(2, 132, 199, 0.94)' : 'rgba(15, 23, 42, 0.84)';
      ctx.beginPath();
      ctx.roundRect(mp.x - bw / 2, by, bw, 19, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(boatHint, mp.x, by + 13);
    }
  }

  const lk = VILLAGE_LAKE;
  [
    { cx: lk.x + 146, cy: lk.y + 186, rx: 62, ry: 34, sp: 0.45, off: 0 },
    { cx: lk.x + 432, cy: lk.y + 206, rx: 56, ry: 28, sp: -0.4, off: 1.8 },
    { cx: lk.x + 292, cy: lk.y + 258, rx: 48, ry: 24, sp: 0.52, off: 3.7 },
  ].forEach((dk) => {
    const ang = timeSec * dk.sp + dk.off;
    const dx = dk.cx + Math.cos(ang) * dk.rx;
    const dy = dk.cy + Math.sin(ang) * dk.ry;
    const dirX = -Math.sin(ang) * dk.sp >= 0 ? 1 : -1;
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.55)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(dx - dirX * 6, dy + 2, 8, 4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(dx, dy, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(dx + dirX * 5, dy - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(dx + dirX * 8, dy - 5, dirX * 4, 2.5);
  });

  // Aliran riak sungai
  VILLAGE_CREEK_SEGMENTS.forEach((seg, sIdx) => {
    for (let i = 0; i < 3; i++) {
      const flow = ((timeSec * 32 + i * 44 + sIdx * 18) % Math.max(24, seg.w - 18)) + seg.x + 6;
      ctx.fillStyle = 'rgba(224, 242, 254, 0.45)';
      ctx.fillRect(flow, seg.y + 16 + (i % 2) * 18, 14, 2.5);
    }
  });

  // 10. Api Unggun menyala hangat + percikan bara di Taman Piknik Selatan
  const cf = VILLAGE_PROPS.campfire;
  const cfx = cf.x + cf.w / 2;
  const cfy = cf.y + cf.h / 2;
  const firePulse = 0.8 + 0.2 * Math.sin(timeSec * 12);
  ctx.fillStyle = `rgba(251, 146, 60, ${0.22 * firePulse})`;
  ctx.beginPath();
  ctx.arc(cfx, cfy, 44 * firePulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(cfx - 11, cfy + 4);
  ctx.quadraticCurveTo(cfx, cfy - 22 * firePulse, cfx + 11, cfy + 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.moveTo(cfx - 6, cfy + 4);
  ctx.quadraticCurveTo(cfx, cfy - 13 * firePulse, cfx + 6, cfy + 4);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    const ep = (timeSec * 1.1 + i * 0.33) % 1;
    ctx.fillStyle = `rgba(253, 224, 71, ${1 - ep})`;
    ctx.fillRect(cfx + Math.sin(timeSec * 5 + i * 2) * 8, cfy - 12 - ep * 24, 2.5, 2.5);
  }

  // 11. Kupu-kupu, Kelopak Sakura, Awan & Burung
  [
    { cx: 1960, cy: 840, r: 34, sp: 1.5, col: '#facc15' },
    { cx: 2630, cy: 960, r: 30, sp: -1.6, col: '#38bdf8' },
    { cx: 1120, cy: 1140, r: 32, sp: 1.4, col: '#f472b6' },
    { cx: 560, cy: 230, r: 28, sp: -1.4, col: '#fde047' },
  ].forEach((bf, i) => {
    const bfx = bf.cx + Math.cos(timeSec * bf.sp + i) * bf.r;
    const bfy = bf.cy + Math.sin(timeSec * bf.sp * 1.6 + i) * 16;
    const wing = 2 + Math.abs(Math.sin(timeSec * 14 + i)) * 3;
    ctx.fillStyle = bf.col;
    ctx.fillRect(bfx - wing, bfy - 2, wing, 4);
    ctx.fillRect(bfx + 1, bfy - 2, wing, 4);
  });

  // Bayangan awan lembut & burung melintas
  const cloudX = ((timeSec * 18) % (VILLAGE_W + 520)) - 260;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.04)';
  ctx.beginPath();
  ctx.ellipse(cloudX, 540, 210, 70, -0.08, 0, Math.PI * 2);
  ctx.ellipse(cloudX + 640, 1280, 230, 74, 0.06, 0, Math.PI * 2);
  ctx.fill();

  const birdX = ((timeSec * 64) % (VILLAGE_W + 260)) - 130;
  const birdY = 340 + Math.sin(timeSec * 1.3) * 32;
  const flap = Math.sin(timeSec * 11) * 4;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.88)';
  ctx.lineWidth = 2;
  [0, -22, -40].forEach((offset, bi) => {
    const x = birdX + offset;
    const y = birdY + bi * 13;
    ctx.beginPath();
    ctx.moveTo(x - 7, y - flap);
    ctx.lineTo(x, y);
    ctx.lineTo(x + 7, y - flap);
    ctx.stroke();
  });

  // 12. Indikator Papan Pengumuman, Stasiun Trem, Kursi Terdekat & Pintu Masuk Office HQ
  if (dir && !dir.activity) {
    const nbSpot = VILLAGE_NOTICE_BOARD.visitSpot;
    const nearNb = Math.hypot(dir.x - nbSpot.x, dir.y - nbSpot.y) <= 88;
    const hint = nearNb ? '📌 [E] / Klik Buka Info Web & Fitur' : '📌 Papan Info Desa';
    ctx.font = 'bold 10px "Inter", system-ui, sans-serif';
    const nw = ctx.measureText(hint).width + 14;
    const ny = VILLAGE_NOTICE_BOARD.y - 26 + Math.sin(timeSec * 3.6) * 2;
    ctx.fillStyle = nearNb ? 'rgba(79, 70, 229, 0.94)' : 'rgba(15, 23, 42, 0.84)';
    ctx.beginPath();
    ctx.roundRect(nbSpot.x - nw / 2, ny, nw, 19, 8);
    ctx.fill();
    ctx.fillStyle = nearNb ? '#ffffff' : '#fef08a';
    ctx.textAlign = 'center';
    ctx.fillText(hint, nbSpot.x, ny + 13);

    // Indikator Stasiun Trem (selalu terlihat agar pemain langsung tahu bisa naik kereta!)
    const st = VILLAGE_TRAM_CONFIG.stationDropSpot;
    const sb = VILLAGE_TRAM_CONFIG.stationNearBox;
    const nearStation =
      dir.x >= sb.x && dir.x <= sb.x + sb.w && dir.y >= sb.y && dir.y <= sb.y + sb.h;
    const trHint = nearStation ? '🚋 [E] / Klik Naik Trem Sekarang!' : '🚋 Naik Trem Wisata';
    const tw = ctx.measureText(trHint).width + 16;
    const ty = 352 + Math.sin(timeSec * 3.8) * 2;
    ctx.fillStyle = nearStation ? 'rgba(21, 128, 61, 0.96)' : 'rgba(15, 23, 42, 0.86)';
    ctx.beginPath();
    ctx.roundRect(st.x - tw / 2, ty, tw, 20, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(trHint, st.x, ty + 13.5);

    // Indikator duduk di bangku / kursi terdekat
    const allSeats = [...VILLAGE_BENCHES, ...VILLAGE_EXTRA_SEATS];
    const nearSeat = allSeats.find(
      (s) => Math.hypot(dir.x - s.seatSpot.x, dir.y - s.seatSpot.y) <= 58
    );
    if (nearSeat) {
      const sHint = '🪑 [E] / Klik Duduk';
      const sw = ctx.measureText(sHint).width + 14;
      const sy = nearSeat.seatSpot.y - 30 + Math.sin(timeSec * 4) * 1.5;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.beginPath();
      ctx.roundRect(nearSeat.seatSpot.x - sw / 2, sy, sw, 18, 7);
      ctx.fill();
      ctx.fillStyle = '#f9a8d4';
      ctx.fillText(sHint, nearSeat.seatSpot.x, sy + 12.5);
    }
  }

  if (OFFICE_HQ_BUILDING && dir) {
    const entry = OFFICE_HQ_BUILDING.entrySpot;
    const d = OFFICE_HQ_BUILDING.door;
    const dist = Math.hypot(dir.x - entry.x, dir.y - entry.y);
    const isNear = dist <= 88;
    const pulse = 0.55 + 0.45 * Math.sin(timeSec * 4.5);

    ctx.strokeStyle = isNear ? '#10b981' : '#818cf8';
    ctx.lineWidth = isNear ? 3 : 2;
    ctx.globalAlpha = 0.45 + 0.45 * pulse;
    ctx.beginPath();
    ctx.roundRect(d.x - 4, d.y - 4, d.w + 8, d.h + 18, 8);
    ctx.stroke();

    const hint = isNear ? '🚪 [E] / Klik Masuk Office HQ' : '🏢 Masuk Virtual Office HQ';
    ctx.globalAlpha = 0.96;
    ctx.font = 'bold 11px "Inter", system-ui, sans-serif';
    const hw = ctx.measureText(hint).width + 18;
    const hy = d.y - 44 + Math.sin(timeSec * 3.5) * 2.5;
    ctx.fillStyle = isNear ? 'rgba(16, 185, 129, 0.94)' : 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    ctx.roundRect(entry.x - hw / 2, hy, hw, 22, 9);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(hint, entry.x, hy + 15);
  }

  ctx.restore();
}

function resolveCurrentDistrict(x, y) {
  let nearest = VILLAGE_DISTRICTS[0];
  let best = Infinity;
  VILLAGE_DISTRICTS.forEach((d) => {
    const dist = Math.hypot(x - d.x, y - d.y);
    if (dist < best) {
      best = dist;
      nearest = d;
    }
  });
  return nearest.name;
}

export function drawVillageMinimap(ctx, { dir, villagers, pets, cam, timeSec }) {
  const m = VILLAGE_MINIMAP_RECT;
  const sx = m.w / VILLAGE_W;
  const sy = m.h / VILLAGE_H;

  ctx.save();
  // Label distrik saat ini di atas minimap
  const districtName = dir ? resolveCurrentDistrict(dir.x, dir.y) : VILLAGE_NAME;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(m.x, m.y - 28, m.w, 22, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 11px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`🗺️ ${districtName}`, m.x + m.w / 2, m.y - 13);

  // Bingkai minimap
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.65)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(m.x - 4, m.y - 4, m.w + 8, m.h + 8, 10);
  ctx.fill();
  ctx.stroke();

  // Latar rumput minimap
  ctx.fillStyle = '#6da859';
  ctx.fillRect(m.x, m.y, m.w, m.h);

  // Jalan utama minimap (mengikuti VILLAGE_ROAD_SEGMENTS secara persis)
  ctx.fillStyle = '#dfd1b3';
  VILLAGE_ROAD_SEGMENTS.forEach((s) => {
    ctx.fillRect(m.x + s.x * sx, m.y + s.y * sy, Math.max(2, s.w * sx), Math.max(2, s.h * sy));
  });

  // Danau & Sungai di minimap
  ctx.fillStyle = '#0ea5e9';
  ctx.fillRect(m.x + VILLAGE_LAKE.x * sx, m.y + VILLAGE_LAKE.y * sy, VILLAGE_LAKE.w * sx, VILLAGE_LAKE.h * sy);
  ctx.fillRect(m.x + 640 * sx, m.y + 1330 * sy, 1560 * sx, 56 * sy);

  // Bangunan (Office HQ diberi highlight menyala)
  VILLAGE_BUILDINGS.forEach((b) => {
    ctx.fillStyle = b.enterable ? '#6366f1' : b.roofColor;
    ctx.fillRect(m.x + b.x * sx, m.y + b.y * sy, Math.max(5, b.w * sx), Math.max(4, b.h * sy));
    if (b.enterable) {
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(m.x + b.x * sx, m.y + b.y * sy, b.w * sx, b.h * sy);
    }
  });

  // Warga & Hewan di minimap
  (villagers || []).forEach((v) => {
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(m.x + v.x * sx - 1.5, m.y + v.y * sy - 1.5, 3, 3);
  });
  (pets || []).forEach((p) => {
    ctx.fillStyle = '#fb923c';
    ctx.fillRect(m.x + p.x * sx - 1.5, m.y + p.y * sy - 1.5, 3, 3);
  });

  // Kotak viewport kamera aktif
  if (cam) {
    const vw = (WORLD_W / (cam.zoom || 1)) * sx;
    const vh = (WORLD_H / (cam.zoom || 1)) * sy;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(m.x + cam.x * sx, m.y + cam.y * sy, vw, vh);
  }

  // Titik Director berkedip pink
  if (dir) {
    const pulse = 3.5 + Math.sin(timeSec * 6) * 1.2;
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.arc(m.x + dir.x * sx, m.y + dir.y * sy, pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  ctx.restore();
}

export function drawVillageAtmosphereLighting(ctx, timeMode, timeSec, tramX) {
  if (!timeMode || timeMode === 'day') return;

  ctx.save();
  if (timeMode === 'sunset') {
    // Cahaya keemasan senja hangat menyelimuti desa
    const grad = ctx.createLinearGradient(0, 0, VILLAGE_W, VILLAGE_H);
    grad.addColorStop(0, 'rgba(249, 115, 22, 0.22)');
    grad.addColorStop(0.55, 'rgba(234, 88, 12, 0.14)');
    grad.addColorStop(1, 'rgba(88, 28, 135, 0.24)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VILLAGE_W, VILLAGE_H);
  } else if (timeMode === 'night') {
    // Langit malam indigo yang hangat & nyaman
    ctx.fillStyle = 'rgba(15, 23, 56, 0.48)';
    ctx.fillRect(0, 0, VILLAGE_W, VILLAGE_H);
  }

  // Pendar cahaya lampu jalan, tali lampu, api unggun, gedung & lampu depan trem
  const intensity = timeMode === 'night' ? 1 : 0.55;
  ctx.globalCompositeOperation = 'lighter';

  const glowPoints = [
    // Lampu jalan
    [1246, 486, 95, '254, 240, 138'],
    [1734, 486, 95, '254, 240, 138'],
    [1246, 700, 95, '254, 240, 138'],
    [1734, 700, 95, '254, 240, 138'],
    [736, 506, 90, '254, 240, 138'],
    [2298, 506, 90, '254, 240, 138'],
    [734, 1258, 90, '254, 240, 138'],
    [1818, 1258, 90, '254, 240, 138'],
    [1214, 1108, 86, '254, 240, 138'],
    [1326, 1108, 86, '254, 240, 138'],
    [864, 1620, 90, '254, 240, 138'],
    [1490, 1638, 90, '254, 240, 138'],
    // Api unggun & pintu gedung utama
    [1653, 1749, 145 + Math.sin(timeSec * 8) * 10, '251, 146, 60'],
    [1490, 352, 135, '125, 211, 252'], // Office HQ
    [840, 336, 110, '253, 224, 71'], // Kopi Senja
    [2080, 350, 105, '94, 234, 212'], // Maker Hub
    [310, 318, 110, '253, 224, 71'], // Stasiun Trem
    [305, 1404, 105, '253, 224, 71'], // Toko Buku
    [1000, 1720, 115, '253, 224, 71'], // Food Truck
    // Lampu sorot depan Trem Wisata
    [(tramX ?? 200) + 178, VILLAGE_TRAM_CONFIG.trackY + 26, 115, '254, 240, 138'],
  ];

  glowPoints.forEach(([gx, gy, r, rgb]) => {
    const g = ctx.createRadialGradient(gx, gy, 4, gx, gy, r);
    g.addColorStop(0, `rgba(${rgb}, ${0.42 * intensity})`);
    g.addColorStop(0.5, `rgba(${rgb}, ${0.16 * intensity})`);
    g.addColorStop(1, `rgba(${rgb}, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(gx, gy, r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

export function drawVillageTramTunnels(ctx) {
  // Gambar portal terowongan batu & bukit rumput 16-bit di awal (Barat) & akhir (Timur) rel
  // Dirender di atas trem & Director agar kereta mulus keluar-masuk terowongan dan tidak tembus map!
  const drawPortal = (isEast) => {
    ctx.save();
    if (isEast) {
      ctx.translate(VILLAGE_W, 0);
      ctx.scale(-1, 1);
    }

    // Bukit rumput & tebing batu penutup tepi peta (x: 0..64, y: 0..124)
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 14, 66, 108);
    ctx.fillStyle = '#64748b';
    for (let by = 20; by < 114; by += 16) {
      ctx.fillRect(4, by, 26, 12);
      ctx.fillRect(34, by + 4, 24, 10);
    }

    // Struktur portal lengkung batu pahat (x: 52..88, y: 20..118)
    // Pilar batu atas (utara rel) & bawah (selatan rel)
    drawBox(ctx, 56, 20, 30, 26, '#94a3b8', '#1e293b', 2);
    drawBox(ctx, 56, 100, 30, 22, '#94a3b8', '#1e293b', 2);
    // Blok-blok batu lengkung & keystone
    drawBox(ctx, 58, 22, 12, 10, '#cbd5e1', '#334155', 1.2);
    drawBox(ctx, 72, 22, 12, 10, '#cbd5e1', '#334155', 1.2);
    drawBox(ctx, 60, 34, 24, 10, '#b6c2cf', '#334155', 1.2);
    drawBox(ctx, 58, 102, 13, 9, '#cbd5e1', '#334155', 1.2);
    drawBox(ctx, 72, 102, 12, 9, '#b6c2cf', '#334155', 1.2);
    drawBox(ctx, 60, 112, 24, 8, '#64748b', '#1e293b', 1.2);

    // Dinding penahan miring + lengkungan bibir terowongan di sisi depan
    drawBox(ctx, 48, 30, 16, 86, '#7b8794', '#1e293b', 2);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(50, 32, 4, 82);
    // Bayangan dalam di mulut terowongan (sepanjang x:62..72 di antara rel)
    ctx.fillStyle = 'rgba(9, 13, 22, 0.55)';
    ctx.fillRect(62, 44, 10, 58);

    // Hamparan bukit rumput hijau lebat di atas terowongan (menutup sempurna sisi atas & tepi peta)
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(86, 0);
    ctx.quadraticCurveTo(92, 20, 74, 26);
    ctx.lineTo(54, 34);
    ctx.lineTo(54, 116);
    ctx.quadraticCurveTo(44, 128, 0, 126);
    ctx.closePath();
    ctx.fill();

    // Lapisan rumput cerah & highlight di puncak bukit terowongan
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(78, 0);
    ctx.quadraticCurveTo(80, 14, 62, 20);
    ctx.lineTo(36, 26);
    ctx.lineTo(36, 112);
    ctx.quadraticCurveTo(22, 120, 0, 118);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(24, 34, 22, 0, Math.PI * 2);
    ctx.arc(26, 74, 20, 0, Math.PI * 2);
    ctx.arc(22, 104, 18, 0, Math.PI * 2);
    ctx.fill();

    // Aksen lumut & semak kecil di atas portal batu
    drawBush(ctx, 64, 16, false);
    drawBush(ctx, 32, 24, true);
    drawBush(ctx, 26, 116, false);

    // Rambu kuning mungil tanda terowongan kereta
    drawBox(ctx, 74, 105, 8, 8, '#facc15', '#422006', 1.2);

    ctx.restore();
  };

  drawPortal(false); // Terowongan Barat (awal rel)
  drawPortal(true);  // Terowongan Timur (akhir rel)
}

export function drawVillageActivityHud(ctx, dir) {
  if (!dir?.activity) return;
  let text = '';
  let accent = '#38bdf8';
  if (dir.activity === 'boat') {
    text = '🚣 Mendayung di Danau • WASD / Klik Air untuk Jalan • [E] / Klik Dermaga untuk Turun';
    accent = '#0ea5e9';
  } else if (dir.activity === 'tram') {
    text = '🚋 Naik Trem Wisata Desa • Nikmati Pemandangan • [E] / Klik / WASD untuk Turun di Stasiun';
    accent = '#10b981';
  } else if (dir.activity === 'sit') {
    text = '🪑 Duduk Santai • Tekan WASD / [E] / Klik Peta untuk Berdiri';
    accent = '#ec4899';
  }
  if (!text) return;

  ctx.save();
  ctx.font = 'bold 13px "Inter", system-ui, sans-serif';
  const w = ctx.measureText(text).width + 32;
  const x = (WORLD_W - w) / 2;
  const y = 20;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, 34, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(text, WORLD_W / 2, y + 21.5);
  ctx.restore();
}
