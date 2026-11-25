let audioCtx = null;
let bgmState = {
  trackId: 'off',
  volume: 0.22,
  timerId: null,
  masterGain: null,
  noiseSource: null,
  step: 0,
  waitingUnlock: false,
};

export const OFFICE_BGM_TRACKS = [
  { id: 'off', label: 'BGM: Off' },
  { id: 'lofi', label: 'Cozy Lo-Fi Office' },
  { id: 'morning', label: 'Morning Piano' },
  { id: 'bossa', label: 'Cafe Bossa Lounge' },
  { id: 'rain', label: 'Rainy Focus' },
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
];

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  return audioCtx;
}

function scheduleNote(ctx, dest, { freq, start, duration, type = 'sine', gain = 0.08, endFreq = null, filterFreq = null }) {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (endFreq && endFreq > 0) {
    osc.frequency.exponentialRampToValueAtTime(endFreq, start + duration);
  }

  env.gain.setValueAtTime(0.0001, start);
  env.gain.linearRampToValueAtTime(gain, start + Math.min(0.015, duration * 0.25));
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
  osc.stop(start + duration + 0.02);
}

function playNoiseBurst(ctx, dest, { start, duration = 0.04, gain = 0.07, filterFreq = 1600, filterType = 'bandpass' }) {
  const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleCount * 0.4));
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.setValueAtTime(filterFreq, start);

  const env = ctx.createGain();
  env.gain.setValueAtTime(gain, start);
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  src.connect(filter);
  filter.connect(env);
  env.connect(dest);
  src.start(start);
  src.stop(start + duration + 0.01);
}

function renderSfx(ctx, type) {
  const now = ctx.currentTime + 0.005;
  const out = ctx.destination;

  switch (type) {
    case 'step': {
      // Langkah kaki kayu/lantai yang lembut namun terdengar jelas
      scheduleNote(ctx, out, {
        freq: 185,
        endFreq: 92,
        start: now,
        duration: 0.055,
        type: 'triangle',
        gain: 0.09,
        filterFreq: 650,
      });
      playNoiseBurst(ctx, out, { start: now, duration: 0.03, gain: 0.045, filterFreq: 900 });
      break;
    }
    case 'click': {
      // Pop UI yang renyah
      scheduleNote(ctx, out, {
        freq: 520,
        endFreq: 680,
        start: now,
        duration: 0.065,
        type: 'triangle',
        gain: 0.12,
      });
      break;
    }
    case 'greet': {
      // Sapaan hangat 2 nada saat klik NPC / staf
      scheduleNote(ctx, out, { freq: 523.25, start: now, duration: 0.09, type: 'triangle', gain: 0.12 });
      scheduleNote(ctx, out, { freq: 659.25, start: now + 0.075, duration: 0.13, type: 'triangle', gain: 0.12 });
      break;
    }
    case 'start': {
      // Nada mulai eksekusi tugas
      scheduleNote(ctx, out, { freq: 440, start: now, duration: 0.09, type: 'triangle', gain: 0.13 });
      scheduleNote(ctx, out, { freq: 554.37, start: now + 0.08, duration: 0.1, type: 'triangle', gain: 0.13 });
      scheduleNote(ctx, out, { freq: 659.25, start: now + 0.16, duration: 0.18, type: 'sine', gain: 0.14 });
      break;
    }
    case 'work': {
      // Ketukan keyboard lembut saat agen mulai bekerja di meja
      [0, 0.065, 0.13].forEach((offset, idx) => {
        playNoiseBurst(ctx, out, {
          start: now + offset,
          duration: 0.025,
          gain: 0.08,
          filterFreq: 1900 + idx * 250,
        });
      });
      break;
    }
    case 'handoff': {
      // Nada estafet dokumen antar ruangan
      scheduleNote(ctx, out, { freq: 523.25, start: now, duration: 0.11, type: 'triangle', gain: 0.14 });
      scheduleNote(ctx, out, { freq: 659.25, start: now + 0.09, duration: 0.12, type: 'triangle', gain: 0.14 });
      scheduleNote(ctx, out, { freq: 783.99, start: now + 0.18, duration: 0.18, type: 'sine', gain: 0.13 });
      break;
    }
    case 'grilling': {
      // Notifikasi pertanyaan konfirmasi inti (hangat & menarik perhatian)
      scheduleNote(ctx, out, { freq: 493.88, start: now, duration: 0.12, type: 'sine', gain: 0.15 });
      scheduleNote(ctx, out, { freq: 587.33, start: now + 0.11, duration: 0.12, type: 'sine', gain: 0.15 });
      scheduleNote(ctx, out, { freq: 739.99, start: now + 0.22, duration: 0.24, type: 'triangle', gain: 0.14 });
      break;
    }
    case 'approve': {
      // Nada konfirmasi disetujui
      scheduleNote(ctx, out, { freq: 587.33, start: now, duration: 0.09, type: 'triangle', gain: 0.13 });
      scheduleNote(ctx, out, { freq: 880, start: now + 0.08, duration: 0.18, type: 'sine', gain: 0.14 });
      break;
    }
    case 'report': {
      // Fanfare singkat laporan selesai
      scheduleNote(ctx, out, { freq: 523.25, start: now, duration: 0.11, type: 'triangle', gain: 0.14 });
      scheduleNote(ctx, out, { freq: 659.25, start: now + 0.09, duration: 0.11, type: 'triangle', gain: 0.14 });
      scheduleNote(ctx, out, { freq: 783.99, start: now + 0.18, duration: 0.13, type: 'triangle', gain: 0.14 });
      scheduleNote(ctx, out, { freq: 1046.5, start: now + 0.28, duration: 0.28, type: 'sine', gain: 0.15 });
      break;
    }
    case 'slap': {
      // Efek cambuk/tegur lucu (seimbang dengan SFX lain)
      scheduleNote(ctx, out, {
        freq: 520,
        endFreq: 95,
        start: now,
        duration: 0.13,
        type: 'sawtooth',
        gain: 0.16,
        filterFreq: 2200,
      });
      playNoiseBurst(ctx, out, { start: now, duration: 0.055, gain: 0.12, filterFreq: 1400 });
      break;
    }
    default:
      break;
  }
}

