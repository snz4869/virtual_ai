let audioCtx = null;
let masterCompressor = null;
let sfxGainNode = null;
let reverbBufferCache = null;
const guitarBufferCache = new Map();

let bgmState = {
  trackId: 'off',
  volume: 0.75,
  sfxVolume: 0.8,
  timerId: null,
  masterGain: null,
  bgmToneFilter: null,
  reverbNode: null,
  reverbWet: null,
  noiseSource: null,
  step: 0,
  waitingUnlock: false,
};

export const OFFICE_BGM_TRACKS = [
  { id: 'off', label: 'BGM: Off' },
  { id: 'village', label: '🏡 Pastoral Village (Guitar & Flute)' },
  { id: 'morning', label: '🎹 Town Square (Felt Piano & Harp)' },
  { id: 'lofi', label: '🎧 Cozy Lo-Fi Beats' },
  { id: 'bossa', label: '☕ Kopi Senja Bossa Nova' },
  { id: 'rain', label: '🌧️ Rainy Evening Cottage' },
];

export const SFX_TYPES = [
  'step',
  'click',
  'greet',
  'start',
  'work',
  'handoff',
  'grilling',
  'approve',
  'report',
  'slap',
  'boat',
  'tram',
  'basketball',
  'pet',
];

function clampVol(v, fallback = 0.75) {
  if (typeof v !== 'number' || Number.isNaN(v)) return fallback;
  return Math.max(0, Math.min(1, v));
}

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
    masterCompressor = audioCtx.createDynamicsCompressor();
    masterCompressor.threshold.setValueAtTime(-16, audioCtx.currentTime);
    masterCompressor.knee.setValueAtTime(20, audioCtx.currentTime);
    masterCompressor.ratio.setValueAtTime(3.5, audioCtx.currentTime);
    masterCompressor.attack.setValueAtTime(0.006, audioCtx.currentTime);
    masterCompressor.release.setValueAtTime(0.2, audioCtx.currentTime);
    masterCompressor.connect(audioCtx.destination);

    sfxGainNode = audioCtx.createGain();
    sfxGainNode.gain.setValueAtTime(bgmState.sfxVolume, audioCtx.currentTime);
    sfxGainNode.connect(masterCompressor);
  }
  return audioCtx;
}

function getMasterOut(ctx) {
  return masterCompressor || ctx.destination;
}

function getSfxOut(ctx) {
  return sfxGainNode || getMasterOut(ctx);
}

// Warm stereo hall impulse response (1.6s) untuk ruang akustik RPG yang organik
function getWarmReverbBuffer(ctx) {
  if (reverbBufferCache && reverbBufferCache.sampleRate === ctx.sampleRate) {
    return reverbBufferCache;
  }
  const duration = 1.6;
  const length = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < length; i++) {
      const decay = Math.pow(1 - i / length, 2.6);
      const white = Math.random() * 2 - 1;
      // Lowpass smoothing pada tail reverb supaya hangat & tidak mendesis
      lp = lp * 0.72 + white * 0.28;
      data[i] = lp * decay * 0.65;
    }
  }
  reverbBufferCache = buffer;
  return buffer;
}

// ============================================================================
// ACOUSTIC INSTRUMENTS (Karplus-Strong Nylon Guitar, Wooden Flute, Felt Piano)
// ============================================================================

function getKarplusGuitarBuffer(ctx, freq, duration = 2.1, brightness = 0.5) {
  const key = `${Math.round(freq * 10)}_${Math.round(brightness * 10)}_${ctx.sampleRate}`;
  const cached = guitarBufferCache.get(key);
  if (cached) return cached;

  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const period = Math.max(8, Math.round(sampleRate / freq));
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  // Eksitasi petikan lembut (nylon string: noise sudah dihaluskan agar tidak tajam)
  let smooth = 0;
  for (let i = 0; i < period; i++) {
    const raw = Math.random() * 2 - 1;
    smooth = smooth * (0.68 - brightness * 0.2) + raw * (0.32 + brightness * 0.2);
    data[i] = smooth;
  }
  // Hilangkan DC offset agar nada bersih
  let mean = 0;
  for (let i = 0; i < period; i++) mean += data[i];
  mean /= period;
  for (let i = 0; i < period; i++) data[i] -= mean;

  // Karplus-Strong damped string loop
  const damping = 0.9955;
  for (let i = period; i < length; i++) {
    const prev = data[i - period];
    const prev2 = data[i - period - 1] ?? prev;
    data[i] = damping * (0.52 * prev + 0.48 * prev2);
  }

  // Normalisasi amplitudo agar tiap senar seimbang & konsisten volumenya
  let peak = 0.001;
  for (let i = 0; i < Math.min(length, period * 6); i++) {
    const a = Math.abs(data[i]);
    if (a > peak) peak = a;
  }
  const norm = 0.82 / peak;
  for (let i = 0; i < length; i++) {
    data[i] *= norm;
  }

  if (guitarBufferCache.size > 96) guitarBufferCache.clear();
  guitarBufferCache.set(key, buffer);
  return buffer;
}

