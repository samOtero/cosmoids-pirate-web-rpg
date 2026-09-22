# Cosmoids Web Project Guidance

## Workspace layout

- This repository uses pnpm workspaces. The Next.js game lives in `apps/web`; future applications belong under `apps/` and shared packages under `packages/`.
- Run `pnpm install` and the root forwarding scripts (`pnpm dev`, `pnpm verify:quick`, `pnpm build`) from the repository root. Run direct app tools with `pnpm --filter @cosmoids/web exec <tool>` so they resolve app-relative paths correctly.
- Game filesystem paths are under `apps/web/src` and `apps/web/public`. Browser asset URLs remain rooted at `/` (for example, `/UI/Icons/...`). Treat older external skill references to root `src/` or `public/` as paths under `apps/web`.
- Keep the workspace lockfile, Git hooks, narrative documents, `docs/`, and repository skills at the root. Local web environment variables belong in `apps/web/.env.local`.

## Art source and deployment workflow

- Read `art-source/README.md` before adding, replacing, moving, or generating raster artwork intended for the app.
- Store the full-quality editable master under the appropriate `art-source/` subdirectory. `art-source/` is excluded from Vercel and must never be referenced by application code, CSS, manifests, tests, or runtime configuration.
- Publish only assets currently referenced by the app to `apps/web/public`. Keep drafts, obsolete variants, experiments, and other unused art source-only.
- Check for an existing canonical master before adding a file. Do not keep duplicate source masters under different names or in both `art-source/` and `apps/web/public`.
- Generate runtime derivatives through `apps/web/scripts/assets/optimize-art-assets.mjs` by running the matching root `pnpm assets:optimize:<category>` command documented in `art-source/README.md`. Add a clearly named optimizer category and root forwarding script when a new asset class needs different export settings.
- Prefer transparency-preserving WebP for runtime raster art. Use a runtime PNG only when a documented platform or technical constraint requires it; source masters may remain PNG or another appropriate lossless/editable format.
- Preserve exact source dimensions for Pixi-dependent assets such as directional sprites, level backgrounds, attacks, units, structures, and configured battle characters. Do not resize an integrated gameplay texture unless its dependent geometry, manifests, and tests are intentionally updated together.
- Reuse the established quality, resize, and alpha settings for the asset category. Do not silently lower export quality merely to reduce deployment size.
- When a runtime filename or format changes, update every application, manifest, test, development-tool, CSS, and documentation reference. Do not leave stale asset URLs or compatibility copies in `public`.
- Inspect transparent runtime derivatives directly and composited over a representative game background at the configured gameplay scale. Check edges, alpha, crop, dimensions, and visual quality before removing a previous runtime file.
- Before deleting a runtime original, confirm that its full-quality master exists under `art-source/`, the derivative was generated from it, required dimensions and alpha were preserved, and repository search finds no remaining reference to the old path.
- After asset changes, run the relevant optimizer, `pnpm verify:quick`, any focused validator or lint command for the affected system, and `pnpm build`. Inspect `apps/web/out` to confirm source masters and replaced runtime originals are absent.
- Keep `.vercelignore` aligned with this model: source art, documentation, repository skills, temporary generation output, and other development-only material must remain excluded from deployment.

## Creature art direction

- Render new and updated directional Cosmoid battle assets as smooth painted 2D game illustrations, not pixel art. Use `apps/web/public/battles/cosmoids/fueguana_left_1_v3.webp`, `fueguana_up_1_v3.webp`, and `fueguana_down_1_v3.webp` as the primary finish references.
- Use clean antialiased outlines and controlled painted/cel shading. Avoid visible pixel blocks, dithering, jagged stair-step edges, and nearest-neighbor styling.
- Creature icons should be tight head-and-face portraits. Show only a minimal amount of neck when needed; do not include shoulders, chest, forelegs, or torso. Follow the framing of the existing Fueguana, Monkeg, Palmit, and Senticle icons rather than Mopup.
- Keep full-quality creature masters as transparent PNGs under `art-source/` when PNG is the appropriate editable source format. Ship transparency-preserving WebP derivatives and preserve the dimensions declared by their creature manifest unless the integration is intentionally updated.

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
- Export full-quality human dialogue portrait masters as transparent 650x650 RGBA PNGs under `art-source/characters/dialogue`, then publish transparency-preserving WebP derivatives through the story-portrait optimizer unless an existing integration intentionally requires different dimensions or format.

## Story and dialogue direction

- Treat `STORY_AND_THEMES.md` as the source of truth for the premise, tone, lore, factions, themes, human character art direction, and dialogue-writing rules.
- Keep every ordinary story introduction or story part, including drafts written only in chat, within five to ten player-advanced dialogue panels or sequence entries. Five is a concise target for a simple beat; ten is the enforced ordinary maximum. Narration and action text count when the player must advance them.
- Count the panels before presenting or implementing the draft. Do not evade the range by splitting one beat into several short panels; move secondary explanation, jokes, and worldbuilding into gameplay or a later scene.
- Exceed ten panels only for a major turning point that genuinely requires it, and explicitly identify the exception when proposing it.
- Preserve character motivation, flaws, and conflict while keeping individual dialogue beats concise and appropriate for an all-ages adventure.
