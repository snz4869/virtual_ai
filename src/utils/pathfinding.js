import { WAYPOINTS } from '../constants/officeConfig';

/**
 * Menghitung jalur gerak karakter melewati koridor tengah
 * agar tidak menembus dinding ruangan tertutup (Director/Meeting, Pantry, Archive, Recreation).
 */
export function buildOfficePath(fromX, fromY, target) {
  const dest =
    typeof target === 'string'
      ? WAYPOINTS[target] || WAYPOINTS.hallwayCenter
      : target || WAYPOINTS.hallwayCenter;

  const path = [];

  const inMeeting = fromX < 334 && fromY < 344;
  const inPantry = fromX < 234 && fromY >= 364 && fromY <= 774;
  const inArchive = fromX < 234 && fromY > 794;
  const inRecreation = fromX >= 360 && fromX <= 710 && fromY >= 770;

  // 1. Keluar dari ruangan tertutup terlebih dahulu
  if (inMeeting) {
    path.push({ x: 274, y: 310 });
    path.push(WAYPOINTS.directorDoor);
  } else if (inPantry) {
    path.push({ x: 205, y: 434 });
    path.push({ x: 280, y: 434 });
  } else if (inArchive) {
    path.push({ x: 205, y: 864 });
    path.push({ x: 280, y: 864 });
  } else if (inRecreation) {
    path.push({ x: 537, y: 810 });
    path.push(WAYPOINTS.recreationDoor);
  }

  // 2. Lewat koridor penghubung utama
  path.push(WAYPOINTS.hallwayCenter);

  // 3. Masuk ke pintu ruangan tujuan jika tujuan berada di dalam ruangan tertutup
  const destInMeeting = dest.x < 334 && dest.y < 344;
  const destInPantry = dest.x < 234 && dest.y >= 364 && dest.y <= 774;
  const destInArchive = dest.x < 234 && dest.y > 794;
  const destInRecreation = dest.x >= 360 && dest.x <= 710 && dest.y >= 770;

  if (destInMeeting) {
    path.push(WAYPOINTS.directorDoor);
    path.push({ x: 274, y: 310 });
  } else if (destInRecreation) {
    path.push(WAYPOINTS.hallwaySouth);
    path.push(WAYPOINTS.recreationDoor);
    path.push({ x: 537, y: 810 });
  } else if (destInPantry) {
    path.push({ x: 280, y: 434 });
    path.push({ x: 205, y: 434 });
  } else if (destInArchive) {
    path.push({ x: 280, y: 864 });
    path.push({ x: 205, y: 864 });
  }

  path.push({ x: dest.x, y: dest.y });
  return path;
}

// Alias kompatibilitas untuk OfficeCanvas2D
export function buildNavigationPath(startPos, targetKey) {
  return buildOfficePath(startPos.x, startPos.y, targetKey);
}