function playNylonGuitar(ctx, dest, { freq, start, duration = 1.6, gain = 0.28, brightness = 0.45 }) {
  const buf = getKarplusGuitarBuffer(ctx, freq, Math.max(1.2, duration + 0.35), brightness);
  const src = ctx.createBufferSource();
  src.buffer = buf;

  const bodyFilter = ctx.createBiquadFilter();
  bodyFilter.type = 'lowpass';
  bodyFilter.frequency.setValueAtTime(1650 + brightness * 700, start);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, start);
  env.gain.linearRampToValueAtTime(gain, start + 0.008);
  env.gain.setValueAtTime(gain * 0.9, start + Math.max(0.05, duration * 0.65));
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  src.connect(bodyFilter);
  bodyFilter.connect(env);
  env.connect(dest);
  src.start(start);
  src.stop(start + duration + 0.04);
}

// Seruling Kayu / Ocarina lembut khas desa RPG (vibrato napas halus, anti melengking)
function playWoodenFlute(ctx, dest, { freq, start, duration = 0.9, gain = 0.2 }) {
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, start);

  // LFO vibrato napas lembut yang masuk perlahan
  const lfo = ctx.createOscillator();
  lfo.frequency.setValueAtTime(4.8, start);
  const lfoGain = ctx.createGain();
  lfoGain.gain.setValueAtTime(0.2, start);
  lfoGain.gain.linearRampToValueAtTime(freq * 0.0085, start + Math.min(0.28, duration * 0.45));
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(Math.min(1350, freq * 2.4), start);
  filter.Q.setValueAtTime(0.7, start);

  const env = ctx.createGain();
  const attack = Math.min(0.11, duration * 0.25);
  env.gain.setValueAtTime(0.0001, start);
  env.gain.linearRampToValueAtTime(gain, start + attack);
  env.gain.setValueAtTime(gain * 0.88, start + Math.max(attack + 0.02, duration - 0.14));
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(filter);
  filter.connect(env);
  env.connect(dest);

  lfo.start(start);
  osc.start(start);
  lfo.stop(start + duration + 0.03);
  osc.stop(start + duration + 0.03);
}

// Felt Piano / Rhodes hangat (dual oscillator detune ±3 cents + lowpass lembut)
function playFeltPiano(ctx, dest, { freq, start, duration = 1.4, gain = 0.17, cutoff = 1300 }) {
  [-3, 3].forEach((cents) => {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, start);
    osc.detune.setValueAtTime(cents, start);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, start);
    filter.frequency.exponentialRampToValueAtTime(Math.max(360, cutoff * 0.42), start + duration);

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, start);
    env.gain.linearRampToValueAtTime(gain * 0.52, start + 0.018);
    env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(filter);
    filter.connect(env);
    env.connect(dest);
    osc.start(start);
    osc.stop(start + duration + 0.03);
  });
}

// Warm Upright / Cello Bass (bulat, lembut, menopang harmoni)
function playWarmBass(ctx, dest, { freq, start, duration = 1.1, gain = 0.34 }) {
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, start);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(340, start);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, start);
  env.gain.linearRampToValueAtTime(gain, start + 0.022);
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(filter);
  filter.connect(env);
  env.connect(dest);
  osc.start(start);
  osc.stop(start + duration + 0.03);
}

// Pad string / accordion hangat sangat lembut untuk Bagian B
function playWarmPad(ctx, dest, { freq, start, duration = 2.4, gain = 0.075 }) {
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, start);

  const env = ctx.createGain();
  const atk = Math.min(0.45, duration * 0.3);
  env.gain.setValueAtTime(0.0001, start);
  env.gain.linearRampToValueAtTime(gain, start + atk);
  env.gain.setValueAtTime(gain * 0.85, start + Math.max(atk + 0.05, duration - 0.45));
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(env);
  env.connect(dest);
  osc.start(start);
  osc.stop(start + duration + 0.04);
}

function scheduleNote(
  ctx,
  dest,
  { freq, start, duration, type = 'sine', gain = 0.22, endFreq = null, filterFreq = null, attack = 0.01 }
) {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (endFreq && endFreq > 0) {
    osc.frequency.exponentialRampToValueAtTime(endFreq, start + duration);
  }

  env.gain.setValueAtTime(0.0001, start);
  env.gain.linearRampToValueAtTime(gain, start + Math.min(attack, duration * 0.3));
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  if (filterFreq) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, start);
    osc.connect(filter);
    filter.connect(env);
  } else {
    osc.connect(env);
  }

  env.connect(dest);
  osc.start(start);
  osc.stop(start + duration + 0.03);
}

function playNoiseBurst(
  ctx,
  dest,
  { start, duration = 0.04, gain = 0.14, filterFreq = 1600, filterType = 'bandpass', q = 1 }
) {
  const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleCount * 0.42));
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.setValueAtTime(filterFreq, start);
  if (q) filter.Q.setValueAtTime(q, start);

  const env = ctx.createGain();
  env.gain.setValueAtTime(gain, start);
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  src.connect(filter);
  filter.connect(env);
  env.connect(dest);
  src.start(start);
  src.stop(start + duration + 0.015);
}

function playSoftKick(ctx, dest, start, gain = 0.36) {
  scheduleNote(ctx, dest, {
    freq: 120,
    endFreq: 44,
    start,
    duration: 0.17,
    type: 'sine',
    gain,
    attack: 0.004,
  });
}

