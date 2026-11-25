import React, { useEffect, useRef } from 'react';
import {
  WORLD_W,
  WORLD_H,
  OFFICE_ROOMS,
  OFFICE_COLLIDERS,
  WAYPOINTS,
  AMBIENT_STAFF,
  AMBIENT_ACTIVITIES,
} from '../constants/officeConfig';
import { buildOfficePath } from '../utils/pathfinding';
import { playRetroTone, unlockAudio } from '../utils/audio';

const AMBIENT_GREETINGS = [
  'Halo Bos! 👋',
  'Lagi fokus nih 💻',
  'Aman terkendali! 👍',
  'Semangat kerja! ☕',
  'Bentar lagi beres ✨',
  'Kopi dulu Bos? ☕',
];

function createAmbientEntities() {
  return AMBIENT_STAFF.map((staff, idx) => {
    const startAtActivity = staff.initialMode === 'ACTIVITY';
    const act = AMBIENT_ACTIVITIES[idx % AMBIENT_ACTIVITIES.length];
    const startPos = startAtActivity ? act.spot : staff.deskSpot;

    return {
      ...staff,
      isAmbient: true,
      x: startPos.x,
      y: startPos.y,
      facing: startAtActivity ? act.facing : staff.deskFacing,
      state: startAtActivity ? 'ACTIVITY' : 'SITTING_DESK',
      statusBubble: startAtActivity ? act.bubble : '',
      bubbleClearTimer: startAtActivity ? 3 + (idx % 3) : 0,
      stateTimer: startAtActivity ? 7 + Math.random() * 6 : 12 + Math.random() * 14,
      workBubbleTimer: 5 + Math.random() * 9,
      pathQueue: [],
      pendingState: null,
      pendingFacing: 'down',
      pendingBubble: '',
      walkPhase: Math.random() * 6,
      hitTimer: 0,
    };
  });
}

// Cek apakah area kaki karakter (hitbox 18x12 di sekitar kaki) menabrak objek
function isPositionBlocked(x, y) {
  const footBox = { x: x - 9, y: y + 4, w: 18, h: 12 };
  return OFFICE_COLLIDERS.some(
    (box) =>
      footBox.x < box.x + box.w &&
      footBox.x + footBox.w > box.x &&
      footBox.y < box.y + box.h &&
      footBox.y + footBox.h > box.y
  );
}

