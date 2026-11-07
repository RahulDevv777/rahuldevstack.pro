/**
 * Step feedback for gestures — the click you feel when an iOS picker snaps to
 * the next value.
 *
 * Two channels, because they cover different devices:
 *
 *  - `navigator.vibrate()` fires the motor. Works on Android; iOS Safari does
 *    not expose the Taptic Engine to web pages at all, so on an iPhone this is
 *    a silent no-op.
 *  - a ~30 ms synthesised click through WebAudio. Works everywhere, iPhone
 *    included, and is the only feedback iOS can give without a native app.
 *
 * Both fire together where they are available, so a phone that has the motor
 * gets the tick *and* the sound, and an iPhone still gets the tick in the ear.
 *
 * Everything is gated on a real user gesture (browsers refuse to start audio
 * otherwise) and throttled, so a fast flick produces a rhythm rather than a
 * buzz.
 */

export type TickStrength = 'light' | 'medium';

/** Shortest gap between two ticks. Below this a flick just sounds like noise. */
const GAP_MS = 40;
const STORAGE_KEY = 'rd:haptics';

let enabled = true;
try {
  enabled = localStorage.getItem(STORAGE_KEY) !== 'off';
} catch {
  /* private mode — keep the default */
}

let lastTickAt = 0;
let context: AudioContext | null = null;
let noise: AudioBuffer | null = null;
let unlocked = false;

function audioContext(): AudioContext | null {
  if (context) return context;
  const Ctor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  try {
    context = new Ctor();
  } catch {
    return null;
  }
  return context;
}

/**
 * Browsers create the audio context suspended. This must run inside a real
 * gesture — a touch, a click or a key press — or iOS keeps it muted.
 */
export function unlockHaptics(): void {
  const ctx = audioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') void ctx.resume();
  if (unlocked) return;
  unlocked = true;
  // Silent one-sample start: iOS only marks the context as usable once a
  // buffer has actually played during the gesture.
  const source = ctx.createBufferSource();
  source.buffer = ctx.createBuffer(1, 1, 22_050);
  source.connect(ctx.destination);
  source.start(0);
}

if (typeof window !== 'undefined') {
  const gestures: Array<keyof WindowEventMap> = [
    'touchstart',
    'pointerdown',
    'mousedown',
    'keydown',
    'wheel',
  ];
  const once = () => {
    unlockHaptics();
    gestures.forEach((type) => window.removeEventListener(type, once));
  };
  gestures.forEach((type) =>
    window.addEventListener(type, once, { passive: true }),
  );
}

function playClick(strength: TickStrength): void {
  const ctx = audioContext();
  if (!ctx) return;

  // Safari can leave the context suspended for the first few gestures; ask
  // again on every tick so the sound starts as soon as it is allowed to.
  if (ctx.state === 'suspended') void ctx.resume();
  if (ctx.state !== 'running') return;

  const now = ctx.currentTime;
  const level = strength === 'medium' ? 0.8 : 0.6;

  if (!noise) {
    const length = Math.ceil(ctx.sampleRate * 0.06);
    noise = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  }

  // The transient: a band-passed noise burst that reads as a plastic "tack".
  // Tuned for a phone speaker, which has almost no bass — the energy sits
  // where the driver is loudest.
  const transient = ctx.createBufferSource();
  transient.buffer = noise;
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 2_300;
  band.Q.value = 0.8;
  const transientGain = ctx.createGain();
  transientGain.gain.setValueAtTime(level, now);
  transientGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
  transient.connect(band).connect(transientGain).connect(ctx.destination);
  transient.start(now);
  transient.stop(now + 0.045);

  // The body: a short falling sine that gives the click a little weight.
  const body = ctx.createOscillator();
  body.type = 'triangle';
  body.frequency.setValueAtTime(420, now);
  body.frequency.exponentialRampToValueAtTime(180, now + 0.04);
  const bodyGain = ctx.createGain();
  bodyGain.gain.setValueAtTime(level * 0.45, now);
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
  body.connect(bodyGain).connect(ctx.destination);
  body.start(now);
  body.stop(now + 0.07);
}

/**
 * Fire one step of feedback. Safe to call on every animation frame — repeated
 * calls inside the throttle window are dropped.
 */
export function tick(strength: TickStrength = 'light'): void {
  if (!enabled) return;

  const now = performance.now();
  if (now - lastTickAt < GAP_MS) return;
  lastTickAt = now;

  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      // Android ignores anything much under 10 ms, so the light detent is
      // still long enough to be felt through a case.
      navigator.vibrate(strength === 'medium' ? 22 : 14);
    } catch {
      /* some browsers throw when the page is not visible */
    }
  }

  playClick(strength);
}

/** Mute or unmute the feedback. Persisted, so it survives a reload. */
export function setHapticsEnabled(on: boolean): void {
  enabled = on;
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    /* private mode */
  }
  if (!on && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(0);
  }
  if (on) unlockHaptics();
}

export function hapticsEnabled(): boolean {
  return enabled;
}
