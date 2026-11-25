import React, { useEffect, useRef } from 'react';
import {
  WORLD_W,
  WORLD_H,
  OFFICE_ROOMS,
  WAYPOINTS,
} from '../constants/officeConfig';
import { buildOfficePath } from '../utils/pathfinding';
import { playRetroTone } from '../utils/audio';

// Daftar area padat (Dinding ruangan dengan celah pintu + Furnitur utama)
const OFFICE_COLLIDERS = [
  // Dinding luar kantor
  { x: 0, y: 0, w: 1000, h: 20 },
  { x: 0, y: 1200, w: 1000, h: 20 },
  { x: 0, y: 0, w: 20, h: 1220 },
  { x: 980, y: 0, w: 20, h: 1220 },

  // Dinding Ruangan Director / Meeting (kiri atas, pintu bawah di x: 250..298)
  { x: 330, y: 20, w: 10, h: 328 },
  { x: 20, y: 340, w: 230, h: 10 },
  { x: 298, y: 340, w: 42, h: 10 },
  { x: 105, y: 115, w: 130, h: 145 }, // Meja rapat

  // Dinding Pantry & Archive (kiri tengah & bawah, celah pintu di y: 410..458 & 840..888)
  { x: 20, y: 360, w: 218, h: 10 },
  { x: 230, y: 360, w: 10, h: 50 },
  { x: 230, y: 458, w: 10, h: 320 },
  { x: 20, y: 770, w: 218, h: 28 },
  { x: 230, y: 790, w: 10, h: 50 },
  { x: 230, y: 888, w: 10, h: 315 },
  { x: 42, y: 395, w: 168, h: 62 }, // Dispenser & Vending machine
  { x: 56, y: 650, w: 96, h: 46 },  // Meja kiri

  // Meja Workstation Product Team (6 blok meja ganda)
  { x: 415, y: 115, w: 96, h: 100 },
  { x: 545, y: 115, w: 96, h: 100 },
  { x: 415, y: 295, w: 96, h: 100 },
  { x: 545, y: 295, w: 96, h: 100 },
  { x: 415, y: 475, w: 96, h: 100 },
  { x: 545, y: 475, w: 96, h: 100 },

  // Sofa & Rak Buku Lounge (kanan atas)
  { x: 754, y: 42, w: 198, h: 42 },
  { x: 756, y: 130, w: 38, h: 86 },
  { x: 924, y: 120, w: 38, h: 86 },
  { x: 825, y: 152, w: 70, h: 40 },
  { x: 820, y: 225, w: 95, h: 36 },

  // Meja Workstation CX Team (kanan)
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
  { x: 478, y: 895, w: 114, h: 150 }, // Meja Pingpong
  { x: 645, y: 905, w: 42, h: 115 },  // Sofa Recreation
];

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

