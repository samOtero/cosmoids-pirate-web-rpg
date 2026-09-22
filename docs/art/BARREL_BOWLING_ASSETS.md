# Barrel Bowling attack assets

Generated with the built-in imagegen tool using the imagegen skill. No API/CLI fallback or local background editing was used.

## Shipped sprites

- `apps/web/public/battles/attacks/barrel_bowling_horizontal.webp`: end-on rolling view, 1254 × 1254 transparent WebP.
- `apps/web/public/battles/attacks/barrel_bowling_vertical.webp`: broadside rolling view, 1536 × 1024 transparent WebP. The initial version had an opaque checkerboard and was rejected; the final built-in edit has transparent edges.

The renderer selects views based on the barrel's direction, spins the horizontal view, and uses a subtle broadside rolling motion for vertical movement. Cosmetic wake and terminal splash are drawn in Pixi.

## Final prompt set

### Horizontal

Use case: stylized-concept. Asset type: transparent PNG game projectile sprite for Cosmoids tower defense. Create ONE sealed water barrel for rolling LEFT/RIGHT across the screen, viewed predominantly END-ON from the game's slightly elevated three-quarter battle camera: a large round wooden end face with a little barrel depth visible above/right. Reference image is STYLE AND MATERIAL reference only: match Macask's warm brown wood staves, sturdy blue-gray metal hoops, smooth painted 2D game illustration, clean antialiased dark outlines, restrained cel shading. Do not include the creature, sacks, straps, rope, tap, protruding handles, or background. Closed round wooden lid, subtle wet blue sheen in hoop highlights, simple readable wood grain. Center isolated barrel, entire silhouette visible with 12% padding. Genuine transparent background, no ground shadow, no water splash, no text, no frame, no pixel art. This is a production sprite that will rotate to depict rolling; keep lighting soft and nondirectional, no fixed motion lines. Square canvas.

### Vertical design

Use case: stylized-concept. Asset type: transparent PNG directional game projectile sprite. Reference image is the approved sealed water-barrel design to preserve: warm golden brown wood, blue-gray metal hoops and rivets, smooth painted 2D antialiased game finish. Generate ONE matching barrel viewed BROADSIDE for rolling UP/DOWN on a tower-defense path. The barrel lies on its curved side, its cylinder axis runs exactly left-to-right across the canvas; the long wooden staves run horizontally and the two metal hoops wrap vertically near its left and right ends. See the broad curved wooden body from a slightly elevated game camera, not a large circular end face. A little end-cap depth is acceptable, but the body must dominate. Keep the same materials, thickness and simple closed design. Center the full isolated barrel with 12% margin. Genuine transparent background and preserved alpha. No ground shadow, no splash, no spigot, no sacks, rope, creature, text, watermark, motion lines, or pixel art. Soft nondirectional painted/cel shading. Square canvas.

### Vertical transparency correction

Use case: background-extraction. Edit target: supplied broadside water barrel. Remove ONLY the entire white and gray checkerboard background and replace it with genuine alpha transparency. The checkerboard is unwanted painted background, not part of the object. Preserve exactly the barrel's existing painted pixels, shape, materials, colors, framing, scale, and horizontal cylinder-axis orientation. Export a transparent RGBA PNG cutout with zero-alpha pixels outside the barrel. No new background, no checker pattern, no solid white, no shadow, no redraw, no additional objects. The barrel is the ONLY opaque subject.
