import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import handler from '../api/interact.js';
import { VILLAGE_SPRITE_KEYS } from '../src/utils/villageAssets.js';
import { isOutputTruncated, normalizeAgyEventLine } from '../server/agyBridge.js';
import { abortableSleep, executeAgentPrompt } from '../src/utils/geminiClient.js';
import { AMBIENT_ACTIVITIES, AMBIENT_STAFF, CORE_AGENT_IDS, DEFAULT_AGENTS, DIRECTOR_SEAT_ZONE, EXTRA_AGENT_SLOTS, FULLSTACK_AGENT_ID, MEETING_SEATS, OFFICE_EXIT_ZONE, WAYPOINTS } from '../src/constants/officeConfig.js';
import { OFFICE_HQ_BUILDING, VILLAGE_ACTIVITIES, VILLAGE_BASKETBALL_CONFIG, VILLAGE_BENCHES, VILLAGE_BOAT_CONFIG, VILLAGE_BUILDINGS, VILLAGE_COLLIDERS, VILLAGE_EXTRA_SEATS, VILLAGE_H, VILLAGE_NOTICE_BOARD, VILLAGE_PETS, VILLAGE_RESIDENTS, VILLAGE_TRAM_CONFIG, VILLAGE_W, VILLAGE_WAYPOINTS } from '../src/constants/villageConfig.js';
import { buildOfficePath, buildVillagePath, isFootBlocked } from '../src/utils/pathfinding.js';
import {
  MAX_GRILLING_ROUNDS,
  buildAlexGrillingSop,
  buildFullStackGrillingSop,
  buildRakaConciseSop,
  detectAlexGrillingStatus,
  stripGrillingStatusTag,
} from '../src/utils/grilling.js';
import {
  OFFICE_BGM_TRACKS,
  SFX_TYPES,
  getAudioVolumes,
  playRetroTone,
  setBgmVolume,
  setOfficeBgm,
  setSfxVolume,
  stopOfficeBgm,
  unlockAudio,
} from '../src/utils/audio.js';

function assertSegmentClear(ax, ay, bx, by, label) {
  const dist = Math.hypot(bx - ax, by - ay);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = ax + (bx - ax) * t;
    const y = ay + (by - ay) * t;
    assert.equal(isFootBlocked(x, y), false, `${label}: blocked at (${x.toFixed(1)}, ${y.toFixed(1)})`);
  }
}

// 1. Pathfinding (Min-Heap A* + Smoothing) across rooms (West + East Wing)
for (const targetKey of ['pantrySpot', 'pingPongSpot', 'loungeSofa', 'director_report', 'directorStand', 'desk_alex', 'desk_raka', 'desk_nadia', 'desk_kael', 'lounge_kael', 'serverLabSpot', 'cafeBarSpot', 'designStudioSpot', 'townhallSpot']) {
  const start = WAYPOINTS.lounge_alex;
  const path = buildOfficePath(start.x, start.y, WAYPOINTS[targetKey]);
  assert.ok(path.length > 0, `Path to ${targetKey} must exist`);
  assert.ok(path.length < 25, `Smoothed path to ${targetKey} should be concise (got ${path.length})`);
  let prev = start;
  for (const pt of path) {
    assert.equal(isFootBlocked(pt.x, pt.y), false, `Waypoint to ${targetKey} blocked`);
    assertSegmentClear(prev.x, prev.y, pt.x, pt.y, `Segment to ${targetKey}`);
    prev = pt;
  }
}

// 2. Extra agent dynamic slots clear of colliders
for (const slot of EXTRA_AGENT_SLOTS) {
  assert.equal(isFootBlocked(slot.homeSpot.x, slot.homeSpot.y), false, `${slot.defaultName} homeSpot blocked`);
  assert.equal(isFootBlocked(slot.deskSpot.x, slot.deskSpot.y), false, `${slot.defaultName} deskSpot blocked`);
}

