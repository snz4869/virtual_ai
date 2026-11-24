import { OFFICE_ROOMS, WAYPOINTS } from '../constants/officeConfig';

function getRoomExitPoints(x, y) {
  if (x <= 306 && y <= 281) {
    return [OFFICE_ROOMS.director.door, WAYPOINTS.director_door_out, WAYPOINTS.hub_west];
  }
  if (x <= 306 && y >= 380) {
    return [OFFICE_ROOMS.lounge.door, WAYPOINTS.lounge_door_out, WAYPOINTS.hub_west];
  }
  if (x >= 410 && x <= 725 && y <= 281) {
    return [OFFICE_ROOMS.leadRoom.door, WAYPOINTS.hub_lead];
  }
  if (x >= 765 && y <= 281) {
    return [OFFICE_ROOMS.devPod.door, WAYPOINTS.hub_dev];
  }
  if (x >= 540 && y >= 380) {
    return [OFFICE_ROOMS.qaLab.door, WAYPOINTS.hub_qa];
  }
  return [];
}

function getRoomEntryPoints(tx, ty) {
  if (tx <= 306 && ty <= 281) {
    return [WAYPOINTS.hub_west, WAYPOINTS.director_door_out, OFFICE_ROOMS.director.door];
  }
  if (tx <= 306 && ty >= 380) {
    return [WAYPOINTS.hub_west, WAYPOINTS.lounge_door_out, OFFICE_ROOMS.lounge.door];
  }
  if (tx >= 410 && tx <= 725 && ty <= 281) {
    return [WAYPOINTS.hub_lead, OFFICE_ROOMS.leadRoom.door];
  }
  if (tx >= 765 && ty <= 281) {
    return [WAYPOINTS.hub_dev, OFFICE_ROOMS.devPod.door];
  }
  if (tx >= 540 && ty >= 380) {
    return [WAYPOINTS.hub_qa, OFFICE_ROOMS.qaLab.door];
  }
  return [];
}

export function buildOfficePath(fromX, fromY, target) {
  const exitPts = getRoomExitPoints(fromX, fromY);
  const entryPts = getRoomEntryPoints(target.x, target.y);

  // Same room shortcut
  const sameDirector = fromX <= 306 && fromY <= 281 && target.x <= 306 && target.y <= 281;
  const sameLounge = fromX <= 306 && fromY >= 380 && target.x <= 306 && target.y >= 380;
  const sameLead = fromX >= 410 && fromX <= 725 && fromY <= 281 && target.x >= 410 && target.x <= 725 && target.y <= 281;
  const sameDev = fromX >= 765 && fromY <= 281 && target.x >= 765 && target.y <= 281;
  const sameQa = fromX >= 540 && fromY >= 380 && target.x >= 540 && target.y >= 380;

  if (sameDirector || sameLounge || sameLead || sameDev || sameQa) {
    return [{ x: target.x, y: target.y }];
  }

  const route = [...exitPts];
  const lastExit = route[route.length - 1] || { x: fromX, y: 330 };
  const firstEntry = entryPts[0] || { x: target.x, y: 330 };

  if (lastExit.y !== 330) {
    route.push({ x: lastExit.x, y: 330 });
  }
  if (firstEntry.x !== lastExit.x) {
    route.push({ x: firstEntry.x, y: 330 });
  }

  route.push(...entryPts);
  route.push({ x: target.x, y: target.y });
  return route;
}
