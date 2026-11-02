import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { ContactPage, FloatingNav } from './components/Contact';
import { Detail } from './components/Detail';
import { Menu, type MenuApi } from './components/Menu';
import { RingPage } from './components/RingPage';
import type { MenuId } from './data/content';
import { clamp, cinematic, prefersReducedMotion } from './lib/motion';
import { addTick } from './lib/ticker';

type DetailId = 'about' | 'projects' | 'education' | 'skills';
type Page = 0 | 1 | 2 | 3;

const DETAIL_IDS: DetailId[] = ['about', 'projects', 'education', 'skills'];

/** Full-page travel time. Kept short so a second flick never feels eaten. */
const PAGE_MS = 640;
/** A wheel stream is closed after this much silence. Trackpad inertia fires
 *  every 8–16ms, so this keeps one flick = one step even if the main thread
 *  hiccups, while two deliberate flicks (≥100ms apart) are two gestures. */
const WHEEL_QUIET_MS = 90;
/** Tiny travel needed before a gesture counts, so one trackpad tick is enough. */
const WHEEL_STEP_PX = 3;

const MENU_INDEX: Record<MenuId, number> = {
  about: 0,
  projects: 1,
  education: 2,
  skills: 3,
  assets: 4,
};

interface DetailState {
  id: DetailId;
  closing: boolean;
  instant: boolean;
  pushed: boolean;
}

