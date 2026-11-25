import assert from 'node:assert/strict';
import handler from '../api/interact.js';
import { abortableSleep, executeAgentPrompt } from '../src/utils/geminiClient.js';
import { EXTRA_AGENT_SLOTS, WAYPOINTS } from '../src/constants/officeConfig.js';
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

globalThis.fetch = origFetch;
console.log('ALL_SMOKE_TESTS_PASSED');
