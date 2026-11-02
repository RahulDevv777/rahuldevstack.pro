Stack: Vite + React 19 + TS, oxlint. Wiring is prop drilling + hash URL.
- src/main.tsx        entry, renders App
- src/App.tsx (475)   page track 0..3, detail overlays, hash routing,
                      GLOBAL wheel/touch/key engine (window.addEventListener)
- src/components/Menu.tsx (430)   5 headings wheel; gesture()/jumpTo()/lock
- src/components/RingPage.tsx (902) 47-card 3D ring + expanded card portal
- src/components/Detail.tsx / DetailContent.tsx  shared-element detail
- src/components/Contact.tsx   FloatingNav + contact page
- src/components/FitHeading.tsx, AssetIcon.tsx  helpers
- src/hooks/useVirtualScroll.ts  inertial column scroll for details
- src/hooks/useReducedMotion.ts
- src/lib/ticker.ts   ONE rAF loop (addTick) shared by all animations
- src/lib/motion.ts   clamp/damp/mod/cubicBezier (easeOut, cinematic)
- src/data/cv.ts, content.ts, assets.ts, cv.json
- src/index.css (2360) all styles
Wheel listener: App.tsx effect ~line 273-415 (single window wheel+touch+key,
preventDefault, trigger(dir) -> goToPage() or menuApi.gesture()).
Page timings: PAGE_MS/cinematic in App.goToPage; Menu STEP_MS/LOCK_MS.
Ring geometry: RingPage.renderRing() (th, focus, spoke, translateZ, zIndex).
Gotchas: hero SVG frozen; no mock data; motion = transform/opacity only;
prefers-reduced-motion honoured in lib/motion.ts.
