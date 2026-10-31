# P4 — Detail Pages

## Goal
Verify detail overlays for About, Projects, Education, Skills: shared-element open, virtual scroll, grouped reveals, close.

## Steps
- [ ] 4.1 Verify `DetailContent.tsx` reads from `src/data/cv.json` (after refactor)
  - Verify: all text (profile, projects, education, skills) comes from cv.json
- [ ] 4.2 Verify `Detail.tsx` shared-element heading fly-in works
  - Verify: heading scales/translates from menu source to detail destination
- [ ] 4.3 Verify `useVirtualScroll` provides inertial column scrolling
  - Verify: wheel/touch/keyboard scroll the detail column; overscroll triggers close
- [ ] 4.4 Verify Esc closes, Tab traps focus inside dialog
  - Verify: `role="dialog"`, `aria-modal="true"`

## Notes
- Detail overlays cover the full screen; menu dims behind them.