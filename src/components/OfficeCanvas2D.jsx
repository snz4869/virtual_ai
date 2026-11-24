import React, { useEffect, useRef } from 'react';
import { OFFICE_ROOMS, WAYPOINTS, WORLD_H, WORLD_W } from '../constants/officeConfig';
import { buildOfficePath } from '../utils/pathfinding';
import { playRetroTone } from '../utils/audio';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export default function OfficeCanvas2D({
  npcRef,
  directorRef,
  simSpeed,
  fxEnabled,
  selectedNpcId,
  onSelectNpc,
  onClearInspector
}) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const hoveredNpcRef = useRef(null);
  const particlesRef = useRef([]);
  const keysPressedRef = useRef({});

  // Keyboard WASD / Arrow Keys listener for Director movement
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        keysPressedRef.current[key] = true;
        // Cancel click-to-walk path when manual keyboard movement starts
        if (directorRef.current) {
          directorRef.current.pathQueue = [];
        }
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      delete keysPressedRef.current[key];
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [directorRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const ctx = canvas.getContext('2d');
    let dpr = window.devicePixelRatio || 1;
    let animId;
    let lastTime = performance.now();

    const resize = () => {
      const rect = wrapper.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };
    resize();
    window.addEventListener('resize', resize);

    const getTransform = () => {
      const cw = canvas.width / dpr;
      const ch = canvas.height / dpr;
      const scale = Math.min(cw / WORLD_W, ch / WORLD_H);
      const offsetX = (cw - WORLD_W * scale) / 2;
      const offsetY = (ch - WORLD_H * scale) / 2;
      return { scale, offsetX, offsetY, cw, ch };
    };

    const toWorld = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const { scale, offsetX, offsetY } = getTransform();
      return {
        x: (clientX - rect.left - offsetX) / scale,
        y: (clientY - rect.top - offsetY) / scale
      };
    };

    const hitTestNpc = (wx, wy) => {
      const npcs = npcRef.current || [];
      for (const npc of npcs) {
        if (Math.hypot(wx - npc.x, wy - (npc.y - 6)) <= 24) return npc;
        const d = npc.deskRect;
        if (wx >= d.x && wx <= d.x + d.w && wy >= d.y && wy <= d.y + d.h) return npc;
      }
      return null;
    };

    const onMouseMove = (e) => {
      const pt = toWorld(e.clientX, e.clientY);
      const hit = hitTestNpc(pt.x, pt.y);
      hoveredNpcRef.current = hit ? hit.id : null;
      canvas.style.cursor = hit ? 'pointer' : 'crosshair';
    };

    const onClick = (e) => {
      const pt = toWorld(e.clientX, e.clientY);
      const hit = hitTestNpc(pt.x, pt.y);
      if (hit) {
        playRetroTone('click', fxEnabled);
        onSelectNpc(hit.id);
        return;
      }

      onClearInspector();
      // Click-to-move Director character inside walkable floor bounds
      const clampedX = Math.max(55, Math.min(WORLD_W - 55, pt.x));
      const clampedY = Math.max(65, Math.min(WORLD_H - 55, pt.y));
      const dir = directorRef.current;
      if (dir) {
        dir.targetMarker = { x: clampedX, y: clampedY, ttl: 1.0 };
        dir.pathQueue = buildOfficePath(dir.x, dir.y, { x: clampedX, y: clampedY });
        playRetroTone('step', fxEnabled);
      }
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('click', onClick);

    const update = (dt) => {
      const dir = directorRef.current;
      const keys = keysPressedRef.current;
      const dirSpeed = 210;

      if (dir) {
        let vx = 0;
        let vy = 0;
        if (keys['w'] || keys['arrowup']) vy -= 1;
        if (keys['s'] || keys['arrowdown']) vy += 1;
        if (keys['a'] || keys['arrowleft']) vx -= 1;
        if (keys['d'] || keys['arrowright']) vx += 1;

        if (vx !== 0 || vy !== 0) {
          const len = Math.hypot(vx, vy);
          dir.x = Math.max(50, Math.min(WORLD_W - 50, dir.x + (vx / len) * dirSpeed * dt));
          dir.y = Math.max(60, Math.min(WORLD_H - 50, dir.y + (vy / len) * dirSpeed * dt));
          dir.isMoving = true;
          dir.walkPhase += dt * 14;
          if (Math.abs(vx) > Math.abs(vy)) dir.facing = vx > 0 ? 'right' : 'left';
          else dir.facing = vy > 0 ? 'down' : 'up';
        } else if (dir.pathQueue && dir.pathQueue.length > 0) {
          const nextPt = dir.pathQueue[0];
          const dx = nextPt.x - dir.x;
          const dy = nextPt.y - dir.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 4) {
            dir.x = nextPt.x;
            dir.y = nextPt.y;
            dir.pathQueue.shift();
          } else {
            dir.x += (dx / dist) * dirSpeed * dt;
            dir.y += (dy / dist) * dirSpeed * dt;
            dir.isMoving = true;
            dir.walkPhase += dt * 14;
            if (Math.abs(dx) > Math.abs(dy)) dir.facing = dx > 0 ? 'right' : 'left';
            else dir.facing = dy > 0 ? 'down' : 'up';
          }
        } else {
          dir.isMoving = false;
          dir.walkPhase += dt * 2.2;
        }

        if (dir.targetMarker && dir.targetMarker.ttl > 0) {
          dir.targetMarker.ttl -= dt;
        }
      }

      // Update NPCs (Active task navigation + Idle Lounge Roaming)
      const npcs = npcRef.current || [];
      const npcSpeed = 175;

      npcs.forEach((npc) => {
        if (npc.state === 'WALKING' && npc.pathQueue.length > 0) {
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
            npc.walkPhase += dt * 14;
            if (Math.abs(dx) > Math.abs(dy)) npc.facing = dx > 0 ? 'right' : 'left';
            else npc.facing = dy > 0 ? 'down' : 'up';

            npc.stepTimer = (npc.stepTimer || 0) + dt;
            if (npc.stepTimer > 0.3) {
              npc.stepTimer = 0;
              playRetroTone('step', fxEnabled);
            }
          }
        } else if (npc.state === 'IDLE') {
          // Ambient Lounge Roaming when idle
          npc.roamCooldown = (npc.roamCooldown ?? 2 + Math.random() * 4) - dt;
          if (npc.roamTarget) {
            const dx = npc.roamTarget.x - npc.x;
            const dy = npc.roamTarget.y - npc.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 3) {
              npc.roamTarget = null;
              npc.facing = 'down';
            } else {
              const roamSpeed = 48;
              npc.x += (dx / dist) * roamSpeed * dt;
              npc.y += (dy / dist) * roamSpeed * dt;
              npc.walkPhase += dt * 8;
              npc.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
            }
          } else {
            npc.walkPhase += dt * 2;
            if (npc.roamCooldown <= 0) {
              npc.roamCooldown = 3.5 + Math.random() * 4.5;
              const spots = [
                npc.homeSpot,
                WAYPOINTS.lounge_coffee,
                WAYPOINTS.lounge_sofa,
                { x: 95 + Math.random() * 165, y: 450 + Math.random() * 145 }
              ];
              npc.roamTarget = spots[Math.floor(Math.random() * spots.length)];
            }
          }
        } else if (npc.state === 'WORKING') {
          npc.walkPhase += dt * 3;
          if (fxEnabled && Math.random() < 0.25) {
            particlesRef.current.push({
              x: npc.x + (Math.random() - 0.5) * 24,
              y: npc.y - 32,
              vx: (Math.random() - 0.5) * 14,
              vy: -22 - Math.random() * 16,
              alpha: 1,
              size: 2.5 + Math.random() * 1.5,
              color: npc.accentLight
            });
          }
        } else {
          npc.walkPhase += dt * 2.2;
        }
      });

      // Update particles
      const pts = particlesRef.current;
      for (let i = pts.length - 1; i >= 0; i--) {
        pts[i].x += pts[i].vx * dt;
        pts[i].y += pts[i].vy * dt;
        pts[i].alpha -= dt * 1.2;
        if (pts[i].alpha <= 0) pts.splice(i, 1);
      }
    };

    const drawRoom = (room) => {
      roundRect(ctx, room.x, room.y, room.w, room.h, 14);
      ctx.fillStyle = room.bg;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = room.border;
      ctx.stroke();

      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(room.label, room.x + 12, room.y + 18);
    };

    const drawCharacter = (char, timeSec, isDirector = false) => {
      const isHovered = !isDirector && hoveredNpcRef.current === char.id;
      const isSelected = !isDirector && selectedNpcId === char.id;
      const isWalking = isDirector
        ? char.isMoving
        : char.state === 'WALKING' || (char.state === 'IDLE' && Boolean(char.roamTarget));
      const isWorking = !isDirector && char.state === 'WORKING';

      const bobY = isWalking ? Math.abs(Math.sin(char.walkPhase)) * -4.5 : Math.sin(char.walkPhase) * 1.4;
      const { x, y } = char;

      ctx.save();

      if (isDirector || isHovered || isSelected) {
        ctx.beginPath();
        ctx.ellipse(x, y + 14, 21, 9, 0, 0, Math.PI * 2);
        ctx.fillStyle = isDirector
          ? 'rgba(236, 72, 153, 0.2)'
          : isSelected
          ? 'rgba(99, 102, 241, 0.25)'
          : 'rgba(255, 255, 255, 0.14)';
        ctx.fill();
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = isDirector ? '#ec4899' : isSelected ? '#818cf8' : '#e2e8f0';
        ctx.stroke();
      }

      // Shadow
      ctx.beginPath();
      ctx.ellipse(x, y + 14, 13, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fill();

      // Legs
      const leftLeg = isWalking ? Math.sin(char.walkPhase) * 4 : 0;
      const rightLeg = isWalking ? -Math.sin(char.walkPhase) * 4 : 0;
      ctx.fillStyle = '#1e293b';
      roundRect(ctx, x - 7, y + 5 + leftLeg, 5, 9, 2);
      ctx.fill();
      roundRect(ctx, x + 2, y + 5 + rightLeg, 5, 9, 2);
      ctx.fill();

      // Torso
      roundRect(ctx, x - 10, y - 9 + bobY, 20, 16, 5);
      ctx.fillStyle = char.accentHex;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();

      // Head
      ctx.beginPath();
      ctx.arc(x, y - 18 + bobY, 10, 0, Math.PI * 2);
      ctx.fillStyle = char.skinColor;
      ctx.fill();
      ctx.stroke();

      // Hair
      ctx.beginPath();
      ctx.arc(x, y - 20 + bobY, 10, Math.PI, Math.PI * 2);
      ctx.fillStyle = char.hairColor;
      ctx.fill();

      // Eyes
      const eyeShift = char.facing === 'left' ? -3 : char.facing === 'right' ? 3 : 0;
      if (char.facing !== 'up') {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(x - 3.5 + eyeShift, y - 17 + bobY, 1.5, 0, Math.PI * 2);
        ctx.arc(x + 3.5 + eyeShift, y - 17 + bobY, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Carrying document icon
      if (char.carryingDoc) {
        roundRect(ctx, x + 10, y - 8 + bobY, 12, 14, 2);
        ctx.fillStyle = '#f8fafc';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Name Pill
      ctx.font = '600 10px "Inter", sans-serif';
      const tw = ctx.measureText(char.name).width;
      roundRect(ctx, x - tw / 2 - 6, y + 20, tw + 12, 16, 6);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fill();
      ctx.strokeStyle = char.accentHex;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.fillText(char.name, x, y + 31);
      ctx.textAlign = 'left';

      // Reporting Exclamation or Bubble
      if (char.hasReportExclamation) {
        const bounce = Math.sin(timeSec * 8) * 3;
        roundRect(ctx, x - 13, y - 56 + bounce, 26, 22, 8);
        ctx.fillStyle = '#10b981';
        ctx.fill();
        ctx.strokeStyle = '#ecfdf5';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.font = '700 14px "JetBrains Mono", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('!', x, y - 40 + bounce);
        ctx.textAlign = 'left';
      } else if (char.statusBubble) {
        ctx.font = '600 10px "Inter", sans-serif';
        const bw = ctx.measureText(char.statusBubble).width + 16;
        roundRect(ctx, x - bw / 2, y - 55 + bobY, bw, 21, 8);
        ctx.fillStyle = isWorking ? 'rgba(30, 41, 59, 0.96)' : 'rgba(15, 23, 42, 0.92)';
        ctx.fill();
        ctx.strokeStyle = char.accentHex;
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        ctx.fillText(char.statusBubble, x, y - 41 + bobY);
        ctx.textAlign = 'left';
      }

      ctx.restore();
    };

    const render = (timeSec) => {
      const { scale, offsetX, offsetY, cw, ch } = getTransform();
      ctx.save();
      ctx.scale(dpr, dpr);

      ctx.fillStyle = '#070b14';
      ctx.fillRect(0, 0, cw, ch);

      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      // Outer Floor
      roundRect(ctx, 18, 18, WORLD_W - 36, WORLD_H - 36, 18);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#1e293b';
      ctx.stroke();

      // Grid lines
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.5)';
      ctx.lineWidth = 1;
      for (let x = 20; x < WORLD_W - 20; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 20);
        ctx.lineTo(x, WORLD_H - 20);
        ctx.stroke();
      }
      for (let y = 20; y < WORLD_H - 20; y += 40) {
        ctx.beginPath();
        ctx.moveTo(20, y);
        ctx.lineTo(WORLD_W - 20, y);
        ctx.stroke();
      }

      // Central Hallway Carpet
      ctx.fillStyle = 'rgba(30, 41, 59, 0.55)';
      ctx.fillRect(320, 308, 630, 44);
      ctx.fillRect(338, 165, 40, 330);

      // Draw 5 Rooms
      Object.values(OFFICE_ROOMS).forEach(drawRoom);

      // Room Props: Director Executive Desk
      roundRect(ctx, 75, 95, 62, 110, 8);
      ctx.fillStyle = '#78350f';
      ctx.fill();
      ctx.strokeStyle = '#b45309';
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(98, 115, 10, 26);
      ctx.fillStyle = '#ec4899';
      ctx.fillRect(98, 152, 10, 26);

      // Room Props: Lounge Sofa & Coffee Bar
      roundRect(ctx, 68, 415, 115, 30, 8);
      ctx.fillStyle = '#312e81';
      ctx.fill();
      roundRect(ctx, 232, 412, 46, 56, 6);
      ctx.fillStyle = '#334155';
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(255, 428, 3, 0, Math.PI * 2);
      ctx.fill();

      // NPC Desks
      const npcs = npcRef.current || [];
      npcs.forEach((npc) => {
        const d = npc.deskRect;
        const isWorking = npc.state === 'WORKING';
        roundRect(ctx, d.x, d.y, d.w, d.h, 8);
        ctx.fillStyle = '#5c2d16';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = isWorking ? npc.accentHex : '#92400e';
        ctx.stroke();

        // Monitor
        ctx.fillStyle = '#090d16';
        ctx.fillRect(d.x + d.w / 2 - 22, d.y + 10, 44, 16);
        ctx.fillStyle = isWorking ? npc.accentHex : '#1e293b';
        ctx.fillRect(d.x + d.w / 2 - 19, d.y + 13, 38, 10);
      });

      // Click target ring for Director
      const dir = directorRef.current;
      if (dir?.targetMarker && dir.targetMarker.ttl > 0) {
        ctx.save();
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 2;
        ctx.globalAlpha = Math.max(0, dir.targetMarker.ttl);
        ctx.beginPath();
        ctx.arc(dir.targetMarker.x, dir.targetMarker.y, 14 * (1.2 - dir.targetMarker.ttl), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Depth-sorted Characters (Director + NPCs)
      const allChars = [
        ...(dir ? [{ ...dir, isDirector: true }] : []),
        ...npcs.map((n) => ({ ...n, isDirector: false }))
      ].sort((a, b) => a.y - b.y);

      allChars.forEach((c) => drawCharacter(c, timeSec, c.isDirector));

      // Particles
      particlesRef.current.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      ctx.restore();
    };

    const loop = (now) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1) * simSpeed;
      lastTime = now;
      update(dt);
      render(now / 1000);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('click', onClick);
    };
  }, [simSpeed, fxEnabled, selectedNpcId, npcRef, directorRef, onSelectNpc, onClearInspector]);

  return (
    <div ref={wrapperRef} className="flex-1 relative overflow-hidden select-none">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
