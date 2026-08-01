# Cosmoids Web Project Guidance

## Creature art direction

- Render new and updated directional Cosmoid battle assets as smooth painted 2D game illustrations, not pixel art. Use `public/battles/cosmoids/fueguana_left_1_v3.png`, `fueguana_up_1_v3.png`, and `fueguana_down_1_v3.png` as the primary finish references.
- Use clean antialiased outlines and controlled painted/cel shading. Avoid visible pixel blocks, dithering, jagged stair-step edges, and nearest-neighbor styling.
- Creature icons should be tight head-and-face portraits. Show only a minimal amount of neck when needed; do not include shoulders, chest, forelegs, or torso. Follow the framing of the existing Fueguana, Monkeg, Palmit, and Senticle icons rather than Mopup.
- Keep shipped creature assets as transparent PNGs and preserve the dimensions declared by their creature manifest unless the integration is intentionally updated.

## Story and dialogue direction

- Treat `STORY_AND_THEMES.md` as the source of truth for the premise, tone, lore, factions, themes, human character art direction, and dialogue-writing rules.
- Keep ordinary story parts no longer than Part 1 unless a major turning point genuinely requires additional dialogue.
- Preserve character motivation, flaws, and conflict while keeping individual dialogue beats concise and appropriate for an all-ages adventure.