// 2b. Ambient staff desks & activity spots clear of colliders and reachable via pathfinding
for (const staff of AMBIENT_STAFF) {
  assert.equal(isFootBlocked(staff.deskSpot.x, staff.deskSpot.y), false, `${staff.name} deskSpot blocked`);
  const pathToLounge = buildOfficePath(staff.deskSpot.x, staff.deskSpot.y, WAYPOINTS.loungeSofa);
  assert.ok(pathToLounge.length > 0, `${staff.name} must have path to lounge`);
  let prev = staff.deskSpot;
  for (const pt of pathToLounge) {
    assert.equal(isFootBlocked(pt.x, pt.y), false, `${staff.name} path point blocked`);
    assertSegmentClear(prev.x, prev.y, pt.x, pt.y, `${staff.name} to lounge`);
    prev = pt;
  }
}
for (const act of AMBIENT_ACTIVITIES) {
  assert.equal(isFootBlocked(act.spot.x, act.spot.y), false, `Activity "${act.bubble}" spot blocked`);
}

// 2c. Director Meeting Room seats (3 left, 3 right + head) clear and reachable to exact chair coords
const allMeetingSeats = [
  { name: 'director (left-mid)', seat: MEETING_SEATS.director },
  { name: 'alex (right-mid)', seat: MEETING_SEATS.alex },
  { name: 'raka (right-top)', seat: MEETING_SEATS.raka },
  { name: 'nadia (right-bottom)', seat: MEETING_SEATS.nadia },
  { name: 'kael (top-head)', seat: MEETING_SEATS.kael },
  ...MEETING_SEATS.extra.map((seat, i) => ({ name: `extra-${i + 1}`, seat })),
];
for (const { name, seat } of allMeetingSeats) {
  assert.equal(isFootBlocked(seat.x, seat.y), false, `Meeting seat ${name} blocked`);
  const path = buildOfficePath(WAYPOINTS.desk_raka.x, WAYPOINTS.desk_raka.y, seat);
  assert.ok(path.length > 0, `Path to meeting seat ${name} must exist`);
  const last = path[path.length - 1];
  assert.equal(last.x, seat.x, `Final X for ${name} should land exactly on chair`);
  assert.equal(last.y, seat.y, `Final Y for ${name} should land exactly on chair`);
}

// 3. Demo mode streaming + QA VERIFIED + HTML landing page preview
const demoChunks = [];
const nadiaDemo = await executeAgentPrompt({
  agent: { id: 'nadia', name: 'Nadia', role: 'QA Lead', sop: 'audit' },
  prompt: 'Tes',
  brief: 'Brief',
  apiMode: 'demo',
  simSpeed: 2,
  onChunk: (p) => demoChunks.push(p),
});
assert.ok(demoChunks.length > 1);
assert.match(nadiaDemo.text, /\[STATUS:\s*VERIFIED\]/i);
assert.equal(nadiaDemo.modelUsed, 'demo-simulator');

const rakaLanding = await executeAgentPrompt({
  agent: { id: 'raka', name: 'Raka', role: 'Dev', sop: 'code' },
  prompt: 'Buat landing page UMKM',
  brief: 'Brief',
  apiMode: 'demo',
  simSpeed: 2,
});
assert.match(rakaLanding.text, /<!DOCTYPE html>/i);

// 4. AbortController cancellation
const ac = new AbortController();
setTimeout(() => ac.abort(), 20);
let aborted = false;
try {
  await abortableSleep(5000, ac.signal);
} catch (err) {
  aborted = err.name === 'AbortError' || err.message === 'ABORTED';
}
assert.equal(aborted, true, 'abortableSleep must reject immediately on abort');

// 5. Serverless handler: Gemini inlineData + SSE streaming + DeepSeek extracted text
const origFetch = globalThis.fetch;
const encoder = new TextEncoder();
const makeStream = (lines) =>
  new ReadableStream({
    start(ctrl) {
      for (const l of lines) ctrl.enqueue(encoder.encode(l));
      ctrl.close();
    },
  });

let capturedUrl = '';
let capturedBody = null;
globalThis.fetch = async (url, opts) => {
  capturedUrl = url;
  capturedBody = JSON.parse(opts.body);
  return {
    ok: true,
    status: 200,
    body: makeStream([
      'data: {"candidates":[{"content":{"parts":[{"text":"OK "}]}}]}\n\n',
      'data: {"candidates":[{"content":{"parts":[{"text":"STREAM"}]},"finishReason":"STOP"}],"usageMetadata":{"promptTokenCount":10,"candidatesTokenCount":5,"totalTokenCount":15}}\n\n',
    ]),
  };
};

const sseOut = [];
const mockRes = {
  setHeader() {},
  write(chunk) { sseOut.push(chunk); },
  end() { this.ended = true; },
  status(c) { this.statusCode = c; return this; },
  json(b) { this.body = b; return this; },
};

