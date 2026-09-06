# Kip's Journal Art Direction

This document is the visual and export source of truth for Cosmoid journal artwork. The journal should feel like Kip recorded a living creature in the field, not like the game reused a battle asset on parchment.

## Narrative purpose

Each page should reveal something Kip could learn only by quietly observing the species outside combat. Favor candid, private, ecological, relational, playful, or vulnerable behavior over a move demonstration, gameplay tutorial, formal portrait, or character sheet.

Before choosing a scene, ask:

> What could Kip learn here that the battle assets do not already show?

Strong subjects include grooming, resting, nesting, molting, courtship, foraging, shelter building, problem-solving, caring, curiosity, embarrassment, social imitation, or the aftermath of a signature action. An ability may leave evidence in the scene, but it should not automatically be the main action.

Reject a direction when its main action duplicates an attack or tower-defense role, its viewing angle and line of action substantially repeat a shipped sprite, or it demonstrates capability without revealing temperament, needs, relationships, lifecycle, or ecology.

## Reference hierarchy

1. `apps/web/public/UI/Journal/harlequill_journal.png` is the primary reference for composition, medium, parchment, and finish.
2. Approved recent journal pages may be used as secondary references for a behavior or treatment they handle especially well. They do not supersede Harlequill or this document.
3. The target Cosmoid's approved concept image, icon, and shipped directional sprites are species-identity references only. Preserve the recognizable anatomy, proportions, markings, palette, materials, and signature props, but never copy a battle sprite's exact pose.
4. The target species record under `docs/cosmoids` is the source of truth for its character contradiction, behavior, anatomy lock, habitat, ecology, and unresolved decisions.

## Observational composition

- Make one full-body observational sketch the clear focal point and keep it readable when displayed at approximately 256 px.
- Use a viewpoint, silhouette, line of action, limb arrangement, and emotional state that materially differ from every shipped battle sprite.
- Keep important anatomy inside a generous safe margin.
- Supporting studies or additional creatures are optional. They must clarify a distinctive feature, track, tool, relationship, or behavior and remain visibly secondary to the focal subject.
- Keep the habitat sparse and understated. Include only enough plants, stones, ground texture, water, or environmental evidence to establish where the observation occurred.
- Avoid rigid scientific-diagram layouts, cinematic storybook staging, and busy environmental scenes.

## Drawing and paint language

- Build the image with sepia or dark-brown ink using varied line weight, broken exploratory contours, loose corrections, faint graphite underdrawing, and light irregular cross-hatching.
- Let ink and graphite carry the form. Watercolor is subordinate and should never turn the creature into a polished cel-painted game render.
- Use restrained, translucent, uneven washes with plenty of parchment showing through the creature, especially within large areas such as scales, fins, fur, shells, or wings.
- Keep species colors recognizable while muting their saturation and density. Prefer weathered, diluted versions of the canonical palette over bright cyan, violet, magenta, yellow, or other uniformly filled colors.
- Reserve the clearest color accents for the focal creature or its most important feature. Supporting studies and background creatures should be paler, looser, and less completely painted.
- Preserve readable pattern differences through value, placement, and selective accents rather than increasing overall saturation.
- Keep the result polished and readable as 2D game art, but not pixel art, photorealism, opaque digital painting, or a fully rendered cinematic scene.

## Parchment treatment

- Use a clean, stylized parchment page with a softly irregular hand-inked boundary, gently rounded or wavy corners, subtle painted mottling, and flat edge shading.
- Avoid photorealistic torn fibers, burnt edges, curled corners, holes, deep creases, visible paper thickness, and realistic cast shadows.
- Do not generate labels, letters, fake handwriting, gibberish notes, UI frames, logos, signatures, or watermarks. Readable journal text belongs in the game UI.

## Identity requirements

The page must remain unmistakably the documented species. Preserve its locked silhouette, proportions, face, appendage count and placement, markings, palette relationships, materials, and signature anatomy. A candid pose may compress or overlap forms naturally, but it must not invent limbs, merge creatures, replace biological features with props, or convert soft anatomy into armor, tiles, clothing, or tools.

## Export and integration

- Export a square PNG at no less than 1024x1024.
- Save the approved final artwork as `apps/web/public/UI/Journal/<species>_journal.png`.
- Set that species' optional `journalImg` field to `/UI/Journal/<species>_journal.png`.
- Leave the species icon and directional battle sprites unchanged.
- Keep an existing accepted journal file in place until the user approves its replacement.

## Acceptance check

A finished candidate passes only when:

- the species identity and locked anatomy are intact;
- the pose and emotional state are materially different from all battle sprites;
- the page completes “Kip learned that this species…” with a meaningful non-combat observation;
- the behavior feels candid rather than staged;
- ink and graphite dominate restrained watercolor, with generous exposed parchment;
- the focal subject reads at journal size and supporting material remains secondary;
- there is no generated text, watermark, anatomy error, or unintended duplicate creature; and
- the export is a square PNG at least 1024x1024.
