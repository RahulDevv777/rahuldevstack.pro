# P1 — Foundation

## Goal
Set up tracking infrastructure and migrate all CV content to `src/data/cv.json` (copy of `prd/data/cv.json`).

## Steps
- [x] 1.1 Create `PROJECT_MAP.md`, `prd/00_START_HERE.md`, `prd/data/cv.json`, `src/data/cv.json`
  - Verify: `python3 -m json.tool src/data/cv.json > /dev/null` exits 0; `prd/data/cv.json` and `src/data/cv.json` are identical (`diff`)
- [ ] 1.2 Create phase files P1–P6
  - Verify: all 6 phase files exist under `prd/`
- [ ] 1.3 Git init + first commit
  - Verify: `git log --oneline` shows at least one commit

## Notes
- Do not edit the hero SVG in `App.tsx` — it is frozen/approved.
- Keep `src/data/content.ts` and `src/data/assets.ts` as-is for now; refactor consumers in P2.