await handler(
  {
    method: 'POST',
    body: {
      provider: 'gemini',
      preferredModel: 'gemini-3.8-flash',
      stream: true,
      systemPrompt: 'sys',
      userPrompt: 'analisa pdf',
      apiKey: 'test-key',
      fileData: { fileName: 'a.pdf', mimeType: 'application/pdf', base64: 'JVBERi0=', extractedText: '' },
    },
  },
  mockRes
);

assert.match(capturedUrl, /gemini-3\.8-flash:streamGenerateContent\?alt=sse/);
assert.equal(capturedBody.contents[0].parts[1].inlineData.mimeType, 'application/pdf');
assert.equal(mockRes.ended, true);
assert.ok(sseOut.join('').includes('"totalTokens":15'));

// 6. AGY Local Bridge: event parsing, streaming when agyAvailable=true, and auto-disable when agyAvailable=false (Vercel)
const initEvt = normalizeAgyEventLine('{"event":"init","init":{"model":"gemini-3.8-flash-medium"}}');
assert.equal(initEvt.type, 'init');
assert.equal(initEvt.model, 'gemini-3.8-flash-medium');

const deltaEvt = normalizeAgyEventLine('{"event":"step_update","step_update":{"step_type":"agent_response","text_delta":"Halo AGY","usage":{"input_tokens":5,"output_tokens":2,"total_tokens":7}}}');
assert.equal(deltaEvt.type, 'delta');
assert.equal(deltaEvt.text, 'Halo AGY');
assert.equal(deltaEvt.usage.totalTokens, 7);

// Truncation detection (unclosed code fence, unclosed </html>, finishedReason=max_tokens)
assert.equal(isOutputTruncated('```html\n<!DOCTYPE html><html><body>Hi'), true, 'Unclosed code fence & HTML must be flagged truncated');
assert.equal(isOutputTruncated('<!DOCTYPE html><html><body>Hi</body>', ''), true, 'Missing </html> must be flagged truncated');
assert.equal(isOutputTruncated('Hasil selesai', 'max_tokens'), true, 'max_tokens reason must be flagged truncated');
assert.equal(isOutputTruncated('```html\n<!DOCTYPE html><html><body>Hi</body></html>\n```', 'stop'), false, 'Complete HTML block must not be flagged truncated');

// 6a. Local AGY streaming call (agyAvailable = true)
let agyRouteHit = false;
globalThis.fetch = async (url) => {
  if (url === '/api/agy/interact') {
    agyRouteHit = true;
    return {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/event-stream; charset=utf-8' }),
      body: makeStream([
        'data: {"type":"delta","text":"Respons "}\n\n',
        'data: {"type":"delta","text":"dari AGY!"}\n\n',
        'data: {"type":"done","modelUsed":"agy:gemini-3.8-flash-medium","usage":{"promptTokens":10,"outputTokens":4,"totalTokens":14}}\n\n',
      ]),
    };
  }
  throw new Error(`Unexpected URL: ${url}`);
};

const agyChunks = [];
const agyOut = await executeAgentPrompt({
  agent: { id: 'alex', name: 'Alex', role: 'Lead', sop: 'sop' },
  prompt: 'Tes AGY',
  brief: 'Brief',
  apiMode: 'live',
  provider: 'agy',
  agyAvailable: true,
  agyModel: 'gemini-3.8-flash-medium',
  onChunk: (p) => agyChunks.push(p),
});
assert.equal(agyRouteHit, true, 'Must route to /api/agy/interact when agyAvailable=true');
assert.equal(agyOut.text, 'Respons dari AGY!');
assert.equal(agyOut.modelUsed, 'agy:gemini-3.8-flash-medium');
assert.equal(agyOut.usage.totalTokens, 14);

// 6b. Vercel mode (agyAvailable = false): even if provider='agy' or preferredModel='agy:...', NEVER calls /api/agy/interact
let vercelHitUrl = '';
globalThis.fetch = async (url) => {
  vercelHitUrl = url;
  return {
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => ({ text: 'FALLBACK_VERCEL_OK', modelUsed: 'gemini-3.5-flash-lite', usage: null }),
  };
};
const vercelOut = await executeAgentPrompt({
  agent: { id: 'raka', name: 'Raka', role: 'Dev', sop: 'sop', preferredModel: 'agy:gemini-4-neon-high' },
  prompt: 'Tes Vercel',
  brief: 'Brief',
  apiMode: 'live',
  provider: 'agy',
  agyAvailable: false,
  clientApiKey: 'cloud-key',
});
assert.equal(vercelHitUrl, '/api/interact', 'On Vercel (agyAvailable=false), must bypass AGY and use /api/interact');
assert.equal(vercelOut.text, 'FALLBACK_VERCEL_OK');

