# P2 — Scroll Engine

## Goal
Verify the existing scroll infrastructure works correctly: `src/lib/ticker.ts`, `src/lib/motion.ts`, `src/hooks/useVirtualScroll.ts`, `src/hooks/useReducedMotion.ts`.

## Steps
- [ ] 2.1 Verify `useVirtualScroll` provides inertial scrolling with `transform`/`opacity`-only motion
  - Verify: detail page content moves via `translate3d`; no `top`/`left` animations
- [ ] 2.2 Verify `prefers-reduced-motion` shortens animations to 150ms fades
  - Verify: `useReducedMotion()` returns boolean; motion lib uses it
- [ ] 2.3 Verify `ticker.ts` is a single rAF loop shared across the site
  - Verify: only one `addTick` consumer per animated component

## Notes
- Motion uses only `transform` and `opacity` per global rules.
- No changes expected; this is a verification phase.