function playSoftSnare(ctx, dest, start, gain = 0.14) {
  playNoiseBurst(ctx, dest, {
    start,
    duration: 0.095,
    gain,
    filterFreq: 1750,
    filterType: 'bandpass',
    q: 0.9,
  });
  scheduleNote(ctx, dest, {
    freq: 185,
    endFreq: 112,
    start,
    duration: 0.055,
    type: 'triangle',
    gain: gain * 0.5,
    attack: 0.003,
  });
}

function playSoftShaker(ctx, dest, start, gain = 0.055) {
  playNoiseBurst(ctx, dest, {
    start,
    duration: 0.028,
    gain,
    filterFreq: 3800,
    filterType: 'bandpass',
    q: 1.1,
  });
}

// ============================================================================
// SFX ENGINE
// ============================================================================

function renderSfx(ctx, type) {
  const now = ctx.currentTime + 0.005;
  const out = getSfxOut(ctx);

  switch (type) {
    case 'step': {
      scheduleNote(ctx, out, {
        freq: 195,
        endFreq: 90,
        start: now,
        duration: 0.052,
        type: 'triangle',
        gain: 0.16,
        filterFreq: 700,
      });
      playNoiseBurst(ctx, out, { start: now, duration: 0.026, gain: 0.065, filterFreq: 920 });
      break;
    }
    case 'click': {
      playNylonGuitar(ctx, out, { freq: 523.25, start: now, duration: 0.16, gain: 0.28, brightness: 0.5 });
      break;
    }
    case 'greet': {
      playNylonGuitar(ctx, out, { freq: 440, start: now, duration: 0.22, gain: 0.28 });
      playNylonGuitar(ctx, out, { freq: 554.37, start: now + 0.08, duration: 0.26, gain: 0.3 });
      break;
    }
    case 'start': {
      playNylonGuitar(ctx, out, { freq: 392.0, start: now, duration: 0.22, gain: 0.28 });
      playNylonGuitar(ctx, out, { freq: 493.88, start: now + 0.08, duration: 0.24, gain: 0.28 });
      playNylonGuitar(ctx, out, { freq: 587.33, start: now + 0.16, duration: 0.32, gain: 0.32 });
      break;
    }
    case 'work': {
      [0, 0.06, 0.12].forEach((offset, idx) => {
        playNoiseBurst(ctx, out, {
          start: now + offset,
          duration: 0.025,
          gain: 0.15,
          filterFreq: 2000 + idx * 240,
        });
      });
      break;
    }
    case 'handoff': {
      playNylonGuitar(ctx, out, { freq: 440, start: now, duration: 0.2, gain: 0.26 });
      playNylonGuitar(ctx, out, { freq: 523.25, start: now + 0.085, duration: 0.22, gain: 0.28 });
      playNylonGuitar(ctx, out, { freq: 659.25, start: now + 0.17, duration: 0.3, gain: 0.3 });
      break;
    }
    case 'grilling': {
      playFeltPiano(ctx, out, { freq: 440, start: now, duration: 0.22, gain: 0.28 });
      playFeltPiano(ctx, out, { freq: 523.25, start: now + 0.11, duration: 0.24, gain: 0.28 });
      playFeltPiano(ctx, out, { freq: 659.25, start: now + 0.22, duration: 0.38, gain: 0.3 });
      break;
    }
    case 'approve': {
      playNylonGuitar(ctx, out, { freq: 493.88, start: now, duration: 0.2, gain: 0.28 });
      playNylonGuitar(ctx, out, { freq: 659.25, start: now + 0.08, duration: 0.3, gain: 0.32 });
      break;
    }
    case 'report': {
      [392.0, 493.88, 587.33, 783.99].forEach((freq, idx) => {
        playNylonGuitar(ctx, out, {
          freq,
          start: now + idx * 0.095,
          duration: idx === 3 ? 0.5 : 0.22,
          gain: 0.3,
        });
      });
      break;
    }
    case 'slap': {
      scheduleNote(ctx, out, {
        freq: 480,
        endFreq: 92,
        start: now,
        duration: 0.13,
        type: 'sawtooth',
        gain: 0.26,
        filterFreq: 1800,
      });
      playNoiseBurst(ctx, out, { start: now, duration: 0.055, gain: 0.2, filterFreq: 1400 });
      break;
    }
    case 'boat': {
      playNoiseBurst(ctx, out, {
        start: now,
        duration: 0.18,
        gain: 0.2,
        filterFreq: 850,
        filterType: 'bandpass',
        q: 1.2,
      });
      scheduleNote(ctx, out, {
        freq: 260,
        endFreq: 380,
        start: now + 0.04,
        duration: 0.14,
        type: 'sine',
        gain: 0.2,
      });
      break;
    }
    case 'tram': {
      // Bel kuningan trem klasik yang hangat (tidak melengking)
      [0, 0.17].forEach((off) => {
        scheduleNote(ctx, out, { freq: 880, start: now + off, duration: 0.3, type: 'sine', gain: 0.26 });
        scheduleNote(ctx, out, { freq: 1318.5, start: now + off, duration: 0.16, type: 'triangle', gain: 0.08 });
      });
      break;
    }
    case 'basketball': {
      playNoiseBurst(ctx, out, {
        start: now,
        duration: 0.13,
        gain: 0.22,
        filterFreq: 2400,
        filterType: 'bandpass',
        q: 1.3,
      });
      playNylonGuitar(ctx, out, { freq: 523.25, start: now + 0.04, duration: 0.18, gain: 0.28 });
      playNylonGuitar(ctx, out, { freq: 783.99, start: now + 0.12, duration: 0.34, gain: 0.32 });
      break;
    }
    case 'pet': {
      scheduleNote(ctx, out, {
        freq: 520,
        endFreq: 680,
        start: now,
        duration: 0.12,
        type: 'sine',
        gain: 0.22,
      });
      playNylonGuitar(ctx, out, { freq: 783.99, start: now + 0.09, duration: 0.28, gain: 0.26 });
      break;
    }
    default:
      break;
  }
}

