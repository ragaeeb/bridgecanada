# Cinematic timeline

The desktop scroll section is 4,800 CSS pixels. It shortens to 4,200 pixels below 900px and 3,700 pixels below 620px. The sticky stage always derives progress from its own local travel:

`p = clamp((scrollY - sectionTop) / (sectionHeight - viewportHeight), 0, 1)`

| Progress | Beat | Motion & 3D WebGL Camera |
| --- | --- | --- |
| 0.00–0.03 | Establishing hold | Closed folio, complete title, 3D Globe with active global connection arcs |
| 0.03–0.18 | Opening copy exits | Small upward fade and blur; 3D camera glides toward Canadian gateway coordinates |
| 0.15–0.25 | Folio opens | Left/right leaves split; near world scales faster than sky; 3D globe settles |
| 0.22–0.27 | Visit panel enters | Short vertical settle into negative space; 3D tilt activated on glass cards |
| 0.27–0.38 | Visit hold | Background focus and brightness support the panel; flight routes pulse |
| 0.38–0.46 | Visit exits | Panel lifts out; 3D globe translates across camera view |
| 0.46–0.50 | Clean panorama | World returns to focus with no narrative overlay; 3D particle nebula shifts |
| 0.50–0.58 | Trade panel enters | Left-side panel settles; bilateral trade commodity cards visible |
| 0.58–0.69 | Trade hold | Restrained blur/tint holds attention on trade pillars |
| 0.69–0.74 | Trade exits | Route and panel clear; 3D globe scales into deep ambient perspective |
| 0.75–0.93 | Itinerary enters | 3D coverflow catalog rises with step badges and specular glare |
| 0.91–0.98 | Controls appear | Rail controls and final state settle |
| 0.98–1.00 | Interactive hold | Scroll timeline stops moving; interactive coverflow rail and customizer drawer active |

## Retiming

All boundaries live in the `beats` object in `src/scripts/cinematic.ts`. Rendering uses `smoothstep` and `segmentInOut`; there are no duration values scattered through CSS.

The visual playhead eases toward scroll only for standard-motion users. Three.js camera position and rotation interpolate synchronously with the playhead. Pointer movement is smoothed separately and drives both 3D WebGL parallax and card specular glare. Reduced-motion users receive a clean static layout without 3D animation strain.

## Z-index bands

- 0–9: photographic world, 3D WebGL canvas layer, and aurora glow
- 10–19: folio, shade, grain, route, and stage frame
- 20–29: intro, narrative panels, and catalog
- 30–39: persistent header, controls, and waypoint HUD scrubber
- 90–99: desktop cursor glow follower
- 200+: interactive VIP delegation builder modal & drawer
