import type { Ref } from 'react';
import { useLayoutEffect, useRef } from 'react';
import { clamp } from '../lib/motion';

interface FitHeadingProps {
  text: string;
  className?: string;
  id?: string;
  elementRef?: Ref<HTMLHeadingElement>;
}

/**
 * The big page headings must never overflow their column. Measure at 100px,
 * scale to the available width, then cap at the type scale of the PRD.
 */
export const FitHeading = ({
  text,
  className = '',
  id,
  elementRef,
}: FitHeadingProps) => {
  const localRef = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const element = localRef.current;
    if (!element) return;

    const fit = () => {
      const parent = element.parentElement;
      if (!parent) return;
      const width = parent.clientWidth;
      if (width <= 0) return;

      element.style.fontSize = '100px';
      // Measure the intrinsic width: the CSS max-width would otherwise clamp
      // the box to the column and hide the overflow we need to fit.
      const previousMaxWidth = element.style.maxWidth;
      element.style.maxWidth = 'none';
      const natural = element.getBoundingClientRect().width;
      element.style.maxWidth = previousMaxWidth;
      if (natural <= 0) return;

      const cap = clamp(41.6, window.innerWidth * 0.07, 112);
      const size = Math.max(30, Math.min(cap, ((width - 2) * 100) / natural));
      element.style.fontSize = `${size.toFixed(2)}px`;
      element.dataset.fit = JSON.stringify({ width, natural, size });
    };

    fit();
    const observer = new ResizeObserver(fit);
    if (element.parentElement) observer.observe(element.parentElement);
    document.fonts?.ready.then(fit).catch(() => undefined);

    return () => {
      observer.disconnect();
    };
  }, [text]);

  return (
    <h2
      ref={(node) => {
        localRef.current = node;
        if (typeof elementRef === 'function') elementRef(node);
        else if (elementRef) {
          (elementRef as { current: HTMLHeadingElement | null }).current = node;
        }
      }}
      id={id}
      className={`fit-heading ${className}`}
    >
      {text}
    </h2>
  );
};
