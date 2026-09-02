---
name: create-cosmoid-journal-art
description: Develop, generate, revise, and integrate Kip-style naturalist journal artwork for Cosmoids. Use when the user wants a new or replacement creature journal image, wants to compare journal-scene ideas, or wants to fill missing journal art. Do not use for creature concept sheets, icons, dialogue portraits, or directional battle sprites.
---

# Create Cosmoid Journal Art

Create journal pages that reveal what a Cosmoid is like outside combat. The battle assets answer what the species looks like; the journal should reveal something Kip learned by quietly observing it.

## Establish context

1. Work in the `cosmoids_web` repository.
2. Read `docs/art/JOURNAL_ART_DIRECTION.md` completely. Treat it as the visual and export source of truth for every journal-art task.
3. Read the target species record under `docs/cosmoids` when one exists. Identify its character contradiction, signature behavior, anatomy lock, habitat, ecology, and unresolved decisions.
4. Inspect the approved concept image, icon, and all shipped directional sprites with `view_image`. They are identity references only.
5. Inspect the journal references required by the hierarchy in `docs/art/JOURNAL_ART_DIRECTION.md`, including `public/UI/Journal/palmit_journal.png`.
6. For a roster request, audit creature registration, `journalImg` fields, and files under `public/UI/Journal`, then work through missing species one at a time.

If a species record leaves habitat or ecology unresolved, use brief authoritative natural-history research when it would materially improve the ideas. Present the results as proposals for the user to choose, not established canon.

## Discover the journal moment

Do not treat the journal as a move demonstration, gameplay tutorial, or alternate battle illustration. Before proposing a scene, ask:

> What could Kip learn here that the battle assets do not already show?

Prefer candid, private, ecological, relational, playful, or vulnerable behavior: grooming, resting, nesting, molting, courtship, foraging, shelter building, problem-solving, caring, curiosity, embarrassment, or an aftermath between signature actions. A species ability may leave evidence in the scene, but it should not automatically be the main action.

Reject a direction before presenting it when:

- its main action duplicates an attack, tower-defense role, or signature combat animation;
- its line of action, viewing angle, limb arrangement, and emotional state substantially repeat a shipped sprite;
- changing only the backdrop would turn it into existing battle art;
- it shows what the creature can do but reveals nothing about its temperament, needs, relationships, lifecycle, or ecology.

## Present three descriptions before generation

For each species, provide exactly three meaningfully different journal-scene descriptions and do not call an image generator yet. Each description should make clear:

- the observed behavior and habitat moment;
- the camera angle and full-body pose;
- how the pose materially differs from the shipped battle sprites;
- the new or normally unseen side of the species it reveals;
- any optional secondary feature study, kept subordinate and unlabeled.

Vary the underlying behavior, emotional register, and silhouette—not merely time of day, scenery, or props. Invite the user to choose one option or request a blend.

## Generate the selected candidate

After the user selects a direction, use the installed `imagegen` skill and its built-in workflow. Announce that use before generating and follow its project-bound asset rules.

Label reference roles explicitly:

- Follow the reference hierarchy in `docs/art/JOURNAL_ART_DIRECTION.md`.
- Identify style, secondary finish, and species-identity references by role in the generation prompt.

Translate the selected scene and the complete visual constraints from `docs/art/JOURNAL_ART_DIRECTION.md` into the prompt. Explicitly forbid copying battle poses and preserve the documented species identity.

Treat the first output as a candidate rather than an automatically approved replacement.

## Inspect the candidate

Inspect every candidate before presenting it:

1. **Identity:** It is unmistakably the documented species and preserves locked anatomy.
2. **Pose contrast:** Compare it directly with the left, up, and down assets. Its viewpoint, silhouette, line of action, limb arrangement, and emotional state are materially different.
3. **Character discovery:** Complete the sentence, “Kip learned that this species…” with something the battle assets do not communicate. If the answer is weak, reject the candidate.
4. **Observation:** The creature is behaving naturally rather than posing for combat or a character sheet.
5. **Visual direction:** It passes the drawing, color, parchment, composition, and identity requirements in `docs/art/JOURNAL_ART_DIRECTION.md`.
6. **Cleanliness:** It contains no generated text, watermark, anatomy error, or unintended duplicate creature.
7. **Export:** It passes the journal document's format and size requirements.

If a candidate materially fails, make a targeted regeneration before presenting it. Show the passing candidate and ask for visual approval before moving to the next species.

When revising an already integrated page, preserve the current accepted file until the user approves the replacement candidate.

## Integrate only after approval

After approval:

1. Save or replace the accepted image at `public/UI/Journal/<species>_journal.png`.
2. Set the species' optional `journalImg` field to `/UI/Journal/<species>_journal.png`.
3. Leave the icon and directional battle sprites unchanged.
4. Verify the PNG dimensions and path, run the creature-manifest validator, and run relevant focused tests when dependencies are available.
5. Report the saved path, final prompt summary, generation mode, and validation results.

For multi-species requests, finish this complete selection, candidate, approval, and integration loop before presenting the next species' three directions.
