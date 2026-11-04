import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import {
  ASSETS,
  assetColor,
  type AssetCard,
} from '../data/assets';
import { AssetIcon } from './AssetIcon';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { addTick } from '../lib/ticker';
import {
  clamp,
  cinematic,
  damp,
  easeOut,
  mod,
  prefersReducedMotion,
} from '../lib/motion';

const N = ASSETS.length;
const MOBILE_QUERY = '(max-width: 720px)';

const CATEGORY_LABEL: Record<AssetCard['cat'], string> = {
  projects: 'PROJECTS',
  skills: 'SKILLS',
  profile: 'PROFILE',
};

interface RingLayout {
  u: number;
  cardW: number;
  cardH: number;
  pad: number;
  radius: number;
  ringR: number;
  icon: number;
  fs: number;
  mobile: boolean;
}

const computeLayout = (): RingLayout => {
  if (typeof window === 'undefined') {
    return {
      u: 1,
      cardW: 250,
      cardH: 330,
      pad: 20,
      radius: 14,
      ringR: 560,
      icon: 48,
      fs: 16,
      mobile: false,
    };
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (window.matchMedia(MOBILE_QUERY).matches) {
    const cardW = clamp(vw * 0.52, 168, 216);
    return {
      u: cardW / 250,
      cardW,
      cardH: cardW * 1.32,
      pad: 16,
      radius: 13,
      ringR: 330,
      icon: 40,
      fs: 13,
      mobile: true,
    };
  }

  const u = Math.min(vw / 1440, vh / 900, 1.35);
  return {
    u,
    cardW: 250 * u,
    cardH: 330 * u,
    pad: 20 * u,
    radius: 14 * u,
    ringR: 560 * u,
    icon: 48 * u,
    fs: 16 * u,
    mobile: false,
  };
};

const normalizeWheel = (event: WheelEvent) => {
  if (event.deltaMode === 1) return event.deltaY * 16;
  if (event.deltaMode === 2) return event.deltaY * window.innerHeight;
  return event.deltaY;
};

const CardFace = ({
  card,
  icon,
}: {
  card: AssetCard;
  icon: number;
}): ReactNode => (
  <>
    <span className="card-chip">{CATEGORY_LABEL[card.cat]}</span>
    <span className="card-icon">
      <AssetIcon name={card.icon} size={icon} />
    </span>
    <span className="card-bottom">
      <span className="card-title">{card.title}</span>
      <span className="card-sub">{card.subtitle}</span>
    </span>
  </>
);

interface RingPageProps {
  active: boolean;
  onExitDown: () => void;
  onOverlayChange: (open: boolean) => void;
}

export const RingPage = ({
  active,
  onExitDown,
  onOverlayChange,
}: RingPageProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [layout, setLayout] = useState<RingLayout>(computeLayout);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  const qDisplay = useRef(0);
  const qTarget = useRef(0);
  const tween = useRef<{
    from: number;
    to: number;
    t0: number;
    dur: number;
    ease: (t: number) => number;
    onDone?: () => void;
  } | null>(null);
  const intro = useRef({ active: false, t0: 0, q0: 0 });
  const drawnOnce = useRef(false);
  const lastInteraction = useRef(0);
  const lastAdvance = useRef(0);
  const autoPaused = useRef(false);
  const dragging = useRef(false);
  const dragMoved = useRef(false);
  const dragStart = useRef(0);
  const dragLast = useRef(0);
  const snapTimer = useRef(0);
  const suppressClick = useRef(false);
  const suppressClickTimer = useRef<number>(0);
  const activeRef = useRef(active);
  activeRef.current = active;
  const reduced = useReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const expandedRef = useRef<number | null>(null);

  const [focusIndex, setFocusIndex] = useState(0);
  const focusIndexRef = useRef(0);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [expandedClosing, setExpandedClosing] = useState(false);

  // Flat 2D twin of the front card (see #focus-card in index.css).
  const focusCardRef = useRef<HTMLButtonElement>(null);
  const hidCardRef = useRef<HTMLElement | null>(null);
  const focusOverlayRef = useRef(-1);
  const [focusOverlay, setFocusOverlay] = useState(0);
  const [inView, setInView] = useState(false);

  const onOverlayRef = useRef(onOverlayChange);
  onOverlayRef.current = onOverlayChange;

  const renderRing = useCallback((now: number) => {
    const q = qDisplay.current;
    const current = layoutRef.current;
    const introState = intro.current;
    let bestIdx = 0;
    let bf = -1;

    for (let i = 0; i < N; i += 1) {
      const element = cardRefs.current[i];
      if (!element) continue;

      let th = (mod(i - q, N) * 360) / N;
      if (th > 180) th -= 360;

      const focus = Math.exp(-((th / 5) ** 2));
      if (focus > bf) {
        bf = focus;
        bestIdx = i;
      }
      // Nudge the near neighbours further out so they never crowd the front.
      const th2 = th + Math.sign(th) * 6 * Math.exp(-((th / 14) ** 2)) * (1 - focus);
      const spoke = (th >= 0 ? -90 : 90) * (1 - focus);
      // The focused card has to sit far enough forward that the tilted
      // neighbours (their outer edges swing forward by half a card width)
      // can never cut through it.
      const z = current.ringR + focus * 215 * current.u;
      const lift = -focus * 120 * current.u;
      const scale = 1 + focus * 0.1;

      element.style.transform =
        `rotateY(${th2.toFixed(3)}deg) translateZ(${z.toFixed(2)}px) ` +
        `translateY(${lift.toFixed(2)}px) rotateY(${spoke.toFixed(3)}deg) ` +
        `scale(${scale.toFixed(4)})`;

      // Paint order by depth. Engines that flatten the ring (an ancestor is
      // composited) ignore 3D sorting and paint in DOM order, which lets the
      // neighbours cut through the focused card. This keeps the card closest
      // to the camera on top everywhere.
      element.style.zIndex = String(Math.round(900 - Math.abs(th) * 4));

      let alpha = Math.abs(th) > 150 ? 0.5 : 1;
      if (introState.active) {
        const distance = Math.min(
          mod(i - introState.q0, N),
          mod(introState.q0 - i, N),
        );
        const fade = clamp((now - introState.t0 - distance * 20) / 420, 0, 1);
        alpha *= fade;
        if (fade < 1) drawnOnce.current = true;
      }
      element.style.opacity = alpha.toFixed(3);
    }

    // The front card is mirrored by a flat 2D overlay so nothing in the 3D
    // stack can ever paint across it. It fades in on arrival, out on departure.
    const overlay = focusCardRef.current;
    const bestEl = cardRefs.current[bestIdx] ?? null;
    const dialogOpen = expandedRef.current !== null;
    let op = 0;
    if (overlay) {
      const calm = clamp(1 - Math.abs(qTarget.current - q) / 0.12, 0, 1);
      op = dialogOpen ? 0 : clamp((bf - 0.7) / 0.25, 0, 1) * calm;
      overlay.style.opacity = op.toFixed(3);
      overlay.style.pointerEvents = op > 0.5 ? 'auto' : 'none';
      overlay.style.visibility = op > 0.001 ? 'visible' : 'hidden';
    }
    // An opaque flat twin hides the real 3D card, so its tilted neighbours
    // can never form a ridge around the flat copy.
    if (hidCardRef.current && (op < 0.99 || hidCardRef.current !== bestEl)) {
      hidCardRef.current.style.visibility = '';
      hidCardRef.current = null;
    }
    if (op >= 0.99 && overlay && !hidCardRef.current && bestEl) {
      hidCardRef.current = bestEl;
      bestEl.style.visibility = 'hidden';
    }
    if (bestIdx !== focusOverlayRef.current) {
      focusOverlayRef.current = bestIdx;
      setFocusOverlay(bestIdx);
    }
  }, []);

  // Size and place the flat overlay from the real 3D card. Init and resize
  // only — never inside the animation frame loop.
  const placeFocusCard = useCallback(() => {
    const overlay = focusCardRef.current;
    if (!overlay) return;

    // The front-most card sits at the ring's front no matter how far the
    // wheel has turned, so its box is the resting box.
    const front = cardRefs.current[mod(Math.round(qDisplay.current), N)];
    if (!front) return;

    const r = front.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    // A bad measure (mid-move, mid-slide) must never resize the flat card.
    if (r.width < 120 || r.height < 120) return;

    const section = sectionRef.current;
    if (!section) return;
    const srect = section.getBoundingClientRect();

    const s = r.width / 250;
    overlay.style.left = `${(r.left - srect.left).toFixed(2)}px`;
    overlay.style.top = `${(r.top - srect.top).toFixed(2)}px`;
    overlay.style.width = '250px';
    overlay.style.height = `${(r.height / s).toFixed(2)}px`;
    overlay.style.transform = `scale(${s.toFixed(4)})`;
  }, []);

  useLayoutEffect(() => {
    const raf = requestAnimationFrame(() => {
      renderRing(performance.now());
      placeFocusCard();
    });
    return () => cancelAnimationFrame(raf);
  }, [active, inView, layout, placeFocusCard, renderRing]);

  // Only mirror the ring while the ring page is actually on screen.
  useEffect(() => {
    const element = sectionRef.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => setInView(entries[0].intersectionRatio >= 0.4),
      { threshold: [0.4] },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const startTween = useCallback(
    (
      to: number,
      dur: number,
      ease: (t: number) => number,
      options: { user?: boolean; onDone?: () => void } = {},
    ) => {
      const now = performance.now();

      // Reduced motion: rotate instantly, never animate the wheel.
      if (reducedRef.current) {
        qDisplay.current = to;
        qTarget.current = to;
        tween.current = null;
        if (options.user !== false) lastInteraction.current = now;
        renderRing(now);
        options.onDone?.();
        return;
      }

      tween.current = {
        from: qDisplay.current,
        to,
        t0: now,
        dur,
        ease,
        onDone: options.onDone,
      };
      qTarget.current = to;
      if (options.user !== false) lastInteraction.current = now;
    },
    [renderRing],
  );

  // The single rAF loop for rotation, focus and auto-advance.
  useEffect(() => {
    const unsubscribe = addTick((now, dt) => {
      let needsDraw = false;

      const currentTween = tween.current;
      if (currentTween) {
        const t = clamp((now - currentTween.t0) / currentTween.dur, 0, 1);
        qDisplay.current =
          currentTween.from +
          (currentTween.to - currentTween.from) * currentTween.ease(t);
        needsDraw = true;
        if (t >= 1) {
          qDisplay.current = currentTween.to;
          tween.current = null;
          currentTween.onDone?.();
        }
      } else if (Math.abs(qTarget.current - qDisplay.current) > 0.0002) {
        qDisplay.current = reducedRef.current
          ? qTarget.current
          : qDisplay.current +
            (qTarget.current - qDisplay.current) * damp(0.12, dt);
        needsDraw = true;
      }

      if (needsDraw || intro.current.active) {
        renderRing(now);
        if (!intro.current.active) drawnOnce.current = true;
      } else if (!drawnOnce.current) {
        renderRing(now);
        drawnOnce.current = true;
      }

      const nextFocus = mod(Math.round(qDisplay.current), N);
      if (nextFocus !== focusIndexRef.current) {
        focusIndexRef.current = nextFocus;
        setFocusIndex(nextFocus);
      }

      if (
        activeRef.current &&
        !reducedRef.current &&
        expandedRef.current === null &&
        !autoPaused.current &&
        !dragging.current &&
        !document.hidden &&
        !tween.current &&
        now - lastInteraction.current > 4000 &&
        now - lastAdvance.current > 3400
      ) {
        lastAdvance.current = now;
        startTween(Math.round(qDisplay.current) + 1, 1000, cinematic, {
          user: false,
        });
      }
    });

    return unsubscribe;
  }, [renderRing, startTween]);

  // Measure on resize.
  useEffect(() => {
    const measure = () => {
      const next = computeLayout();
      setLayout(next);
      renderRing(performance.now());
    };
    window.addEventListener('resize', measure);
    document.fonts?.ready.then(() => placeFocusCard()).catch(() => undefined);
    return () => window.removeEventListener('resize', measure);
  }, [placeFocusCard, renderRing]);

  // Entering the page: the ring spins into place and the cards fade in.
  const previousActive = useRef(false);
  useEffect(() => {
    if (active && !previousActive.current) {
      const q0 = Math.round(qDisplay.current);
      const now = performance.now();
      lastInteraction.current = now;
      lastAdvance.current = now;
      qTarget.current = q0;
      intro.current = { active: false, t0: 0, q0 };
      // Re-measure once the page slide has settled.
      window.setTimeout(() => placeFocusCard(), 950);

      if (reducedRef.current) {
        qDisplay.current = q0;
        renderRing(now);
      } else {
        qDisplay.current = q0 - 6;
        intro.current = { active: true, t0: now, q0 };
        startTween(q0, 1200, cinematic, {
          user: false,
          onDone: () => {
            intro.current = { active: false, t0: 0, q0: 0 };
            drawnOnce.current = false;
            lastAdvance.current = performance.now();
            renderRing(performance.now());
          },
        });
      }
    }
    previousActive.current = active;
  }, [active, placeFocusCard, renderRing, startTween]);

  // The real front card must come back whenever the flat twin is not live
  // (dialog open, other page, unmount).
  useEffect(() => {
    if (hidCardRef.current) {
      hidCardRef.current.style.visibility = '';
      hidCardRef.current = null;
    }
  }, [active, inView, expanded]);

  // Wheel rotation.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !active) return;

    const onWheel = (event: WheelEvent) => {
      if (expandedRef.current !== null) return;
      event.preventDefault();
      const delta = normalizeWheel(event);
      if (!delta) return;

      tween.current = null;
      const now = performance.now();
      lastInteraction.current = now;
      qTarget.current += delta * 0.004;

      window.clearTimeout(snapTimer.current);
      snapTimer.current = window.setTimeout(() => {
        startTween(Math.round(qTarget.current), 700, easeOut, { user: true });
      }, 140);
    };

    section.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      section.removeEventListener('wheel', onWheel);
      window.clearTimeout(snapTimer.current);
    };
  }, [active, startTween]);

  // Drag to rotate.
  useEffect(() => {
    if (!active) return;
    const section = sectionRef.current;
    if (!section) return;

    const onPointerDown = (event: PointerEvent) => {
      if (expandedRef.current !== null) return;
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      dragging.current = true;
      dragMoved.current = false;
      dragStart.current = event.clientX;
      dragLast.current = event.clientX;
      autoPaused.current = true;
      lastInteraction.current = performance.now();
      section.classList.add('is-dragging');
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging.current) return;
      const dx = event.clientX - dragLast.current;
      dragLast.current = event.clientX;
      if (Math.abs(event.clientX - dragStart.current) > 6) {
        dragMoved.current = true;
      }
      if (!dragMoved.current) return;
      tween.current = null;
      qTarget.current -= dx * 0.007;
      lastInteraction.current = performance.now();
    };

    const endDrag = () => {
      if (!dragging.current) return;
      dragging.current = false;
      autoPaused.current = false;
      section.classList.remove('is-dragging');
      lastInteraction.current = performance.now();
      if (dragMoved.current) {
        suppressClick.current = true;
        window.clearTimeout(suppressClickTimer.current);
        suppressClickTimer.current = window.setTimeout(() => {
          suppressClick.current = false;
        }, 360);
        startTween(Math.round(qTarget.current), 700, easeOut, { user: true });
      }
    };

    section.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    return () => {
      section.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
      section.classList.remove('is-dragging');
      window.clearTimeout(suppressClickTimer.current);
    };
  }, [active, startTween]);

  // Arrow keys rotate the ring.
  useEffect(() => {
    if (!active) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (expandedRef.current !== null) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        const dir = event.key === 'ArrowRight' ? 1 : -1;
        startTween(Math.round(qDisplay.current) + dir, 650, easeOut, {
          user: true,
        });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active, startTween]);

  const focusCard = useCallback(
    (i: number) => {
      const current = mod(Math.round(qDisplay.current), N);
      const diff = mod(i - current + N / 2, N) - N / 2;
      startTween(qDisplay.current + diff, 750, cinematic, { user: true });
    },
    [startTween],
  );

  const openExpanded = useCallback(
    (i: number) => {
      if (expandedRef.current !== null) return;
      expandedRef.current = i;
      autoPaused.current = true;
      setExpanded(i);
      setExpandedClosing(false);
      onOverlayRef.current(true);
    },
    [],
  );

  const closeExpanded = useCallback(() => {
    if (expandedRef.current === null || expandedClosing) return;
    setExpandedClosing(true);
  }, [expandedClosing]);

  const handleCardClick = (i: number) => {
    if (suppressClick.current) return;
    if (!activeRef.current) return;
    if (i === focusIndexRef.current) {
      openExpanded(i);
    } else {
      focusCard(i);
    }
  };

  const changeExpanded = (dir: 1 | -1) => {
    if (expandedRef.current === null) return;
    const current = expandedRef.current;
    const next = mod(current + dir, N);
    expandedRef.current = next;
    setExpanded(next);
    setExpandedClosing(false);
    focusCard(next);
  };

  useEffect(() => {
    if (!expandedClosing || expanded === null) return;
    const timer = window.setTimeout(() => {
      expandedRef.current = null;
      setExpanded(null);
      setExpandedClosing(false);
      autoPaused.current = false;
      lastInteraction.current = performance.now();
      onOverlayRef.current(false);
    }, 760);
    return () => window.clearTimeout(timer);
  }, [expanded, expandedClosing]);

  // Escape / arrows inside the expanded card.
  useEffect(() => {
    if (expanded === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeExpanded();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        changeExpanded(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        changeExpanded(1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, closeExpanded]);

  const card = ASSETS[focusIndex];

  return (
    <>
      <section
        ref={sectionRef}
        id="ring"
        className={`panel ring-page ${active ? 'is-active' : 'idle'} ${
          expanded !== null ? 'is-expanded' : ''
        }`}
        aria-label="Asset cards"
        inert={active ? undefined : true}
      >
        <p className="sr-only">
          A ring of {N} asset cards. Use the left and right arrow keys to rotate
          the ring, and press Enter to open the card in focus. Arrow up returns
          to the sections and arrow down goes to contact.
        </p>

        <div className="ring-stage">
          <div className="ring">
            {ASSETS.map((item, i) => {
              const palette = assetColor(i);
              let th = (mod(i - qDisplay.current, N) * 360) / N;
              if (th > 180) th -= 360;
              const w = (1 - Math.exp(-((th / 26) ** 2))) * 0.55;
              return (
                <button
                  key={item.id}
                  ref={(element) => {
                    cardRefs.current[i] = element;
                  }}
                  type="button"
                  className="rc card-face"
                  data-index={i}
                  tabIndex={i === focusIndex ? 0 : -1}
                  aria-label={`${item.title}. ${item.subtitle}. ${
                    i === focusIndex
                      ? 'Open card'
                      : 'Move this card into focus'
                  }`}
                  style={
                    {
                      width: layout.cardW,
                      height: layout.cardH,
                      marginLeft: -layout.cardW / 2,
                      marginTop: -layout.cardH / 2,
                      padding: layout.pad,
                      borderRadius: layout.radius,
                      fontSize: layout.fs,
                      '--card-bg': palette.bg,
                      '--card-ink': palette.text,
                      '--w': w.toFixed(4),
                    } as CSSProperties
                  }
                  onClick={() => handleCardClick(i)}
                  onPointerEnter={() => {
                    if (i === focusIndexRef.current) autoPaused.current = true;
                  }}
                  onPointerLeave={() => {
                    if (i === focusIndexRef.current) autoPaused.current = false;
                  }}
                >
                  <CardFace card={item} icon={layout.icon} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="band band-l" aria-hidden="true">
          <div />
          <div />
          <div />
          <div />
        </div>
        <div className="band band-r" aria-hidden="true">
          <div />
          <div />
          <div />
          <div />
        </div>

        <span className="ring-counter">
          {String(focusIndex + 1).padStart(2, '0')} / {N}
        </span>

        <aside className="ring-summary" aria-live="polite">
          <div key={focusIndex} className="ring-summary-inner">
            <span className="card-chip ring-summary-chip">
              {CATEGORY_LABEL[card.cat]}
            </span>
            <strong className="ring-summary-title">{card.title}</strong>
            <span className="ring-summary-meta">
              {card.subtitle} · {card.period}
            </span>
            <p className="ring-summary-copy">{card.summary}</p>
            <span className="ring-summary-hint">click the card to open</span>
          </div>
        </aside>

        <button
          type="button"
          className="glass-pill ring-contact"
          onClick={onExitDown}
        >
          contact
          <svg width="15" height="15" viewBox="0 0 22 22" fill="none" aria-hidden="true">
            <path
              d="M11 3v16M5 13l6 6 6-6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </section>

      {active && inView && expanded === null
        ? createPortal(
            <button
              type="button"
              id="focus-card"
              ref={focusCardRef}
              className="card-face"
              tabIndex={-1}
              aria-hidden="true"
              style={
                {
                  '--card-bg': assetColor(focusOverlay).bg,
                  '--card-ink': assetColor(focusOverlay).text,
                } as CSSProperties
              }
              onClick={() => openExpanded(focusOverlay)}
            >
              <CardFace card={ASSETS[focusOverlay]} icon={48} />
            </button>,
            sectionRef.current!,
          )
        : null}

      {expanded !== null
        ? createPortal(
            <RingExpanded
              key="ring-expanded"
              card={ASSETS[expanded]}
              color={assetColor(expanded)}
              index={expanded}
              closing={expandedClosing}
              onPrev={() => changeExpanded(-1)}
              onNext={() => changeExpanded(1)}
              onClose={closeExpanded}
              icon={layout.icon * 1.6}
            />,
            // The dialog must be positioned against the real viewport, not the
            // transformed page track it used to be mounted in.
            document.body,
          )
        : null}
    </>
  );
};

RingPage.displayName = 'RingPage';

interface RingExpandedProps {
  card: AssetCard;
  color: { bg: string; text: string };
  index: number;
  closing: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  icon: number;
}

const RingExpanded = ({
  card,
  color,
  index,
  closing,
  onPrev,
  onNext,
  onClose,
  icon,
}: RingExpandedProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [swap, setSwap] = useState<1 | -1>(1);
  const previousIndex = useRef(index);

  const targetSelector = `.rc[data-index="${index}"]`;

  useLayoutEffect(() => {
    const element = cardRef.current;
    const source = document.querySelector<HTMLElement>(targetSelector);
    if (!element || !source) {
      setOpen(true);
      return;
    }

    if (prefersReducedMotion()) {
      setOpen(true);
      return;
    }

    const dest = element.getBoundingClientRect();
    const src = source.getBoundingClientRect();
    if (dest.width <= 0 || dest.height <= 0) {
      setOpen(true);
      return;
    }

    const scale = Math.min(src.width / dest.width, src.height / dest.height);
    const dx = src.left + src.width / 2 - (dest.left + dest.width / 2);
    const dy = src.top + src.height / 2 - (dest.top + dest.height / 2);

    element.style.transition = 'none';
    element.style.transformOrigin = '50% 50%';
    element.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
    void element.offsetWidth;
    element.style.transition = 'transform 760ms cubic-bezier(0.22, 1, 0.36, 1)';
    requestAnimationFrame(() => {
      element.style.transform = 'translate3d(0, 0, 0) scale(1)';
      setOpen(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    if (index !== previousIndex.current) {
      setSwap(index > previousIndex.current ? 1 : -1);
      previousIndex.current = index;
    }
  }, [index]);

  useEffect(() => {
    if (!closing) return;
    const element = cardRef.current;
    const source = document.querySelector<HTMLElement>(targetSelector);

    if (element && source && !prefersReducedMotion()) {
      const dest = element.getBoundingClientRect();
      const src = source.getBoundingClientRect();
      if (dest.width > 0 && src.width > 0) {
        const scale = Math.min(src.width / dest.width, src.height / dest.height);
        const dx = src.left + src.width / 2 - (dest.left + dest.width / 2);
        const dy = src.top + src.height / 2 - (dest.top + dest.height / 2);
        element.style.transition =
          'transform 700ms cubic-bezier(0.76, 0, 0.24, 1), opacity 220ms ease 480ms';
        element.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
        element.style.opacity = '0';
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closing]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const closeButton = root.querySelector<HTMLButtonElement>('.rx-close');
    closeButton?.focus({ preventScroll: true });

    return () => {
      if (previousFocus?.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, []);

  const paragraphs = card.details ?? [];

  return (
    <div
      ref={rootRef}
      className={`rx ${open ? 'is-open' : ''} ${closing ? 'is-closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={card.title}
    >
      <button
        type="button"
        className="rx-backdrop"
        onClick={onClose}
        aria-label="Close card"
      />

      <div className="rx-card-slot">
        <div
          ref={cardRef}
          className={`rx-card card-face ${closing ? 'is-closing' : ''}`}
          style={
            {
              '--card-bg': color.bg,
              '--card-ink': color.text,
            } as CSSProperties
          }
        >
          <div className={`rx-face-swap is-swap-${swap}`} key={index}>
            <span className="card-chip">{CATEGORY_LABEL[card.cat]}</span>
            <span className="card-icon">
              <AssetIcon name={card.icon} size={icon} />
            </span>
            <span className="card-bottom">
              <span className="card-title">{card.title}</span>
              <span className="card-sub">{card.subtitle}</span>
            </span>
          </div>
        </div>
      </div>

      <div className={`rx-panel ${closing ? 'is-closing' : ''}`}>
        <button
          type="button"
          className="rx-close glass-button"
          onClick={onClose}
          aria-label="Close card"
        >
          <X size={16} strokeWidth={1.6} />
        </button>

        <div className="rx-panel-scroll">
          <div className={`rx-swap is-swap-${swap}`} key={`panel-${index}`}>
            <span className="rx-chip">{CATEGORY_LABEL[card.cat]}</span>
            <h3 className="rx-title">{card.title}</h3>
            <p className="rx-meta">
              {card.subtitle} · {card.period}
            </p>

            {paragraphs.map((paragraph, i) => (
              <div className="rx-line-mask" key={i}>
                <p className="rx-body" style={{ '--d': `${i * 70}ms` } as CSSProperties}>
                  {paragraph}
                </p>
              </div>
            ))}

            {card.tags.length > 0 ? (
              <div className="rx-line-mask">
                <p className="rx-tags">{card.tags.join(' · ')}</p>
              </div>
            ) : null}

            {card.links?.length ? (
              <div className="rx-links">
                {card.links.map((link) => (
                  <a
                    key={link.href}
                    className="rx-link"
                    href={link.href}
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={
                      link.href.startsWith('http')
                        ? 'noopener noreferrer'
                        : undefined
                    }
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rx-nav">
            <button type="button" className="rx-arrow" onClick={onPrev} aria-label="Previous card">
              <ArrowLeft size={16} strokeWidth={1.6} />
            </button>
            <span className="rx-count">
              {String(index + 1).padStart(2, '0')} / {N}
            </span>
            <button type="button" className="rx-arrow" onClick={onNext} aria-label="Next card">
              <ArrowRight size={16} strokeWidth={1.6} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
