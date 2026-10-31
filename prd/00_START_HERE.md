# Project PRD — Rahuldev Muthamsetty Portfolio (rahudevstag.pro)

**Project:** portfolio website for Rahuldev Muthamsetty (rahudevstag.pro). Work inside the current project folder. **Keep the existing stack; do not switch frameworks.** The **hero page (giant black PORTFOLIO) is approved: never edit it.**

## RESUME RULE
At the start of every session, read ONLY: (a) this file, (b) `prd/PROGRESS.md`, (c) `PROJECT_MAP.md`, (d) the ONE phase file named in `CURRENT PHASE`, and only the step named in `NEXT STEP`. Do not read other phase files. Do not re-read old code you already wrote: use `PROJECT_MAP.md`.

Work in small steps. One step = one small change set. After each step: run its Verify check, `git add -A && git commit -m "step X.Y"`, update `prd/PROGRESS.md`, update `PROJECT_MAP.md` if files changed, then start the next step.

Never redo a step marked `[x]`. Keep files small (max ~250 lines each). Save tokens: never cat big files; do not paste PRD text into replies; after each step reply in 5 lines or less.

## Global rules
- One font for the whole site: the hero font (Unbounded). No other font family anywhere.
- Plain white pages. Motion uses only `transform` and `opacity`. `prefers-reduced-motion`: shorten animations to 150 ms fades.
- Do not invent CV content: all text comes from `src/data/cv.json` (a copy of `prd/data/cv.json`).
- 4 full-page sections: 1 Hero, 2 Menu (headings), 3 Ring (iCards), 4 Contact; plus detail overlays for About, Projects, Education, Skills.

## Phases
P1 `P1_foundation.md` · P2 `P2_scroll_engine.md` · P3 `P3_menu.md` · P4 `P4_detail_pages.md` · P5 `P5_ring.md` · P6 `P6_contact_nav_polish.md`