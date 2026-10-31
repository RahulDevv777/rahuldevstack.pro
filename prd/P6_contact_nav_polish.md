# P6 — Contact / Nav / Polish

## Goal
Verify Contact page (page 3), FloatingNav, and final polish.

## Steps
- [ ] 6.1 Verify `Contact.tsx` reads from `src/data/cv.json` profile (after refactor)
  - Verify: email, LinkedIn, location, roles, quote all from cv.json
- [ ] 6.2 Verify `FloatingNav` highlights active section/page
  - Verify: nav links update on page change; RM logo goes to hero
- [ ] 6.3 Verify hash-based deep linking works (#about, #projects, #education, #skills, #menu, #ring, #contact)
  - Verify: `App.tsx` reads `window.location.hash` on mount
- [ ] 6.4 Final polish: all 4 pages (hero/menu/ring/contact) + 4 detail overlays work
  - Verify: `npm run build` and `npm run lint` both pass

## Notes
- Hero page is frozen — never edit.
- Contact page is on page 3 of the track.