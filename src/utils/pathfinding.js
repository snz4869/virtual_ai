import { WORLD_W, WORLD_H, WAYPOINTS, OFFICE_COLLIDERS } from '../constants/officeConfig.js';
import {
  VILLAGE_COLLIDERS,
  VILLAGE_H,
  VILLAGE_W,
  VILLAGE_WAYPOINTS,
} from '../constants/villageConfig.js';

const CELL = 20;

const gridCache = new WeakMap();

export function isFootBlocked(x, y, colliders = OFFICE_COLLIDERS) {
  const footBox = { x: x - 9, y: y + 4, w: 18, h: 12 };
  return colliders.some(
    (b) =>
      footBox.x < b.x + b.w &&
      footBox.x + footBox.w > b.x &&
      footBox.y < b.y + b.h &&
      footBox.y + footBox.h > b.y
  );
}

function getGrid(colliders = OFFICE_COLLIDERS, width = WORLD_W, height = WORLD_H) {
  const cached = gridCache.get(colliders);
  if (cached && cached.width === width && cached.height === height) return cached;
  const cols = Math.ceil(width / CELL);
  const rows = Math.ceil(height / CELL);
  const cells = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      const cx = c * CELL + CELL / 2;
      const cy = r * CELL + CELL / 2;
      return isFootBlocked(cx, cy, colliders);
    })
  );
  const entry = { cells, cols, rows, width, height };
  gridCache.set(colliders, entry);
  return entry;
}

class MinHeap {
  constructor() {
    this.data = [];
  }
  get size() {
    return this.data.length;
  }
  push(node) {
    this.data.push(node);
    this._bubbleUp(this.data.length - 1);
  }
  pop() {
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length > 0) {
      this.data[0] = last;
      this._sinkDown(0);
    }
    return top;
  }
  _bubbleUp(i) {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.data[i].f >= this.data[parent].f) break;
      [this.data[i], this.data[parent]] = [this.data[parent], this.data[i]];
      i = parent;
    }
  }
  _sinkDown(i) {
    const n = this.data.length;
    while (true) {
      let smallest = i;
      const left = (i << 1) + 1;
      const right = left + 1;
      if (left < n && this.data[left].f < this.data[smallest].f) smallest = left;
      if (right < n && this.data[right].f < this.data[smallest].f) smallest = right;
      if (smallest === i) break;
      [this.data[i], this.data[smallest]] = [this.data[smallest], this.data[i]];
      i = smallest;
    }
  }
}

// Jika titik klik berada di atas meja/dinding, cari sel lantai terdekat yang bebas
function findNearestWalkable(grid, cols, rows, col, row) {
  const c0 = Math.max(0, Math.min(cols - 1, col));
  const r0 = Math.max(0, Math.min(rows - 1, row));
  if (!grid[r0][c0]) return { c: c0, r: r0 };

  for (let radius = 1; radius <= 16; radius++) {
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        const nr = r0 + dr;
        const nc = c0 + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !grid[nr][nc]) {
          return { c: nc, r: nr };
        }
      }
    }
  }
  return { c: c0, r: r0 };
}

function hasLineOfSight(ax, ay, bx, by, colliders = OFFICE_COLLIDERS) {
  const dist = Math.hypot(bx - ax, by - ay);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    if (isFootBlocked(ax + (bx - ax) * t, ay + (by - ay) * t, colliders)) {
      return false;
    }
  }
  return true;
}

/**
 * Melakukan string-pulling (line-of-sight) agar gerakan karakter mulus
 * tanpa patah-patah mengikuti grid 20px, sambil tetap 100% bebas tabrakan.
 */
function smoothPath(startX, startY, waypoints, colliders = OFFICE_COLLIDERS) {
  if (waypoints.length <= 1) return waypoints;

  const smoothed = [];
  let anchor = { x: startX, y: startY };
  let idx = 0;

  while (idx < waypoints.length) {
    let farthest = idx;
    for (let probe = waypoints.length - 1; probe > idx; probe--) {
      if (hasLineOfSight(anchor.x, anchor.y, waypoints[probe].x, waypoints[probe].y, colliders)) {
        farthest = probe;
        break;
      }
    }
    smoothed.push(waypoints[farthest]);
    anchor = waypoints[farthest];
    idx = farthest + 1;
  }

  return smoothed;
}