export function playRetroTone(type, enabled = true) {
  if (!enabled || bgmState.sfxVolume <= 0.001) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx
        .resume()
        .then(() => {
          renderSfx(ctx, type);
          if (bgmState.waitingUnlock && bgmState.trackId !== 'off') {
            startBgmLoop(bgmState.trackId, bgmState.volume);
          }
        })
        .catch(() => {});
      return;
    }

    renderSfx(ctx, type);
  } catch {
    // Ignore autoplay restriction errors
  }
}

// ============================================================================
// COZY RPG VILLAGE BGM ENGINE (Stardew / Kakariko / Animal Crossing Inspired)
// Semua melodi dijaga ketat di register manis C4..F5 (261–698 Hz), anti-spike!
// ============================================================================

// Helper frekuensi nada agar komposisi akurat & mudah dibaca
const N = {
  G2: 98.0, A2: 110.0, Bb2: 116.54, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, Fs3: 185.0, G3: 196.0, A3: 220.0, Bb3: 233.08, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.0, A4: 440.0, Bb4: 466.16, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46,
};

const TRACK_CONFIGS = {
  // 1. PASTORAL VILLAGE (3/4 Waltz ala Zelda Kakariko Village & Stardew Valley!)
  // 16 bar x 6 eighth-notes per bar = 96 steps (A-Section 8 bar + B-Section 8 bar)
  village: {
    style: 'village_waltz',
    stepMs: 265,
    stepsPerBar: 6,
    chords: [
      // Bagian A: G - D/F# - Em7 - Bm7 - C - G/B - Am7 - Dsus4/D (nostalgik & hangat)
      { bass: N.G2, notes: [N.G3, N.B3, N.D4, N.G4] },
      { bass: N.Fs3 / 2, notes: [N.A3, N.D4, N.Fs4, N.A4] },
      { bass: N.E3 / 2, notes: [N.G3, N.B3, N.E4, N.G4] },
      { bass: N.B2, notes: [N.Fs3, N.B3, N.D4, N.Fs4] },
      { bass: N.C3, notes: [N.G3, N.C4, N.E4, N.G4] },
      { bass: N.B2, notes: [N.G3, N.B3, N.D4, N.G4] },
      { bass: N.A2, notes: [N.E3, N.A3, N.C4, N.E4] },
      { bass: N.D3, notes: [N.A3, N.D4, N.Fs4, N.A4] },
      // Bagian B (sentuhan Folk Mixolydian: Em - C - G - D - C - Bm7 - Am7 - D)
      { bass: N.E3 / 2, notes: [N.B3, N.E4, N.G4, N.B4] },
      { bass: N.C3, notes: [N.G3, N.C4, N.E4, N.G4] },
      { bass: N.G2, notes: [N.B3, N.D4, N.G4, N.B4] },
      { bass: N.D3, notes: [N.A3, N.D4, N.Fs4, N.A4] },
      { bass: N.C3, notes: [N.G3, N.C4, N.E4, N.G4] },
      { bass: N.B2, notes: [N.Fs3, N.B3, N.D4, N.Fs4] },
      { bass: N.A2, notes: [N.E3, N.A3, N.C4, N.E4] },
      { bass: N.D3, notes: [N.A3, N.D4, N.Fs4, N.G4] },
    ],
    // Melodi Seruling Kayu di register hangat B3..E5 (format: [bar, subStep, freq, lenSteps])
    flutePhrases: [
      // Bagian A (bar 0..7)
      [0, 0, N.B4, 3], [0, 3, N.D5, 2], [0, 5, N.B4, 1],
      [1, 0, N.A4, 4], [1, 4, N.Fs4, 2],
      [2, 0, N.G4, 3], [2, 3, N.B4, 2], [2, 5, N.A4, 1],
      [3, 0, N.Fs4, 5],
      [4, 0, N.E4, 2], [4, 2, N.G4, 2], [4, 4, N.C5, 2],
      [5, 0, N.B4, 3], [5, 3, N.A4, 2], [5, 5, N.G4, 1],
      [6, 0, N.A4, 4], [6, 4, N.G4, 2],
      [7, 0, N.Fs4, 5],
      // Bagian B (bar 8..15 — lebih ekspresif & merdu, puncak tetap lembut di E5)
      [8, 0, N.E5, 3], [8, 3, N.D5, 2], [8, 5, N.B4, 1],
      [9, 0, N.C5, 4], [9, 4, N.G4, 2],
      [10, 0, N.B4, 3], [10, 3, N.D5, 3],
      [11, 0, N.A4, 5],
      [12, 0, N.G4, 2], [12, 2, N.A4, 2], [12, 4, N.C5, 2],
      [13, 0, N.B4, 3], [13, 3, N.A4, 2], [13, 5, N.Fs4, 1],
      [14, 0, N.E4, 3], [14, 3, N.G4, 3],
      [15, 0, N.A4, 4], [15, 4, N.Fs4, 2],
    ],
  },

  // 2. TOWN SQUARE (Felt Piano & Harp ala Pallet Town / Studio Ghibli)
  morning: {
    style: 'town_piano',
    stepMs: 310,
    stepsPerBar: 4,
    chords: [
      // Cmaj7 - G/B - Am7 - Em7 - Fmaj7 - C/E - Dm7 - Gsus4
      { bass: N.C3, notes: [N.C4, N.E4, N.G4, N.B4] },
      { bass: N.B2, notes: [N.B3, N.D4, N.G4, N.B4] },
      { bass: N.A2, notes: [N.A3, N.C4, N.E4, N.G4] },
      { bass: N.E3 / 2, notes: [N.G3, N.B3, N.E4, N.G4] },
      { bass: N.F3 / 2, notes: [N.A3, N.C4, N.E4, N.A4] },
      { bass: N.E3 / 2, notes: [N.G3, N.C4, N.E4, N.G4] },
      { bass: N.D3, notes: [N.A3, N.C4, N.D4, N.F4] },
      { bass: N.G2, notes: [N.G3, N.B3, N.D4, N.G4] },
    ],
    melody: [
      N.E5, 0, N.D5, N.C5, N.B4, 0, N.G4, 0,
      N.C5, 0, N.B4, N.A4, N.G4, 0, N.E4, 0,
      N.A4, N.C5, N.E5, 0, N.D5, 0, N.C5, 0,
      N.A4, 0, N.C5, N.D5, N.B4, 0, N.G4, 0,
    ],
  },

  // 3. COZY LO-FI BEATS (Warm Felt Rhodes + Soft Boom-Bap)
  lofi: {
    style: 'lofi',
    stepMs: 350,
    stepsPerBar: 4,
    chords: [
      { bass: N.F3 / 2, notes: [N.F3, N.A3, N.C4, N.E4] },
      { bass: N.E3 / 2, notes: [N.E3, N.G3, N.B3, N.D4] },
      { bass: N.D3 / 2, notes: [N.D3, N.F3, N.A3, N.C4] },
      { bass: N.C3 / 2, notes: [N.C3, N.E3, N.G3, N.B3] },
      { bass: N.F3 / 2, notes: [N.F3, N.A3, N.C4, N.E4] },
      { bass: N.G2, notes: [N.G3, N.B3, N.D4, N.E4] },
      { bass: N.E3 / 2, notes: [N.E3, N.G3, N.B3, N.D4] },
      { bass: N.A2, notes: [N.A3, N.C4, N.E4, N.G4] },
    ],
    melody: [
      N.C5, 0, N.E5, 0, N.D5, N.C5, N.A4, 0,
      N.B4, 0, N.D5, 0, N.C5, N.A4, N.G4, 0,
      N.E5, 0, N.D5, N.C5, N.A4, 0, N.C5, 0,
      N.B4, N.C5, N.D5, 0, N.A4, 0, N.G4, 0,
    ],
  },

  // 4. KOPI SENJA BOSSA NOVA (Nylon Guitar Comping + Flute)
  bossa: {
    style: 'bossa',
    stepMs: 285,
    stepsPerBar: 4,
    chords: [
      { bass: N.C3, notes: [N.E3, N.G3, N.B3, N.D4] },
      { bass: N.D3, notes: [N.F3, N.A3, N.C4, N.E4] },
      { bass: N.G2, notes: [N.F3, N.A3, N.B3, N.E4] },
      { bass: N.E3 / 2, notes: [N.G3, N.B3, N.D4, N.G4] },
      { bass: N.A2, notes: [N.G3, N.C4, N.E4, N.G4] },
      { bass: N.D3, notes: [N.F3, N.A3, N.C4, N.E4] },
      { bass: N.G2, notes: [N.F3, N.A3, N.B3, N.D4] },
      { bass: N.C3, notes: [N.E3, N.G3, N.B3, N.D4] },
    ],
    melody: [
      N.E5, 0, N.D5, N.C5, 0, N.A4, N.C5, 0,
      N.D5, 0, N.C5, N.B4, 0, N.G4, N.A4, 0,
      N.E5, 0, N.D5, N.C5, 0, N.A4, N.E5, 0,
      N.D5, N.C5, N.B4, 0, N.C5, 0, 0, 0,
    ],
  },

  // 5. RAINY EVENING COTTAGE (Slow Felt Piano + Soft Rainfall)
  rain: {
    style: 'rain',
    stepMs: 520,
    stepsPerBar: 4,
    rainNoise: true,
    chords: [
      { bass: N.D3 / 2, notes: [N.D3, N.A3, N.C4, N.E4] },
      { bass: N.C3 / 2, notes: [N.C3, N.G3, N.B3, N.D4] },
      { bass: N.Bb2, notes: [N.F3, N.A3, N.C4, N.D4] },
      { bass: N.A2, notes: [N.E3, N.G3, N.C4, N.E4] },
      { bass: N.D3 / 2, notes: [N.D3, N.A3, N.C4, N.E4] },
      { bass: N.C3 / 2, notes: [N.C3, N.G3, N.B3, N.D4] },
      { bass: N.F3 / 2, notes: [N.A3, N.C4, N.E4, N.G4] },
      { bass: N.E3 / 2, notes: [N.G3, N.B3, N.D4, N.E4] },
    ],
    melody: [
      N.C5, 0, 0, N.A4, 0, 0, N.G4, 0,
      N.A4, 0, 0, N.F4, 0, 0, N.E4, 0,
      N.D5, 0, 0, N.C5, 0, 0, N.A4, 0,
      N.G4, 0, N.F4, 0, N.E4, 0, 0, 0,
    ],
  },
};

