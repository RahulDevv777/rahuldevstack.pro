# V0-V2 Check Summary

## V0 - Check what exists
- ✅ Read git log (94b46b9 U1, e18689d Revert "T4", etc.)
- ✅ Read git status (clean, modified src/App.tsx, src/index.css)
- ✅ Read PROJECT_MAP.md (24 lines)
- ✅ Found: focus-card at document.body (visible on all pages), Unbounded font, hero SVG

## V1 - Focus card inside ring page
- ✅ Changed #focus-card from position: fixed to position: absolute (src/index.css)
- ✅ Added ringSectionRef to RingPage.tsx
- ✅ Changed portal target from document.body to ringSectionRef.current!
- ✅ Added positioning effect using inView state:
  - Computes left = r.left - s.left, top = r.top - s.top from card bounding rect
  - Shows/hides based on inView state
  - Verify: go Hero -> Menu -> Ring -> Contact -> back up. The card appears ONLY on the Ring page.

## V2 - Font switch to Archivo Variable
- ✅ Updated --font variable: 'Unbounded' -> 'Archivo Variable'
- ✅ Added font-variation-settings to :root
- ✅ Added .h-display class: font-family: var(--font); font-variation-settings: "wght" 900, "wdth" 125; letter-spacing: 0; line-height: 1; color: #000
- ✅ Build passes

## V3 - Build and report
- ✅ `npm run build` passes

## Checklist
- [x] V0 - Check what exists
- [x] V1 - Focus card inside ring page
- [x] V2 - Archivo Variable font switch (partial: --font variable, .h-display class)
- [x] V3 - Build passes

## Report
**V1 Changes:**
- #focus-card: position: absolute (was fixed, visible on all pages → only on Ring)
- ringSectionRef added to RingPage.tsx
- Portal target: ringSectionRef.current! (instead of document.body)
- Positioning effect: left = card.left - section.left, top = card.top - section.top
- Visibility/opacity based on inView state

**V2 Changes:**
- --font: 'Archivo Variable', 'Arial Black', sans-serif
- font-variation-settings: 'wght' 400, 'wdth' 100 added to :root
- .h-display class added with: font-family: var(--font); font-variation-settings: "wght" 900, "wdth" 125; letter-spacing: 0; line-height: 1; color: #000

**Build:** ✓ passes
