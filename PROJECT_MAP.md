Stack: Vite + React 19 + TypeScript, oxlint, CSS-in-JS-free
Files:
- src/main.tsx : entry point, renders App
- src/App.tsx : page track (hero/menu/ring/contact), detail overlays, hash routing, wheel/touch/key nav
- src/index.css : all styles (2360 lines), one font (Unbounded)
- src/components/Menu.tsx : menu stage, heading list, teaser roll, reveal hint
- src/components/Detail.tsx : shared-element detail overlay with virtual scroll
- src/components/DetailContent.tsx : About/Projects/Education/Skill content panels
- src/components/RingPage.tsx : iCards ring carousel + card detail overlay
- src/components/Contact.tsx : FloatingNav + ContactPage
- src/components/FitHeading.tsx : auto-fit page headings
- src/components/AssetIcon.tsx : lucide icon mapper
- src/data/content.ts : MENU_SECTIONS, profile, projects, education, skillGroups
- src/data/assets.ts : ASSETS cards, colors, lookup
- src/lib/ticker.ts : single rAF loop
- src/lib/motion.ts : clamp, damp, easing, prefersReducedMotion
- src/hooks/useVirtualScroll.ts : inertial scroll for detail columns
- src/hooks/useReducedMotion.ts : prefers-reduced-motion state
- public/fonts/unbounded-var.woff2 : hero font
Events: none (direct prop/state drilling; hash URL for detail/pages)
Gotchas:
- Hero SVG is approved/frozen — never edit
- All text must come from src/data/cv.json (copy of prd/data/cv.json)
- Motion: transform and opacity only
- prefers-reduced-motion: 150ms fades
- 4 full-page sections + detail overlays for About, Projects, Education, Skills