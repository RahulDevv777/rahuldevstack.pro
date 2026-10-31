import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { FitHeading } from './FitHeading';
import { DETAIL_CONTENT, type DetailId } from './DetailContent';
import { useVirtualScroll } from '../hooks/useVirtualScroll';
import { prefersReducedMotion } from '../lib/motion';

const LABELS: Record<DetailId, string> = {
  about: 'ABOUT',
  projects: 'PROJECTS',
  education: 'EDUCATION',
  skills: 'SKILLS',
};

interface DetailProps {
  id: DetailId;
  closing: boolean;
  instant: boolean;
  onClose: () => void;
  onClosed: () => void;
  onMenuReveal: () => void;
}

export const Detail = ({
  id,
  closing,
  instant,
  onClose,
  onClosed,
  onMenuReveal,
}: DetailProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const sourceRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);

  const { viewportRef, contentRef, showEndHint } = useVirtualScroll({
    enabled: !closing,
    onOverscroll: onClose,
    resetKey: id,
  });

  // Shared-element opening: the heading flies from the menu to the left column.
  useLayoutEffect(() => {
    const heading = headingRef.current;
    const source = document.querySelector<HTMLElement>(
      `[data-menu-heading="${id}"]`,
    );
    sourceRef.current = source;
    if (source) source.style.visibility = 'hidden';

    const reduced = prefersReducedMotion() || instant;

    if (heading && source && !reduced) {
      const dest = heading.getBoundingClientRect();
      const src = source.getBoundingClientRect();
      if (dest.width > 0 && src.width > 0) {
        const scale = Math.min(src.width / dest.width, src.height / dest.height);
        const dx = src.left + src.width / 2 - (dest.left + dest.width / 2);
        const dy = src.top + src.height / 2 - (dest.top + dest.height / 2);
        heading.style.transition = 'none';
        heading.style.transformOrigin = '50% 50%';
        heading.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
        // Flush styles so the first paint is the source position.
        void heading.offsetWidth;
        heading.style.transition =
          'transform 1100ms cubic-bezier(0.76, 0, 0.24, 1)';
        requestAnimationFrame(() => {
          heading.style.transform = 'translate3d(0, 0, 0) scale(1)';
        });
      }
    }

    setOpen(true);

    // Safety net: content can never be stuck invisible.
    const fallback = window.setTimeout(() => {
      rootRef.current
        ?.querySelectorAll('[data-detail-group]')
        .forEach((group) => group.classList.add('is-seen'));
    }, 2600);

    return () => {
      window.clearTimeout(fallback);
      if (source) source.style.visibility = '';
    };
  }, [id, instant]);

  // Each group reveals once as it enters the viewport.
  useEffect(() => {
    const groups = rootRef.current?.querySelectorAll('[data-detail-group]');
    if (!groups || groups.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-seen');
            observer.unobserve(entry.target);
          }
        });
      },
      { root: viewportRef.current, threshold: 0.02 },
    );

    groups.forEach((group) => observer.observe(group));
    return () => observer.disconnect();
  }, [viewportRef]);

  // Reverse shared-element close.
  useEffect(() => {
    if (!closing) return;

    const reduced = prefersReducedMotion();
    const timers: number[] = [];
    const heading = headingRef.current;
    const source = sourceRef.current;

    if (heading && source && !reduced) {
      const dest = heading.getBoundingClientRect();
      const src = source.getBoundingClientRect();
      if (dest.width > 0 && src.width > 0) {
        const scale = Math.min(src.width / dest.width, src.height / dest.height);
        const dx = src.left + src.width / 2 - (dest.left + dest.width / 2);
        const dy = src.top + src.height / 2 - (dest.top + dest.height / 2);
        heading.style.transition = `transform 900ms ${cinematicCss}`;
        heading.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
      }
    }

    timers.push(window.setTimeout(onMenuReveal, reduced ? 40 : 500));
    timers.push(window.setTimeout(onClosed, reduced ? 140 : 960));

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [closing, onClosed, onMenuReveal]);

  // Esc closes; the overlay owns the screen while open.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'Tab') {
        const root = rootRef.current;
        if (!root) return;
        const focusable = Array.from(
          root.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((element) => element.offsetParent !== null);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus({ preventScroll: true });
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus({ preventScroll: true });
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true });
  }, []);

  const Content = DETAIL_CONTENT[id];

  return (
    <div
      ref={rootRef}
      className={`detail ${open ? 'is-open' : ''} ${closing ? 'is-closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={`${LABELS[id]} details`}
      tabIndex={-1}
    >
      <button
        type="button"
        className="detail-back"
        onClick={onClose}
        aria-label="Close and return to the sections"
      >
        <span aria-hidden="true">←</span> back
      </button>

      <div className="detail-head">
        <div className="detail-heading-wrap">
          <FitHeading
            text={LABELS[id]}
            className="detail-heading"
            elementRef={headingRef}
          />
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-viewport" ref={viewportRef}>
          <div className="detail-inner" ref={contentRef}>
            <Content />
            <div className="detail-tail" aria-hidden="true" />
          </div>
        </div>
        <div
          className={`detail-hint ${showEndHint ? 'is-visible' : ''}`}
          aria-hidden="true"
        >
          keep scrolling
        </div>
      </div>
    </div>
  );
};

// Kept as a string so the inline transition matches the PRD curve exactly.
const cinematicCss = 'cubic-bezier(0.76, 0, 0.24, 1)';
