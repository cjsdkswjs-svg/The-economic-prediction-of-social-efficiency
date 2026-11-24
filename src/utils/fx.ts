// Procedural Web Audio API sound effects & Unity-inspired 105 BPM E-minor BGM (offline, zero external assets)

let audioCtx: AudioContext | null = null;
let bgmTimer: number | null = null;
let bgmStep = 0;
let bgmRunning = false;
let bgmMuted = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    try {
      audioCtx = new Ctx();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  delay = 0,
  volume = 0.08,
  slideToFreq?: number
) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideToFreq) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideToFreq), start + duration);
  }

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(start);
  osc.stop(start + duration + 0.02);
}

// ============================================================================
// Unity (TheFatRat) Style Electro-Chiptune BGM — 105 BPM, E minor (Em - C - D - A)
// 16th-note step = 60 / 105 / 4 ≈ 143ms, 64 steps per 4-bar phrase
// ============================================================================
const UNITY_CHORDS_BASS = [
  82.41,  // Bar 0: E2 (Em)
  65.41,  // Bar 1: C2 (C)
  73.42,  // Bar 2: D2 (D)
  110.0,  // Bar 3: A2 (A)
];

// Bright flute/square-style melodic motif in E minor / G major pentatonic
// 0 = rest
const UNITY_MELODY: number[][] = [
  // Bar 0 (Em): bouncy signature motif
  [659.25, 0, 783.99, 0, 987.77, 0, 783.99, 659.25, 587.33, 0, 659.25, 0, 783.99, 0, 659.25, 0],
  // Bar 1 (C): uplifting rise
  [523.25, 0, 659.25, 0, 783.99, 0, 659.25, 523.25, 587.33, 0, 659.25, 0, 783.99, 0, 987.77, 0],
  // Bar 2 (D): bright crest
  [880.0, 0, 783.99, 0, 659.25, 0, 587.33, 0, 659.25, 0, 783.99, 0, 880.0, 0, 783.99, 0],
  // Bar 3 (A): energetic turnaround
  [659.25, 0, 587.33, 0, 554.37, 0, 440.0, 0, 554.37, 0, 659.25, 0, 880.0, 0, 783.99, 0],
];