export function playRetroTone(type, enabled = true) {
  if (!enabled) return;
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
// OFFICE LOBBY BGM ENGINE (Procedural Web Audio — Tenang & Cozy, Zero Assets)
// ============================================================================

const TRACK_CONFIGS = {
  lofi: {
    stepMs: 700,
    chords: [
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [164.81, 196.0, 246.94, 293.66], // Em7
      [146.83, 174.61, 220.0, 261.63], // Dm7
      [130.81, 164.81, 196.0, 246.94], // Cmaj7
    ],
    melody: [523.25, 0, 659.25, 587.33, 523.25, 0, 440.0, 0, 493.88, 0, 587.33, 523.25, 392.0, 0, 440.0, 0],
    wave: 'triangle',
    filterFreq: 950,
    bassGain: 0.14,
  },
  morning: {
    stepMs: 560,
    chords: [
      [196.0, 246.94, 293.66, 369.99], // Gmaj7
      [164.81, 196.0, 246.94, 293.66], // Em7
      [130.81, 164.81, 196.0, 246.94], // Cmaj7
      [146.83, 185.0, 220.0, 293.66],  // D6/add9
    ],
    melody: [587.33, 659.25, 739.99, 0, 783.99, 739.99, 659.25, 0, 523.25, 587.33, 659.25, 0, 587.33, 493.88, 440.0, 0],
    wave: 'sine',
    filterFreq: 1400,
    bassGain: 0.1,
  },
  bossa: {
    stepMs: 460,
    chords: [
      [130.81, 164.81, 196.0, 246.94], // Cmaj7
      [146.83, 174.61, 220.0, 261.63], // Dm7
      [196.0, 246.94, 293.66, 349.23], // G7
      [164.81, 196.0, 246.94, 293.66], // Em7
    ],
    melody: [659.25, 0, 587.33, 523.25, 0, 440.0, 523.25, 0, 587.33, 0, 523.25, 493.88, 0, 392.0, 440.0, 0],
    wave: 'triangle',
    filterFreq: 1150,
    bassGain: 0.15,
    bossaPulse: true,
  },
  rain: {
    stepMs: 950,
    chords: [
      [146.83, 220.0, 261.63, 329.63], // Dm9
      [130.81, 196.0, 246.94, 293.66], // Cmaj9
      [116.54, 174.61, 220.0, 261.63], // Bbmaj7
      [110.0, 164.81, 196.0, 261.63],  // Am7
    ],
    melody: [523.25, 0, 0, 440.0, 0, 0, 392.0, 0, 440.0, 0, 0, 349.23, 0, 0, 329.63, 0],
    wave: 'sine',
    filterFreq: 720,
    bassGain: 0.11,
    rainNoise: true,
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
      const oldGain = bgmState.masterGain;
      setTimeout(() => {
        try {
          oldGain.disconnect();
        } catch {
          // ignore
        }
      }, 300);
    } catch {
      // ignore
    }
    bgmState.masterGain = null;
  }
}

