# Cinematic timeline

The desktop scroll section is 4,800 CSS pixels. It shortens to 4,200 pixels below 900px and 3,700 pixels below 620px. The sticky stage always derives progress from its own local travel:

`p = clamp((scrollY - sectionTop) / (sectionHeight - viewportHeight), 0, 1)`

| Progress | Beat | Motion |
| --- | --- | --- |
| 0.00–0.03 | Establishing hold | Closed folio, complete title, stable car and skyline |
| 0.03–0.18 | Opening copy exits | Small upward fade and blur; world begins its push |
| 0.15–0.25 | Folio opens | Left/right leaves split; near world scales faster than sky |
| 0.22–0.27 | Visit panel enters | Short vertical settle into the revealed negative space |
| 0.27–0.35 | Visit hold | Background focus and brightness support the panel |
| 0.35–0.44 | Visit exits | Panel lifts out; folio finishes clearing |
| 0.44–0.48 | Clean panorama | World returns to focus with no narrative overlay |
| 0.48–0.58 | Trade panel enters | Left-side panel settles; route line appears |
| 0.58–0.69 | Trade hold | Restrained blur/tint holds attention on copy |
| 0.69–0.74 | Trade exits | Route and panel clear; panorama refocuses |
| 0.75–0.93 | Itinerary enters | Screen-space catalog rises over the same world |
| 0.91–0.98 | Controls appear | Rail controls and final state settle |
| 0.98–1.00 | Interactive hold | Scroll timeline stops moving; rail remains fully usable |

## Retiming

All boundaries live in the `beats` object in `src/scripts/cinematic.ts`. Rendering uses `smoothstep`, `rangeProgress`, and `segmentInOut`; there are no duration values scattered through CSS.

The visual playhead eases toward scroll only for standard-motion users. Pointer movement is smoothed separately and stops requesting frames after convergence. Reduced-motion users receive a static hero followed by normal-flow panels and the same interactive rail.

## Z-index bands

- 0–9: photographic world and depth treatments
- 10–19: folio, shade, grain, route, and stage frame
- 20–29: intro, narrative panels, and catalog
- 30–39: persistent header and controls
- 40+: reserved for future dialogs or overlays