function playFilteredSynth(
  freq: number,
  duration: number,
  type: OscillatorType,
  volume: number,
  cutoffHz: number
) {
  const ctx = getAudioContext();
  if (!ctx || bgmMuted) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(cutoffHz, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function playKickPulse() {
  const ctx = getAudioContext();
  if (!ctx || bgmMuted) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(125, now);
  osc.frequency.exponentialRampToValueAtTime(42, now + 0.09);
  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.12);
}

function playHiHat() {
  const ctx = getAudioContext();
  if (!ctx || bgmMuted) return;
  const now = ctx.currentTime;
  const bufferSize = Math.floor(ctx.sampleRate * 0.035);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;

  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.setValueAtTime(6500, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.016, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

  src.connect(hp);
  hp.connect(gain);
  gain.connect(ctx.destination);
  src.start(now);
}

function tickBgmStep() {
  if (bgmMuted || !bgmRunning) return;

  const bar = Math.floor(bgmStep / 16) % 4;
  const stepInBar = bgmStep % 16;

  // Four-on-the-floor electro kick on quarter notes (0, 4, 8, 12)
  if (stepInBar % 4 === 0) {
    playKickPulse();
  }

  // Off-beat crisp hi-hat (2, 6, 10, 14)
  if (stepInBar % 4 === 2) {
    playHiHat();
  }

  // Bouncy electro-house bass on off-beats & root
  const bassRoot = UNITY_CHORDS_BASS[bar];
  if (stepInBar === 0 || stepInBar === 3 || stepInBar === 6 || stepInBar === 10 || stepInBar === 14) {
    const octave = stepInBar % 4 === 2 ? bassRoot * 2 : bassRoot;
    playFilteredSynth(octave, 0.16, 'sawtooth', 0.028, 480);
  }

  // Iconic bright Unity-style square/triangle lead melody
  const leadFreq = UNITY_MELODY[bar][stepInBar];
  if (leadFreq > 0) {
    playFilteredSynth(leadFreq, 0.18, 'square', 0.016, 2200);
    playFilteredSynth(leadFreq * 0.5, 0.18, 'triangle', 0.018, 1800);
  }

  bgmStep = (bgmStep + 1) % 64;
}

export function startBgm(muted: boolean) {
  bgmMuted = muted;
  if (muted) {
    stopBgmLoop();
    return;
  }
  const ctx = getAudioContext();
  if (!ctx) return;

  if (!bgmRunning) {
    bgmRunning = true;
    tickBgmStep();
    bgmTimer = window.setInterval(tickBgmStep, 143); // ~105 BPM 16th-note grid
  }
}

export function stopBgmLoop() {
  bgmRunning = false;
  if (bgmTimer !== null && typeof window !== 'undefined') {
    window.clearInterval(bgmTimer);
    bgmTimer = null;
  }
}

export function setBgmMuted(muted: boolean) {
  bgmMuted = muted;
  if (muted) {
    stopBgmLoop();
  } else {
    startBgm(false);
  }
}

export function isBgmActive(): boolean {
  return bgmRunning && !bgmMuted;
}

export function playClickSound(muted: boolean) {
  if (muted) return;
  playTone(620, 0.06, 'triangle', 0, 0.05, 480);
}

export function playCardToggleSound(muted: boolean, selected: boolean) {
  if (muted) return;
  if (selected) {
    playTone(523.25, 0.09, 'sine', 0, 0.07);
    playTone(659.25, 0.12, 'sine', 0.05, 0.07);
  } else {
    playTone(440, 0.08, 'triangle', 0, 0.05, 340);
  }
}

export type EffectSeverity = 'positive' | 'mixed' | 'warning';

// 효율성 상승 효과음: 밝고 신나는 상승 "딩-동-댕!" 차임
export function playEfficiencyUpChime(muted: boolean) {
  if (muted) return;
  playTone(659.25, 0.12, 'triangle', 0, 0.09);     // E5
  playTone(783.99, 0.12, 'triangle', 0.08, 0.09);  // G5
  playTone(987.77, 0.14, 'triangle', 0.16, 0.09);  // B5
  playTone(1318.51, 0.28, 'sine', 0.24, 0.1);      // E6
}

// 효율성 하락 효과음: 퀴즈 오답 느낌의 "따-다-당!" 하강 버저
export function playEfficiencyDownWrongBuzzer(muted: boolean) {
  if (muted) return;
  // 따!
  playTone(311.13, 0.11, 'sawtooth', 0, 0.08, 293.66);
  // 다!
  playTone(277.18, 0.11, 'sawtooth', 0.13, 0.08, 261.63);
  // 당~~~ (낮고 묵직한 오답 버저)
  playTone(207.65, 0.38, 'sawtooth', 0.26, 0.095, 146.83);
  playTone(103.83, 0.38, 'triangle', 0.26, 0.08, 73.42);
}

export function playChoiceOutcomeSound(
  muted: boolean,
  efficiencyChange: number
) {
  if (muted) return;
  if (efficiencyChange > 0.05) {
    playEfficiencyUpChime(false);
  } else if (efficiencyChange < -0.05) {
    playEfficiencyDownWrongBuzzer(false);
  } else {
    playTone(440, 0.12, 'triangle', 0, 0.06);
    playTone(523.25, 0.15, 'sine', 0.07, 0.06);
  }
}

export function playEndingFanfare(muted: boolean, endingId: string) {
  if (muted) return;
  if (endingId === 'co_growth') {
    playTone(523.25, 0.16, 'triangle', 0, 0.08);
    playTone(659.25, 0.16, 'triangle', 0.09, 0.08);
    playTone(783.99, 0.18, 'triangle', 0.18, 0.08);
    playTone(1046.5, 0.42, 'sine', 0.27, 0.1);
  } else if (endingId === 'corporate_only' || endingId === 'social_only') {
    playTone(392, 0.2, 'triangle', 0, 0.07);
    playTone(466.16, 0.2, 'triangle', 0.12, 0.07);
    playTone(349.23, 0.36, 'sine', 0.24, 0.08);
  } else {
    playTone(392, 0.18, 'sine', 0, 0.06);
    playTone(440, 0.28, 'sine', 0.12, 0.06);
  }
}
