# PROJECT_MAP

Entry: `src/main.tsx` → imports Archivo font, `index.css`, renders `App` (React).
Markup: `index.html` (#root).

- `src/App.tsx` — 4-page vertical track, gesture engine (one wheel listener, swipe decay detection), page lock, routing/hash, detail state.
- `src/components/Menu.tsx` — five-heading wheel, caption/teaser, exit only at ends, imperative `MenuApi` (gesture/jumpTo/getIndex).
- `src/components/RingPage.tsx` — 51-card 3D ring, flat `#focus-card` overlay, auto-advance, drag/wheel/arrow, expanded dialog portal.
- `src/components/Contact.tsx` — contact page + floating nav.
- `src/components/Detail.tsx` — detail overlay, shared-element heading, virtual scroll.
- `src/components/DetailContent.tsx` — detail copy (from cv.json).
- `src/hooks/useVirtualScroll.ts` — inertial detail column + overscroll-close.
- `src/lib/motion.ts` — easings (`easeOut`, `cinematic`), clamp/mod/damp.
- `src/lib/ticker.ts` — single rAF loop (`addTick`).
- `src/data/cv.json` — single content source; `cv.ts` typed views + `assetColor`.
- `src/index.css` — all styles; `--font` = Archivo Variable; ring/idle rules.