function resolveFacing(dx, dy, fallback = 'down') {
  if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return fallback;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

function drawPixelBox(ctx, x, y, w, h, fill, stroke = '#2c221e', lineWidth = 2) {
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

function drawPixelPlant(ctx, x, y) {
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.beginPath();
  ctx.ellipse(x, y + 14, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  drawPixelBox(ctx, x - 9, y + 2, 18, 14, '#c26d4a', '#2c221e', 2);
  drawPixelBox(ctx, x - 11, y, 22, 5, '#d9825b', '#2c221e', 2);

  const leaves = [
    { dx: 0, dy: -12, r: 9, c: '#3d8b40' },
    { dx: -8, dy: -6, r: 7, c: '#4caf50' },
    { dx: 8, dy: -6, r: 7, c: '#2e7d32' },
    { dx: 0, dy: -16, r: 6, c: '#66bb6a' },
  ];
  leaves.forEach((l) => {
    ctx.fillStyle = l.c;
    ctx.beginPath();
    ctx.arc(x + l.dx, y + l.dy, l.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1b4332';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}

function drawRug(ctx, x, y, w, h, mainColor, borderColor, accentColor = null) {
  drawPixelBox(ctx, x, y, w, h, borderColor, 'rgba(30, 41, 59, 0.35)', 1.5);
  ctx.fillStyle = mainColor;
  ctx.fillRect(x + 5, y + 5, w - 10, h - 10);
  if (accentColor) {
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 9.5, y + 9.5, w - 19, h - 19);
  }
}

function drawSofa(ctx, x, y, w, h, baseColor, cushionColor, orient = 'down') {
  // Bayangan lembut di lantai
  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  ctx.fillRect(x + 3, y + 4, w, h);

  drawPixelBox(ctx, x, y, w, h, baseColor, '#2c221e', 2);

  if (orient === 'down' || orient === 'up') {
    const backH = 11;
    const backY = orient === 'down' ? y + 2 : y + h - backH - 2;
    const seatY = orient === 'down' ? y + backH + 1 : y + 3;
    const seatH = h - backH - 5;

    // Sandaran & lengan sofa
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(x + 2, backY, w - 4, backH);
    drawPixelBox(ctx, x + 2, y + 2, 10, h - 4, baseColor, '#2c221e', 1.5);
    drawPixelBox(ctx, x + w - 12, y + 2, 10, h - 4, baseColor, '#2c221e', 1.5);

    // Bantalan dudukan (2–3 segmen)
    const innerW = w - 26;
    const segs = innerW > 70 ? 3 : 2;
    const segW = innerW / segs;
    for (let i = 0; i < segs; i++) {
      drawPixelBox(ctx, x + 13 + i * segW, seatY, segW - 1, seatH, cushionColor, 'rgba(44,34,30,0.5)', 1);
    }
    // Bantal aksen kecil
    drawPixelBox(ctx, x + 15, seatY + 3, 12, 10, '#fef9c3', '#713f12', 1);
  } else {
    // Orientasi 'right' atau 'left' (sofa vertikal)
    const backW = 11;
    const backX = orient === 'right' ? x + 2 : x + w - backW - 2;
    const seatX = orient === 'right' ? x + backW + 1 : x + 3;
    const seatW = w - backW - 5;

    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(backX, y + 2, backW, h - 4);
    drawPixelBox(ctx, x + 2, y + 2, w - 4, 10, baseColor, '#2c221e', 1.5);
    drawPixelBox(ctx, x + 2, y + h - 12, w - 4, 10, baseColor, '#2c221e', 1.5);

    const innerH = h - 26;
    const segs = innerH > 72 ? 3 : 2;
    const segH = innerH / segs;
    for (let i = 0; i < segs; i++) {
      drawPixelBox(ctx, seatX, y + 13 + i * segH, seatW, segH - 1, cushionColor, 'rgba(44,34,30,0.5)', 1);
    }
    // Bantal aksen
    drawPixelBox(ctx, seatX + 3, y + 16, 10, 12, '#fef08a', '#854d0e', 1);
  }
}

function drawWallClock(ctx, x, y) {
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(x, y, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 4.5);
  ctx.moveTo(x, y);
  ctx.lineTo(x + 3.5, y + 1.5);
  ctx.stroke();
}

function drawWorkstation(ctx, x, y, screenColor = '#38bdf8', facing = 'down') {
  // Bayangan meja
  ctx.fillStyle = 'rgba(0,0,0,0.13)';
  ctx.fillRect(x + 3, y + 4, 96, 46);

  // Permukaan meja kayu dengan aksen bevel
  drawPixelBox(ctx, x, y, 96, 46, '#c88a55', '#2c221e', 2);
  ctx.fillStyle = '#dda673';
  ctx.fillRect(x + 3, y + 3, 90, 9);
  ctx.fillStyle = '#b47643';
  ctx.fillRect(x + 3, y + 40, 90, 3);

  // Dudukan monitor + monitor layar lebar
  ctx.fillStyle = '#475569';
  ctx.fillRect(x + 43, y + 26, 10, 4);
  drawPixelBox(ctx, x + 26, y + 5, 44, 22, '#1e293b', '#0f172a', 2);
  ctx.fillStyle = screenColor;
  ctx.fillRect(x + 29, y + 8, 38, 16);
  // Highlight kaca & baris kode halus
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(x + 29, y + 8, 38, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillRect(x + 32, y + 12, 18, 2);
  ctx.fillRect(x + 32, y + 16, 26, 2);
  ctx.fillRect(x + 32, y + 20, 14, 2);

  // Keyboard & mousepad + mouse
  drawPixelBox(ctx, x + 30, y + 31, 32, 9, '#e2e8f0', '#475569', 1.5);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(x + 33, y + 33, 26, 2);
  ctx.fillRect(x + 33, y + 36, 22, 2);
  ctx.fillStyle = '#334155';
  ctx.fillRect(x + 65, y + 30, 14, 12); // Mousepad
  drawPixelBox(ctx, x + 68, y + 32, 7, 8, '#f1f5f9', '#475569', 1.2);

  // Buku catatan + sticky note + cangkir mini di samping meja
  drawPixelBox(ctx, x + 7, y + 13, 15, 19, '#fef9c3', '#713f12', 1.5);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(x + 10, y + 18, 9, 1.5);
  ctx.fillRect(x + 10, y + 22, 7, 1.5);
  ctx.fillRect(x + 10, y + 26, 8, 1.5);
  drawPixelBox(ctx, x + 79, y + 11, 10, 10, '#f8fafc', '#475569', 1.2);
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x + 81, y + 13, 6, 6);

  // Kursi ergonomis dengan sandaran & pegangan tangan
  const chairY = facing === 'down' ? y - 17 : y + 48;
  drawPixelBox(ctx, x + 34, chairY, 28, 15, '#475569', '#1e293b', 2);
  ctx.fillStyle = '#64748b';
  ctx.fillRect(x + 37, chairY + (facing === 'down' ? 2 : 9), 22, 4);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x + 32, chairY + 3, 3, 9);
  ctx.fillRect(x + 61, chairY + 3, 3, 9);
}

function drawActiveMonitorOverlay(ctx, npc, timeSec) {
  const d = npc?.deskRect;
  if (!d) return;
  const pulse = 0.55 + 0.45 * Math.sin(timeSec * 8);

  // Cahaya halo lembut di sekitar monitor aktif
  ctx.save();
  ctx.fillStyle = npc.accentHex || '#38bdf8';
  ctx.globalAlpha = 0.18 * pulse;
  ctx.fillRect(d.x + 24, d.y + 2, 48, 30);

  // Layar aktif dengan animasi baris kode mengetik
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(d.x + 31, d.y + 9, 34, 15);

  const codeColor = npc.accentLight || '#6ee7b7';
  const line1W = 10 + Math.round(((Math.sin(timeSec * 6) + 1) / 2) * 16);
  const line2W = 8 + Math.round(((Math.cos(timeSec * 7.5) + 1) / 2) * 18);
  const line3W = 6 + Math.round(((Math.sin(timeSec * 9 + 1) + 1) / 2) * 14);

  ctx.fillStyle = codeColor;
  ctx.fillRect(d.x + 33, d.y + 11, line1W, 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(d.x + 33, d.y + 15, line2W, 2);
  ctx.fillStyle = codeColor;
  ctx.fillRect(d.x + 33, d.y + 19, line3W, 2);

  // Kursor berkedip
  if (Math.floor(timeSec * 4) % 2 === 0) {
    ctx.fillStyle = '#facc15';
    ctx.fillRect(d.x + 34 + line3W, d.y + 19, 3, 2);
  }
  ctx.restore();
}

function drawBookshelf(ctx, x, y, w = 72) {
  drawPixelBox(ctx, x, y, w, 44, '#8d5b3c', '#2c221e', 2);
  const bookColors = ['#ef4444', '#3b82f6', '#eab308', '#10b981', '#a855f7'];
  for (let row = 0; row < 2; row++) {
    const ry = y + 5 + row * 19;
    ctx.fillStyle = '#4a2e1b';
    ctx.fillRect(x + 4, ry, w - 8, 15);
    for (let bx = x + 6; bx < x + w - 12; bx += 7) {
      ctx.fillStyle = bookColors[(bx + row) % bookColors.length];
      ctx.fillRect(bx, ry + 2, 5, 12);
    }
  }
}

function createOfficeBackgroundBuffer() {
  const off = document.createElement('canvas');
  off.width = WORLD_W;
  off.height = WORLD_H;
  const ctx = off.getContext('2d');

  const tileSize = 32;
  for (let y = 0; y < WORLD_H; y += tileSize) {
    for (let x = 0; x < WORLD_W; x += tileSize) {
      const isAlt = ((x / tileSize + y / tileSize) | 0) % 2 === 0;
      ctx.fillStyle = isAlt ? '#f4ead5' : '#ede0c6';
      ctx.fillRect(x, y, tileSize, tileSize);
      ctx.strokeStyle = 'rgba(139, 115, 85, 0.14)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, tileSize, tileSize);
    }
  }

  OFFICE_ROOMS.forEach((room) => {
    for (let y = room.y; y < room.y + room.h; y += tileSize) {
      for (let x = room.x; x < room.x + room.w; x += tileSize) {
        const isAlt = ((x / tileSize + y / tileSize) | 0) % 2 === 0;
        ctx.fillStyle = isAlt ? room.floorColor : room.tileAlt;
        ctx.fillRect(
          x,
          y,
          Math.min(tileSize, room.x + room.w - x),
          Math.min(tileSize, room.y + room.h - y)
        );
      }
    }

    if (room.door) {
      ctx.strokeStyle = '#3b2d38';
      ctx.lineWidth = 10;
      ctx.strokeRect(room.x, room.y, room.w, room.h);
      ctx.strokeStyle = '#7c6576';
      ctx.lineWidth = 4;
      ctx.strokeRect(room.x, room.y, room.w, room.h);

      ctx.fillStyle = '#f4ead5';
      if (room.door.side === 'bottom') {
        ctx.fillRect(room.door.x, room.y + room.h - 8, room.door.w, 16);
      } else if (room.door.side === 'top') {
        ctx.fillRect(room.door.x, room.y - 8, room.door.w, 16);
      } else if (room.door.side === 'right') {
        ctx.fillRect(room.x + room.w - 8, room.door.y, 16, room.door.h);
      }
    }
  });

  ctx.strokeStyle = '#261e24';
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, WORLD_W - 14, WORLD_H - 14);

  // Efek cahaya matahari lembut masuk dari jendela atas
  [390, 500, 610, 780, 880].forEach((wx) => {
    drawPixelBox(ctx, wx, 6, 76, 18, '#bae6fd', '#2c221e', 2);
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(wx + 6, 9, 28, 10);
    ctx.fillRect(wx + 42, 9, 28, 10);
    ctx.fillStyle = 'rgba(254, 249, 195, 0.14)';
    ctx.beginPath();
    ctx.moveTo(wx + 4, 24);
    ctx.lineTo(wx + 72, 24);
    ctx.lineTo(wx + 92, 74);
    ctx.lineTo(wx - 10, 74);
    ctx.closePath();
    ctx.fill();
  });

  // === RUANG MEETING & DIRECTOR ===
  drawRug(ctx, 56, 86, 228, 206, '#e2d3c1', '#b59a7d', 'rgba(99,102,241,0.28)');
  drawWallClock(ctx, 290, 54);
  // Whiteboard dengan grafik roadmap & sticky notes
  drawPixelBox(ctx, 90, 40, 162, 28, '#f8fafc', '#334155', 2);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(94, 65, 154, 3); // Tray spidol
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(102, 46, 16, 12);
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(122, 46, 16, 12);
  ctx.fillStyle = '#10b981';
  ctx.fillRect(142, 46, 16, 12);
  // Mini bar chart di sisi kanan whiteboard
  ctx.fillStyle = '#6366f1';
  ctx.fillRect(176, 54, 8, 8);
  ctx.fillRect(188, 50, 8, 12);
  ctx.fillRect(200, 45, 8, 17);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(216, 48, 24, 3);
  ctx.fillStyle = '#64748b';
  ctx.fillRect(216, 54, 18, 2);
  ctx.fillRect(216, 59, 22, 2);

  // Meja rapat kayu solid + bayangan + laptop + berkas + cangkir
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.fillRect(109, 120, 130, 145);
  drawPixelBox(ctx, 105, 115, 130, 145, '#b87a4b', '#2c221e', 2.5);
  ctx.fillStyle = '#ca8d5d';
  ctx.fillRect(111, 121, 118, 133);
  ctx.strokeStyle = 'rgba(92,52,24,0.35)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(114.5, 124.5, 111, 126);
  // Laptop Director di sisi kiri meja
  drawPixelBox(ctx, 118, 166, 18, 24, '#334155', '#0f172a', 1.5);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(121, 169, 12, 18);
  // Berkas proyek & cangkir rapat
  drawPixelBox(ctx, 198, 132, 20, 16, '#fef9c3', '#854d0e', 1.2);
  drawPixelBox(ctx, 202, 220, 18, 14, '#e0f2fe', '#0369a1', 1.2);
  drawPixelBox(ctx, 124, 132, 9, 9, '#f8fafc', '#475569', 1.2);
  drawPixelBox(ctx, 124, 228, 9, 9, '#f8fafc', '#475569', 1.2);
  drawPixelPlant(ctx, 170, 182);

  // Kursi eksekutif rapat (dengan sandaran & bantalan)
  [125, 170, 215].forEach((cy) => {
    drawPixelBox(ctx, 82, cy, 18, 22, '#4f46e5', '#1e1b4b', 2);
    ctx.fillStyle = '#818cf8';
    ctx.fillRect(86, cy + 3, 11, 16);
    drawPixelBox(ctx, 240, cy, 18, 22, '#4f46e5', '#1e1b4b', 2);
    ctx.fillStyle = '#818cf8';
    ctx.fillRect(243, cy + 3, 11, 16);
  });

  // === PRODUCT TEAM WORKSTATIONS ===
  [115, 295, 475].forEach((ry, idx) => {
    drawWorkstation(ctx, 415, ry, idx === 0 ? '#34d399' : '#38bdf8', 'down');
    drawWorkstation(ctx, 545, ry, idx === 0 ? '#60a5fa' : '#a78bfa', 'down');
    drawWorkstation(ctx, 415, ry + 54, '#fbbf24', 'up');
    drawWorkstation(ctx, 545, ry + 54, '#38bdf8', 'up');
  });

  // === RELAXATION LOUNGE (Sofa empuk, karpet, coffee table hidup) ===
  drawRug(ctx, 750, 94, 214, 186, '#d7e8ca', '#94b885', 'rgba(255,255,255,0.45)');
  drawBookshelf(ctx, 754, 42, 74);
  drawSofa(ctx, 842, 46, 110, 38, '#9333ea', '#c084fc', 'down');
  drawSofa(ctx, 756, 130, 38, 86, '#2563eb', '#60a5fa', 'right');
  drawSofa(ctx, 924, 120, 38, 86, '#dc2626', '#f87171', 'left');
  // Coffee table kayu + majalah + 2 cangkir kopi + piring camilan
  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  ctx.fillRect(828, 156, 70, 40);
  drawPixelBox(ctx, 825, 152, 70, 40, '#a16236', '#2c221e', 2);
  ctx.fillStyle = '#c07d4b';
  ctx.fillRect(829, 156, 62, 32);
  drawPixelBox(ctx, 833, 160, 18, 22, '#fef08a', '#854d0e', 1.2); // Majalah
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(836, 163, 12, 6);
  drawPixelBox(ctx, 860, 161, 10, 10, '#f8fafc', '#475569', 1.2); // Kopi 1
  ctx.fillStyle = '#78350f';
  ctx.fillRect(862, 163, 6, 6);
  drawPixelBox(ctx, 876, 173, 10, 10, '#f8fafc', '#475569', 1.2); // Kopi 2
  ctx.fillStyle = '#78350f';
  ctx.fillRect(878, 175, 6, 6);
  // Bench ottoman hijau empuk dengan jahitan tufted
  drawSofa(ctx, 820, 225, 95, 36, '#16a34a', '#86efac', 'up');

  // === CX TEAM ===
  drawBookshelf(ctx, 756, 355, 86);
  drawBookshelf(ctx, 875, 355, 86);
  [540, 790, 1020].forEach((cy) => {
    drawWorkstation(ctx, 760, cy, '#34d399', 'down');
    drawWorkstation(ctx, 866, cy, '#38bdf8', 'down');
    drawWorkstation(ctx, 760, cy + 54, '#f472b6', 'up');
    drawWorkstation(ctx, 866, cy + 54, '#60a5fa', 'up');
  });

  // === RECREATION AREA (TV + Pingpong lengkap + Sofa nyaman) ===
  drawRug(ctx, 430, 866, 206, 210, '#cde0f0', '#8fb1cf', 'rgba(255,255,255,0.4)');
  // Wall TV + konsol kabinet
  drawPixelBox(ctx, 488, 792, 98, 22, '#1e293b', '#0f172a', 2);
  ctx.fillStyle = '#0ea5e9';
  ctx.fillRect(494, 796, 86, 13);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(498, 798, 30, 8);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(534, 799, 20, 4);
  ctx.fillStyle = '#34d399';
  ctx.fillRect(558, 799, 16, 6);

  // Meja pingpong + bayangan + jaring + bet & bola
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.fillRect(483, 901, 114, 150);
  drawPixelBox(ctx, 478, 895, 114, 150, '#15803d', '#14532d', 3);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(484, 901, 102, 138);
  ctx.beginPath();
  ctx.moveTo(535, 901);
  ctx.lineTo(535, 1039);
  ctx.stroke();
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(475, 967, 120, 6);
  // Bet pingpong merah & biru + bola putih
  drawPixelBox(ctx, 495, 916, 12, 14, '#ef4444', '#7f1d1d', 1.2);
  ctx.fillStyle = '#d97706';
  ctx.fillRect(499, 930, 4, 6);
  drawPixelBox(ctx, 562, 1010, 12, 14, '#3b82f6', '#1e3a8a', 1.2);
  ctx.fillStyle = '#d97706';
  ctx.fillRect(566, 1004, 4, 6);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(548, 946, 3.5, 0, Math.PI * 2);
  ctx.fill();

  drawSofa(ctx, 645, 905, 42, 115, '#7e22ce', '#c084fc', 'left');

  // === PANTRY & UTILITY (Dispenser galon, meja sink + mesin kopi, kulkas bermagnet) ===
  drawRug(ctx, 44, 474, 156, 74, '#dcd4ea', '#b6a8cf');
  // Dispenser galon air
  drawPixelBox(ctx, 42, 415, 32, 34, '#e2e8f0', '#334155', 2);
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(58, 427, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#bae6fd';
  ctx.fillRect(54, 422, 4, 7);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(51, 440, 5, 4); // Keran panas
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(60, 440, 5, 4); // Keran dingin

  // Meja dapur + wastafel stainless + mesin espresso + mug
  drawPixelBox(ctx, 86, 405, 56, 46, '#94a3b8', '#334155', 2);
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(89, 408, 50, 40);
  drawPixelBox(ctx, 92, 414, 22, 22, '#64748b', '#1e293b', 1.5); // Sink
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(101, 410, 4, 7); // Keran
  drawPixelBox(ctx, 119, 412, 18, 22, '#1e293b', '#0f172a', 1.5); // Mesin kopi
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(132, 416, 3, 3);
  drawPixelBox(ctx, 123, 437, 8, 8, '#fef9c3', '#713f12', 1.2); // Gelas kopi

  // Kulkas kantor + pegangan pintu + stiker magnet
  drawPixelBox(ctx, 154, 395, 56, 62, '#60a5fa', '#1e3a8a', 2);
  ctx.fillStyle = '#93c5fd';
  ctx.fillRect(157, 398, 50, 22);
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(156, 422, 52, 2); // Garis freezer
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(160, 404, 4, 12); // Handle atas
  ctx.fillRect(160, 428, 4, 18); // Handle bawah
  ctx.fillStyle = '#facc15';
  ctx.fillRect(184, 405, 7, 7); // Magnet 1
  ctx.fillStyle = '#fb7185';
  ctx.fillRect(194, 432, 8, 6); // Magnet 2
  ctx.fillStyle = '#34d399';
  ctx.fillRect(178, 438, 7, 7); // Magnet 3

  drawWorkstation(ctx, 56, 650, '#fbbf24', 'down');

  // Full-Stack Studio (Kael) — ruang pribadi di kiri bawah
  // Karpet kerja lembut di bawah area meja
  drawPixelBox(ctx, 44, 902, 166, 134, '#cbd5e1', '#64748b', 1.5);
  ctx.fillStyle = '#e0f2fe';
  ctx.fillRect(50, 908, 154, 122);

  // Whiteboard arsitektur di dinding atas ruangan
  drawPixelBox(ctx, 52, 804, 146, 22, '#f8fafc', '#334155', 2);
  ctx.fillStyle = '#0ea5e9';
  ctx.fillRect(62, 811, 28, 7);
  ctx.fillStyle = '#10b981';
  ctx.fillRect(102, 811, 28, 7);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(142, 811, 28, 7);
  ctx.fillStyle = '#475569';
  ctx.fillRect(91, 814, 10, 2);
  ctx.fillRect(131, 814, 10, 2);

  // Meja komputer utama Kael + lampu meja + cangkir kopi
  drawWorkstation(ctx, 76, 952, '#38bdf8', 'down');
  drawPixelBox(ctx, 154, 956, 12, 12, '#fde047', '#854d0e', 1.5); // Lampu meja hangat
  drawPixelBox(ctx, 82, 984, 8, 8, '#f8fafc', '#475569', 1.2); // Mug kopi

  // Rak buku referensi di sudut kiri bawah
  drawBookshelf(ctx, 34, 1136, 84);

  // Mini server rack & coffee cabinet di sudut kanan bawah
  drawPixelBox(ctx, 146, 1126, 36, 54, '#1e293b', '#0f172a', 2);
  [1134, 1146, 1158, 1170].forEach((sy, idx) => {
    ctx.fillStyle = '#334155';
    ctx.fillRect(150, sy, 28, 7);
    ctx.fillStyle = idx % 2 === 0 ? '#38bdf8' : '#34d399';
    ctx.fillRect(152, sy + 2, 4, 3);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(158, sy + 2, 3, 3);
  });
  drawPixelBox(ctx, 186, 1136, 32, 44, '#8d5b3c', '#2c221e', 2);
  drawPixelBox(ctx, 192, 1142, 20, 18, '#475569', '#0f172a', 1.5); // Mesin kopi mini
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(206, 1145, 3, 3);

  [
    [54, 65],
    [365, 65],
    [705, 65],
    [955, 285],
    [355, 395],
    [400, 825],
    [665, 825],
    [405, 1145],
    [665, 1145],
    [46, 876],
    [206, 1072],
  ].forEach(([px, py]) => drawPixelPlant(ctx, px, py));

  OFFICE_ROOMS.forEach((room) => {
    if (!room.floatingTag) return;
    ctx.font = 'bold 14px "Inter", system-ui, sans-serif';
    const textW = ctx.measureText(room.floatingTag).width + 24;
    const tagX = room.x + (room.w - textW) / 2;
    const tagY = room.y + 42;

    drawPixelBox(ctx, tagX, tagY, textW, 28, 'rgba(255,255,255,0.92)', '#334155', 1.5);
    ctx.fillStyle = '#1e293b';
    ctx.textAlign = 'center';
    ctx.fillText(room.floatingTag, room.x + room.w / 2, tagY + 19);
  });

  return off;
}

function drawCarriedDocument(ctx, px, py, facing, timeSec) {
  const floatY = Math.sin(timeSec * 10) * 1.5;
  const docX = facing === 'left' ? px - 17 : px + 8;
  const docY = py - 5 + floatY;

  // Kertas dokumen pixel-art
  drawPixelBox(ctx, docX, docY, 11, 13, '#fefce8', '#334155', 1.5);
  // Lipatan sudut
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(docX + 7, docY + 1, 3, 3);
  // Garis teks mini
  ctx.fillStyle = '#6366f1';
  ctx.fillRect(docX + 2, docY + 4, 5, 1.5);
  ctx.fillStyle = '#64748b';
  ctx.fillRect(docX + 2, docY + 7, 7, 1.5);
  ctx.fillRect(docX + 2, docY + 10, 5, 1.5);
}

function drawRPGCharacter(ctx, entity, timeSec, isDirector = false, isSelected = false) {
  if (!entity || typeof entity.x !== 'number' || typeof entity.y !== 'number') return;

  const isAmbient = Boolean(entity.isAmbient);
  const isWalking = isDirector
    ? Boolean(entity.isMoving)
    : entity.state === 'WALKING' ||
      (entity.state === 'IDLE' && Array.isArray(entity.roamPath) && entity.roamPath.length > 0);
  const isTypingAtDesk = !isDirector && (entity.state === 'WORKING' || entity.state === 'SITTING_DESK');
  const isSitting = isDirector
    ? Boolean(entity.isSitting) && !isWalking
    : isTypingAtDesk || entity.state === 'MEETING' || entity.state === 'REPORTING';
  const facing = entity.facing || 'down';

  const bob = isWalking ? Math.abs(Math.sin(entity.walkPhase || 0)) * -4 : 0;
  const sitDrop = isSitting ? 3 : 0;
  const shakeX = entity.hitTimer > 0 ? Math.sin(timeSec * 65) * 4 : 0;
  const px = Math.round(entity.x + shakeX);
  const py = Math.round(entity.y + bob + sitDrop);

  if (isDirector || isSelected) {
    ctx.beginPath();
    ctx.ellipse(px, Math.round(entity.y) + 15, 18, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = isDirector ? 'rgba(236, 72, 153, 0.25)' : 'rgba(99, 102, 241, 0.28)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = isDirector ? '#ec4899' : '#6366f1';
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(px, Math.round(entity.y) + 15, 11, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const legOffset = isWalking ? Math.sin(entity.walkPhase || 0) * 3 : 0;
  const legHeight = isSitting ? 5 : 9;
  drawPixelBox(ctx, px - 7, py + 6 + legOffset, 6, legHeight, '#1e293b', '#0f172a', 1.5);
  drawPixelBox(ctx, px + 1, py + 6 - legOffset, 6, legHeight, '#1e293b', '#0f172a', 1.5);

  const shirt = entity.shirtColor || entity.accentHex || '#3b82f6';
  const skin = entity.skinColor || '#f8cba6';
  const hair = entity.hairColor || '#1e293b';

  // Badan
  drawPixelBox(ctx, px - 9, py - 5, 18, 13, shirt, '#1e1b18', 2);

  // Animasi tangan mengetik hanya saat duduk bekerja di komputer
  if (isTypingAtDesk) {
    const speed = isAmbient ? 12 : 20;
    const leftTap = Math.sin(timeSec * speed) * 2;
    const rightTap = Math.cos(timeSec * speed) * 2;
    drawPixelBox(ctx, px - 12, py + leftTap, 4, 5, skin, '#1e1b18', 1.2);
    drawPixelBox(ctx, px + 8, py + rightTap, 4, 5, skin, '#1e1b18', 1.2);
  }

  // Kepala + Rambut & Mata mengikuti arah `facing`
  drawPixelBox(ctx, px - 9, py - 21, 18, 16, skin, '#1e1b18', 2);

  if (facing === 'up') {
    drawPixelBox(ctx, px - 10, py - 24, 20, 14, hair, '#1e1b18', 1.5);
  } else if (facing === 'left') {
    drawPixelBox(ctx, px - 10, py - 24, 20, 7, hair, '#1e1b18', 1.5);
    ctx.fillStyle = hair;
    ctx.fillRect(px + 3, py - 18, 6, 9);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px - 7, py - 14, 2.5, 3);
    ctx.fillRect(px - 2, py - 14, 2.5, 3);
  } else if (facing === 'right') {
    drawPixelBox(ctx, px - 10, py - 24, 20, 7, hair, '#1e1b18', 1.5);
    ctx.fillStyle = hair;
    ctx.fillRect(px - 9, py - 18, 6, 9);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px + 0, py - 14, 2.5, 3);
    ctx.fillRect(px + 5, py - 14, 2.5, 3);
  } else {
    drawPixelBox(ctx, px - 10, py - 24, 20, 7, hair, '#1e1b18', 1.5);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px - 5, py - 14, 2.5, 3);
    ctx.fillRect(px + 3, py - 14, 2.5, 3);
  }

  // Ikon dokumen saat handoff / melapor
  if (!isDirector && !isAmbient && entity.carryingDoc) {
    drawCarriedDocument(ctx, px, py, facing, timeSec);
  }

  const labelName = entity.name || 'Agent';
  ctx.font = isAmbient
    ? '600 10px "Inter", system-ui, sans-serif'
    : 'bold 11px "Inter", system-ui, sans-serif';
  const dotSpace = isAmbient ? 0 : 9;
  const labelW = ctx.measureText(labelName).width + 16 + dotSpace;
  const labelH = isAmbient ? 16 : 18;
  const labelY = py - (isAmbient ? 42 : 44);

  ctx.fillStyle = isAmbient ? 'rgba(15, 23, 42, 0.68)' : 'rgba(15, 23, 42, 0.92)';
  ctx.beginPath();
  ctx.roundRect(px - labelW / 2, labelY, labelW, labelH, 8);
  ctx.fill();

  if (!isAmbient) {
    ctx.fillStyle = isDirector ? '#ec4899' : entity.accentHex || '#6366f1';
    ctx.beginPath();
    ctx.arc(px - labelW / 2 + 8, labelY + labelH / 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = isAmbient ? '#cbd5e1' : '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(labelName, px + dotSpace / 2, labelY + (isAmbient ? 11.5 : 13));

  if (entity.hasReportExclamation) {
    const bounce = Math.sin(timeSec * 8) * 3;
    const by = labelY - 26 + bounce;
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.roundRect(px - 12, by, 24, 20, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillText('!', px, by + 14.5);
  } else if (entity.statusBubble || (!isAmbient && isTypingAtDesk)) {
    const text = entity.statusBubble || '⚙️ Bekerja...';
    ctx.font = '600 10px "Inter", system-ui, sans-serif';
    const bw = Math.max(38, ctx.measureText(text).width + 16);
    const by = labelY - 24;

    ctx.fillStyle = isAmbient ? 'rgba(255,255,255,0.92)' : '#ffffff';
    ctx.strokeStyle = isAmbient ? '#64748b' : '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(px - bw / 2, by, bw, 20, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.fillText(text, px, by + 13.5);
  }

  if (isDirector && entity.actionTimer > 0) {
    ctx.save();
    const tx = entity.actionTarget ? entity.actionTarget.x : px + 36;
    const ty = entity.actionTarget ? entity.actionTarget.y - 6 : py - 4;

    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px + 6, py - 4);
    ctx.quadraticCurveTo((px + tx) / 2, py - 26, tx, ty);
    ctx.stroke();

    if (entity.actionTarget) {
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeText('PLAK!', tx, ty - 14);
      ctx.fillText('PLAK!', tx, ty - 14);
    }
    ctx.restore();
  }
}

function spawnParticles(particles, event) {
  if (event.type === 'confetti') {
    const colors = ['#10b981', '#6366f1', '#facc15', '#ec4899', '#38bdf8', '#fb923c'];
    for (let i = 0; i < 36; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 55 + Math.random() * 140;
      particles.push({
        x: event.x,
        y: event.y - 16,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 90,
        gravity: 220,
        size: 3 + Math.random() * 3.5,
        color: colors[i % colors.length],
        life: 1.1 + Math.random() * 0.7,
        maxLife: 1.8,
      });
    }
  } else if (event.type === 'handoff') {
    const colors = ['#facc15', '#38bdf8', '#a78bfa'];
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 25 + Math.random() * 55;
      particles.push({
        x: event.x,
        y: event.y - 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 35,
        gravity: 40,
        size: 2.5 + Math.random() * 2,
        color: colors[i % colors.length],
        life: 0.55 + Math.random() * 0.3,
        maxLife: 0.85,
      });
    }
  }
}

export default function OfficeCanvas2D({
  npcRef,
  directorRef,
  fxEventsRef = null,
  simSpeed = 1,
  fxEnabled = true,
  showAmbientStaff = true,
  cameraZoom = 1,
  followDirector = false,
  onDisableFollow = null,
  onZoomChange = null,
  selectedNpcId = null,
  onSelectNpc,
  onClearInspector,
}) {
  const canvasRef = useRef(null);
  const bgBufferRef = useRef(null);
  const keysRef = useRef({});
  const fxEnabledRef = useRef(fxEnabled);
  const showAmbientRef = useRef(showAmbientStaff);
  const ambientRef = useRef(null);
  if (!ambientRef.current) {
    ambientRef.current = createAmbientEntities();
  }
  const particlesRef = useRef([]);
  const stepSfxTimerRef = useRef(0);
  const camRef = useRef({ x: 0, y: 0, zoom: cameraZoom });
  const dragRef = useRef({ active: false, moved: false, startX: 0, startY: 0, camStartX: 0, camStartY: 0 });

  useEffect(() => {
    fxEnabledRef.current = fxEnabled;
  }, [fxEnabled]);

  useEffect(() => {
    showAmbientRef.current = showAmbientStaff;
  }, [showAmbientStaff]);

  useEffect(() => {
    const prevZoom = camRef.current.zoom || 1;
    const nextZoom = Math.max(1, Math.min(2.2, cameraZoom || 1));
    if (nextZoom === 1) {
      camRef.current = { x: 0, y: 0, zoom: 1 };
      return;
    }
    // Pertahankan titik pusat saat zoom berubah
    const prevViewW = WORLD_W / prevZoom;
    const prevViewH = WORLD_H / prevZoom;
    const centerX = camRef.current.x + prevViewW / 2;
    const centerY = camRef.current.y + prevViewH / 2;
    const nextViewW = WORLD_W / nextZoom;
    const nextViewH = WORLD_H / nextZoom;
    camRef.current = {
      zoom: nextZoom,
      x: Math.max(0, Math.min(WORLD_W - nextViewW, centerX - nextViewW / 2)),
      y: Math.max(0, Math.min(WORLD_H - nextViewH, centerY - nextViewH / 2)),
    };
  }, [cameraZoom]);

  // Keyboard WASD / Arrow Keys untuk karakter Director
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        unlockAudio();
        keysRef.current[key] = true;
        if (directorRef?.current) {
          directorRef.current.pathQueue = [];
          directorRef.current.onArriveCallback = null;
          directorRef.current.isSitting = false;
        }
      }

      if (e.code === 'Space' || key === 'e') {
        e.preventDefault();
        const dir = directorRef?.current;
        const aiNpcs = npcRef?.current || [];
        const ambNpcs = showAmbientRef.current ? ambientRef.current || [] : [];
        const allNpcs = [...aiNpcs, ...ambNpcs];
        if (!dir) return;

        let nearest = null;
        let minDist = 75;
        allNpcs.forEach((npc) => {
          const d = Math.hypot(npc.x - dir.x, npc.y - dir.y);
          if (d < minDist) {
            minDist = d;
            nearest = npc;
          }
        });

        dir.actionTimer = 0.28;
        dir.actionTarget = nearest ? { x: nearest.x, y: nearest.y } : null;
        playRetroTone('slap', fxEnabledRef.current);

        if (nearest) {
          dir.facing = resolveFacing(nearest.x - dir.x, nearest.y - dir.y, dir.facing);
          const reactions = ['Ampun Bos! 😵', 'Siap kerja! 🫡', 'Aduh! ⚡', 'Oke lembur! 💻'];
          nearest.hitTimer = 0.45;
          nearest.statusBubble = reactions[Math.floor(Math.random() * reactions.length)];
          nearest.bubbleClearTimer = 2.0;

          const angle = Math.atan2(nearest.y - dir.y, nearest.x - dir.x);
          const pushX = nearest.x + Math.cos(angle) * 14;
          const pushY = nearest.y + Math.sin(angle) * 14;
          if (!isPositionBlocked(pushX, pushY)) {
            nearest.x = pushX;
            nearest.y = pushY;
          }
        }
      }
    };

    const handleKeyUp = (e) => {
      delete keysRef.current[e.key.toLowerCase()];
    };

    const handleBlur = () => {
      keysRef.current = {};
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [directorRef, npcRef]);

  useEffect(() => {
    if (!bgBufferRef.current) {
      bgBufferRef.current = createOfficeBackgroundBuffer();
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let lastTime = performance.now();

    const toWorld = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const canvasX = ((clientX - rect.left) / rect.width) * WORLD_W;
      const canvasY = ((clientY - rect.top) / rect.height) * WORLD_H;
      const { x: camX, y: camY, zoom } = camRef.current;
      return {
        x: canvasX / zoom + camX,
        y: canvasY / zoom + camY,
      };
    };

    const hitTestNpc = (wx, wy) => {
      const npcs = npcRef?.current || [];
      for (const npc of npcs) {
        if (Math.hypot(wx - npc.x, wy - (npc.y - 8)) <= 26) return npc;
        const d = npc.deskRect;
        if (d && wx >= d.x && wx <= d.x + d.w && wy >= d.y && wy <= d.y + d.h) return npc;
      }
      return null;
    };

    const hitTestAmbient = (wx, wy) => {
      if (!showAmbientRef.current) return null;
      const ambList = ambientRef.current || [];
      for (const staff of ambList) {
        if (Math.hypot(wx - staff.x, wy - (staff.y - 8)) <= 24) return staff;
      }
      return null;
    };

    const onMouseDown = (e) => {
      if (camRef.current.zoom <= 1) return;
      dragRef.current = {
        active: true,
        moved: false,
        startX: e.clientX,
        startY: e.clientY,
        camStartX: camRef.current.x,
        camStartY: camRef.current.y,
      };
    };

    const onMouseMove = (e) => {
      if (dragRef.current.active && camRef.current.zoom > 1) {
        const dxScreen = e.clientX - dragRef.current.startX;
        const dyScreen = e.clientY - dragRef.current.startY;
        if (Math.hypot(dxScreen, dyScreen) > 6) {
          dragRef.current.moved = true;
          onDisableFollow?.();
        }
        if (dragRef.current.moved) {
          const rect = canvas.getBoundingClientRect();
          const zoom = camRef.current.zoom;
          const dxWorld = (dxScreen / rect.width) * (WORLD_W / zoom);
          const dyWorld = (dyScreen / rect.height) * (WORLD_H / zoom);
          const viewW = WORLD_W / zoom;
          const viewH = WORLD_H / zoom;
          camRef.current.x = Math.max(0, Math.min(WORLD_W - viewW, dragRef.current.camStartX - dxWorld));
          camRef.current.y = Math.max(0, Math.min(WORLD_H - viewH, dragRef.current.camStartY - dyWorld));
          canvas.style.cursor = 'grabbing';
          return;
        }
      }

      const pt = toWorld(e.clientX, e.clientY);
      const hit = hitTestNpc(pt.x, pt.y) || hitTestAmbient(pt.x, pt.y);
      canvas.style.cursor = hit ? 'pointer' : camRef.current.zoom > 1 ? 'grab' : 'crosshair';
    };

    const onMouseUp = () => {
      if (dragRef.current.active) {
        dragRef.current.active = false;
      }
    };

    const onWheel = (e) => {
      if (!e.ctrlKey || !onZoomChange) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.2 : -0.2;
      const next = Math.max(1, Math.min(2.2, Number((camRef.current.zoom + delta).toFixed(1))));
      onZoomChange(next);
    };

    const onClick = (e) => {
      unlockAudio();
      if (dragRef.current.moved) {
        dragRef.current.moved = false;
        return;
      }
      const pt = toWorld(e.clientX, e.clientY);
      const hit = hitTestNpc(pt.x, pt.y);
      if (hit) {
        playRetroTone('greet', fxEnabledRef.current);
        onSelectNpc?.(hit.id);
        return;
      }

      const hitAmb = hitTestAmbient(pt.x, pt.y);
      if (hitAmb) {
        playRetroTone('greet', fxEnabledRef.current);
        const dir = directorRef?.current;
        if (dir) {
          hitAmb.facing = resolveFacing(dir.x - hitAmb.x, dir.y - hitAmb.y, hitAmb.facing);
        }
        hitAmb.statusBubble =
          AMBIENT_GREETINGS[Math.floor(Math.random() * AMBIENT_GREETINGS.length)];
        hitAmb.bubbleClearTimer = 2.6;
        return;
      }

      onClearInspector?.();
      const clampedX = Math.max(45, Math.min(WORLD_W - 45, pt.x));
      const clampedY = Math.max(45, Math.min(WORLD_H - 45, pt.y));
      const dir = directorRef?.current;
      if (dir) {
        dir.isSitting = false;
        dir.onArriveCallback = null;
        dir.targetMarker = { x: clampedX, y: clampedY, ttl: 1.0 };
        dir.pathQueue = buildOfficePath(dir.x, dir.y, { x: clampedX, y: clampedY });
        playRetroTone('click', fxEnabledRef.current);
      }
    };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('click', onClick);

    const update = (dt) => {
      // Kuras antrean efek partikel (confetti QA / handoff sparkle)
      if (fxEventsRef?.current && fxEventsRef.current.length > 0) {
        const queued = fxEventsRef.current.splice(0, fxEventsRef.current.length);
        queued.forEach((evt) => spawnParticles(particlesRef.current, evt));
      }

      const dir = directorRef?.current;
      const keys = keysRef.current;
      const dirSpeed = 220;

      if (dir) {
        let vx = 0;
        let vy = 0;
        if (keys['w'] || keys['arrowup']) vy -= 1;
        if (keys['s'] || keys['arrowdown']) vy += 1;
        if (keys['a'] || keys['arrowleft']) vx -= 1;
        if (keys['d'] || keys['arrowright']) vx += 1;

        if (vx !== 0 || vy !== 0) {
          const len = Math.hypot(vx, vy);
          const nextX = dir.x + (vx / len) * dirSpeed * dt;
          const nextY = dir.y + (vy / len) * dirSpeed * dt;

          if (!isPositionBlocked(nextX, dir.y)) dir.x = nextX;
          if (!isPositionBlocked(dir.x, nextY)) dir.y = nextY;

          dir.facing = resolveFacing(vx, vy, dir.facing);
          dir.isMoving = true;
          dir.walkPhase = (dir.walkPhase || 0) + dt * 14;
        } else if (dir.pathQueue && dir.pathQueue.length > 0) {
          const nextPt = dir.pathQueue[0];
          const dx = nextPt.x - dir.x;
          const dy = nextPt.y - dir.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 6) {
            dir.x = nextPt.x;
            dir.y = nextPt.y;
            dir.pathQueue.shift();
            if (dir.pathQueue.length === 0) {
              dir.isMoving = false;
              if (dir.onArriveCallback) {
                const cb = dir.onArriveCallback;
                dir.onArriveCallback = null;
                cb();
              }
            }
          } else {
            dir.x += (dx / dist) * dirSpeed * dt;
            dir.y += (dy / dist) * dirSpeed * dt;
            dir.facing = resolveFacing(dx, dy, dir.facing);
            dir.isMoving = true;
            dir.walkPhase = (dir.walkPhase || 0) + dt * 14;
          }
        } else {
          dir.isMoving = false;
        }

        if (dir.targetMarker && dir.targetMarker.ttl > 0) {
          dir.targetMarker.ttl -= dt;
        }

        if (dir.actionTimer > 0) {
          dir.actionTimer = Math.max(0, dir.actionTimer - dt);
        }

        // Suara langkah kaki ritmis saat Director berjalan (WASD / klik lantai)
        if (dir.isMoving) {
          stepSfxTimerRef.current -= dt;
          if (stepSfxTimerRef.current <= 0) {
            playRetroTone('step', fxEnabledRef.current);
            stepSfxTimerRef.current = 0.27;
          }
        } else {
          stepSfxTimerRef.current = 0.05;
        }

        // Smooth camera follow Director ketika zoom > 1
        if (followDirector && camRef.current.zoom > 1) {
          const viewW = WORLD_W / camRef.current.zoom;
          const viewH = WORLD_H / camRef.current.zoom;
          const targetCamX = Math.max(0, Math.min(WORLD_W - viewW, dir.x - viewW / 2));
          const targetCamY = Math.max(0, Math.min(WORLD_H - viewH, dir.y - viewH / 2));
          const lerp = Math.min(1, dt * 6);
          camRef.current.x += (targetCamX - camRef.current.x) * lerp;
          camRef.current.y += (targetCamY - camRef.current.y) * lerp;
        }
      }

      const npcs = npcRef?.current || [];
      const npcSpeed = 180;

      npcs.forEach((npc) => {
        if (npc.hitTimer > 0) npc.hitTimer = Math.max(0, npc.hitTimer - dt);
        if (npc.bubbleClearTimer > 0) {
          npc.bubbleClearTimer -= dt;
          if (npc.bubbleClearTimer <= 0 && npc.state === 'IDLE') {
            npc.statusBubble = '';
          }
        }

        if (npc.state === 'WALKING' && npc.pathQueue && npc.pathQueue.length > 0) {
          npc.roamPath = [];
          const target = npc.pathQueue[0];
          const dx = target.x - npc.x;
          const dy = target.y - npc.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 4) {
            npc.x = target.x;
            npc.y = target.y;
            npc.pathQueue.shift();
            if (npc.pathQueue.length === 0 && npc.onArriveCallback) {
              const cb = npc.onArriveCallback;
              npc.onArriveCallback = null;
              cb();
            }
          } else {
            npc.x += (dx / dist) * npcSpeed * dt;
            npc.y += (dy / dist) * npcSpeed * dt;
            npc.facing = resolveFacing(dx, dy, npc.facing);
            npc.walkPhase = (npc.walkPhase || 0) + dt * 14;
          }
        } else if (npc.state === 'MEETING' || npc.state === 'REPORTING') {
          if (npc.meetingTimer > 0) {
            npc.meetingTimer -= dt;
            if (npc.meetingTimer <= 0) {
              npc.meetingTimer = 0;
              npc.state = 'IDLE';
              npc.hasReportExclamation = false;
              const leaveBubbles = ['🫡 Siap Bos!', '☕ Kembali santai', '👍 Rapat selesai'];
              npc.statusBubble = leaveBubbles[Math.floor(Math.random() * leaveBubbles.length)];
              npc.bubbleClearTimer = 2.2;
              npc.roamCooldown = 4 + Math.random() * 4;
              const returnSpot = npc.homeSpot || WAYPOINTS.loungeSofa;
              npc.roamPath = buildOfficePath(npc.x, npc.y, returnSpot);
              npc.pendingIdleBubble = '';
            }
          }
        } else if (npc.state === 'IDLE') {
          npc.roamCooldown = (npc.roamCooldown ?? 2.5 + Math.random() * 3.5) - dt;
          if (Array.isArray(npc.roamPath) && npc.roamPath.length > 0) {
            const pt = npc.roamPath[0];
            const dx = pt.x - npc.x;
            const dy = pt.y - npc.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 4) {
              npc.x = pt.x;
              npc.y = pt.y;
              npc.roamPath.shift();
              if (npc.roamPath.length === 0 && npc.pendingIdleBubble) {
                npc.statusBubble = npc.pendingIdleBubble;
                npc.bubbleClearTimer = 2.4;
                npc.pendingIdleBubble = '';
                npc.facing = 'down';
              }
            } else {
              npc.x += (dx / dist) * 68 * dt;
              npc.y += (dy / dist) * 68 * dt;
              npc.facing = resolveFacing(dx, dy, npc.facing);
              npc.walkPhase = (npc.walkPhase || 0) + dt * 10;
            }
          } else if (npc.roamCooldown <= 0) {
            npc.roamCooldown = 4.5 + Math.random() * 5;
            const activities = [
              { spot: npc.homeSpot, bubble: '🛋️ Santai' },
              { spot: WAYPOINTS.loungeSofa, bubble: '💬 Ngobrol' },
              { spot: WAYPOINTS.lounge_alex, bubble: '' },
              { spot: WAYPOINTS.lounge_raka, bubble: '' },
              { spot: WAYPOINTS.pantrySpot, bubble: '☕ Ambil kopi' },
              { spot: WAYPOINTS.pingPongSpot, bubble: '🏓 Pingpong' },
            ].filter((a) => Boolean(a.spot));

            const chosen = activities[Math.floor(Math.random() * activities.length)];
            if (chosen && Math.hypot(chosen.spot.x - npc.x, chosen.spot.y - npc.y) > 18) {
              npc.roamPath = buildOfficePath(npc.x, npc.y, chosen.spot);
              npc.pendingIdleBubble = chosen.bubble;
            }
          }
        }
      });

      // Update karyawan ambient (Non-AI): duduk kerja di komputer & sesekali beraktivitas
      if (showAmbientRef.current && ambientRef.current) {
        const ambSpeed = 82;
        ambientRef.current.forEach((staff) => {
          if (staff.hitTimer > 0) staff.hitTimer = Math.max(0, staff.hitTimer - dt);
          if (staff.bubbleClearTimer > 0) {
            staff.bubbleClearTimer -= dt;
            if (staff.bubbleClearTimer <= 0) {
              staff.statusBubble = '';
            }
          }

          if (staff.state === 'WALKING' && staff.pathQueue.length > 0) {
            const pt = staff.pathQueue[0];
            const dx = pt.x - staff.x;
            const dy = pt.y - staff.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 4) {
              staff.x = pt.x;
              staff.y = pt.y;
              staff.pathQueue.shift();
              if (staff.pathQueue.length === 0) {
                staff.state = staff.pendingState || 'SITTING_DESK';
                staff.facing = staff.pendingFacing || staff.deskFacing || 'down';
                if (staff.pendingBubble) {
                  staff.statusBubble = staff.pendingBubble;
                  staff.bubbleClearTimer = 2.8;
                }
                staff.stateTimer =
                  staff.state === 'SITTING_DESK'
                    ? 14 + Math.random() * 16
                    : 6 + Math.random() * 7;
              }
            } else {
              staff.x += (dx / dist) * ambSpeed * dt;
              staff.y += (dy / dist) * ambSpeed * dt;
              staff.facing = resolveFacing(dx, dy, staff.facing);
              staff.walkPhase = (staff.walkPhase || 0) + dt * 11;
            }
          } else {
            // Sesekali munculkan bubble kerja ringan saat duduk di komputer
            if (staff.state === 'SITTING_DESK') {
              staff.workBubbleTimer -= dt;
              if (staff.workBubbleTimer <= 0 && !staff.statusBubble) {
                staff.workBubbleTimer = 9 + Math.random() * 12;
                const pool = staff.workBubbles || ['💻 Bekerja...'];
                staff.statusBubble = pool[Math.floor(Math.random() * pool.length)];
                staff.bubbleClearTimer = 2.6;
              }
            }

            staff.stateTimer -= dt;
            if (staff.stateTimer <= 0) {
              if (staff.state === 'SITTING_DESK') {
                // Bangun dari meja menuju aktivitas (kopi, lounge, pingpong, whiteboard)
                const act =
                  AMBIENT_ACTIVITIES[Math.floor(Math.random() * AMBIENT_ACTIVITIES.length)];
                staff.pathQueue = buildOfficePath(staff.x, staff.y, act.spot);
                staff.state = 'WALKING';
                staff.pendingState = 'ACTIVITY';
                staff.pendingFacing = act.facing;
                staff.pendingBubble = act.bubble;
              } else {
                // Kembali duduk bekerja di meja komputernya
                staff.pathQueue = buildOfficePath(staff.x, staff.y, staff.deskSpot);
                staff.state = 'WALKING';
                staff.pendingState = 'SITTING_DESK';
                staff.pendingFacing = staff.deskFacing;
                staff.pendingBubble =
                  staff.workBubbles?.[Math.floor(Math.random() * staff.workBubbles.length)] ||
                  '💻 Lanjut kerja';
              }
            }
          }
        });
      }

      // Update partikel
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vy += p.gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
      }
    };

    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1) * simSpeed;
      lastTime = now;
      update(dt);

      const timeSec = now / 1000;
      const { x: camX, y: camY, zoom } = camRef.current;

      ctx.clearRect(0, 0, WORLD_W, WORLD_H);
      ctx.save();
      ctx.scale(zoom, zoom);
      ctx.translate(-camX, -camY);

      ctx.drawImage(bgBufferRef.current, 0, 0);

      // Animasi detail hidup kantor: uap kopi, LED server Kael, dan cahaya TV Recreation
      ctx.save();
      [
        { x: 127, y: 410 }, // Mesin kopi Pantry
        { x: 201, y: 1138 }, // Mesin kopi Full-Stack Lab
      ].forEach((steam, idx) => {
        const phase = (timeSec * 1.4 + idx * 0.7) % 1;
        ctx.fillStyle = `rgba(255, 255, 255, ${(1 - phase) * 0.55})`;
        ctx.beginPath();
        ctx.arc(steam.x + Math.sin(timeSec * 4 + idx) * 2.5, steam.y - phase * 12, 2.2 + phase * 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // LED berkedip di mini server rack Kael
      [1136, 1148, 1160, 1172].forEach((ly, idx) => {
        const blink = Math.floor(timeSec * (2.5 + idx * 0.8) + idx) % 2 === 0;
        ctx.fillStyle = blink ? (idx % 2 === 0 ? '#38bdf8' : '#4ade80') : '#1e293b';
        ctx.fillRect(166, ly, 4, 3);
      });

      // Animasi sinyal lembut di TV Recreation Area
      const tvPulse = 0.12 + 0.08 * Math.sin(timeSec * 3.2);
      ctx.fillStyle = `rgba(56, 189, 248, ${tvPulse})`;
      ctx.fillRect(492, 795, 90, 15);
      ctx.restore();

      // Render animasi layar monitor menyala untuk AI Agent WORKING & staf ambient SITTING_DESK
      const npcs = npcRef?.current || [];
      const ambList = showAmbientRef.current ? ambientRef.current || [] : [];
      npcs.forEach((n) => {
        if (n.state === 'WORKING') {
          drawActiveMonitorOverlay(ctx, n, timeSec);
        }
      });
      ambList.forEach((s) => {
        if (s.state === 'SITTING_DESK') {
          drawActiveMonitorOverlay(ctx, s, timeSec * 0.75);
        }
      });

      const dir = directorRef?.current;
      if (dir?.targetMarker && dir.targetMarker.ttl > 0) {
        ctx.save();
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = Math.max(0, dir.targetMarker.ttl);
        ctx.beginPath();
        ctx.arc(
          dir.targetMarker.x,
          dir.targetMarker.y,
          14 * (1.2 - dir.targetMarker.ttl),
          0,
          Math.PI * 2
        );
        ctx.stroke();
        ctx.restore();
      }

      const renderList = [
        ...(dir ? [{ ...dir, isDirector: true }] : []),
        ...npcs.map((n) => ({ ...n, isDirector: false })),
        ...ambList.map((s) => ({ ...s, isDirector: false, isAmbient: true })),
      ].sort((a, b) => (a.y || 0) - (b.y || 0));

      renderList.forEach((ent) =>
        drawRPGCharacter(ctx, ent, timeSec, ent.isDirector, ent.id === selectedNpcId)
      );

      // Render partikel (confetti & handoff sparkle)
      particlesRef.current.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life / p.maxLife));
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
        ctx.restore();
      });

      ctx.restore();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('click', onClick);
    };
  }, [
    simSpeed,
    fxEnabled,
    followDirector,
    selectedNpcId,
    npcRef,
    directorRef,
    fxEventsRef,
    onSelectNpc,
    onClearInspector,
    onDisableFollow,
    onZoomChange,
  ]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#1e1b24] flex items-center justify-center p-2">
      <canvas
        ref={canvasRef}
        width={WORLD_W}
        height={WORLD_H}
        className="rounded-xl shadow-2xl border-2 border-slate-700 max-w-full max-h-full aspect-[1000/1220] touch-manipulation"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}
