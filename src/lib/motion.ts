export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const lerp = (from: number, to: number, t: number) =>
  from + (to - from) * t;

export const mod = (value: number, length: number) =>
  ((value % length) + length) % length;

/** Frame-rate independent smoothing factor for a per-frame `factor` at 60fps. */
export const damp = (factor: number, dt: number) =>
  1 - Math.pow(1 - factor, dt / 16.6667);

/**
 * CSS cubic-bezier timing function as a JS easing function.
 * x1/y1/x2/y2 are the control points of the curve.
 */
export const cubicBezier = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) => {
  const a = (p1: number, p2: number) => 1 - 3 * p2 + 3 * p1;
  const b = (p1: number, p2: number) => 3 * p2 - 6 * p1;
  const c = (p1: number) => 3 * p1;
  const calc = (t: number, p1: number, p2: number) =>
    ((a(p1, p2) * t + b(p1, p2)) * t + c(p1)) * t;
  const slope = (t: number, p1: number, p2: number) =>
    3 * a(p1, p2) * t * t + 2 * b(p1, p2) * t + c(p1);

  const solveX = (x: number) => {
    let t = x;
    for (let i = 0; i < 6; i += 1) {
      const s = slope(t, x1, x2);
      if (s === 0) break;
      const error = calc(t, x1, x2) - x;
      if (Math.abs(error) < 1e-6) return t;
      t -= error / s;
    }
    let low = 0;
    let high = 1;
    t = x;
    for (let i = 0; i < 24; i += 1) {
      const value = calc(t, x1, x2);
      if (Math.abs(value - x) < 1e-6) return t;
      if (value < x) low = t;
      else high = t;
      t = (low + high) / 2;
    }
    return t;
  };

  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    return calc(solveX(x), y1, y2);
  };
};

/** UI easing — soft and fast out. */
export const easeOut = cubicBezier(0.22, 1, 0.36, 1);
/** Cinematic in-out easing for full-page moves. */
export const cinematic = cubicBezier(0.76, 0, 0.24, 1);

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