function createRainLoop(ctx, dest) {
  const length = ctx.sampleRate * 3;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  // Pink-ish rain noise (lembut di telinga)
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.997 * b0 + white * 0.029;
    b1 = 0.985 * b1 + white * 0.032;
    b2 = 0.95 * b2 + white * 0.048;
    data[i] = (b0 + b1 + b2 + white * 0.015) * 0.45;
  }

  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1100;

  const rainGain = ctx.createGain();
  rainGain.gain.value = 0.35;

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
  const master = ctx.createGain();
  const now = ctx.currentTime;
  master.gain.setValueAtTime(0.0001, now);
  master.gain.linearRampToValueAtTime(Math.max(0.05, Math.min(0.6, volume)), now + 0.6);
  master.connect(ctx.destination);
  bgmState.masterGain = master;
  bgmState.step = 0;

  if (cfg.rainNoise) {
    bgmState.noiseSource = createRainLoop(ctx, master);
  }

  const tick = () => {
    if (!audioCtx || audioCtx.state !== 'running' || bgmState.masterGain !== master) return;
    const stepIdx = bgmState.step;
    const chord = cfg.chords[Math.floor(stepIdx / 4) % cfg.chords.length];
    const beatInBar = stepIdx % 4;
    const t = audioCtx.currentTime + 0.03;
    const sec = cfg.stepMs / 1000;

    // Warm chord pad di ketukan pertama tiap bar (atau ritme bossa)
    if (beatInBar === 0 || (cfg.bossaPulse && beatInBar === 2)) {
      chord.forEach((freq, i) => {
        scheduleNote(audioCtx, master, {
          freq,
          start: t + i * 0.018,
          duration: cfg.bossaPulse ? sec * 1.7 : sec * 3.7,
          type: cfg.wave,
          gain: 0.075,
          filterFreq: cfg.filterFreq,
        });
      });
    }

    // Bass lembut
    if (beatInBar === 0 || beatInBar === 2) {
      scheduleNote(audioCtx, master, {
        freq: chord[0] / 2,
        start: t,
        duration: sec * 1.6,
        type: 'sine',
        gain: cfg.bassGain,
        filterFreq: 360,
      });
    }

    // Soft shaker / brush pulse untuk Lo-Fi & Bossa
    if ((trackId === 'lofi' && beatInBar % 2 === 1) || (cfg.bossaPulse && beatInBar !== 0)) {
      playNoiseBurst(audioCtx, master, {
        start: t,
        duration: 0.028,
        gain: 0.03,
        filterFreq: 3200,
        filterType: 'highpass',
      });
    }

    // Melodi halus (electric piano / bell)
    const melFreq = cfg.melody[stepIdx % cfg.melody.length];
    if (melFreq > 0) {
      scheduleNote(audioCtx, master, {
        freq: melFreq,
        start: t,
        duration: sec * 1.45,
        type: 'sine',
        gain: 0.09,
        filterFreq: cfg.filterFreq + 500,
      });
    }

    bgmState.step = (stepIdx + 1) % 16;
  };

  tick();
  bgmState.timerId = setInterval(tick, cfg.stepMs);
}

export function setOfficeBgm(trackId = 'off', { volume = 0.22 } = {}) {
  const validId = TRACK_CONFIGS[trackId] ? trackId : 'off';
  bgmState.trackId = validId;
  bgmState.volume = volume;
  if (validId === 'off') {
    bgmState.waitingUnlock = false;
    stopBgmNodes();
    return;
  }
  startBgmLoop(validId, volume);
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
