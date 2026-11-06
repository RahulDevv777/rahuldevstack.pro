import '@fontsource-variable/archivo/wdth.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Safety net: the page shell must never scroll natively (a stray focus or
// anchor jump used to shift the whole site up by a quarter of the viewport).
const shellEls = () => [
  document.scrollingElement,
  document.body,
  document.getElementById('track'),
  // The last page scrolls its own content; every other panel is a fixed shell.
  ...document.querySelectorAll('.panel:not(.contact-page)'),
];
const unscroll = () =>
  shellEls().forEach((e) => {
    if (e && (e.scrollTop || e.scrollLeft)) {
      e.scrollTop = 0;
      e.scrollLeft = 0;
    }
  });
addEventListener('scroll', unscroll, { capture: true, passive: true });
document.addEventListener('focusin', () => requestAnimationFrame(unscroll));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
