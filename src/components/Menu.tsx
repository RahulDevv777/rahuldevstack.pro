import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react';
import { MENU_SECTIONS, type MenuId } from '../data/content';
import { clamp, easeOut, prefersReducedMotion } from '../lib/motion';
import { addTick } from '../lib/ticker';

const LAST = MENU_SECTIONS.length - 1;
const STEP_MS = 700;
const STEP_LOCK_MS = 280;
const EXIT_REST_MS = 250;

export interface MenuApi {
  gesture: (dir: 1 | -1, moveFocus?: boolean) => boolean;
  jumpTo: (index: number) => void;
  getIndex: () => number;
}

interface MenuProps {
  active: boolean;
  dimmed: boolean;
  index: number;
  onIndexChange: (index: number) => void;
  onExit: (dir: 1 | -1) => void;
  onOpen: (id: MenuId) => void;
  apiRef: RefObject<MenuApi | null>;
}

interface TeaserProps {
  lines: string[];
  running: boolean;
}

const TeaserRoll = ({ lines, running }: TeaserProps) => {
  const [index, setIndex] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const [tabVisible, setTabVisible] = useState(true);
  const reduced = prefersReducedMotion();

  useEffect(() => {
    const update = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  useEffect(() => {
    if (!running || !tabVisible || reduced || lines.length < 2) return;
    const timer = window.setInterval(() => {
      setPrevious(index);
      setIndex((current) => (current + 1) % lines.length);
    }, 2400);
    return () => window.clearInterval(timer);
  }, [index, lines.length, reduced, running, tabVisible]);

  useEffect(() => {
    if (previous === null) return;
    const timer = window.setTimeout(() => setPrevious(null), 640);
    return () => window.clearTimeout(timer);
  }, [previous]);

  const shown = lines[index % lines.length];

  return (
    <span className="teaser-roll" aria-hidden="true">
      {previous !== null && previous !== index ? (
        <span className="teaser-line is-out" key={`out-${previous}`}>
          {lines[previous % lines.length]}
        </span>
      ) : null}
      <span className="teaser-line is-in" key={`in-${index}-${shown}`}>
        {shown}
      </span>
    </span>
  );
};

export const Menu = ({
  active,
  dimmed,
  index,
  onIndexChange,
  onExit,
  onOpen,
  apiRef,
}: MenuProps) => {
  const stageRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const lastBlurRef = useRef<number[]>([]);

  const pTargetRef = useRef(index);
  const pDisplayRef = useRef(index);
  const tweenRef = useRef<{
    from: number;
    to: number;
    t0: number;
    dur: number;
  } | null>(null);
  const lockUntilRef = useRef(0);
  const settledAtRef = useRef(0);
  const activeIndexRef = useRef(index);
  const hoveredRef = useRef(-1);
  const needRenderRef = useRef(true);
  const hasScrolledRef = useRef(false);

  const [activeIndex, setActiveIndex] = useState(index);
  const [settled, setSettled] = useState(true);
  const [hovered, setHovered] = useState(-1);
  const [hasScrolled, setHasScrolled] = useState(false);

  const propsRef = useRef({ active, dimmed, onIndexChange, onExit, onOpen });
  propsRef.current = { active, dimmed, onIndexChange, onExit, onOpen };

  const activeRef = useRef(active);
  activeRef.current = active;

  const markScrolled = useCallback(() => {
    if (hasScrolledRef.current) return;
    hasScrolledRef.current = true;
    setHasScrolled(true);
  }, []);

  const settle = useCallback((target: number) => {
    activeIndexRef.current = target;
    setActiveIndex(target);
    setSettled(true);
    settledAtRef.current = performance.now();
    propsRef.current.onIndexChange(target);
  }, []);

  const startTween = useCallback(
    (to: number) => {
      const target = clamp(Math.round(to), 0, LAST);
      const now = performance.now();

      if (Math.abs(pDisplayRef.current - target) < 0.0005 || prefersReducedMotion()) {
        pTargetRef.current = target;
        pDisplayRef.current = target;
        tweenRef.current = null;
        needRenderRef.current = true;
        lockUntilRef.current = now + STEP_LOCK_MS;
        settle(target);
        return;
      }

      // Re-target from wherever the wheel currently is, so a step that arrives
      // mid-animation chains on instead of being queued behind it.
      pTargetRef.current = target;
      tweenRef.current = {
        from: pDisplayRef.current,
        to: target,
        t0: now,
        dur: STEP_MS,
      };
      lockUntilRef.current = now + STEP_LOCK_MS;
      setSettled(false);
    },
    [settle],
  );

  const draw = useCallback(() => {
    const stage = stageRef.current;
    const vh = stage?.clientHeight || window.innerHeight;
    const p = pDisplayRef.current;
    const nearest = clamp(Math.round(p), 0, LAST);
    const hover = hoveredRef.current;

    itemRefs.current.forEach((element, i) => {
      if (!element) return;
      const d = i - p;
      const distance = Math.abs(d);
      const y = d * 0.34 * vh;
      const hoverScale =
        hover === i && i === nearest && i !== LAST ? 1.02 : 1;
      const scale = 1 - 0.14 * Math.min(distance, 1);
      const blur =
        distance < 0.02
          ? 0
          : distance <= 1
            ? distance * 20
            : Math.min(28, 20 + (distance - 1) * 8);
      const opacity =
        distance <= 1
          ? 1 - 0.35 * distance
          : Math.max(0, 0.65 - (distance - 1) * 0.5);

      element.style.transform =
        `translate(-50%, -50%) translate3d(0, ${y.toFixed(2)}px, 0) ` +
        `scale(${(scale * hoverScale).toFixed(4)})`;
      element.style.opacity = opacity.toFixed(3);
      element.style.zIndex = String(100 - Math.round(distance * 10));
      element.style.pointerEvents = opacity > 0.05 ? 'auto' : 'none';

      const rounded = Math.round(blur * 2) / 2;
      if (lastBlurRef.current[i] !== rounded) {
        lastBlurRef.current[i] = rounded;
        element.style.filter = rounded < 0.02 ? 'none' : `blur(${rounded}px)`;
      }

      element.classList.toggle('is-active', i === nearest);
      element.classList.toggle('is-edge', i === LAST);
    });
  }, []);

  // One rAF loop renders the wheel.
  useEffect(() => {
    const unsubscribe = addTick((now) => {
      const tween = tweenRef.current;
      if (tween) {
        const t = clamp((now - tween.t0) / tween.dur, 0, 1);
        pDisplayRef.current = tween.from + (tween.to - tween.from) * easeOut(t);
        needRenderRef.current = true;

        if (t >= 1) {
          pDisplayRef.current = tween.to;
          tweenRef.current = null;
          settle(tween.to);
        }
      }

      if (needRenderRef.current) {
        needRenderRef.current = false;
        draw();
      }
    });

    return unsubscribe;
  }, [draw, settle]);

  // First paint and resize.
  useLayoutEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const redraw = () => {
      needRenderRef.current = true;
    };
    window.addEventListener('resize', redraw);
    return () => window.removeEventListener('resize', redraw);
  }, []);

  // External navigation is driven through the imperative API (jumpTo), so the
  // wheel never has to react to prop changes and accidentally re-snap.

  const gesture = useCallback(
    (dir: 1 | -1, moveFocus = false) => {
      if (!activeRef.current || propsRef.current.dimmed) return false;
      const now = performance.now();
      if (now < lockUntilRef.current) return false;

      const current = clamp(Math.round(pTargetRef.current), 0, LAST);
      markScrolled();

      if (dir > 0) {
        if (current < LAST) {
          const next = current + 1;
          startTween(next);
          if (moveFocus) {
            itemRefs.current[next]?.focus({ preventScroll: true });
          }
          return true;
        }
        if (now - settledAtRef.current >= EXIT_REST_MS) {
          propsRef.current.onExit(1);
          return true;
        }
        return false;
      }

      if (current > 0) {
        const next = current - 1;
        startTween(next);
        if (moveFocus) {
          itemRefs.current[next]?.focus({ preventScroll: true });
        }
        return true;
      }
      if (now - settledAtRef.current >= EXIT_REST_MS) {
        propsRef.current.onExit(-1);
        return true;
      }
      return false;
    },
    [markScrolled, startTween],
  );

  const jumpTo = useCallback(
    (to: number) => {
      markScrolled();
      // Arriving from another page: place the wheel immediately so the Menu
      // opens already resting on the requested heading.
      if (!activeRef.current) {
        const target = clamp(Math.round(to), 0, LAST);
        pTargetRef.current = target;
        pDisplayRef.current = target;
        tweenRef.current = null;
        needRenderRef.current = true;
        settle(target);
        return;
      }
      startTween(to);
    },
    [markScrolled, settle, startTween],
  );

  useLayoutEffect(() => {
    apiRef.current = {
      gesture,
      jumpTo,
      getIndex: () => activeIndexRef.current,
    };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, gesture, jumpTo]);

  const handleClick = (i: number) => {
    if (!activeRef.current || dimmed) return;
    if (i === LAST) return; // ASSETS never opens on click.
    if (i === activeIndexRef.current && settled) {
      propsRef.current.onOpen(MENU_SECTIONS[i].id);
      return;
    }
    if (performance.now() < lockUntilRef.current) return;
    markScrolled();
    startTween(i);
  };

  const handleHover = (i: number) => {
    if (hoveredRef.current === i) return;
    hoveredRef.current = i;
    setHovered(i);
    needRenderRef.current = true;
  };

  const section = MENU_SECTIONS[activeIndex] ?? MENU_SECTIONS[0];
  const atEnd = activeIndex === LAST;
  const teaserRunning = active && settled && !dimmed;
  const interactionEnabled = active && !dimmed;

  return (
    <section
      ref={stageRef}
      id="menu"
      className={`panel menu-stage ${active ? 'is-active' : ''} ${dimmed ? 'is-dimmed' : ''}`}
      aria-label="Portfolio sections"
      inert={interactionEnabled ? undefined : true}
    >
      <p className="sr-only">
        Use the arrow keys to move between sections. Press Enter on About,
        Projects, Education or Skills to open it. Assets is the last section;
        scroll down to reveal it.
      </p>

      <div className="menu-veil menu-veil-top" aria-hidden="true" />
      <div className="menu-veil menu-veil-bottom" aria-hidden="true" />

      <ul className="menu-list">
        {MENU_SECTIONS.map((item, i) => (
          <li className="menu-list-item" key={item.id}>
            <button
              ref={(element) => {
                itemRefs.current[i] = element;
              }}
              type="button"
              className="menu-item"
              data-menu-heading={item.id}
              aria-current={i === activeIndex ? 'true' : undefined}
              aria-label={item.label}
              onPointerEnter={() => handleHover(i)}
              onPointerLeave={() => handleHover(-1)}
              onFocus={() => handleHover(i)}
              onBlur={() => handleHover(-1)}
              onClick={() => handleClick(i)}
              style={{ '--menu-index': i } as CSSProperties}
            >
              <span className="menu-item-text">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="menu-caption" key={`caption-${activeIndex}`}>
        <span>{String(activeIndex + 1).padStart(2, '0')} / 05</span>
        <span>{MENU_SECTIONS[activeIndex].label.toLowerCase()}</span>
        <span>{section.count}</span>
      </div>

      <div
        className={`menu-teaser ${teaserRunning ? 'is-visible' : ''}`}
        aria-live="off"
      >
        <TeaserRoll
          key={`teaser-${activeIndex}`}
          lines={section.teaser}
          running={teaserRunning}
        />
      </div>

      {atEnd ? (
        <div
          className={`menu-reveal ${settled && !dimmed ? 'is-visible' : ''}`}
          aria-hidden="true"
        >
          <svg
            className="menu-reveal-arrow"
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
          >
            <path
              d="M11 3v16M5 13l6 6 6-6"
              stroke="#111111"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>scroll down to reveal</span>
        </div>
      ) : null}

      <div className={`menu-hint ${hasScrolled ? 'is-gone' : ''}`} aria-hidden="true">
        <span>scroll</span>
      </div>

      <div
        className={`menu-open-hint ${
          hovered === activeIndex && hovered !== LAST && !atEnd && settled
            ? 'is-visible'
            : ''
        }`}
        aria-hidden="true"
      >
        click to open
      </div>
    </section>
  );
};