// 7. Alex Tech Lead Core-Only Grilling detection, prompt rules & Demo Mode flow
assert.equal(detectAlexGrillingStatus('❓ **Q1** - **Scope**: Pilih A?\n\n➡️ Ya\n\n[STATUS: GRILLING]'), 'grilling');
assert.equal(detectAlexGrillingStatus('Kontrak selesai.\n[STATUS: READY]'), 'ready');
assert.equal(
  detectAlexGrillingStatus('❓ **Q1** - **Scope**: Tanpa tag status?\n\n➡️ Ya'),
  'grilling',
  'Fallback must detect grilling questions even if tag is omitted'
);
assert.equal(
  detectAlexGrillingStatus('❓ **Q1** - **Scope**: Masih tanya\n[STATUS: GRILLING]', { canGrill: false }),
  'ready',
  'Must force ready when grilling is disabled or max rounds reached'
);
assert.equal(stripGrillingStatusTag('Halo\n\n[STATUS: GRILLING]'), 'Halo');

const grillingSop = buildAlexGrillingSop('Base SOP', { grillingEnabled: true, round: 0 });
assert.match(grillingSop, /\[STATUS:\s*GRILLING\]/);
assert.match(grillingSop, /\[STATUS:\s*READY\]/);

const finalSop = buildAlexGrillingSop('Base SOP', {
  grillingEnabled: true,
  round: MAX_GRILLING_ROUNDS,
});
assert.doesNotMatch(finalSop, /\[STATUS:\s*GRILLING\]/);
assert.match(finalSop, /\[STATUS:\s*READY\]/);

const rakaConciseSop = buildRakaConciseSop('Base Raka', { hasLockedContract: true });
assert.match(rakaConciseSop, /Kontrak Kerja Ringkas/i);

// Demo Mode: tugas singkat langsung READY, tugas kompleks memicu GRILLING lalu READY setelah konfirmasi
const alexSimpleDemo = await executeAgentPrompt({
  agent: { id: 'alex', name: 'Alex', role: 'Tech Lead', sop: grillingSop },
  prompt: 'Hitung akar pangkat 3 dari 34 beserta langkah cepatnya.',
  brief: 'Brief',
  apiMode: 'demo',
  simSpeed: 2,
});
assert.equal(detectAlexGrillingStatus(alexSimpleDemo.text), 'ready', 'Simple math prompt should skip grilling');

const alexComplexDemo = await executeAgentPrompt({
  agent: { id: 'alex', name: 'Alex', role: 'Tech Lead', sop: grillingSop },
  prompt: 'Buat landing page modern untuk produk SaaS manajemen keuangan UMKM',
  brief: 'Brief',
  apiMode: 'demo',
  simSpeed: 2,
});
assert.equal(detectAlexGrillingStatus(alexComplexDemo.text), 'grilling', 'Complex landing page prompt should trigger grilling');
assert.match(alexComplexDemo.text, /❓\s*\*\*Q1\*\*/);

const alexContractDemo = await executeAgentPrompt({
  agent: { id: 'alex', name: 'Alex', role: 'Tech Lead', sop: finalSop },
  prompt: 'Buat landing page modern\n\n[JAWABAN GRILLING DIRECTOR — KEPUTUSAN INTI TERKONFIRMASI]:\nRonde #1: Setuju semua rekomendasi',
  brief: 'Brief',
  apiMode: 'demo',
  simSpeed: 2,
});
assert.equal(detectAlexGrillingStatus(alexContractDemo.text), 'ready', 'After Director confirmation Alex must emit READY contract');

