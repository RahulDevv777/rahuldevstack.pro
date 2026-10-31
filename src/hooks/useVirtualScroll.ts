import { useEffect, useRef, useState } from 'react';
import { clamp, damp, prefersReducedMotion } from '../lib/motion';
import { addTick } from '../lib/ticker';

interface Options {
  enabled: boolean;
  onOverscroll: () => void;
  resetKey: unknown;
}

const normalizeWheel = (event: WheelEvent) => {
  if (event.deltaMode === 1) return event.deltaY * 16;
  if (event.deltaMode === 2) return event.deltaY * window.innerHeight;
  return event.deltaY;
};

/**
 * One inertial scroll engine for the detail content columns.
 * The column is translated inside a clipped viewport; no native scrollbar.
 */
export const useVirtualScroll = ({
  enabled,
  onOverscroll,
  resetKey,
}: Options) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [showEndHint, setShowEndHint] = useState(false);

  const stateRef = useRef({
    target: 0,
    display: 0,
    max: 0,
    overscroll: 0,
    triggered: false,
    lastInput: 0,
    drawn: Number.NEGATIVE_INFINITY,
  });
  const overscrollRef = useRef(onOverscroll);
  const hintRef = useRef(false);

  overscrollRef.current = onOverscroll;

  // Reset at the top every time a fresh detail opens.
  useEffect(() => {
    stateRef.current.target = 0;
    stateRef.current.display = 0;
    stateRef.current.overscroll = 0;
    stateRef.current.triggered = false;
    stateRef.current.drawn = Number.NEGATIVE_INFINITY;
  }, [resetKey]);

  // Measure the content height.
  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;

    const measure = () => {
      const max = Math.max(0, content.scrollHeight - viewport.clientHeight);
      stateRef.current.max = max;
      stateRef.current.target = clamp(stateRef.current.target, 0, max);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    observer.observe(viewport);
    window.addEventListener('resize', measure);
    document.fonts?.ready.then(measure).catch(() => undefined);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  // Wheel and touch input.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !enabled) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const state = stateRef.current;
      const delta = normalizeWheel(event);
      if (!delta) return;
      state.lastInput = performance.now();

      const previous = state.target;
      state.target = clamp(state.target + delta, 0, state.max);

      if (state.target === state.max && delta > 0 && previous === state.max) {
        state.overscroll += delta * 0.92;
      } else {
        state.overscroll = 0;
      }

      if (state.overscroll > 260 && !state.triggered) {
        state.triggered = true;
        overscrollRef.current();
      }
    };

    let startY = 0;
    let lastY = 0;
    let dragging = false;
    let suppressClick = false;

    const onTouchStart = (event: TouchEvent) => {
      startY = event.touches[0].clientY;
      lastY = startY;
      dragging = false;
    };

    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      const dy = touch.clientY - startY;
      if (!dragging && Math.abs(dy) < 7) return;
      dragging = true;
      event.preventDefault();

      const state = stateRef.current;
      const step = lastY - touch.clientY;
      lastY = touch.clientY;
      state.lastInput = performance.now();

      const previous = state.target;
      state.target = clamp(state.target + step * 1.45, 0, state.max);

      if (state.target === state.max && step > 0 && previous === state.max) {
        state.overscroll += step * 1.45;
      } else {
        state.overscroll = 0;
      }

      if (state.overscroll > 260 && !state.triggered) {
        state.triggered = true;
        overscrollRef.current();
      }
    };

    const onTouchEnd = () => {
      if (dragging) {
        suppressClick = true;
        window.setTimeout(() => {
          suppressClick = false;
        }, 320);
      }
      dragging = false;
    };

    const onClickCapture = (event: MouseEvent) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    };

    viewport.addEventListener('wheel', onWheel, { passive: false });
    viewport.addEventListener('touchstart', onTouchStart, { passive: true });
    viewport.addEventListener('touchmove', onTouchMove, { passive: false });
    viewport.addEventListener('touchend', onTouchEnd, { passive: true });
    viewport.addEventListener('click', onClickCapture, true);

    return () => {
      viewport.removeEventListener('wheel', onWheel);
      viewport.removeEventListener('touchstart', onTouchStart);
      viewport.removeEventListener('touchmove', onTouchMove);
      viewport.removeEventListener('touchend', onTouchEnd);
      viewport.removeEventListener('click', onClickCapture, true);
    };
  }, [enabled]);

  // Keyboard scrolling while the detail owns the screen.
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

      const state = stateRef.current;
      const page = window.innerHeight * 0.62;
      let handled = true;

      switch (event.key) {
        case 'ArrowDown':
        case 'PageDown':
        case ' ':
          state.target = clamp(state.target + page, 0, state.max);
          break;
        case 'ArrowUp':
        case 'PageUp':
          state.target = clamp(state.target - page, 0, state.max);
          break;
        case 'Home':
          state.target = 0;
          break;
        case 'End':
          state.target = state.max;
          break;
        default:
          handled = false;
      }

      if (handled) {
        event.preventDefault();
        state.lastInput = performance.now();
        state.overscroll = 0;
        state.triggered = false;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);

  // One rAF loop moves the column.
  useEffect(() => {
    const reduced = prefersReducedMotion();

    const unsubscribe = addTick((now, dt) => {
      const state = stateRef.current;
      const content = contentRef.current;

      if (now - state.lastInput > 130 && state.overscroll !== 0) {
        state.overscroll *= Math.pow(0.86, dt / 16.6667);
        if (Math.abs(state.overscroll) < 0.4) state.overscroll = 0;
      }

      const next = reduced
        ? state.target
        : state.display + (state.target - state.display) * damp(0.1, dt);
      state.display =
        Math.abs(state.target - next) < 0.04 ? state.target : next;

      const rubber = -clamp(state.overscroll * 0.16, 0, 40);
      const offset = -state.display + rubber;

      if (content && Math.abs(offset - state.drawn) > 0.02) {
        state.drawn = offset;
        content.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
      }

      const shouldHint = state.overscroll > 80;
      if (shouldHint !== hintRef.current) {
        hintRef.current = shouldHint;
        setShowEndHint(shouldHint);
      }
    });

    return unsubscribe;
  }, []);

  return { viewportRef, contentRef, showEndHint };
};
