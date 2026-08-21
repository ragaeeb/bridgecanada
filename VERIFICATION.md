# Verification

## Automated

- `bun run check` — Astro & TypeScript type check: 0 errors, 0 warnings, 0 hints
- `bun run lint` — Biome linter check: 0 errors, 0 warnings across all files
- `bun run build` — Full static production export builds cleanly to `dist/`
- Static output — pure client-side static route, zero server runtime dependency
- WebGL / Canvas — Three.js renders 3D connected globe, curved flight arcs, and particle nebula with automatic DPI clamping
- 3D Physics — Perspective tilt (`rotateX`, `rotateY`, `translateZ`) and specular lighting glare on pointer move

## Visual checkpoints

Inspected scrolling down and back up across timeline:

- `p=0.00` Hero overview: 3D interactive connection globe rotating on right, glowing status indicator, stats ribbon
- `p=0.18` Hero exit: Camera glides toward Canadian gateway coordinates; smooth blur/fade
- `p=0.27` Protocol (Visit) panel: 3D frosted glass card with airside greeting, luxury transport, and roundtable highlights
- `p=0.48` Clean panorama & route: Flight arcs pulse between Dhaka / international hubs and Ottawa / Canada
- `p=0.58` Bilateral Trade panel: 3D commodity cards (jute, cashew, clean tech) with direct trade inquiry triggers
- `p=0.74` Panorama refocus: 3D globe transitions into ambient depth perspective
- `p=0.88` Itinerary coverflow: 3D glass cards with category pills, step numbers, and quick inquiry actions
- `p=1.00` Final interactive hold: Waypoint HUD synced; delegation customizer drawer fully interactive

## Responsive

- 1440×900+ desktop — Complete timeline, 3D WebGL globe, cursor glow follower, waypoint HUD
- 1024×768 tablet landscape — Scaled 3D scene, responsive glass cards, touch coverflow rail
- 768×1024 tablet portrait — Adaptive layout, touch swipe rail, full delegation customizer
- 390×844 mobile — Streamlined single-column layout, touch drag rail, instant modal builder

## Interaction and accessibility

- **VIP Delegation Customizer**: Multi-step interactive drawer with mission focus, Canadian destination hubs, protocol services, and delegate size with one-click tailored email formatting
- **Waypoint HUD**: Clickable waypoint dots and real-time scroll scrubber on right desktop edge
- **3D Card Tilts**: Mouse hover triggers smooth spring-damped 3D perspective tilt and dynamic specular light glare
- **3D Itinerary Rail**: Supports prev/next buttons, drag, touch swipe, keyboard arrows, Home/End keys
- **Reduced Motion**: When `prefers-reduced-motion: reduce` is enabled, 3D WebGL and timeline smoothing disable gracefully to provide a clean static reading experience with all interactive features accessible