// 8. Solo Full-Stack Agent (Kael) config, Core-Only Grilling SOP & Demo Mode flow
const kaelAgent = DEFAULT_AGENTS.find((a) => a.id === FULLSTACK_AGENT_ID);
assert.ok(kaelAgent, 'Full-Stack agent Kael must exist in DEFAULT_AGENTS');
assert.ok(CORE_AGENT_IDS.includes(FULLSTACK_AGENT_ID), 'Kael must be in CORE_AGENT_IDS so it is excluded from 3-agent relay specialists');
assert.equal(isFootBlocked(kaelAgent.deskSpot.x, kaelAgent.deskSpot.y), false, 'Kael deskSpot must be clear');
assert.equal(isFootBlocked(kaelAgent.homeSpot.x, kaelAgent.homeSpot.y), false, 'Kael homeSpot must be clear');

const kaelGrillingSop = buildFullStackGrillingSop(kaelAgent.sop, { grillingEnabled: true, round: 0 });
assert.match(kaelGrillingSop, /\[STATUS:\s*GRILLING\]/);
const kaelExecSop = buildFullStackGrillingSop(kaelAgent.sop, { grillingEnabled: true, forceExecute: true });
assert.doesNotMatch(kaelExecSop, /\[STATUS:\s*GRILLING\]/);

const kaelSimpleDemo = await executeAgentPrompt({
  agent: { ...kaelAgent, sop: kaelGrillingSop },
  prompt: 'Hitung akar pangkat 3 dari 34 beserta langkah cepatnya.',
  brief: 'Brief',
  apiMode: 'demo',
  simSpeed: 2,
});
assert.equal(detectAlexGrillingStatus(kaelSimpleDemo.text), 'ready', 'Simple prompt for Kael should execute directly without grilling');

const kaelComplexDemo = await executeAgentPrompt({
  agent: { ...kaelAgent, sop: kaelGrillingSop },
  prompt: 'Buat landing page modern untuk produk SaaS manajemen keuangan UMKM',
  brief: 'Brief',
  apiMode: 'demo',
  simSpeed: 2,
});
assert.equal(detectAlexGrillingStatus(kaelComplexDemo.text), 'grilling', 'Complex prompt for Kael with Grilling ON should ask core questions first');

const kaelDoneDemo = await executeAgentPrompt({
  agent: { ...kaelAgent, sop: kaelExecSop },
  prompt: 'Buat landing page modern UMKM\n\n[JAWABAN GRILLING DIRECTOR — KEPUTUSAN INTI TERKONFIRMASI]:\nRonde #1: Setuju semua rekomendasi',
  brief: 'Brief',
  apiMode: 'demo',
  simSpeed: 2,
});
assert.equal(detectAlexGrillingStatus(kaelDoneDemo.text), 'ready');
assert.match(kaelDoneDemo.text, /<!DOCTYPE html>/i, 'Kael must deliver full HTML end-to-end solution after confirmation');

// 9. Audio SFX, Creative BGM tracks & Volume controls integrity
assert.ok(OFFICE_BGM_TRACKS.length >= 6, 'Must offer Sunny Village Guitar plus Office BGM tracks and Off');
assert.ok(OFFICE_BGM_TRACKS.some((t) => t.id === 'off'));
assert.ok(OFFICE_BGM_TRACKS.some((t) => t.id === 'village'));
assert.ok(OFFICE_BGM_TRACKS.some((t) => t.id === 'lofi'));
assert.ok(OFFICE_BGM_TRACKS.some((t) => t.id === 'rain'));
for (const sfx of ['step', 'click', 'greet', 'start', 'work', 'handoff', 'grilling', 'approve', 'report', 'slap', 'boat', 'tram', 'basketball', 'pet']) {
  assert.ok(SFX_TYPES.includes(sfx), `Missing SFX type: ${sfx}`);
  playRetroTone(sfx, true); // Safe no-op in Node SSR/test env
}
setBgmVolume(0.85);
setSfxVolume(0.65);
assert.deepEqual(getAudioVolumes(), { bgmVolume: 0.85, sfxVolume: 0.65 }, 'Volume controls must update state accurately');
setBgmVolume(2.5);
setSfxVolume(-0.4);
assert.deepEqual(getAudioVolumes(), { bgmVolume: 1, sfxVolume: 0 }, 'Volume controls must clamp to [0, 1]');
setOfficeBgm('village', { volume: 0.75 });
unlockAudio();
stopOfficeBgm();

