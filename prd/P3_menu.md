# P3 — Menu

## Goal
Verify the Menu page (page 1) works: heading list, teaser roll, reveal hint, shared-element open trigger.

## Steps
- [ ] 3.1 Verify `Menu.tsx` reads from `src/data/cv.json` (after refactor)
  - Verify: menu labels, counts, teasers all come from cv.json
- [ ] 3.2 Verify arrow-key navigation, hover, click-to-open all work
  - Verify: `MenuApi` (gesture, jumpTo, getIndex) exposed via apiRef
- [ ] 3.3 Verify shared-element transition from menu heading to detail overlay
  - Verify: heading flies from menu item to detail heading on open

## Notes
- The menu is on page 1 of the track; Assets (index 4) reveals on scroll.