function stopBgmNodes() {
  if (bgmState.timerId) {
    clearInterval(bgmState.timerId);
    bgmState.timerId = null;
  }
  if (bgmState.noiseSource) {
    try {
      bgmState.noiseSource.stop();
      bgmState.noiseSource.disconnect();
    } catch {
      // ignore
    }
    bgmState.noiseSource = null;
  }
  if (bgmState.masterGain && audioCtx) {
    try {
      const now = audioCtx.currentTime;
      bgmState.masterGain.gain.cancelScheduledValues(now);
      bgmState.masterGain.gain.setTargetAtTime(0.0001, now, 0.08);
      const oldNodes = [
        bgmState.masterGain,
        bgmState.bgmToneFilter,
        bgmState.reverbNode,
        bgmState.reverbWet,
      ];
      setTimeout(() => {
        oldNodes.forEach((n) => {
          try {
            n?.disconnect();
          } catch {
            // ignore
          }
        });
      }, 340);
    } catch {
      // ignore
    }
    bgmState.masterGain = null;
    bgmState.bgmToneFilter = null;
    bgmState.reverbNode = null;
    bgmState.reverbWet = null;
  }
}

function createRainLoop(ctx, dest) {
  const length = ctx.sampleRate * 3;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.997 * b0 + white * 0.029;
    b1 = 0.985 * b1 + white * 0.032;
    b2 = 0.95 * b2 + white * 0.048;
    data[i] = (b0 + b1 + b2 + white * 0.014) * 0.48;
  }

  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1150;

  const rainGain = ctx.createGain();
  rainGain.gain.value = 0.38;

  src.connect(filter);
  filter.connect(rainGain);
  rainGain.connect(dest);
  src.start();
  return src;
}

