# Rollo dialogue portrait expressions

Three source-only dialogue portraits created with the built-in image generation tool from Rollo's approved [character concept](../../art-source/characters/concepts/storyteller/rollo.png). The portrait rules are in [AGENTS.md](../../AGENTS.md#human-dialogue-portrait-direction).

The neutral portrait was generated and inspected first; both emotion variants derive directly from that inspected pose. Each final master is a transparent 650×650, four-channel sRGB PNG. Native generated artwork was exported with Lanczos3 resampling and lossless PNG compression, preserving alpha. These files are the canonical project masters.

| Neutral | Boastful | Nervous |
| --- | --- | --- |
| ![Rollo neutral](C:/Projects/2026/cosmoids_web/art-source/characters/dialogue/rollo/rollo_neutral_v1.png) | ![Rollo boastful](C:/Projects/2026/cosmoids_web/art-source/characters/dialogue/rollo/rollo_boastful_v1.png) | ![Rollo nervous](C:/Projects/2026/cosmoids_web/art-source/characters/dialogue/rollo/rollo_nervous_v1.png) |

## Inspection record

| Check | Neutral | Boastful | Nervous |
| --- | --- | --- | --- |
| Head and torso alignment | Both turn three-quarter screen-right | Same turn retained | Same turn retained |
| Near and far shoulders | Screen-left shoulder larger; screen-right recedes | Relationship retained | Relationship retained |
| Sternum / costume centerline | Shirt opening right of canvas center | Placement retained | Placement retained |
| Chin and eyeline | Level chin; forward conversational gaze | Level gaze; confident eyelids | Level gaze; widened worried eyes |
| Crop | Complete hair, face and collar; torso exits bottom | Same framing | Same framing |
| Identity | Slick side-part, brown skin, rounded elongated nose, green waistcoat | Identity retained | Identity retained |
| Background alpha | RGBA; alpha ranges 0–255; not opaque | RGBA; alpha ranges 0–255; not opaque | RGBA; alpha ranges 0–255; not opaque |
| Expression | Small friendly closed smile | Raised eyebrow and broad toothy grin | Raised inner brows, tense mouth and small sweat bead |

## Publication status

This finished expression set is not yet referenced by a story scene. Masters live in `art-source/characters/dialogue/rollo/`, under the required dialogue source directory. The nested folder keeps unused portraits outside the optimizer's flat source-file scan. When scenes reference them, publish only the selected portraits through the story-portrait optimizer at quality 88 with alpha quality 100; retain 650×650 dimensions. No runtime assets or story sequences were changed by this portrait request.