// 10. Director standing start spot -> Director seat path & seat hitbox
assert.equal(isFootBlocked(WAYPOINTS.directorStand.x, WAYPOINTS.directorStand.y), false, 'Director standing start must be clear');
const dirStandToSeat = buildOfficePath(WAYPOINTS.directorStand.x, WAYPOINTS.directorStand.y, MEETING_SEATS.director);
assert.ok(dirStandToSeat.length > 0, 'Director must have valid path from standing start to seat');
assert.ok(
  MEETING_SEATS.director.x >= DIRECTOR_SEAT_ZONE.x &&
    MEETING_SEATS.director.x <= DIRECTOR_SEAT_ZONE.x + DIRECTOR_SEAT_ZONE.w &&
    MEETING_SEATS.director.y >= DIRECTOR_SEAT_ZONE.y &&
    MEETING_SEATS.director.y <= DIRECTOR_SEAT_ZONE.y + DIRECTOR_SEAT_ZONE.h,
  'DIRECTOR_SEAT_ZONE must cover Director chair coordinates'
);

// 11. Village map layout (3000x2000, 4 districts), enterable Office HQ, office exit door & village pathfinding
assert.equal(VILLAGE_W, 3000, 'Expanded village width should be 3000');
assert.equal(VILLAGE_H, 2000, 'Expanded village height should be 2000');
assert.ok(OFFICE_HQ_BUILDING?.enterable, 'Virtual Office HQ must be an enterable building on the village map');
assert.ok(VILLAGE_BUILDINGS.length >= 10, 'Expanded village should contain Office HQ plus 10 neighboring buildings across 4 districts');
assert.equal(isFootBlocked(WAYPOINTS.officeEntrance.x, WAYPOINTS.officeEntrance.y), false, 'Office entrance spawn must be clear');
assert.equal(isFootBlocked(WAYPOINTS.officeExitDoor.x, WAYPOINTS.officeExitDoor.y), false, 'Office exit door spot must be clear');
assert.ok(
  WAYPOINTS.officeExitDoor.x >= OFFICE_EXIT_ZONE.x &&
    WAYPOINTS.officeExitDoor.x <= OFFICE_EXIT_ZONE.x + OFFICE_EXIT_ZONE.w &&
    WAYPOINTS.officeExitDoor.y >= OFFICE_EXIT_ZONE.y &&
    WAYPOINTS.officeExitDoor.y <= OFFICE_EXIT_ZONE.y + OFFICE_EXIT_ZONE.h,
  'OFFICE_EXIT_ZONE must cover officeExitDoor coordinates'
);
const officeEntranceToSeat = buildOfficePath(
  WAYPOINTS.officeEntrance.x,
  WAYPOINTS.officeEntrance.y,
  MEETING_SEATS.director
);
assert.ok(officeEntranceToSeat.length > 0, 'Director must be able to walk from office main door to meeting seat');

for (const [wpName, wp] of Object.entries(VILLAGE_WAYPOINTS)) {
  assert.equal(isFootBlocked(wp.x, wp.y, VILLAGE_COLLIDERS), false, `Village waypoint ${wpName} blocked`);
  const vPath = buildVillagePath(VILLAGE_WAYPOINTS.officeFront.x, VILLAGE_WAYPOINTS.officeFront.y, wp);
  assert.ok(vPath.length > 0, `Village path to ${wpName} must exist`);
  let prev = VILLAGE_WAYPOINTS.officeFront;
  for (const pt of vPath) {
    assert.equal(isFootBlocked(pt.x, pt.y, VILLAGE_COLLIDERS), false, `Village path point to ${wpName} blocked`);
    const dist = Math.hypot(pt.x - prev.x, pt.y - prev.y);
    const steps = Math.max(1, Math.ceil(dist / 6));
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const sx = prev.x + (pt.x - prev.x) * t;
      const sy = prev.y + (pt.y - prev.y) * t;
      assert.equal(
        isFootBlocked(sx, sy, VILLAGE_COLLIDERS),
        false,
        `Village segment to ${wpName} blocked at (${sx.toFixed(1)}, ${sy.toFixed(1)})`
      );
    }
    prev = pt;
  }
}
for (const res of VILLAGE_RESIDENTS) {
  assert.equal(isFootBlocked(res.startSpot.x, res.startSpot.y, VILLAGE_COLLIDERS), false, `Villager ${res.name} startSpot blocked`);
}
for (const act of VILLAGE_ACTIVITIES) {
  assert.equal(isFootBlocked(act.spot.x, act.spot.y, VILLAGE_COLLIDERS), false, `Village activity "${act.bubble}" blocked`);
}
assert.equal(
  isFootBlocked(VILLAGE_NOTICE_BOARD.visitSpot.x, VILLAGE_NOTICE_BOARD.visitSpot.y, VILLAGE_COLLIDERS),
  false,
  'Village notice board visitSpot blocked'
);
for (const pet of VILLAGE_PETS) {
  for (const spot of pet.spots) {
    assert.equal(isFootBlocked(spot.x, spot.y, VILLAGE_COLLIDERS), false, `Village pet ${pet.name} spot (${spot.x}, ${spot.y}) blocked`);
  }
}
for (const key of ['bridgeWestCenter', 'bridgeEastCenter', 'pierTip', 'windmillFront', 'stationFront', 'foodTruckFront', 'campfireWest']) {
  const crossing = buildVillagePath(
    VILLAGE_WAYPOINTS.officeFront.x,
    VILLAGE_WAYPOINTS.officeFront.y,
    VILLAGE_WAYPOINTS[key]
  );
  assert.ok(crossing.length > 0, `Must be able to walk from Office HQ to ${key}`);
}