function startBgmLoop(trackId, volume) {
  stopBgmNodes();
  const cfg = TRACK_CONFIGS[trackId];
  if (!cfg) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    bgmState.waitingUnlock = true;
    ctx
      .resume()
      .then(() => {
        if (bgmState.trackId === trackId && !bgmState.timerId) {
          bgmState.waitingUnlock = false;
          startBgmLoop(trackId, bgmState.volume);
        }
      })
      .catch(() => {});
    return;
  }

  bgmState.waitingUnlock = false;
  const targetVol = clampVol(volume, 0.75);
  const now = ctx.currentTime;

  // Bus hangat: Instrument -> Warm Tone Lowpass (2800Hz anti-tajam) -> Master Gain -> Compressor
  const master = ctx.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.linearRampToValueAtTime(Math.max(0.0001, targetVol * 1.15), now + 0.5);
  master.connect(getMasterOut(ctx));

  const toneFilter = ctx.createBiquadFilter();
  toneFilter.type = 'lowpass';
  toneFilter.frequency.setValueAtTime(2800, now);
  toneFilter.connect(master);

  // Warm Hall Convolution Reverb bus
  const reverbNode = ctx.createConvolver();
  reverbNode.buffer = getWarmReverbBuffer(ctx);
  const reverbWet = ctx.createGain();
  reverbWet.gain.setValueAtTime(cfg.style === 'rain' ? 0.42 : 0.3, now);
  reverbNode.connect(reverbWet);
  reverbWet.connect(toneFilter);

  bgmState.masterGain = master;
  bgmState.bgmToneFilter = toneFilter;
  bgmState.reverbNode = reverbNode;
  bgmState.reverbWet = reverbWet;
  bgmState.step = 0;

  if (cfg.rainNoise) {
    bgmState.noiseSource = createRainLoop(ctx, toneFilter);
  }

  // Indeks cepat untuk frasa seruling (khusus village_waltz)
  const fluteMap = new Map();
  if (cfg.flutePhrases) {
    cfg.flutePhrases.forEach(([bar, sub, freq, len]) => {
      fluteMap.set(`${bar}:${sub}`, { freq, len });
    });
  }

  const totalSteps = cfg.chords.length * cfg.stepsPerBar;

  const tick = () => {
    if (!audioCtx || audioCtx.state !== 'running' || bgmState.masterGain !== master) return;
    const stepIdx = bgmState.step;
    const barIdx = Math.floor(stepIdx / cfg.stepsPerBar) % cfg.chords.length;
    const beat = stepIdx % cfg.stepsPerBar;
    const chord = cfg.chords[barIdx];
    const t = audioCtx.currentTime + 0.035;
    const sec = cfg.stepMs / 1000;

    if (cfg.style === 'village_waltz') {
      // === PASTORAL 3/4 WALTZ (ala Zelda Kakariko / Stardew Valley) ===
      // Pola petikan gitar nilon 6/8: Bass -> note0 -> note1 -> note2 -> note3 -> note1
      if (beat === 0) {
        playWarmBass(audioCtx, toneFilter, {
          freq: chord.bass,
          start: t,
          duration: sec * 5.2,
          gain: 0.34,
        });
        playNylonGuitar(audioCtx, toneFilter, {
          freq: chord.notes[0],
          start: t,
          duration: sec * 3.8,
          gain: 0.25,
          brightness: 0.42,
        });
        // Di Bagian B (bar 8..15), tambahkan pad string/accordion lembut untuk kedalaman
        if (barIdx >= 8) {
          playWarmPad(audioCtx, reverbNode, {
            freq: chord.notes[1],
            start: t,
            duration: sec * 5.8,
            gain: 0.11,
          });
          playWarmPad(audioCtx, reverbNode, {
            freq: chord.notes[2],
            start: t,
            duration: sec * 5.8,
            gain: 0.09,
          });
        }
      } else {
        const arpOrder = [0, 1, 2, 3, 2, 1];
        const noteFreq = chord.notes[arpOrder[beat]];
        const vel = beat === 2 || beat === 4 ? 0.2 : 0.15;
        playNylonGuitar(audioCtx, toneFilter, {
          freq: noteFreq,
          start: t,
          duration: sec * 2.4,
          gain: vel,
          brightness: 0.45,
        });
        playNylonGuitar(audioCtx, reverbNode, {
          freq: noteFreq,
          start: t,
          duration: sec * 2.0,
          gain: vel * 0.45,
          brightness: 0.35,
        });
      }

      // Melodi Seruling Kayu yang bernapas & mengalir lembut (tanpa lonjakan nada!)
      const fluteEvent = fluteMap.get(`${barIdx}:${beat}`);
      if (fluteEvent) {
        const dur = sec * fluteEvent.len * 0.96;
        playWoodenFlute(audioCtx, toneFilter, {
          freq: fluteEvent.freq,
          start: t,
          duration: dur,
          gain: 0.22,
        });
        playWoodenFlute(audioCtx, reverbNode, {
          freq: fluteEvent.freq,
          start: t,
          duration: dur,
          gain: 0.14,
        });
      }
    } else if (cfg.style === 'town_piano') {
      // === TOWN SQUARE FELT PIANO & HARP ===
      if (beat === 0) {
        playWarmBass(audioCtx, toneFilter, {
          freq: chord.bass,
          start: t,
          duration: sec * 3.6,
          gain: 0.3,
        });
        chord.notes.forEach((f, idx) => {
          playFeltPiano(audioCtx, toneFilter, {
            freq: f,
            start: t + idx * 0.025,
            duration: sec * 3.8,
            gain: 0.15,
            cutoff: 1450,
          });
        });
      }
      // Petikan harpa lembut mengikuti akor di register tengah (tidak melengking)
      playNylonGuitar(audioCtx, reverbNode, {
        freq: chord.notes[beat % chord.notes.length],
        start: t,
        duration: sec * 2.2,
        gain: 0.15,
        brightness: 0.5,
      });

      const melFreq = cfg.melody[stepIdx % cfg.melody.length];
      if (melFreq > 0) {
        playFeltPiano(audioCtx, toneFilter, {
          freq: melFreq,
          start: t,
          duration: sec * 1.9,
          gain: 0.22,
          cutoff: 1600,
        });
        playFeltPiano(audioCtx, reverbNode, {
          freq: melFreq,
          start: t,
          duration: sec * 1.8,
          gain: 0.12,
          cutoff: 1400,
        });
      }
    } else if (cfg.style === 'lofi') {
      // === COZY LO-FI BEATS ===
      if (beat === 0) {
        chord.notes.forEach((f, idx) => {
          playFeltPiano(audioCtx, toneFilter, {
            freq: f,
            start: t + idx * 0.02,
            duration: sec * 3.8,
            gain: 0.17,
            cutoff: 1200,
          });
        });
        playSoftKick(audioCtx, toneFilter, t, 0.38);
      }
      if (beat === 2) playSoftSnare(audioCtx, toneFilter, t, 0.15);
      if (beat === 3 && barIdx % 2 === 1) playSoftKick(audioCtx, toneFilter, t + sec * 0.5, 0.26);
      playSoftShaker(audioCtx, toneFilter, t, beat % 2 === 1 ? 0.065 : 0.04);

      if (beat === 0 || beat === 2) {
        playWarmBass(audioCtx, toneFilter, {
          freq: chord.bass,
          start: t,
          duration: sec * 1.8,
          gain: 0.34,
        });
      }
      const melFreq = cfg.melody[stepIdx % cfg.melody.length];
      if (melFreq > 0) {
        playFeltPiano(audioCtx, toneFilter, {
          freq: melFreq,
          start: t,
          duration: sec * 1.6,
          gain: 0.22,
          cutoff: 1500,
        });
        playFeltPiano(audioCtx, reverbNode, {
          freq: melFreq,
          start: t,
          duration: sec * 1.6,
          gain: 0.12,
          cutoff: 1300,
        });
      }
    } else if (cfg.style === 'bossa') {
      // === KOPI SENJA BOSSA NOVA ===
      if (beat === 0 || beat === 2) {
        const offset = beat === 2 ? sec * 0.45 : 0;
        chord.notes.forEach((f, idx) => {
          playNylonGuitar(audioCtx, toneFilter, {
            freq: f,
            start: t + offset + idx * 0.015,
            duration: sec * 1.7,
            gain: 0.16,
            brightness: 0.45,
          });
        });
        playWarmBass(audioCtx, toneFilter, {
          freq: beat === 0 ? chord.bass : chord.notes[0] / 2,
          start: t,
          duration: sec * 1.6,
          gain: 0.32,
        });
      }
      if (beat === 0) playSoftKick(audioCtx, toneFilter, t, 0.3);
      if (beat === 1 || beat === 3) playSoftShaker(audioCtx, toneFilter, t, 0.06);
      if (beat === 2) playSoftSnare(audioCtx, toneFilter, t + sec * 0.5, 0.09);

      const melFreq = cfg.melody[stepIdx % cfg.melody.length];
      if (melFreq > 0) {
        playWoodenFlute(audioCtx, toneFilter, {
          freq: melFreq,
          start: t,
          duration: sec * 1.6,
          gain: 0.2,
        });
        playWoodenFlute(audioCtx, reverbNode, {
          freq: melFreq,
          start: t,
          duration: sec * 1.5,
          gain: 0.11,
        });
      }
    } else {
      // === RAINY EVENING COTTAGE ===
      if (beat === 0) {
        playWarmBass(audioCtx, toneFilter, {
          freq: chord.bass,
          start: t,
          duration: sec * 3.8,
          gain: 0.26,
        });
        chord.notes.forEach((f, idx) => {
          playFeltPiano(audioCtx, toneFilter, {
            freq: f,
            start: t + idx * 0.04,
            duration: sec * 3.9,
            gain: 0.16,
            cutoff: 980,
          });
        });
      }
      const melFreq = cfg.melody[stepIdx % cfg.melody.length];
      if (melFreq > 0) {
        playFeltPiano(audioCtx, toneFilter, {
          freq: melFreq,
          start: t,
          duration: sec * 2.2,
          gain: 0.2,
          cutoff: 1200,
        });
        playFeltPiano(audioCtx, reverbNode, {
          freq: melFreq,
          start: t,
          duration: sec * 2.2,
          gain: 0.14,
          cutoff: 1000,
        });
      }
    }

    bgmState.step = (stepIdx + 1) % totalSteps;
  };

  tick();
  bgmState.timerId = setInterval(tick, cfg.stepMs);
}

