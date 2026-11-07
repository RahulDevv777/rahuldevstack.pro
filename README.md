# rahuldevstack.pro

The personal portfolio of **Rahuldev Muthamsetty** — a four-screen, motion-led
site: a giant hero wordmark, a scrollable section list, a 3D ring of project
cards, and a contact page.

Live: <https://rahuldevv777.github.io/rahuldevstack.pro/>

## Stack

- Vite + React 19 + TypeScript
- One stylesheet (`src/index.css`), Archivo Variable (via `@fontsource-variable`)
- `lucide-react` icons, hand-drawn SVG glyphs
- No router, no state library — a single rAF ticker drives every animation

## Structure

```
src/
  App.tsx                 four-page vertical track, wheel/touch/key gesture engine,
                          page lock, hash routing, detail state
  components/
    Menu.tsx              section headings, caption + teaser, exit only at the ends
    RingPage.tsx          51-card 3D ring: drag, sideways wheel, arrow keys, dialog
    Detail.tsx            About / Projects / Education / Skills overlay with a
                          shared-element heading and virtual scrolling
    DetailContent.tsx     the copy for those four pages
    Contact.tsx           contact page + floating nav
    AssetIcon.tsx         icon set used on the ring cards
    FitHeading.tsx        heading that always fits the column
  data/
    cv.json               single source of truth for all content
    cv.ts                 typed accessors over cv.json
    content.ts            menu + page content views
    assets.ts             ring card data and colours
  hooks/
    useVirtualScroll.ts   inertial content column, overscroll closes the page
    useReducedMotion.ts   respects prefers-reduced-motion
  lib/
    ticker.ts             one requestAnimationFrame loop for the whole site
    motion.ts             easings, clamp, damp
  index.css               every style on the site
public/                   resume PDF, favicon, hero mark, robots.txt
```

## Local development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build into dist/
npm run preview  # serve the built site
npm run lint
```

## Routes

Hash-based, so they work on any static host:

| URL          | Screen                        |
| ------------ | ----------------------------- |
| `/`          | hero (PORTFOLIO)              |
| `/#menu`     | sections                      |
| `/#assets`   | project ring                  |
| `/#contact`  | contact                       |
| `/#about` `/#projects` `/#education` `/#skills` | detail pages |

## Deploying

The build is fully static and uses relative asset paths, so it runs unchanged
on Vercel, Netlify, Cloudflare Pages, GitHub Pages or plain shared hosting.

### Vercel (primary)

The repo is connected to Vercel: every push to `main` builds and publishes.

- Framework preset: Vite (auto-detected)
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: none

### GitHub Pages (mirror)

`npm run deploy` builds and publishes `dist/` to the `gh-pages` branch, served at
<https://rahuldevv777.github.io/rahuldevstack.pro/>. Useful as a spare copy; the
canonical site is the domain on Vercel.

## Content

Everything the site says lives in `src/data/cv.json` — profile, projects,
education, skills and the ring cards. Edit that file, rebuild, and every screen
follows.