// 12. Interactive Village Activities: benches/seats, boat dock, tram station, basketball court
for (const seat of [...VILLAGE_BENCHES, ...VILLAGE_EXTRA_SEATS]) {
  assert.equal(
    isFootBlocked(seat.approachSpot.x, seat.approachSpot.y, VILLAGE_COLLIDERS),
    false,
    `Village seat ${seat.id} approachSpot blocked`
  );
}
assert.equal(
  isFootBlocked(VILLAGE_BOAT_CONFIG.dockPoint.x, VILLAGE_BOAT_CONFIG.dockPoint.y, VILLAGE_COLLIDERS),
  false,
  'Boat dockPoint must be clear'
);
// Pastikan posisi awal perahu berada DI DALAM area sailBounds dan di luar pierAvoidBox agar bisa digerakkan!
{
  const mp = VILLAGE_BOAT_CONFIG.mooredPos;
  const sb = VILLAGE_BOAT_CONFIG.sailBounds;
  const pa = VILLAGE_BOAT_CONFIG.pierAvoidBox;
  assert.ok(
    mp.x >= sb.minX && mp.x <= sb.maxX && mp.y >= sb.minY && mp.y <= sb.maxY,
    `Boat mooredPos (${mp.x},${mp.y}) must be inside sailBounds`
  );
  const insidePierAvoid = mp.x > pa.x && mp.x < pa.x + pa.w && mp.y > pa.y && mp.y < pa.y + pa.h;
  assert.equal(insidePierAvoid, false, 'Boat mooredPos must not overlap pierAvoidBox');
}
assert.equal(
  isFootBlocked(VILLAGE_TRAM_CONFIG.stationDropSpot.x, VILLAGE_TRAM_CONFIG.stationDropSpot.y, VILLAGE_COLLIDERS),
  false,
  'Tram stationDropSpot must be clear'
);
{
  const st = VILLAGE_TRAM_CONFIG.stationDropSpot;
  const nb = VILLAGE_TRAM_CONFIG.stationNearBox;
  assert.ok(
    st.x >= nb.x && st.x <= nb.x + nb.w && st.y >= nb.y && st.y <= nb.y + nb.h,
    'Tram stationNearBox must cover stationDropSpot'
  );
}
assert.equal(
  isFootBlocked(
    VILLAGE_BASKETBALL_CONFIG.defaultShootSpot.x,
    VILLAGE_BASKETBALL_CONFIG.defaultShootSpot.y,
    VILLAGE_COLLIDERS
  ),
  false,
  'Basketball defaultShootSpot must be clear'
);

// 13. Real 16-bit PNG sprite assets exist in public/assets/village/
for (const key of VILLAGE_SPRITE_KEYS) {
  const filePath = path.resolve(process.cwd(), 'public', 'assets', 'village', `${key}.png`);
  assert.ok(fs.existsSync(filePath), `Missing village sprite asset: ${filePath}`);
  const stat = fs.statSync(filePath);
  assert.ok(stat.size > 1024, `Village sprite asset ${key}.png looks empty (${stat.size} bytes)`);
}

globalThis.fetch = origFetch;
console.log('ALL_SMOKE_TESTS_PASSED');
