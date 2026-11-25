import { WORLD_W, WORLD_H, WAYPOINTS, OFFICE_COLLIDERS } from '../constants/officeConfig.js';

const CELL = 20;
const COLS = Math.ceil(WORLD_W / CELL);
const ROWS = Math.ceil(WORLD_H / CELL);

let blockedGrid = null;

export function isFootBlocked(x, y) {
  const footBox = { x: x - 9, y: y + 4, w: 18, h: 12 };
  return OFFICE_COLLIDERS.some(
    (b) =>
      footBox.x < b.x + b.w &&
      footBox.x + footBox.w > b.x &&
      footBox.y < b.y + b.h &&
      footBox.y + footBox.h > b.y
  );
}

function getGrid() {
  if (blockedGrid) return blockedGrid;
  blockedGrid = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => {
      const cx = c * CELL + CELL / 2;
      const cy = r * CELL + CELL / 2;
      return isFootBlocked(cx, cy);
    })
  );
  return blockedGrid;
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
function findNearestWalkable(grid, col, row) {
  const c0 = Math.max(0, Math.min(COLS - 1, col));
  const r0 = Math.max(0, Math.min(ROWS - 1, row));
  if (!grid[r0][c0]) return { c: c0, r: r0 };

  for (let radius = 1; radius <= 12; radius++) {
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        const nr = r0 + dr;
        const nc = c0 + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !grid[nr][nc]) {
          return { c: nc, r: nr };
        }
      }
    }
  }
  return { c: c0, r: r0 };
}

function hasLineOfSight(ax, ay, bx, by) {
  const dist = Math.hypot(bx - ax, by - ay);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    if (isFootBlocked(ax + (bx - ax) * t, ay + (by - ay) * t)) {
      return false;
    }
  }
  return true;
}

/**
 * Melakukan string-pulling (line-of-sight) agar gerakan karakter mulus
 * tanpa patah-patah mengikuti grid 20px, sambil tetap 100% bebas tabrakan.
 */
function smoothPath(startX, startY, waypoints) {
  if (waypoints.length <= 1) return waypoints;

  const smoothed = [];
  let anchor = { x: startX, y: startY };
  let idx = 0;

  while (idx < waypoints.length) {
    let farthest = idx;
    for (let probe = waypoints.length - 1; probe > idx; probe--) {
      if (hasLineOfSight(anchor.x, anchor.y, waypoints[probe].x, waypoints[probe].y)) {
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

export function buildOfficePath(fromX, fromY, target) {
  const dest =
    typeof target === 'string'
      ? WAYPOINTS[target] || WAYPOINTS.hallwayCenter
      : target || WAYPOINTS.hallwayCenter;

  const grid = getGrid();
  const start = findNearestWalkable(grid, Math.floor(fromX / CELL), Math.floor(fromY / CELL));
  const goal = findNearestWalkable(grid, Math.floor(dest.x / CELL), Math.floor(dest.y / CELL));

  const goalWorld = { x: goal.c * CELL + CELL / 2, y: goal.r * CELL + CELL / 2 };
  const exactTarget =
    !isFootBlocked(dest.x, dest.y) && hasLineOfSight(goalWorld.x, goalWorld.y, dest.x, dest.y)
      ? { x: dest.x, y: dest.y }
      : goalWorld;

  if (start.c === goal.c && start.r === goal.r) {
    return [exactTarget];
  }

  // Jalur langsung jika garis lurus sudah bebas hambatan
  if (!isFootBlocked(fromX, fromY) && hasLineOfSight(fromX, fromY, exactTarget.x, exactTarget.y)) {
    return [exactTarget];
  }

  const open = new MinHeap();
  const closed = new Uint8Array(ROWS * COLS);
  const bestG = new Float32Array(ROWS * COLS);
  bestG.fill(Infinity);

  const idxOf = (c, r) => r * COLS + c;
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
      return smoothPath(fromX, fromY, rawWaypoints);
    }

    for (const [dc, dr, cost] of dirs) {
      const nc = curr.c + dc;
      const nr = curr.r + dr;
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
      const nIdx = idxOf(nc, nr);
      if (grid[nr][nc] || closed[nIdx]) continue;
      // Cegah potong sudut diagonal atau menyenggol tepi dinding/furnitur
      if (dc !== 0 && dr !== 0 && (grid[curr.r][nc] || grid[nr][curr.c])) continue;
      if (
        !hasLineOfSight(
          curr.c * CELL + CELL / 2,
          curr.r * CELL + CELL / 2,
          nc * CELL + CELL / 2,
          nr * CELL + CELL / 2
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

export function buildNavigationPath(startPos, targetKey) {
  return buildOfficePath(startPos.x, startPos.y, targetKey);
}
