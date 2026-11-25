import { WORLD_W, WORLD_H, WAYPOINTS, OFFICE_COLLIDERS } from '../constants/officeConfig';

const CELL = 20;
const COLS = Math.ceil(WORLD_W / CELL);
const ROWS = Math.ceil(WORLD_H / CELL);

let blockedGrid = null;

function isFootBlocked(x, y) {
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

export function buildOfficePath(fromX, fromY, target) {
  const dest =
    typeof target === 'string'
      ? WAYPOINTS[target] || WAYPOINTS.hallwayCenter
      : target || WAYPOINTS.hallwayCenter;

  const grid = getGrid();
  const start = findNearestWalkable(grid, Math.floor(fromX / CELL), Math.floor(fromY / CELL));
  const goal = findNearestWalkable(grid, Math.floor(dest.x / CELL), Math.floor(dest.y / CELL));

  if (start.c === goal.c && start.r === goal.r) {
    return [{ x: goal.c * CELL + CELL / 2, y: goal.r * CELL + CELL / 2 }];
  }

  const open = [{ ...start, g: 0, f: Math.hypot(goal.c - start.c, goal.r - start.r), parent: null }];
  const closed = new Set();
  const key = (c, r) => `${c},${r}`;

  const dirs = [
    [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
    [1, 1, 1.41], [1, -1, 1.41], [-1, 1, 1.41], [-1, -1, 1.41],
  ];

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f);
    const curr = open.shift();
    const k = key(curr.c, curr.r);
    if (closed.has(k)) continue;
    closed.add(k);

    if (curr.c === goal.c && curr.r === goal.r) {
      const waypoints = [];
      let node = curr;
      while (node && node.parent) {
        waypoints.unshift({
          x: node.c * CELL + CELL / 2,
          y: node.r * CELL + CELL / 2,
        });
        node = node.parent;
      }
      return waypoints;
    }

    for (const [dc, dr, cost] of dirs) {
      const nc = curr.c + dc;
      const nr = curr.r + dr;
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
      if (grid[nr][nc] || closed.has(key(nc, nr))) continue;
      // Cegah potong sudut diagonal melewati dinding
      if (dc !== 0 && dr !== 0 && (grid[curr.r][nc] || grid[nr][curr.c])) continue;

      const g = curr.g + cost;
      const h = Math.hypot(goal.c - nc, goal.r - nr);
      open.push({ c: nc, r: nr, g, f: g + h, parent: curr });
    }
  }

  return [{ x: dest.x, y: dest.y }];
}

export function buildNavigationPath(startPos, targetKey) {
  return buildOfficePath(startPos.x, startPos.y, targetKey);
}