function buildPathForMap(
  fromX,
  fromY,
  target,
  colliders,
  waypointsMap,
  fallbackWaypoint,
  width,
  height
) {
  const dest =
    typeof target === 'string'
      ? waypointsMap[target] || fallbackWaypoint
      : target || fallbackWaypoint;

  const { cells: grid, cols, rows } = getGrid(colliders, width, height);
  const start = findNearestWalkable(grid, cols, rows, Math.floor(fromX / CELL), Math.floor(fromY / CELL));
  const goal = findNearestWalkable(grid, cols, rows, Math.floor(dest.x / CELL), Math.floor(dest.y / CELL));

  const goalWorld = { x: goal.c * CELL + CELL / 2, y: goal.r * CELL + CELL / 2 };
  const exactTarget =
    !isFootBlocked(dest.x, dest.y, colliders) &&
    hasLineOfSight(goalWorld.x, goalWorld.y, dest.x, dest.y, colliders)
      ? { x: dest.x, y: dest.y }
      : goalWorld;

  if (start.c === goal.c && start.r === goal.r) {
    return [exactTarget];
  }

  // Jalur langsung jika garis lurus sudah bebas hambatan
  if (
    !isFootBlocked(fromX, fromY, colliders) &&
    hasLineOfSight(fromX, fromY, exactTarget.x, exactTarget.y, colliders)
  ) {
    return [exactTarget];
  }

  const open = new MinHeap();
  const closed = new Uint8Array(rows * cols);
  const bestG = new Float32Array(rows * cols);
  bestG.fill(Infinity);

  const idxOf = (c, r) => r * cols + c;
  const startIdx = idxOf(start.c, start.r);
  bestG[startIdx] = 0;
  open.push({
    c: start.c,
    r: start.r,
    g: 0,
    f: Math.hypot(goal.c - start.c, goal.r - start.r),
    parent: null,
  });

  const dirs = [
    [1, 0, 1],
    [-1, 0, 1],
    [0, 1, 1],
    [0, -1, 1],
    [1, 1, 1.4142],
    [1, -1, 1.4142],
    [-1, 1, 1.4142],
    [-1, -1, 1.4142],
  ];

  while (open.size > 0) {
    const curr = open.pop();
    const currIdx = idxOf(curr.c, curr.r);
    if (closed[currIdx]) continue;
    closed[currIdx] = 1;

    if (curr.c === goal.c && curr.r === goal.r) {
      const rawWaypoints = [];
      let node = curr;
      while (node) {
        rawWaypoints.push({
          x: node.c * CELL + CELL / 2,
          y: node.r * CELL + CELL / 2,
        });
        node = node.parent;
      }
      rawWaypoints.reverse();
      if (exactTarget.x !== goalWorld.x || exactTarget.y !== goalWorld.y) {
        rawWaypoints.push(exactTarget);
      }
      return smoothPath(fromX, fromY, rawWaypoints, colliders);
    }

    for (const [dc, dr, cost] of dirs) {
      const nc = curr.c + dc;
      const nr = curr.r + dr;
      if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;
      const nIdx = idxOf(nc, nr);
      if (grid[nr][nc] || closed[nIdx]) continue;
      // Cegah potong sudut diagonal atau menyenggol tepi dinding/furnitur
      if (dc !== 0 && dr !== 0 && (grid[curr.r][nc] || grid[nr][curr.c])) continue;
      if (
        !hasLineOfSight(
          curr.c * CELL + CELL / 2,
          curr.r * CELL + CELL / 2,
          nc * CELL + CELL / 2,
          nr * CELL + CELL / 2,
          colliders
        )
      ) {
        continue;
      }

      const g = curr.g + cost;
      if (g >= bestG[nIdx]) continue;
      bestG[nIdx] = g;

      const h = Math.hypot(goal.c - nc, goal.r - nr);
      open.push({ c: nc, r: nr, g, f: g + h, parent: curr });
    }
  }

  return [goalWorld];
}

export function buildOfficePath(fromX, fromY, target) {
  return buildPathForMap(
    fromX,
    fromY,
    target,
    OFFICE_COLLIDERS,
    WAYPOINTS,
    WAYPOINTS.hallwayCenter,
    WORLD_W,
    WORLD_H
  );
}

export function buildVillagePath(fromX, fromY, target) {
  return buildPathForMap(
    fromX,
    fromY,
    target,
    VILLAGE_COLLIDERS,
    VILLAGE_WAYPOINTS,
    VILLAGE_WAYPOINTS.officeFront,
    VILLAGE_W,
    VILLAGE_H
  );
}

export function buildNavigationPath(startPos, targetKey) {
  return buildOfficePath(startPos.x, startPos.y, targetKey);
}
