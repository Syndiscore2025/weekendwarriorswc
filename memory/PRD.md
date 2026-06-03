# Weekend Warriors Wrestling Club — UI Redesign

## Original Problem Statement
> "i built this wrestling club website in the early stages of using ide extensions in vs code. now that ai has advanced with UI can you take a good look and see if there are ui changes and enhancements we can make to make this websites ui look alot better?"

Source repo: https://github.com/Syndiscore2025/weekendwarriorswc
Stack (preserved): Static HTML + CSS + vanilla JS, Node Express API for admin data, JSON file storage.

## User Choices (Jan 2026)
- **Design direction:** Gritty Mat-Room — dark, industrial, bold typography, red/black accent.
- **Scope:** Redesign only public-facing pages (`index.html`, `about.html`, `schedule.html`, `contact.html`, `winter-signups.html`). Leave **admin pages untouched**.
- **Backend:** All API/JSON logic preserved (contact submit, slides loader, tournaments loader, registration form).
- **Brand:** Logo colors only — red, black, white.

## Architecture (unchanged)
- Static site served via `/app/frontend/server.js` (Express static) on port 3000 (preview).
- Site files live at `/app/*.html`, `/app/style.css`, `/app/global-music.js`, `/app/data/*.json`, `/app/media/*`.
- Backend supervisor stub at `/app/backend/server.py` (placeholder, unused by site).

## Design Tokens
Saved in `/app/design_guidelines.json` (Anton/Barlow Google Fonts, obsidian/red palette, sharp corners, hard offset shadows, SVG noise grain). Driven by `design_agent_full_stack`.

## What's Been Implemented (Jan 2026)
- ✅ New `style.css` — gritty mat-room CSS variables, typography ramp, sticky nav with underline sweep, sharp-cornered cards with hard offset shadow on hover, dark forms with red focus rail, schedule tables with hover red rail + register pill, polygon-clipped audio toggle, footer with red top accent, entrance animations, mobile breakpoints + responsive table card-stack.
- ✅ `index.html` — Asymmetric hero (massive "GRIND. SWEAT. CONQUER." with outlined word + slideshow in angled poster clip) + stats strip + "Built for Warriors." welcome block.
- ✅ `about.html` — Mission display headline + bento value cards (Discipline/Respect 3-col, Excellence 2-col, Teamwork 4-col) with watermark numbers behind text + coaching card.
- ✅ `schedule.html` — Display "THE SCHEDULE." + redesigned practice/tournament tables with Anton red headers and register pill buttons.
- ✅ `contact.html` — "GET IN TOUCH." + grid layout with bold contact info card and dark sharp form.
- ✅ `winter-signups.html` — Stripped ice/blue theme; recolored logo cross-animation in red glow, restyled program cards / add-on list / signup form / waiver / modal / success message to match.
- ✅ All interactive elements have `data-testid` attributes.
- ✅ Slideshow JS, contact form submit JS, schedule data loader JS, audio music toggle JS — all preserved untouched (only visual styles changed).

## Files Touched
- `/app/style.css` (full rewrite)
- `/app/index.html` (full rewrite — slideshow JS preserved)
- `/app/about.html` (full rewrite)
- `/app/schedule.html` (full rewrite — table JS preserved)
- `/app/contact.html` (full rewrite — form JS preserved)
- `/app/winter-signups.html` (inline style block replaced; header/body markup + form fields + submit JS preserved)
- `/app/frontend/server.js` (Express static — preview only, not deployed)
- `/app/design_guidelines.json` (design blueprint from agent)

## Admin Pages — UNTOUCHED
- `admin.html`, `admin-enhanced.html`, `admin-enhanced.js`, `admin-lite.html`, `admin-simple.html` — left as-is per user request.

## Backlog / Future Enhancements
- **P1**: Add real coach bios + photos to About page (mission-block design ready)
- **P1**: Replace placeholder hero stats (15+/200+/50+/1) with real numbers from `data/team-roster.json` once available
- **P2**: Photo gallery page leveraging `data/photo-gallery.json` (admin already manages it)
- **P2**: Lightweight blog/news section pulled from a new `data/news.json`
- **P2**: Convert tournament register links to inline modal flow
- **P3**: Add page-load microcopy variation (e.g., rotating hero hooks "Grind. Sweat. Conquer." / "Train. Compete. Conquer.")

## Next Tasks
- Optional: deploy fresh build to `weekendwarriorswc.com` / Render.
- Optional: run testing agent for cross-browser smoke if user wants validation.
