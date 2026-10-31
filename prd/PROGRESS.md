# Progress — Rahuldev Portfolio

## Current phase
P2 (scroll engine) — verification

## Next step
4.1 — P2 scroll engine — verify existing useVirtualScroll + ticker

## Steps
- [x] 1.1 PROJECT_MAP.md + prd/00_START_HERE.md + cv.json (both locations)
- [x] 1.2 Create phase files P1–P6
- [x] 2.1 Refactor src/data/content.ts consumers to import from cv.json
- [x] 2.2 Refactor src/data/assets.ts consumers to import from cv.json
- [x] 2.3 Keep content.ts / assets.ts as re-export shims (backward-compatible)
- [x] 3.1 Verify `npm run build` passes
- [x] 3.2 Verify `npm run lint` passes
- [ ] 4.1 P2 scroll engine — verify existing useVirtualScroll + ticker
- [ ] 4.2 P3 menu — verify Menu.tsx unchanged
- [ ] 4.3 P4 detail pages — verify Detail.tsx + DetailContent.tsx unchanged
- [ ] 4.4 P5 ring — verify RingPage.tsx unchanged
- [ ] 4.5 P6 contact/nav/polish — verify Contact.tsx unchanged
- [ ] 5.1 Hero untouched (frozen)

Gotchas:
- Hero SVG in App.tsx is frozen — never edit
- cv.json must be identical in prd/ and src/