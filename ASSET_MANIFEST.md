# Asset manifest

## Cinematic layer contract

All scene layers share a 16:9 camera, bottom/center anchors, cool blue-hour lighting, and a spruce/slate grade. The world groups render with 4–22% CSS overscan depending on viewport to prevent exposed edges.

| Band | Role | Production asset | Dimensions | Alpha | Anchor and depth |
| --- | --- | --- | --- | --- | --- |
| 00 | Background / sky plate | `public/assets/scene/toronto-panorama-{960,1440,1672}.webp` | 960×540, 1440×810, 1672×941 | No | Center at 54%; farthest layer; smallest scale and pointer travel |
| 10 | Distant landscape | Aligned full-plate rendering of the same responsive source | Responsive | No | Horizon near 48%; far depth; deliberately locked to the 00 camera |
| 20 | Midground environment | Lower 51% clipped rendering of the same responsive source | Responsive | CSS clip | Bottom-center; larger push-in and opposing pointer travel |
| 30 | Hero object | Executive car and leather folio within the 20 pass | In master plate | No | Bottom-center/right; stable subject anchor |
| 40 | Foreground-left occluder | CSS editorial folio leaf using `grain.webp` | Viewport-relative | No | Left edge; opens to −112% |
| 41 | Foreground-right occluder | CSS editorial folio leaf using `grain.webp` | Viewport-relative | No | Right edge; opens to +112% |
| 50 | Edge frame / overlays | CSS route, haze, shade, grain, and coordinate frame | Viewport-relative | Mixed | Screen-space; z-index 10–19 |
| — | Texture | `public/assets/scene/grain.webp` | 384×384 | Yes | Tiled overlay; legacy source optimized for web |
| — | Brand icon | `public/assets/brand/icon.png` | 42×42 | Yes | Header mark; copied from the supplied application icon |

The 00/10/20 passes intentionally share one source so their camera, perspective, light, and grade cannot drift. The 20 pass is CSS-clipped rather than an independently rotoscoped car plate. This is production-safe at the current restrained parallax amplitude; a future art-production pass could supply a truly isolated car/shoreline layer for stronger depth.

## Generated panorama

`toronto-panorama-*.webp` was generated with the built-in image-generation workflow, then optimized into responsive WebP variants.

Prompt summary: a text-free, ultra-wide Toronto waterfront at blue hour after rain, with an understated skyline and CN Tower, a dark spruce executive sedan and leather travel folio in the foreground, editorial negative space, coherent natural light, 15% safe bleed, and no people, brands, flags, UI, typography, watermark, neon, or fantasy treatment.

## Final itinerary assets

Each card crop is 900×675 RGB WebP, center anchored, lazy loaded, and used as supporting brand evidence rather than a cinematic depth layer.

| Asset | Source | Role |
| --- | --- | --- |
| `arrival.webp` | `airport.jpg` | Airport welcome |
| `accommodation.webp` | `hotels.webp` | Lodging |
| `meetings.webp` | `meetings.jpg` | Business meetings |
| `dining.webp` | `food.webp` | Hosted dining |
| `shopping.webp` | `shopping.jpg` | Leisure and shopping |
| `trade-mission.webp` | `industries-montreal.png` | Import/export and industry |
| `education.webp` | `education-toronto.png` | Delegation support |
| `travel.webp` | `passport.webp` | Travel coordination |

## Supplied source audit

The supplied legacy directory contained 22 public images plus the application icon. Every file was inspected for dimensions, alpha, visible bounds, and likely role.

| Source | Dimensions | Alpha / visible bounds | Classification |
| --- | ---: | --- | --- |
| `08_Hand Display Poster Mockup.jpg` | 2000×3000 | Opaque / full canvas | Unused brand mockup |
| `airport.jpg` | 3233×2349 | Opaque / full canvas | Itinerary source |
| `business-cards.jpg` | 4500×3375 | Opaque / full canvas | Unused brand mockup |
| `coffee.jpg` | 3600×3600 | Opaque / full canvas | Unused service source |
| `conclusion.jpg` | 4868×4167 | Opaque / full canvas | Unused service source |
| `education-toronto.png` | 2708×2800 | Opaque / full canvas | Itinerary source |
| `food.webp` | 1080×814 | RGBA / artwork reaches canvas edges | Itinerary source |
| `gift.jpg` | 3500×3500 | Opaque / full canvas | Unused service source |
| `hotel_tag.webp` | 364×557 | RGBA / artwork reaches canvas edges | Unused product source |
| `hotels.webp` | 1500×1013 | Opaque / full canvas | Itinerary source |
| `housing-toronto.jpg` | 2000×1500 | Opaque / full canvas | Unused delegation source |
| `industries-montreal.png` | 3000×2400 | Opaque / full canvas | Itinerary source |
| `logo.png` | 1613×1080 | Opaque / full canvas | Unused raster logo scene |
| `meetings.jpg` | 3000×3000 | Opaque / full canvas | Itinerary source |
| `mockup.webp` | 1500×1043 | Opaque / full canvas | Unused raster logo scene |
| `noise.webp` | 2049×2049 | RGBA / full visible bounds | Texture source |
| `og-image.jpg` | 1649×1080 | Opaque / full canvas | Unused duplicate hero source |
| `passport.webp` | 1080×756 | RGBA / artwork reaches canvas edges | Itinerary source |
| `shopping.jpg` | 2300×2300 | Opaque / full canvas | Itinerary source |
| `sim.jpg` | 2400×2400 | Opaque / full canvas | Unused service source |
| `splash.jpg` | 1649×1080 | Opaque / full canvas | Unused duplicate hero source |
| `water.jpg` | 4000×4000 | Opaque / full canvas | Unused service source |
| `icon.png` | 42×42 | RGBA / full visible bounds | Header and favicon |

## Production notes

There are no visible placeholders or missing assets in the shipped page. If stronger physical parallax is desired later, request separately rendered transparent shoreline/car and left/right foreground plates from the panorama master; the current source library does not contain those aligned layers.
