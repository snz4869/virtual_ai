import React, { useEffect, useRef } from 'react';
import {
  WORLD_W,
  WORLD_H,
  OFFICE_ROOMS,
  WAYPOINTS,
} from '../constants/officeConfig';
import { buildNavigationPath } from '../utils/pathfinding';

// Helper menggambar kotak pixel-art ber-outline gelap (gaya Stardew Valley)
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

// Helper tanaman hias pixel-art
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

// Helper workstation kayu + monitor + keyboard + kursi
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

// Helper Rak Buku
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

// Render seluruh latar statis kantor ke 1 offscreen canvas (sekali saja!)
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

function drawRPGCharacter(ctx, entity, frameTick) {
  const { x, y, name, shirtColor, hairColor, skinColor, isMoving, status, bubbleText } = entity;
  const bob = isMoving ? Math.sin(frameTick * 0.25) * 2.5 : 0;
  const px = Math.round(x);
  const py = Math.round(y + bob);

  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(px, Math.round(y) + 15, 11, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const legOffset = isMoving ? Math.sin(frameTick * 0.3) * 3 : 0;
  drawPixelBox(ctx, px - 7, py + 6 + legOffset, 6, 9, '#1e293b', '#0f172a', 1.5);
  drawPixelBox(ctx, px + 1, py + 6 - legOffset, 6, 9, '#1e293b', '#0f172a', 1.5);

  drawPixelBox(ctx, px - 9, py - 5, 18, 13, shirtColor, '#1e1b18', 2);
  drawPixelBox(ctx, px - 9, py - 21, 18, 16, skinColor, '#1e1b18', 2);
  drawPixelBox(ctx, px - 10, py - 24, 20, 7, hairColor, '#1e1b18', 1.5);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(px - 5, py - 14, 2.5, 3);
  ctx.fillRect(px + 3, py - 14, 2.5, 3);

  ctx.font = 'bold 11px "Inter", system-ui, sans-serif';
  const labelW = ctx.measureText(name).width + 16;
  const labelY = py - 44;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.beginPath();
  ctx.roundRect(px - labelW / 2, labelY, labelW, 18, 9);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(name, px, labelY + 13);

  if (bubbleText || status === 'WORKING') {
    const text = bubbleText || '...';
    ctx.font = '600 10px "Inter", system-ui, sans-serif';
    const bw = Math.max(34, ctx.measureText(text).width + 16);
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
}

export default function OfficeCanvas2D({ agents, activeTask, directorTarget, onDirectorArrive }) {
  const canvasRef = useRef(null);
  const bgBufferRef = useRef(null);
  const keysRef = useRef({});
  const stateRef = useRef({
    director: {
      x: WAYPOINTS.hallwayCenter.x,
      y: WAYPOINTS.hallwayCenter.y,
      name: 'You (Director)',
      shirtColor: '#f59e0b',
      hairColor: '#1e293b',
      skinColor: '#f8cba6',
      isMoving: false,
      path: [],
    },
    npcs: {},
    tick: 0,
  });

  useEffect(() => {
    agents.forEach((ag) => {
      if (!stateRef.current.npcs[ag.id]) {
        const home = WAYPOINTS[ag.homeSpot] || WAYPOINTS.leadDesk;
        stateRef.current.npcs[ag.id] = {
          ...ag,
          x: home.x,
          y: home.y,
          path: [],
          isMoving: false,
        };
      } else {
        Object.assign(stateRef.current.npcs[ag.id], ag);
      }
    });
  }, [agents]);

  useEffect(() => {
    if (directorTarget) {
      stateRef.current.director.path = buildNavigationPath(
        stateRef.current.director,
        directorTarget
      );
    }
  }, [directorTarget]);

  useEffect(() => {
    const down = (e) => {
      keysRef.current[e.key.toLowerCase()] = true;
    };
    const up = (e) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useEffect(() => {
    if (!bgBufferRef.current) {
      bgBufferRef.current = createOfficeBackgroundBuffer();
    }

    let animId;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const moveAlongPath = (entity, speed = 2.4) => {
      if (!entity.path || entity.path.length === 0) {
        entity.isMoving = false;
        return;
      }
      const next = entity.path[0];
      const dx = next.x - entity.x;
      const dy = next.y - entity.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= speed) {
        entity.x = next.x;
        entity.y = next.y;
        entity.path.shift();
        if (entity.path.length === 0) {
          entity.isMoving = false;
          if (entity === stateRef.current.director && onDirectorArrive) {
            onDirectorArrive();
          }
        }
      } else {
        entity.x += (dx / dist) * speed;
        entity.y += (dy / dist) * speed;
        entity.isMoving = true;
      }
    };

    const loop = () => {
      const st = stateRef.current;
      st.tick += 1;

      const keys = keysRef.current;
      let vx = 0;
      let vy = 0;
      if (keys['w'] || keys['arrowup']) vy -= 2.6;
      if (keys['s'] || keys['arrowdown']) vy += 2.6;
      if (keys['a'] || keys['arrowleft']) vx -= 2.6;
      if (keys['d'] || keys['arrowright']) vx += 2.6;

      if (vx !== 0 || vy !== 0) {
        st.director.path = [];
        st.director.x = Math.max(30, Math.min(WORLD_W - 30, st.director.x + vx));
        st.director.y = Math.max(30, Math.min(WORLD_H - 30, st.director.y + vy));
        st.director.isMoving = true;
      } else {
        moveAlongPath(st.director, 2.8);
      }

      Object.values(st.npcs).forEach((npc) => {
        const targetSpot =
          npc.status === 'WORKING' ? npc.homeSpot : npc.roamSpot || npc.homeSpot;
        const dest = WAYPOINTS[targetSpot];
        if (dest && Math.hypot(dest.x - npc.x, dest.y - npc.y) > 8 && npc.path.length === 0) {
          npc.path = buildNavigationPath(npc, targetSpot);
        }
        moveAlongPath(npc, 2.1);
      });

      ctx.clearRect(0, 0, WORLD_W, WORLD_H);
      ctx.drawImage(bgBufferRef.current, 0, 0);

      const entities = [st.director, ...Object.values(st.npcs)].sort(
        (a, b) => a.y - b.y
      );
      entities.forEach((ent) => drawRPGCharacter(ctx, ent, st.tick));

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [activeTask, onDirectorArrive]);

  return (
    <div className="relative w-full h-full overflow-auto bg-[#1e1b24] flex items-start justify-center p-3">
      <canvas
        ref={canvasRef}
        width={WORLD_W}
        height={WORLD_H}
        className="rounded-xl shadow-2xl border-2 border-slate-700 max-w-full h-auto"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}
