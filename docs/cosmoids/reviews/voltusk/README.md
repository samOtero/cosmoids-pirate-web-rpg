# Voltusk production-art review

> September 6, 2026. All four normal-form previews approved by the user before transparent-background work. Final transparent PNGs, creature registration, directional visuals, and the dated manifest are complete. Level 6 encounter implementation remains pending.

[Approved concept and identity checklist](../../voltusk.md)

## Review Set

| Asset | Preview | Source dimensions | Approval |
| --- | --- | --- | --- |
| Head icon | [Icon preview](voltusk-icon-review-v2.png) | 1254 x 1254 | Approved |
| Left-facing battle sprite | [Left preview](voltusk-left-review-v1.png) | 1310 x 1201 | Approved |
| Front/down-facing battle sprite | [Down preview](voltusk-down-review-v1.png) | 1254 x 1254 | Approved |
| Rear/up-facing battle sprite | [Up preview](voltusk-up-review-v2.png) | 1136 x 1384 | Approved |

These are full-resolution review images with opaque pale-gray backgrounds, not final shipped asset dimensions. Right-facing art will reuse the approved left-facing sprite with a horizontal flip. Cursed-phase visuals remain separate design work.

## Icon

![Voltusk head icon preview](voltusk-icon-review-v2.png)

## Left

![Voltusk left-facing preview](voltusk-left-review-v1.png)

## Front / Down

![Voltusk front-facing preview](voltusk-down-review-v1.png)

## Rear / Up

![Voltusk rear-facing preview](voltusk-up-review-v2.png)

## Generation Record and Prompt Summary

Generated with the built-in image-generation tool. The approved `voltusk-concept.png` was the identity authority; the Fueguana icon and v3 directional sprites supplied framing, orientation, and smooth painted finish references only.

- **Icon:** Straight-on golden-yellow head and face, stern amber eyes, cream muzzle, silver brow and whisker fans. Exclude shoulders, chest, and flippers. Revision 2 follows the user's request for a soft fade at the bottom of both tusks. Preserve that fade through the later transparent export; it must become fading tusk opacity rather than a pale background fringe.
- **Left:** Rotate the approved walrus toward screen-left, preserving the tall heavy body, long silver tusks, front-flipper bands, visible portions of both chest chevrons, and dorsal plate line. Keep near/far flipper placement coherent.
- **Down:** Direct front view with both chest chevrons, two complete tusks, two planted banded foreflippers, and the rear pair partly visible behind the body. Dorsal plates remain behind the shoulders.
- **Up:** Direct rear view with no face or chest chevrons visible. Revision 2 follows the user's request to make dorsal coverage consistent with the front and side sprites: broad overlapping transverse silver plates wrap across most of the back, leaving narrow yellow side margins and the low rump exposed. Preserve four flippers and the tiny vestigial tail at the low rump. Whisker tips may project beyond the head edges; no tusks originate from the back.
- **Shared finish:** Clean antialiased outlines, controlled painted/cel shading, readable yellow/black/silver color regions, simplified surface texture, full sprite silhouettes and plain opaque backgrounds. No uniforms, nets, extra creatures, labels, or scenery.

## Final Exports

![Final assets and game-scale inspection](voltusk-final-assets.png)

| Asset | Transparent PNG | Dimensions |
| --- | --- | --- |
| Icon | [voltusk_icon.png](../../../../apps/web/public/UI/Icons/voltusk_icon.png) | 160 x 160 |
| Left / mirrored right | [voltusk_left.png](../../../../apps/web/public/battles/cosmoids/voltusk_left.png) | 340 x 311 |
| Front / down | [voltusk_down.png](../../../../apps/web/public/battles/cosmoids/voltusk_down.png) | 300 x 300 |
| Rear / up | [voltusk_up.png](../../../../apps/web/public/battles/cosmoids/voltusk_up.png) | 246 x 300 |

The built-in image tool prepared each approved preview for extraction with the prompt direction: replace only the pale background with a uniform magenta key; preserve identity, pose, palette, markings, framing, and shading. For the icon, composite the faded tusk tips into the key so extraction preserves fading opacity. Direct-transparency attempts with a painted checkerboard or colored fringe were rejected. The imagegen chroma-key helper extracted actual alpha, followed by proportional Lanczos resizing. No API/CLI image-generation fallback was used.

## Inspection and Integration

The approved previews and alpha exports were visually inspected for concept identity, markings, view direction, crop, and limb placement. The icon is head-only with the requested soft tusk fade. Full-body views keep tusk and flipper tips inside the canvas. The revised rear plates span the back consistently with the metal visible in the front and side references; the hind flippers and vestigial tail remain at the rump, chest markings stay hidden, and bands remain on the foreflippers.

The first icon and rear previews are retained as revision history. The left and front previews remain at revision 1.

The source review copies were verified against their generated source hashes. Each final PNG has real RGBA transparency, four fully transparent corners, non-empty opaque subject coverage, and partially transparent antialiased edges. The icon retains the tusk fade as alpha. Exports were inspected against light and dark backgrounds and at their configured game display scale (0.52 for battle sprites); no visible chroma fringe remains. The final contact sheet shows the exports and their reduced game-scale appearance; it is an inspection composite, not an in-engine screenshot.

The species and directional configurations are registered, with Body Rush and Spark reused from the existing attack catalog. The [manifest](../../../../apps/web/src/content/creatures/voltusk.json) records actual dimensions and planned Level 6 boss placement. No Level 5 wave introduction was substituted. Level 6 remains a locked placeholder; encounter mechanics, cursed-phase visuals, capture availability, and final balance require further design.

Validation on September 6, 2026: all 10 creature manifests validated, all 21 creature integration tests and 10 focused attack tests passed, and TypeScript checking passed. Image checks confirmed manifest dimensions and real alpha. The existing Spark test now checks that Spark remains separate from the Razcall family learnsets, allowing Voltusk to use it without changing attack behavior.