const readHash = () => window.location.hash.replace(/^#/, '');

/** Wheel deltas in a single unit (pixels) so thresholds mean the same thing. */
const normalizeWheel = (event: WheelEvent) => {
  if (event.deltaMode === 1) return event.deltaY * 16;
  if (event.deltaMode === 2) return event.deltaY * window.innerHeight;
  return event.deltaY;
};

const detailFromHash = (): DetailId | null => {
  const hash = readHash();
  return (DETAIL_IDS as string[]).includes(hash) ? (hash as DetailId) : null;
};

const pageFromHash = (detail: DetailId | null): Page => {
  if (detail) return 1;
  const hash = readHash();
  if (hash === 'menu') return 1;
  if (hash === 'assets' || hash === 'ring') return 2;
  if (hash === 'contact') return 3;
  return 0;
};

export const App = () => {
  const bootDetail = useRef(detailFromHash());

  const [page, setPage] = useState<Page>(() =>
    pageFromHash(bootDetail.current),
  );
  const [menuIndex, setMenuIndex] = useState(() =>
    bootDetail.current ? MENU_INDEX[bootDetail.current] : 0,
  );
  const [menuDimmed, setMenuDimmed] = useState(Boolean(bootDetail.current));
  const [detail, setDetail] = useState<DetailState | null>(() =>
    bootDetail.current
      ? {
          id: bootDetail.current,
          closing: false,
          instant: true,
          pushed: false,
        }
      : null,
  );
  const [ringOverlay, setRingOverlay] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<Page>(page);
  const pageAtMount = useRef<Page>(page);
  const menuApiRef = useRef<MenuApi | null>(null);
  const menuIndexRef = useRef(menuIndex);
  const detailRef = useRef(detail);
  const lockedRef = useRef(false);
  const ringOverlayRef = useRef(false);

  detailRef.current = detail;
  menuIndexRef.current = menuIndex;

  // Place the track on the initial page before the first paint.
  useLayoutEffect(() => {
    const height = viewportRef.current?.clientHeight ?? window.innerHeight;
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(0, ${-pageAtMount.current * height}px, 0)`;
    }
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (lockedRef.current) return;
      const height = viewportRef.current?.clientHeight ?? window.innerHeight;
      if (trackRef.current) {
        trackRef.current.style.transform = `translate3d(0, ${-pageRef.current * height}px, 0)`;
      }
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  const goToPage = useCallback(
    (
      target: Page,
      options: { menuIndex?: number; instant?: boolean } = {},
    ) => {
      if (detailRef.current || lockedRef.current) return;
      const from = pageRef.current;

      if (target === from) {
        if (target === 1 && options.menuIndex !== undefined) {
          menuApiRef.current?.jumpTo(options.menuIndex);
        }
        return;
      }

      pageRef.current = target;
      setPage(target);

      if (target === 1) {
        const requested = options.menuIndex ?? (from === 0 ? 0 : 4);
        setMenuIndex(requested);
        menuIndexRef.current = requested;
        menuApiRef.current?.jumpTo(requested);
      }

      const track = trackRef.current;
      const height = viewportRef.current?.clientHeight ?? window.innerHeight;
      if (!track) return;

      const start = -from * height;
      const end = -target * height;

      if (options.instant || prefersReducedMotion()) {
        track.style.transform = `translate3d(0, ${end}px, 0)`;
        return;
      }

      lockedRef.current = true;
      const t0 = performance.now();
      let unsubscribe = () => {};

      unsubscribe = addTick((now) => {
        const t = clamp((now - t0) / PAGE_MS, 0, 1);
        const y = start + (end - start) * cinematic(t);
        track.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;

        if (t >= 1) {
          unsubscribe();
          window.setTimeout(() => {
            lockedRef.current = false;
          }, 40);
        }
      });
    },
    [],
  );

  const openDetail = useCallback((id: MenuId) => {
    if (id === 'assets') return;
    if (detailRef.current || lockedRef.current) return;
    window.history.pushState({ detail: id }, '', `#${id}`);
    setDetail({ id, closing: false, instant: false, pushed: true });
    setMenuDimmed(true);
  }, []);

  const closeDetail = useCallback(() => {
    setDetail((current) => {
      if (!current || current.closing) return current;
      return { ...current, closing: true };
    });
  }, []);

  const handleMenuReveal = useCallback(() => {
    setMenuDimmed(false);
  }, []);

  const handleDetailClosed = useCallback(() => {
    const current = detailRef.current;
    setDetail(null);
    setMenuDimmed(false);
    if (!current) return;
    if (current.pushed) {
      // Return to the previous entry (the menu) without a new history entry.
      window.history.back();
      return;
    }
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}${window.location.search}`,
    );
  }, []);

  // Browser Back closes a detail with the reverse animation; forward opens it.
  useEffect(() => {
    const onPopState = () => {
      const id = detailFromHash();
      const current = detailRef.current;
      if (id) {
        if (!current) {
          setMenuIndex(MENU_INDEX[id]);
          setDetail({ id, closing: false, instant: true, pushed: false });
          setMenuDimmed(true);
        }
        return;
      }
      if (current && !current.closing) {
        setDetail({ ...current, closing: true, pushed: false });
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleMenuExit = useCallback(
    (dir: 1 | -1) => {
      if (dir > 0) goToPage(2);
      else goToPage(0);
    },
    [goToPage],
  );

  const handleMenuIndex = useCallback((index: number) => {
    setMenuIndex((current) => (current === index ? current : index));
  }, []);

  const handleNav = useCallback(
    (target: number, index?: number) => {
      goToPage(target as Page, { menuIndex: index });
    },
    [goToPage],
  );

  const handleRingOverlay = useCallback((open: boolean) => {
    ringOverlayRef.current = open;
    setRingOverlay(open);
  }, []);

  const goToHero = useCallback(() => {
    goToPage(0, { instant: false });
  }, [goToPage]);

  // The gesture engine: one deliberate scroll = one step. Wheel inertia,
  // trackpad tails and key repeats can never skip a heading or a page.
  useEffect(() => {
    const suspended = () =>
      Boolean(detailRef.current) || ringOverlayRef.current;

    const trigger = (dir: 1 | -1, source: 'wheel' | 'touch' | 'key') => {
      if (suspended() || lockedRef.current) return;
      const current = pageRef.current;

      if (current === 0) {
        if (dir > 0) goToPage(1, { menuIndex: 0 });
        return;
      }

      if (current === 1) {
        menuApiRef.current?.gesture(dir, source === 'key');
        return;
      }

      if (current === 2) {
        // The wheel belongs to the ring; keys leave the page.
        if (source !== 'key') return;
        if (dir > 0) goToPage(3);
        else goToPage(1, { menuIndex: 4 });
        return;
      }

      if (current === 3 && dir < 0) {
        goToPage(2);
      }
    };

    // A wheel gesture opens with the first event and closes after the stream
    // goes quiet. One gesture = one step, so trackpad inertia can never skip
    // a page or a heading — but the tiniest flick is still enough.
    let wheelAcc = 0;
    let wheelBusy = false;
    let quietTimer = 0;

    const closeStream = () => {
      wheelBusy = false;
      wheelAcc = 0;
    };

    const onWheel = (event: WheelEvent) => {
      // Detail and expanded-card layers own their own scroll. Returning early
      // lets the expanded panel and detail column receive native wheel input.
      if (suspended()) return;

      event.preventDefault();
      const delta = normalizeWheel(event);
      if (!delta) return;

      window.clearTimeout(quietTimer);
      quietTimer = window.setTimeout(closeStream, WHEEL_QUIET_MS);

      // This gesture already spent its single step.
      if (wheelBusy) return;

      // Direction flip inside one gesture means the user changed their mind.
      if ((wheelAcc > 0 && delta < 0) || (wheelAcc < 0 && delta > 0)) {
        wheelAcc = 0;
      }
      wheelAcc += delta;

      if (Math.abs(wheelAcc) < WHEEL_STEP_PX) return;

      const dir = wheelAcc > 0 ? 1 : -1;
      wheelAcc = 0;
      wheelBusy = true;
      trigger(dir, 'wheel');
    };

    let touchStartY = 0;
    let touchStartTime = 0;

    const onTouchStart = (event: TouchEvent) => {
      if (suspended()) return;
      touchStartY = event.touches[0].clientY;
      touchStartTime = performance.now();
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (suspended() || lockedRef.current) return;
      const touch = event.changedTouches[0];
      if (!touch) return;
      const dy = touch.clientY - touchStartY;
      const duration = performance.now() - touchStartTime;
      if (Math.abs(dy) > 60 && duration < 600) {
        trigger(dy < 0 ? 1 : -1, 'touch');
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.repeat) return;
      if (suspended() || lockedRef.current) return;

      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (target?.isContentEditable) return;

      if (
        (event.key === ' ' || event.key === 'Enter') &&
        target?.closest('button, a')
      ) {
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
        case 'PageDown':
        case ' ':
          event.preventDefault();
          trigger(1, 'key');
          break;
        case 'ArrowUp':
        case 'PageUp':
          event.preventDefault();
          trigger(-1, 'key');
          break;
        default:
          break;
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.clearTimeout(quietTimer);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [goToPage]);

  const menuActive = page === 1;

  return (
    <>
      <div id="viewport" ref={viewportRef}>
        <div id="track" ref={trackRef}>
          <section id="hero" className="panel hero" aria-label="Portfolio">
            <h1 className="sr">Rahuldev Muthamsetty — Portfolio</h1>
            <svg viewBox="0 0 1000 112" aria-hidden="true">
              <text
                x="0"
                y="110"
                textLength="1000"
                lengthAdjust="spacingAndGlyphs"
              >
                PORTFOLIO
              </text>
            </svg>
          </section>

          <Menu
            active={menuActive}
            dimmed={menuDimmed}
            index={menuIndex}
            onIndexChange={handleMenuIndex}
            onExit={handleMenuExit}
            onOpen={openDetail}
            apiRef={menuApiRef}
          />

          <RingPage
            active={page === 2}
            onExitDown={() => goToPage(3)}
            onOverlayChange={handleRingOverlay}
          />

          <ContactPage active={page === 3} onBackToTop={goToHero} />
        </div>
      </div>

      <FloatingNav
        page={page}
        menuIndex={menuIndex}
        hidden={detail !== null || ringOverlay}
        onNavigate={handleNav}
      />

      {detail ? (
        <Detail
          id={detail.id}
          closing={detail.closing}
          instant={detail.instant}
          onClose={closeDetail}
          onClosed={handleDetailClosed}
          onMenuReveal={handleMenuReveal}
        />
      ) : null}
    </>
  );
};

export default App;