function drawWorkstation(ctx, x, y, screenColor = '#38bdf8', facing = 'down') {
  drawPixelBox(ctx, x, y, 96, 46, '#c88a55', '#2c221e', 2);
  ctx.fillStyle = '#dba06c';
  ctx.fillRect(x + 3, y + 3, 90, 10);

  drawPixelBox(ctx, x + 28, y + 6, 40, 22, '#334155', '#1e293b', 2);
  ctx.fillStyle = screenColor;
  ctx.fillRect(x + 31, y + 9, 34, 15);
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.fillRect(x + 34, y + 12, 18, 2);
  ctx.fillRect(x + 34, y + 16, 24, 2);

  drawPixelBox(ctx, x + 32, y + 31, 30, 8, '#e2e8f0', '#475569', 1.5);
  drawPixelBox(ctx, x + 68, y + 32, 8, 7, '#cbd5e1', '#475569', 1.5);
  drawPixelBox(ctx, x + 8, y + 14, 14, 18, '#fef9c3', '#713f12', 1.5);

  const chairY = facing === 'down' ? y - 16 : y + 48;
  drawPixelBox(ctx, x + 36, chairY, 24, 14, '#475569', '#1e293b', 2);
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

  [390, 500, 610, 780, 880].forEach((wx) => {
    drawPixelBox(ctx, wx, 6, 76, 18, '#bae6fd', '#2c221e', 2);
    ctx.fillStyle = '#e0f2fe';
    ctx.fillRect(wx + 6, 9, 28, 10);
    ctx.fillRect(wx + 42, 9, 28, 10);
  });

  drawPixelBox(ctx, 90, 42, 160, 26, '#f8fafc', '#334155', 2);
  drawPixelBox(ctx, 105, 115, 130, 145, '#b87a4b', '#2c221e', 2.5);
  drawPixelPlant(ctx, 170, 180);
  [125, 170, 215].forEach((cy) => {
    drawPixelBox(ctx, 84, cy, 16, 22, '#6366f1', '#1e1b4b', 2);
    drawPixelBox(ctx, 240, cy, 16, 22, '#6366f1', '#1e1b4b', 2);
  });

  [115, 295, 475].forEach((ry, idx) => {
    drawWorkstation(ctx, 415, ry, idx === 0 ? '#34d399' : '#38bdf8', 'down');
    drawWorkstation(ctx, 545, ry, idx === 0 ? '#60a5fa' : '#a78bfa', 'down');
    drawWorkstation(ctx, 415, ry + 54, '#fbbf24', 'up');
    drawWorkstation(ctx, 545, ry + 54, '#38bdf8', 'up');
  });

  drawBookshelf(ctx, 754, 42, 74);
  drawPixelBox(ctx, 842, 46, 110, 38, '#c084fc', '#2c221e', 2);
  drawPixelBox(ctx, 756, 130, 38, 86, '#60a5fa', '#2c221e', 2);
  drawPixelBox(ctx, 924, 120, 38, 86, '#f87171', '#2c221e', 2);
  drawPixelBox(ctx, 825, 152, 70, 40, '#b87a4b', '#2c221e', 2);
  drawPixelBox(ctx, 820, 225, 95, 36, '#86efac', '#2c221e', 2);

  drawBookshelf(ctx, 756, 355, 86);
  drawBookshelf(ctx, 875, 355, 86);
  [540, 790, 1020].forEach((cy) => {
    drawWorkstation(ctx, 760, cy, '#34d399', 'down');
    drawWorkstation(ctx, 866, cy, '#38bdf8', 'down');
    drawWorkstation(ctx, 760, cy + 54, '#f472b6', 'up');
    drawWorkstation(ctx, 866, cy + 54, '#60a5fa', 'up');
  });

  drawPixelBox(ctx, 495, 795, 84, 18, '#1e293b', '#0f172a', 2);
  drawPixelBox(ctx, 478, 895, 114, 150, '#15803d', '#14532d', 3);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(484, 901, 102, 138);
  ctx.beginPath();
  ctx.moveTo(535, 901);
  ctx.lineTo(535, 1039);
  ctx.stroke();
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(476, 968, 118, 5);
  drawPixelBox(ctx, 645, 905, 42, 115, '#a855f7', '#2c221e', 2);

  drawPixelBox(ctx, 42, 415, 32, 34, '#bae6fd', '#0369a1', 2);
  drawPixelBox(ctx, 86, 405, 56, 46, '#94a3b8', '#334155', 2);
  drawPixelBox(ctx, 154, 395, 56, 62, '#3b82f6', '#1e3a8a', 2);
  drawWorkstation(ctx, 56, 650, '#fbbf24', 'down');

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

function drawRPGCharacter(ctx, entity, timeSec, isDirector = false, isSelected = false) {
  if (!entity || typeof entity.x !== 'number' || typeof entity.y !== 'number') return;

  const isWalking = isDirector
    ? Boolean(entity.isMoving)
    : entity.state === 'WALKING' || (entity.state === 'IDLE' && Boolean(entity.roamTarget));
  const isWorking = !isDirector && entity.state === 'WORKING';

  const bob = isWalking ? Math.abs(Math.sin(entity.walkPhase || 0)) * -4 : 0;
  const shakeX = entity.hitTimer > 0 ? Math.sin(timeSec * 65) * 4 : 0;
  const px = Math.round(entity.x + shakeX);
  const py = Math.round(entity.y + bob);

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
  drawPixelBox(ctx, px - 7, py + 6 + legOffset, 6, 9, '#1e293b', '#0f172a', 1.5);
  drawPixelBox(ctx, px + 1, py + 6 - legOffset, 6, 9, '#1e293b', '#0f172a', 1.5);

  const shirt = entity.shirtColor || entity.accentHex || '#3b82f6';
  const skin = entity.skinColor || '#f8cba6';
  const hair = entity.hairColor || '#1e293b';

  drawPixelBox(ctx, px - 9, py - 5, 18, 13, shirt, '#1e1b18', 2);
  drawPixelBox(ctx, px - 9, py - 21, 18, 16, skin, '#1e1b18', 2);
  drawPixelBox(ctx, px - 10, py - 24, 20, 7, hair, '#1e1b18', 1.5);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(px - 5, py - 14, 2.5, 3);
  ctx.fillRect(px + 3, py - 14, 2.5, 3);

  const labelName = entity.name || 'Agent';
  ctx.font = 'bold 11px "Inter", system-ui, sans-serif';
  const labelW = ctx.measureText(labelName).width + 16;
  const labelY = py - 44;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.beginPath();
  ctx.roundRect(px - labelW / 2, labelY, labelW, 18, 9);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(labelName, px, labelY + 13);

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
  } else if (entity.statusBubble || isWorking) {
    const text = entity.statusBubble || '⚙️ Bekerja...';
    ctx.font = '600 10px "Inter", system-ui, sans-serif';
    const bw = Math.max(38, ctx.measureText(text).width + 16);
    const by = labelY - 24;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#334155';
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

    // Garis cambuk / ayunan melengkung
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(px + 6, py - 4);
    ctx.quadraticCurveTo((px + tx) / 2, py - 26, tx, ty);
    ctx.stroke();

    // Teks efek kartun "PLAK!"
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

export default function OfficeCanvas2D({
  npcRef,
  directorRef,
  simSpeed = 1,
  fxEnabled = true,
  selectedNpcId = null,
  onSelectNpc,
  onClearInspector,
}) {
  const canvasRef = useRef(null);
  const bgBufferRef = useRef(null);
  const keysRef = useRef({});

  // Keyboard WASD / Arrow Keys untuk karakter Director
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        keysRef.current[key] = true;
        if (directorRef?.current) {
          directorRef.current.pathQueue = [];
        }
      }

      if (e.code === 'Space' || key === 'e') {
        e.preventDefault();
        const dir = directorRef?.current;
        const npcs = npcRef?.current || [];
        if (!dir) return;

        // Cari NPC terdekat dalam jarak 75 pixel
        let nearest = null;
        let minDist = 75;
        npcs.forEach((npc) => {
          const d = Math.hypot(npc.x - dir.x, npc.y - dir.y);
          if (d < minDist) {
            minDist = d;
            nearest = npc;
          }
        });

        // Picu animasi ayunan tangan/cambuk Director
        dir.actionTimer = 0.28;
        dir.actionTarget = nearest ? { x: nearest.x, y: nearest.y } : null;
        playRetroTone('slap', fxEnabled);

        if (nearest) {
          const reactions = ['Ampun Bos! 😵', 'Siap kerja! 🫡', 'Aduh! ⚡', 'Oke lembur! 💻'];
          nearest.hitTimer = 0.45;
          nearest.statusBubble = reactions[Math.floor(Math.random() * reactions.length)];
          nearest.bubbleClearTimer = 2.0;

          // Dorong sedikit menjauh (efek kartun) jika lantai aman
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

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [directorRef]);

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
      const scaleX = WORLD_W / rect.width;
      const scaleY = WORLD_H / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
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

    const onMouseMove = (e) => {
      const pt = toWorld(e.clientX, e.clientY);
      const hit = hitTestNpc(pt.x, pt.y);
      canvas.style.cursor = hit ? 'pointer' : 'crosshair';
    };

    const onClick = (e) => {
      const pt = toWorld(e.clientX, e.clientY);
      const hit = hitTestNpc(pt.x, pt.y);
      if (hit) {
        playRetroTone('click', fxEnabled);
        onSelectNpc?.(hit.id);
        return;
      }

      onClearInspector?.();
      const clampedX = Math.max(45, Math.min(WORLD_W - 45, pt.x));
      const clampedY = Math.max(45, Math.min(WORLD_H - 45, pt.y));
      const dir = directorRef?.current;
      if (dir) {
        dir.targetMarker = { x: clampedX, y: clampedY, ttl: 1.0 };
        dir.pathQueue = buildOfficePath(dir.x, dir.y, { x: clampedX, y: clampedY });
        playRetroTone('step', fxEnabled);
      }
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('click', onClick);

    const update = (dt) => {
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

          // Cek sumbu X dan Y terpisah agar karakter bisa meluncur di tepi objek
          if (!isPositionBlocked(nextX, dir.y)) dir.x = nextX;
          if (!isPositionBlocked(dir.x, nextY)) dir.y = nextY;

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
          } else {
            dir.x += (dx / dist) * dirSpeed * dt;
            dir.y += (dy / dist) * dirSpeed * dt;
            dir.isMoving = true;
            dir.walkPhase = (dir.walkPhase || 0) + dt * 14;
          }
        } else {
          dir.isMoving = false;
        }

        if (dir.targetMarker && dir.targetMarker.ttl > 0) {
          dir.targetMarker.ttl -= dt;
        }
      }

      const npcs = npcRef?.current || [];
      const npcSpeed = 180;

      if (dir?.actionTimer > 0) {
        dir.actionTimer = Math.max(0, dir.actionTimer - dt);
      }

      npcs.forEach((npc) => {
        if (npc.hitTimer > 0) npc.hitTimer = Math.max(0, npc.hitTimer - dt);
        if (npc.bubbleClearTimer > 0) {
          npc.bubbleClearTimer -= dt;
          if (npc.bubbleClearTimer <= 0 && npc.state === 'IDLE') {
            npc.statusBubble = '';
          }
        }
        if (npc.state === 'WALKING' && npc.pathQueue && npc.pathQueue.length > 0) {
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
            npc.walkPhase = (npc.walkPhase || 0) + dt * 14;
          }
        } else if (npc.state === 'IDLE') {
          npc.roamCooldown = (npc.roamCooldown ?? 2 + Math.random() * 3) - dt;
          if (npc.roamTarget) {
            const dx = npc.roamTarget.x - npc.x;
            const dy = npc.roamTarget.y - npc.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 3) {
              npc.roamTarget = null;
            } else {
              npc.x += (dx / dist) * 52 * dt;
              npc.y += (dy / dist) * 52 * dt;
              npc.walkPhase = (npc.walkPhase || 0) + dt * 9;
            }
          } else if (npc.roamCooldown <= 0) {
            npc.roamCooldown = 3 + Math.random() * 4;
            const spots = [
              npc.homeSpot,
              WAYPOINTS.loungeSofa,
              WAYPOINTS.lounge_alex,
              WAYPOINTS.lounge_raka,
              WAYPOINTS.lounge_nadia,
            ].filter(Boolean);
            npc.roamTarget = spots[Math.floor(Math.random() * spots.length)];
          }
        }
      });
    };

    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1) * simSpeed;
      lastTime = now;
      update(dt);

      ctx.clearRect(0, 0, WORLD_W, WORLD_H);
      ctx.drawImage(bgBufferRef.current, 0, 0);

      const dir = directorRef?.current;
      if (dir?.targetMarker && dir.targetMarker.ttl > 0) {
        ctx.save();
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = Math.max(0, dir.targetMarker.ttl);
        ctx.beginPath();
        ctx.arc(dir.targetMarker.x, dir.targetMarker.y, 14 * (1.2 - dir.targetMarker.ttl), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      const npcs = npcRef?.current || [];
      const renderList = [
        ...(dir ? [{ ...dir, isDirector: true }] : []),
        ...npcs.map((n) => ({ ...n, isDirector: false })),
      ].sort((a, b) => (a.y || 0) - (b.y || 0));

      renderList.forEach((ent) =>
        drawRPGCharacter(ctx, ent, now / 1000, ent.isDirector, ent.id === selectedNpcId)
      );

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('click', onClick);
    };
  }, [simSpeed, fxEnabled, selectedNpcId, npcRef, directorRef, onSelectNpc, onClearInspector]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#1e1b24] flex items-center justify-center p-2">
      <canvas
        ref={canvasRef}
        width={WORLD_W}
        height={WORLD_H}
        className="rounded-xl shadow-2xl border-2 border-slate-700 max-w-full max-h-full w-auto h-full object-contain"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}
