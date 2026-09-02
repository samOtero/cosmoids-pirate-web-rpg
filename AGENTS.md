# Cosmoids Web Project Guidance

## Creature art direction

- Render new and updated directional Cosmoid battle assets as smooth painted 2D game illustrations, not pixel art. Use `public/battles/cosmoids/fueguana_left_1_v3.png`, `fueguana_up_1_v3.png`, and `fueguana_down_1_v3.png` as the primary finish references.
- Use clean antialiased outlines and controlled painted/cel shading. Avoid visible pixel blocks, dithering, jagged stair-step edges, and nearest-neighbor styling.
- Creature icons should be tight head-and-face portraits. Show only a minimal amount of neck when needed; do not include shoulders, chest, forelegs, or torso. Follow the framing of the existing Fueguana, Monkeg, Palmit, and Senticle icons rather than Mopup.
- Keep shipped creature assets as transparent PNGs and preserve the dimensions declared by their creature manifest unless the integration is intentionally updated.

## Kip's journal sketch direction

- For any new, replacement, or missing Cosmoid journal image, use `.agents/skills/create-cosmoid-journal-art/SKILL.md` for the complete concept, approval, generation, inspection, and integration workflow.
- Read `docs/art/JOURNAL_ART_DIRECTION.md` completely before proposing or generating journal art. Treat it as the visual and export source of truth.

## Human dialogue portrait direction

- Treat every request for a human dialogue portrait or portrait expression set as requiring this section's generation and acceptance checks, even when the user does not repeat them.
- Default to a three-quarter portrait view, with the head and torso facing the same direction.
- For screen-right poses, place the sternum or costume centerline right of the canvas center. The screen-left shoulder should appear nearer and larger, while the screen-right shoulder should appear smaller and recede.
- Do not accept a portrait where the face turns three-quarter over a frontal or oppositely turned torso. The nose, chin, sternum or costume centerline, and shoulder-depth perspective must all describe the same turn.
- Keep the character's chin level and eyes on a neutral, forward conversational eyeline. Do not have characters look downward unless the scene explicitly provides a reason.
- Use head angle, facial expression, eyelids, eyebrows, and posture to communicate whatever emotion or attitude the scene requires, including confidence, haughtiness, fear, anger, amusement, or defeat.
- Use Caleb's existing dialogue portraits as the primary reference for framing, three-quarter orientation, and conversational eyeline.
- For a new character expression set, generate and inspect one neutral pose-lock portrait before creating variants. Reject and correct any head/torso mismatch at this stage; do not use a failed pose as the identity reference for later expressions.
- Derive expression variants from the approved neutral pose-lock. Preserve the head direction, torso direction, near/far shoulder relationship, costume centerline, crop, scale, and eyeline; change only the expression and the smallest natural posture adjustment needed for that emotion.
- Before accepting each portrait, explicitly inspect the head/torso alignment, near/far shoulder sizes, sternum placement, level chin, forward eyeline, safe crop, identity consistency, and background alpha. Regenerate a portrait that fails any of these checks before producing or accepting the rest of the set.
- Export human dialogue portraits as transparent 650x650 RGBA PNGs unless an existing asset integration intentionally requires different dimensions.

## Story and dialogue direction

- Treat `STORY_AND_THEMES.md` as the source of truth for the premise, tone, lore, factions, themes, human character art direction, and dialogue-writing rules.
- Keep every ordinary story introduction or story part, including drafts written only in chat, within five to ten player-advanced dialogue panels or sequence entries. Five is a concise target for a simple beat; ten is the enforced ordinary maximum. Narration and action text count when the player must advance them.
- Count the panels before presenting or implementing the draft. Do not evade the range by splitting one beat into several short panels; move secondary explanation, jokes, and worldbuilding into gameplay or a later scene.
- Exceed ten panels only for a major turning point that genuinely requires it, and explicitly identify the exception when proposing it.
- Preserve character motivation, flaws, and conflict while keeping individual dialogue beats concise and appropriate for an all-ages adventure.
