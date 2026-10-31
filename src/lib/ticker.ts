type Tick = (now: number, dt: number) => void;

const listeners = new Set<Tick>();
let frame = 0;
let last = 0;

const loop = (now: number) => {
  const dt = last ? Math.min(64, now - last) : 16.6667;
  last = now;

  // Copy first: a listener may remove itself while ticking.
  for (const listener of Array.from(listeners)) {
    listener(now, dt);
  }

  if (listeners.size > 0) {
    frame = requestAnimationFrame(loop);
  } else {
    frame = 0;
    last = 0;
  }
};

/**
 * The single requestAnimationFrame loop for the whole site.
 * Returns an unsubscribe function.
 */
export const addTick = (tick: Tick) => {
  listeners.add(tick);
  if (!frame) {
    last = 0;
    frame = requestAnimationFrame(loop);
  }
  return () => {
    listeners.delete(tick);
    if (listeners.size === 0 && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
    }
  };
};
