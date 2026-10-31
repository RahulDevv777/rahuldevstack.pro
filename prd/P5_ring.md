# P5 — Ring

## Goal
Verify the Ring page (page 2): iCards ring carousel, card detail overlay, prev/next navigation.

## Steps
- [ ] 5.1 Verify `RingPage.tsx` reads from `src/data/cv.json` assets (after refactor)
  - Verify: all 47 asset cards render in the ring with correct colors
- [ ] 5.2 Verify ring layout responds to viewport size (desktop/mobile)
  - Verify: `computeLayout()` adjusts card size, ring radius, font size
- [ ] 5.3 Verify card detail overlay opens with face/p panel flip
  - Verify: `is-swap-N` keyed swap, prev/next arrows, index counter
- [ ] 5.4 Verify scroll-down-to-contact exit from ring
  - Verify: `onExitDown` triggers `goToPage(3)`

## Notes
- Ring uses `lucide-react` icons mapped via `AssetIcon.tsx`.
- Card colors come from `ASSET_COLORS` in cv.json.