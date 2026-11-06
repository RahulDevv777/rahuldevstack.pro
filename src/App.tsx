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

/** Page change travel + the matching input lock. */
const PAGE_MS = 900;

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

/** @deprecated - use direct deltaY with deltaMode scaling in onWheel instead */
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
  const lockTimerRef = useRef(0);
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
      window.clearTimeout(lockTimerRef.current);
      lockTimerRef.current = window.setTimeout(() => {
        lockedRef.current = false;
      }, PAGE_MS);

      const t0 = performance.now();
      let unsubscribe = () => {};

      unsubscribe = addTick((now) => {
        const t = clamp((now - t0) / PAGE_MS, 0, 1);
        const y = start + (end - start) * cinematic(t);
        track.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;

        if (t >= 1) unsubscribe();
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
        // The ring turns on sideways gestures; up and down leave the page.
        if (dir > 0) goToPage(3);
        else goToPage(1, { menuIndex: 4 });
        return;
      }

      if (current === 3 && dir < 0) {
        goToPage(2);
      }
    };

    // One gesture = one step. A real scroll accelerates or holds steady;
    // trackpad inertia only ever decelerates, so the tail is ignored.
    let lastT = 0;
    let lockedUntil = 0;
    let spent = false;
    let peak = 0;
    let low = Infinity;
    let passed = false;

    // The last page is taller than short screens, so its panel scrolls on its
    // own. Only hand the gesture back to the page engine at a real edge.
    const contactScrollRoom = (dir: 1 | -1) => {
      if (pageRef.current !== 3) return 0;
      const host = document.querySelector<HTMLElement>('.contact-page');
      if (!host) return 0;
      const max = host.scrollHeight - host.clientHeight;
      if (max <= 1) return 0;
      return dir > 0 ? Math.max(0, max - host.scrollTop) : host.scrollTop;
    };

    const axisValue = (value: number, mode: number) =>
      value * (mode === 1 ? 33 : mode === 2 ? innerHeight : 1);

    const onWheel = (e: WheelEvent) => {
      const raw = axisValue(e.deltaY, e.deltaMode);
      const side = axisValue(e.deltaX, e.deltaMode);

      // The ring is a sideways control: a horizontal swipe turns it, a
      // vertical one steps to the next or previous page.
      if (
        pageRef.current === 2 &&
        Math.abs(side) > Math.abs(raw) &&
        Math.abs(side) > 1
      ) {
        return; // RingPage owns this gesture
      }

      if (!suspended() && Math.abs(raw) > 1 && contactScrollRoom(raw > 0 ? 1 : -1) > 1) {
        return; // the contact panel keeps the wheel while it can still move
      }
      e.preventDefault();
      const now = performance.now();
      const gap = now - lastT;
      lastT = now;
      const d = raw;
      if (suspended()) return;

      const a = Math.abs(d);
      if (gap > 120) spent = false; // quiet moment = the swipe ended
      if (spent) {
        // still inside the same swipe (inertia tail)
        if (a > peak) peak = a;
        else if (a < peak * 0.85) passed = true;
        if (passed) low = Math.min(low, a);
        if (
          passed &&
          now >= lockedUntil &&
          a > 16 &&
          a > low * 2.8 &&
          a > peak * 0.3
        ) {
          spent = false; // a NEW swipe began
        }
      }
      if (now < lockedUntil || spent || a < 1) return;
      spent = true;
      peak = a;
      low = Infinity;
      passed = false;
      lockedUntil = now + 350;
      trigger(d > 0 ? 1 : -1, 'wheel');
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
        const dir = dy < 0 ? 1 : -1;
        if (contactScrollRoom(dir) > 1) return; // still scrolling the contact list
        trigger(dir, 'touch');
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

            <img className="hero-logo" src="/r-mark.png" alt="" />

            <div className="hero-foot">
              <span className="hero-name">Rahul Dev</span>
              <span className="hero-copy">&copy; 2026</span>
            </div>

            <svg viewBox="0 0 1000 104" aria-hidden="true">
              <text
                x="0"
                y="102"
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

          <ContactPage active={page === 3} />
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
