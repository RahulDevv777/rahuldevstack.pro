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
  const level = strength === 'medium' ? 0.85 : 0.7;

  if (!noise) {
    const length = Math.ceil(ctx.sampleRate * 0.04);
    noise = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  }

  // The iOS picker tick is almost pure transient: dry, bright, about 10 ms,
  // with no bass at all. The low thump in the previous version is exactly
  // what made it read as a "thock" instead of a "tick".
  const click = ctx.createBufferSource();
  click.buffer = noise;
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 3_600;
  band.Q.value = 1.4;
  const clickGain = ctx.createGain();
  clickGain.gain.setValueAtTime(level, now);
  clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.013);
  click.connect(band).connect(clickGain).connect(ctx.destination);
  click.start(now);
  click.stop(now + 0.02);

  // A short 2.4 kHz sine under the noise: it gives the detent a pitch to land
  // on, which is what the system sound has instead of body.
  const tone = ctx.createOscillator();
  tone.type = 'sine';
  tone.frequency.setValueAtTime(2_400, now);
  tone.frequency.exponentialRampToValueAtTime(1_500, now + 0.012);
  const toneGain = ctx.createGain();
  toneGain.gain.setValueAtTime(level * 0.34, now);
  toneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.014);
  tone.connect(toneGain).connect(ctx.destination);
  tone.start(now);
  tone.stop(now + 0.018);
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
      // The iOS selection haptic is a single short impulse; Android has no
      // amplitude control, so duration is the only way to make it read light
      // instead of heavy. Under ~10 ms most Android motors do nothing at all.
      navigator.vibrate(strength === 'medium' ? 20 : 12);
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
