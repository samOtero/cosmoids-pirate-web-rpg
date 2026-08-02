# Cosmoids Web Project Guidance

## Creature art direction

- Render new and updated directional Cosmoid battle assets as smooth painted 2D game illustrations, not pixel art. Use `public/battles/cosmoids/fueguana_left_1_v3.png`, `fueguana_up_1_v3.png`, and `fueguana_down_1_v3.png` as the primary finish references.
- Use clean antialiased outlines and controlled painted/cel shading. Avoid visible pixel blocks, dithering, jagged stair-step edges, and nearest-neighbor styling.
- Creature icons should be tight head-and-face portraits. Show only a minimal amount of neck when needed; do not include shoulders, chest, forelegs, or torso. Follow the framing of the existing Fueguana, Monkeg, Palmit, and Senticle icons rather than Mopup.
- Keep shipped creature assets as transparent PNGs and preserve the dimensions declared by their creature manifest unless the integration is intentionally updated.

## Human dialogue portrait direction

- Default to a three-quarter portrait view, with the head and torso facing the same direction.
- For screen-right poses, place the sternum or costume centerline right of the canvas center. The screen-left shoulder should appear nearer and larger, while the screen-right shoulder should appear smaller and recede.
- Keep the character's chin level and eyes on a neutral, forward conversational eyeline. Do not have characters look downward unless the scene explicitly provides a reason.
- Use head angle, facial expression, eyelids, eyebrows, and posture to communicate whatever emotion or attitude the scene requires, including confidence, haughtiness, fear, anger, amusement, or defeat.
- Use Caleb's existing dialogue portraits as the primary reference for framing, three-quarter orientation, and conversational eyeline.
- Export human dialogue portraits as transparent 650x650 RGBA PNGs unless an existing asset integration intentionally requires different dimensions.

## Story and dialogue direction

- Treat `STORY_AND_THEMES.md` as the source of truth for the premise, tone, lore, factions, themes, human character art direction, and dialogue-writing rules.
- Keep ordinary story parts no longer than Part 1 unless a major turning point genuinely requires additional dialogue.
- Preserve character motivation, flaws, and conflict while keeping individual dialogue beats concise and appropriate for an all-ages adventure.
