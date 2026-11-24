import { WAYPOINTS } from '../constants/officeConfig';

/**
 * Menghitung jalur gerak karakter melewati koridor tengah
 * agar tidak menembus dinding ruangan tertutup (Meeting, Pantry, Recreation).
 */
export function buildNavigationPath(startPos, targetKey) {
  const dest = WAYPOINTS[targetKey] || WAYPOINTS.hallwayCenter;
  const path = [];

  const inMeeting = startPos.x < 334 && startPos.y < 344;
  const inPantry = startPos.x < 234 && startPos.y >= 364 && startPos.y <= 774;
  const inArchive = startPos.x < 234 && startPos.y > 794;
  const inRecreation =
    startPos.x >= 360 && startPos.x <= 710 && startPos.y >= 770;

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

  // 3. Masuk ke pintu ruangan tujuan jika tujuan tertutup
  if (targetKey === 'directorDesk') {
    path.push(WAYPOINTS.directorDoor);
    path.push({ x: 274, y: 310 });
  } else if (targetKey === 'pingPongSpot') {
    path.push(WAYPOINTS.hallwaySouth);
    path.push(WAYPOINTS.recreationDoor);
    path.push({ x: 537, y: 810 });
  } else if (targetKey === 'pantrySpot') {
    path.push({ x: 280, y: 434 });
    path.push({ x: 205, y: 434 });
  }

  path.push(dest);
  return path;
}
