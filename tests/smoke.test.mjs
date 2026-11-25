import assert from 'node:assert/strict';
import handler from '../api/interact.js';
import { isOutputTruncated, normalizeAgyEventLine } from '../server/agyBridge.js';
import { abortableSleep, executeAgentPrompt } from '../src/utils/geminiClient.js';
import { AMBIENT_ACTIVITIES, AMBIENT_STAFF, EXTRA_AGENT_SLOTS, MEETING_SEATS, WAYPOINTS } from '../src/constants/officeConfig.js';
import { buildOfficePath, isFootBlocked } from '../src/utils/pathfinding.js';

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

// 1. Pathfinding (Min-Heap A* + Smoothing) across rooms
for (const targetKey of ['pantrySpot', 'pingPongSpot', 'loungeSofa', 'director_report', 'desk_alex', 'desk_raka', 'desk_nadia']) {
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

globalThis.fetch = origFetch;
console.log('ALL_SMOKE_TESTS_PASSED');
