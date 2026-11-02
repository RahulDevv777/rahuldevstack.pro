# PROJECT_MAP.md

## File Overview
- **src/App.tsx** (≈470 lines) — Main app shell; page state (0=hero,1=menu,2=ring,3=detail,4=contact); wheel listener at line 396 (`window.addEventListener('wheel', onWheel, {passive:false})`); one `onWheel` handler feeds `trigger(dir,'wheel')`; contains `normalizeWheel`, `goToPage`, menu/rings/detail orchestration
- **src/components/Menu.tsx** (≈450 lines) — Horizontal menu with 5 sections; heading buttons `.menu-item`; gesture `apiRef.gesture(dir)`; step lock `STEP_LOCK_MS=280`; exit lock `STEP_MS=700`
- **src/components/RingPage.tsx** (≈300 lines) — 3D ring of 51 asset cards; `computeLayout()`, `q`/ `qTarget` tweening; `render()` uses focus weight `f`; neighbor `th2` push; no focused-card overlay yet
- **src/components/FitHeading.tsx** (≈75 lines) — Fit heading that scales to column width; used on detail pages
- **src/components/Detail.tsx** (≈230 lines) — Detail overlay with `FitHeading`; heading flies from menu; IntersectionObserver reveals groups
- **src/components/DetailContent.tsx** — Content groups/masks for detail pages
- **src/lib/motion.ts** — `clamp`, `lerp`, `damp`, `cubicBezier`, `easeOut`, `cinematic`, `prefersReducedMotion`
- **src/lib/ticker.ts** — Single `requestAnimationFrame` loop via `addTick`; one loop for Menu + Ring
- **src/data/cv.json** — Palette, asset data, menu sections; T4 will replace `cv.palette`
- **src/index.css** — Global styles; `#track { will-change: transform; }`; `:focus-visible { outline: 2px solid var(--ink) }`; hero/fit headings; ring styles; contact page

## Key Functions
- `normalizeWheel(event)` — converts deltaMode to pixels (lines 42-46 App.tsx)
- `onWheel(event)` — current handler with buffer/peak/decel detection (lines 310-340 App.tsx)
- `goToPage(page, opts)` — page navigation with PAGE_MS=900 lock
- `Menu.gesture(dir, key)` — menu step handler
- `computeLayout()` — ring layout calculation (RingPage.tsx line 50)
- `clamp`, `lerp`, `easeOut`, `cinematic` — motion utilities

## Wheel Listener Location
- `src/App.tsx line 396`: `window.addEventListener('wheel', onWheel, { passive: false });` — registered once in useEffect deps `[goToPage]`
