# Pro Sewer and Drains

Marketing site for ACR Trenchless & Plumbing, dba **Pro Sewer and Drains** (prosewerdrains.com) — a drain/sewer-focused plumbing company serving a 30-mile radius around La Habra, CA.

## Status

Homepage built: pure HTML/CSS/JS, no build step. Other pages (services subpages, about, etc.) are not started yet.

## Structure

- `index.html` / `styles.css` / `app.js` — the homepage
- `assets/logos/` — primary logo (SVG/PNG/PDF/EPS/DXF)
- `assets/fonts/` — Gravity and HelveticaNeue BoldExtObl families, self-hosted via `@font-face`
- `assets/content/video/` — raw client-provided video; `assets/content/video/web/` has the trimmed, web-encoded clips actually used on the page
- `assets/images/` — favicons and the one licensed stock photo used on the page
- `references/onboarding-info/` — full client brief: services, pricing, service area, brand contacts
- `CLAUDE.md` — working agreement for this repo (git workflow, etc.)

## Design

Bold, near-monochrome direction (navy + off-white, logo red as the single accent) modeled on span.io / joulevc.com rather than a typical trade-site layout — oversized typography carries the page instead of icon grids, and the hero/process sections use trimmed clips from the client's own raw video instead of stock photography. Structural page pattern (nav, hero, contact form, footer) follows `capri-plumbing` elsewhere in the AM SITES workspace, adapted for this client's core services (clogged drains, water heaters, liners, pipe bursting, epoxy, boring, sewer repair) in place of Capri's HVAC line.