export function setOfficeBgm(trackId = 'off', { volume } = {}) {
  const validId = TRACK_CONFIGS[trackId] ? trackId : 'off';
  const nextVol = typeof volume === 'number' ? clampVol(volume, bgmState.volume) : bgmState.volume;
  const trackChanged = bgmState.trackId !== validId;

  bgmState.trackId = validId;
  bgmState.volume = nextVol;

  if (validId === 'off') {
    bgmState.waitingUnlock = false;
    stopBgmNodes();
    return;
  }

  if (!trackChanged && bgmState.timerId && bgmState.masterGain && audioCtx) {
    setBgmVolume(nextVol);
    return;
  }

  startBgmLoop(validId, nextVol);
}

export function setBgmVolume(volume = 0.75) {
  const next = clampVol(volume, 0.75);
  bgmState.volume = next;
  if (bgmState.masterGain && audioCtx) {
    const now = audioCtx.currentTime;
    bgmState.masterGain.gain.cancelScheduledValues(now);
    bgmState.masterGain.gain.setTargetAtTime(Math.max(0.0001, next * 1.15), now, 0.04);
  }
}

export function setSfxVolume(volume = 0.8) {
  const next = clampVol(volume, 0.8);
  bgmState.sfxVolume = next;
  if (sfxGainNode && audioCtx) {
    const now = audioCtx.currentTime;
    sfxGainNode.gain.cancelScheduledValues(now);
    sfxGainNode.gain.setTargetAtTime(next, now, 0.03);
  }
}

export function getAudioVolumes() {
  return {
    bgmVolume: bgmState.volume,
    sfxVolume: bgmState.sfxVolume,
  };
}

export function stopOfficeBgm() {
  bgmState.trackId = 'off';
  bgmState.waitingUnlock = false;
  stopBgmNodes();
}

export function unlockAudio() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx
        .resume()
        .then(() => {
          if (bgmState.trackId !== 'off' && !bgmState.timerId) {
            startBgmLoop(bgmState.trackId, bgmState.volume);
          }
        })
        .catch(() => {});
    } else if (bgmState.trackId !== 'off' && !bgmState.timerId) {
      startBgmLoop(bgmState.trackId, bgmState.volume);
    }
  } catch {
    // ignore
  }
}
