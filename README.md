# Bridge Canada

[![wakatime](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/8609daf8-78e6-4e8e-b94c-de3c4fef4169.svg)](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/8609daf8-78e6-4e8e-b94c-de3c4fef4169)
[![Vercel Deploy](https://deploy-badge.vercel.app/vercel/bridgecanada)](https://bridgecanada.ca)

**Connecting Continents** — A professional business coordination service helping international delegations connect with Canadian entities.

A static, scroll-driven Astro microsite for Bridge Canada’s VIP visit, delegation, and trade coordination services.

---

## About

Bridge Canada specializes in arranging comprehensive business trips to Canada, providing end-to-end coordination services including:

- 🛂 **VISA Assistance** and travel bookings
- 🤝 **Business Meeting Arrangements** with Canadian entities
- 🚗 **Private Transportation** and logistics
- 🏨 **Luxury Accommodations** selected for privacy and proximity
- 🍽️ **Hosted Dining** and refreshments
- 🎁 **Tourism & Leisure** itineraries (sightseeing, shopping)
- 📦 **Trade Coordination** for import/export (jute bags, cashew nuts, and other goods)

We have successfully hosted government delegations from Bangladesh (Ministry of Industries, Education, Housing & Public Works) across multiple Canadian cities.

---

## Tech Stack

Built with modern web technologies:

- **Framework**: [Astro 7](https://astro.build) (Static HTML & Component Engine)
- **Runtime / Package Manager**: [Bun](https://bun.sh) (>=1.3.0)
- **Language**: TypeScript with **ESNext** target & module resolution
- **Styling**: Vanilla CSS with `@layer` architecture, custom animations, and responsive viewport units (`100svh`)
- **Code Quality**: [Biome 2](https://biomejs.dev) for linting & formatting
- **Deployment**: Static export (`output: 'static'`) optimized for Vercel and GitHub Pages

---

## Getting Started

Install dependencies and run the development server:

```bash
bun install
bun run dev
```

Open [http://localhost:4321](http://localhost:4321) to view the site.

---

## Available Scripts

```bash
bun run dev          # Start development server
bun run build        # Type-check and build static export to dist/
bun run preview      # Preview the production build locally
bun run check        # Run Astro & TypeScript type check
bun run lint         # Run Biome linter check
bun run format       # Format code with Biome
bun run deploy       # Build and deploy directly to Cloudflare Workers via Wrangler
bun run deploy:pages # Build and deploy to Cloudflare Pages via Wrangler
```

---

## Project Structure

```
.
├── src/
│   ├── pages/
│   │   └── index.astro        # Main page markup & content structure
│   ├── scripts/
│   │   └── cinematic.ts       # Scroll timeline & itinerary rail interaction logic
│   └── styles/
│       └── global.css         # Art direction, depth layers, layout, reduced-motion
├── public/
│   └── assets/                # Optimized scene, brand, and itinerary assets
├── .github/workflows/         # GitHub Actions for automated Cloudflare deployment
├── wrangler.json              # Cloudflare Workers static asset configuration
├── ASSET_MANIFEST.md          # Layer roles, dimensions, anchors, and source audit
├── TIMELINE.md                # Normalized scene beats and retiming guide
├── VERIFICATION.md            # Build and interaction QA record
└── dist/                      # Production output directory (generated on build)
```

The site has no runtime server dependency and builds to `dist/`.

---

## Editing & Configuration

- **Itinerary Content**: Lives in the `itinerary` array in the frontmatter of `src/pages/index.astro`.
- **Timeline Boundaries**: Live in the single `beats` object in `src/scripts/cinematic.ts`. Adjust those boundaries before changing render math.
- **Interactions**: The final rail supports control buttons, keyboard arrow navigation, Home/End keys, mouse drag, and native touch swipe. Every card and CTA triggers pre-addressed email actions.

---

## Contact

**Office Address**: 1390 Prince of Wales Drive, Unit 508 · Ottawa, Canada

For inquiries about our services, contact us at: [info@bridgecanada.ca](mailto:info@bridgecanada.ca)

---

## License & Repository

- **License**: MIT © 2021-2026 Bridge Canada N World
- **Repository**: [https://github.com/ragaeeb/bridgecanada](https://github.com/ragaeeb/bridgecanada)
