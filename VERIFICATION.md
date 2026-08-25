# Verification

This file defines the release checks; it is not a permanent claim that the current checkout has passed them. Record dated execution evidence in the pull request or release notes.

## Automated

- `bun lint` — Biome checks supported source and configuration files.
- `bun typecheck` — Astro and TypeScript check templates and TypeScript modules.
- `bun test` — Bun runs behavior and project-contract tests, including local asset references.
- `bun run build` — Type-checks and produces the static site in `dist/`.
- Confirm `dist/404.html`, `dist/_headers`, `dist/robots.txt`, and `dist/sitemap.xml` exist after the build.

## Visual checkpoints

Verify scrolling down and back up across the timeline at each release:

- `p=0.00` Hero overview: 3D interactive connection globe rotating on right, glowing status indicator, stats ribbon
- `p=0.18` Hero exit: Camera glides toward Canadian gateway coordinates; smooth blur/fade
- `p=0.27` Protocol (Visit) panel: 3D frosted glass card with airside greeting, luxury transport, and roundtable highlights
- `p=0.48` Clean panorama & route: Flight arcs pulse between Dhaka / international hubs and Ottawa / Canada
- `p=0.58` Bilateral Trade panel: 3D commodity cards (jute, cashew, clean tech) with direct trade inquiry triggers
- `p=0.74` Panorama refocus: 3D globe transitions into ambient depth perspective
- `p=0.88` Itinerary coverflow: 3D glass cards with category pills, step numbers, and quick inquiry actions
- `p=1.00` Final interactive hold: Waypoint HUD synced; delegation customizer drawer fully interactive

## Responsive

- 1844×882 wide desktop — Folio labels clear the header and hero content remains inside the photographic center
- 1440×900 desktop — Complete timeline, 3D WebGL globe, cursor glow follower, waypoint HUD
- 1024×768 tablet landscape — Scaled 3D scene, responsive glass cards, touch coverflow rail
- 768×1024 tablet portrait — Adaptive layout, touch swipe rail, full delegation customizer
- 390×844 mobile — Single-column layout, touch drag rail, delegation customizer

At scroll position zero on desktop widths, compare rendered geometry rather than relying on CSS tokens alone:

- Both `.folio__index` rectangles must start below `.site-header` (`index.top > header.bottom`).
- `.intro` must start to the right of `.folio--left` and end to the left of `.folio--right`.
- Run those checks at 1844×882, 1440×900, and 1024×768; confirm no horizontal document overflow.
- At 768×1024 and 390×844, confirm the folios are hidden and the intro remains inside `.cinematic-stage`.

## Interaction and accessibility

- **VIP Delegation Customizer**: Multi-step interactive drawer with mission focus, Canadian destination hubs, protocol services, and delegate size with one-click tailored email formatting
- **Waypoint HUD**: Clickable waypoint dots and real-time scroll scrubber on right desktop edge
- **3D Card Tilts**: Mouse hover triggers smooth spring-damped 3D perspective tilt and dynamic specular light glare
- **3D Itinerary Rail**: Supports prev/next buttons, drag, touch swipe, keyboard arrows, Home/End keys
- **Reduced Motion**: Toggle `prefers-reduced-motion` while the page is open and confirm WebGL and timeline motion stop while controls remain usable.
- **Keyboard and focus**: Confirm the itinerary rail, waypoint controls, and customizer can be operated without a pointer and that modal focus is contained and restored.
- **Fallbacks**: Confirm the narrative remains readable with JavaScript disabled and when WebGL initialization is unavailable.
