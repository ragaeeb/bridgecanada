# Verification

## Automated

- `bun run build` — Astro check: 0 errors, 0 warnings, 0 hints; static build succeeds
- Static output — one route, no server runtime
- Optimized project media — approximately 1 MB before HTML/CSS/JS
- Browser console — no errors or warnings during the full timeline and rail interaction pass
- Horizontal document overflow — none at 1440×900, 768×1024, and 390×844

## Visual checkpoints

Inspected scrolling down and back up at approximately:

- `p=0.00` complete editorial hero
- `p=0.18` intro fully exited
- `p=0.27` visit panel readable
- `p=0.44` clean panorama with no holes
- `p=0.58` trade panel readable
- `p=0.74` world restored to focus
- `p=0.90` itinerary mostly entered
- `p=1.00` stable interactive final state

No transparent holes, unpainted edges, layer-order changes, stretching, critical crop loss, or horizontal page overflow were observed.

## Responsive

- 1440×900 desktop — complete timeline and all checkpoints
- 1280×720 laptop — opening composition
- 1024×768 tablet landscape — trade narrative
- 768×1024 tablet portrait — final rail and controls
- 390×844 mobile — opening, visit panel, and final rail

## Interaction and accessibility

- Previous/next buttons advance the rail
- Arrow Left/Right and Home/End are implemented on the focused rail
- Mouse drag and native touch swipe are supported
- Active position is announced after the rail settles
- All cards and CTAs are semantic links with real pre-addressed email actions
- All navigation buttons map to real timeline markers
- Visible focus styles are present
- Decorative images use empty alternative text
- Reduced-motion CSS changes the sticky experience into a static hero plus normal-flow content; timeline smoothing, pointer parallax, zoom, and blur are disabled while all content and rail controls remain available
