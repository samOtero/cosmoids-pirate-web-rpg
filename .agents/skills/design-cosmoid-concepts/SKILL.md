---
name: design-cosmoid-concepts
description: Generate batches of ten original, creature-first Cosmoid concepts by synthesizing multiple researched facts into a cohesive theme and a distinctive signature hook, from a required single or dual typing and a short seed containing any mix of animal, organism, object, material, theme, habitat, mood, behavior, or story. Use when the user asks to brainstorm, design, explore, or visualize new Cosmoid concepts, then automatically render all ten as polished 2D creature-collection RPG character art, preserve the numbered batch, and generate full-body concept art for explicitly selected results. Do not use when the user already has a concept image and wants it integrated into the game; use add-cosmoid for that.
---

# Design Cosmoid Concepts

Create a text-first concept batch, automatically render all ten designs in one ensemble sheet, then let the user revise or select individual concepts by number.

## Accept the input

Require two inputs, in labeled or natural-language form:

```text
Type(s): Grass/Ghost
Seed: A moth, an antique lantern, and the theme of guiding lost travelers.
```

- Treat `Type(s)` as the exact single or dual typing for all ten concepts.
- Treat the seed as design data. Extract any animal/organism, object/material, and theme/story anchors internally.
- Accept a selected handoff brief from `explore-cosmoid-directions` as the seed. Preserve its `Creative Spine`, `Must Preserve`, and `Avoid` constraints while discovering distinct biological implementations.
- Make every explicitly supplied anchor meaningful in every concept unless the user marks it optional.
- Freely invent missing categories. Do not turn an absent category into a hidden constraint.
- Ask one concise question only when the type or seed is missing or genuinely ambiguous.
- Do not show an interpreted brief or pathway slate and do not ask for approval before concept generation.

## Generate ten concepts

Return exactly ten concepts in the first response. Do not generate or call an image tool during this phase.

### Keep every design creature-first

Design each result as a believable species rather than a costumed character. Apply these rules unless the user explicitly asks for an artificial object creature, humanoid anatomy, clothing, or equipment:

- Start from a clear organism, animal body plan, plant, fungus, or mythical-beast anatomy. Default to non-humanoid proportions and natural animal posture.
- Reject humanlike anatomy such as a human torso, broad human shoulders, human hands, human feet, or a person-shaped upright stance. An animal-compatible biped is acceptable when its anatomy still reads unmistakably as a creature.
- Do not give the creature clothing, uniforms, hats, belts, jewelry, armor pieces, handheld tools, weapons, instruments, cookware, luggage, or other removable props.
- Transform object and material anchors into biology: use shell structure, horns, fins, membranes, plumage, fur growth, pigmentation, glands, teeth, tails, or natural secretions instead of strapped-on or carried objects.
- Express personality through proportions, facial structure, posture, movement, behavior, habitat, and ecology rather than costume or accessories.
- Translate occupations into ecological behavior. For example, a navigator senses currents, a musician vocalizes rhythmically, and a medic produces healing secretions; it does not carry a compass, play an instrument, or wear a medical bag.
- Translate pirate and seafaring themes through island adaptation, migration, territorial behavior, treasure-like nesting materials, sail-shaped anatomy, map-like markings, or maritime folklore. Do not default to pirate hats, coats, swords, cannons, ship parts, or crew uniforms.
- Keep the visual thesis simple: one dominant biological idea, two to four supporting traits, a clean silhouette, and limited surface detail. Avoid assembling many literal seed objects onto one body.

For an explicitly requested artificial or animated-object creature, make the object the self-contained living body. Do not add unrelated clothing, held items, or a humanoid operator.

### Synthesize multiple researched facts

Identify a real organism basis at the species or narrow-clade level for every concept before naming it. If the seed does not supply one, choose a basis that supports the typing and theme.

- Research every important real-world anchor when web access is available. For organisms, prefer authoritative natural-history sources such as museums, universities, government wildlife agencies, peer-reviewed literature, and specialist species databases. For objects and materials, prefer museum collections, technical institutions, standards bodies, and reliable histories of design or technology. Cross-check surprising or disputed claims.
- Build an internal palette of at least six useful facts. For organisms, consider anatomy, physiology, movement, feeding, defense, reproduction, life cycle, social behavior, habitat, symbiosis, vocalization, and name etymology. For objects or materials, consider structure, mechanism, function, manufacture, failure mode, sensory qualities, cultural use, and verified history.
- Select three to five complementary facts for each concept, normally spanning at least two categories and, when the seed includes multiple real-world anchors, more than one anchor. Prefer facts that naturally reinforce the same mood, behavior, ecology, or transformation instead of unrelated trivia.
- Give each selected fact a job. Across the set, the facts must shape at least four of these: name, silhouette, anatomy, markings or material, behavior, habitat, typing expression, attack premise, or evolution. A fact merely listed in the description does not count.
- Synthesize rather than stack: combine the facts into one causal design thesis, such as `habitat pressure + unusual sensory organ + object mechanism -> a characteristic body structure and behavior`. Do not bolt one visual motif onto the creature for every fact.
- Let facts have unequal weight. One fact may establish anatomy, another explain behavior, and another sharpen the theme; do not force every fact to become a separate visible feature.
- Use an organism's real common name, scientific name, or verified etymology as a thematic bridge when it produces a strong concept. Do not invent an etymology or present wordplay as biology.
- Keep factual claims and creative extrapolation distinct. Never fabricate a real-world fact to justify a design.
- Diversify the fact syntheses across the batch. When concepts share an organism basis, use substantially different fact combinations and do not reuse the same combination.

Example pattern: `laughing gull's laugh-like call + seasonal dark hood + ground-nesting colony defense + the spring action of a jack-in-the-box -> a squat shorebird whose expanding throat ruff snaps upright as a startling chorus display`. The facts converge on one behavior and silhouette; the ruff remains anatomy, not a jester costume.

### Give every concept a signature hook

Do not stop at `real animal + typing + themed markings`. Give each Cosmoid one memorable departure from its source organism: a feature, mechanism, behavior, transformation, or ecological relationship that can be stated in a short sentence and recognized in silhouette or action.

- Derive the signature hook from the fact synthesis and seed theme. It is the creative conclusion of the research, not an extra random gimmick.
- Prefer hooks that change how the creature is built or how it acts: an unusual body plan, specialized organ, locomotion system, lifecycle state, conditional transformation, symbiosis, defensive reveal, nesting behavior, or attack mechanism.
- Make the hook affect at least three of these: silhouette or anatomy, characteristic pose or movement, behavior or ecology, typing expression or attack premise, name, and evolution.
- Keep one dominant hook per concept. Use two to four supporting traits to clarify it, not competing gimmicks.
- Make the hook species-level and repeatable, not a one-off accessory, profession, or personal backstory.
- Preserve instant readability. The viewer should first see a coherent creature, then discover the clever connection; avoid puzzle-box designs that require prose to understand.
- Apply the plain-animal test: if the typing effects, palette, and removable-looking details vanished, the concept should still differ meaningfully from an ordinary specimen of its source organism.
- Apply the silhouette-or-action test: at least one defining difference should remain identifiable in a black silhouette or a three-second behavior vignette.
- Reject hooks that closely reproduce the defining silhouette, gimmick, name logic, or evolutionary premise of an existing Pokemon, Cosmoid, or other recognizable franchise creature.

Choose the inspiration approach independently for each result. Use, combine, reinterpret, or replace familiar pathways such as folklore adaptation, symbiosis, natural phenomena, animated objects, ecological mimicry, artificial origins, culinary synthesis, living landscape, and latent metamorphosis. Invent original pathways whenever that produces a stronger concept.

For every pathway:

- Give it a specific descriptive name; never output `You decide` or `Original pathway` as its name.
- Mark a newly invented pathway as `Original` after its name.
- Express the inspiration flow as `source anchor -> transformation mechanism -> creature outcome`.
- Use one primary pathway and at most one meaningful secondary pathway.
- Prefer at least five primary pathways across the batch and use no primary pathway more than twice when the seed permits.

Use the exact requested typing. Make the typing, anatomy, habitat, behavior, origin, and evolution mutually consistent. Do not add or drop a supplied type merely to create variety.

Before responding, silently audit and replace weak entries. Every pair of concepts must differ across at least three of these axes:

- biological or object basis;
- silhouette and anatomy;
- transformation mechanism;
- habitat;
- behavior;
- material or texture;
- evolutionary premise;
- interpretation of the seed theme.

Reject concepts that are cosmetic reskins, reuse the same name construction, use a supplied anchor only as decoration, are too vague to draw, closely resemble an existing Pokemon or Cosmoid, depend on a costume, prop, weapon, tool, or human occupation to communicate their premise, rely on a generic animal fact, or mention a fact without transforming the design. Replace any design that would stop reading clearly if all removable objects were taken away. When available, scan current creature names and concise creature manifests in the repository before naming the batch; do not modify the repository during concept generation.

Also reject concepts whose selected facts read like a trivia list instead of one thesis, whose signature hook exists only in lore, or whose uniqueness comes only from color, elemental particles, markings, size, or exaggerated personality. Before keeping an entry, summarize it internally as `multiple facts -> one theme -> one signature hook`; if that chain is weak, redesign it.

## Format the batch

Use numbered headings `1` through `10` so later selections remain unambiguous. Render every result with these exact user-facing fields:

- **Name:** A pronounceable, distinctive name connected to the premise.
- **Type:** The supplied typing.
- **Research Synthesis:** Three to five concise verified facts, followed by one sentence explaining how they converge on the concept. Include direct source links when web research was used; group facts supported by the same source instead of repeating links.
- **Signature Hook:** One sentence naming the creature's memorable defining feature, mechanism, behavior, transformation, or relationship and how it changes the creature in silhouette or action.
- **Inspiration Pathway:** Pathway name, established/original marker when relevant, and the concise inspiration flow.
- **Core Concept:** One sentence stating the central design idea.
- **Description:** One or two Pokedex-style sentences about behavior, habitat, ecology, origin, or lore.
- **Visual Traits:** A drawable description covering silhouette, anatomy, materials, palette, proportions, notable features, and approximate size.
- **Evolution Note:** A short explanation of its evolutionary position and possible change.

Keep `baseTheme` internally as the user's original seed when later revising or imaging a concept. Do not add rankings, recommendations, or image prompts. The automatic ten-creature ensemble is required; do not generate separate concept images unless the user asks.

After rendering the ensemble sheet, end with one compact instruction:

```text
Review the ensemble, choose one or more numbers for separate images, or ask to revise, replace, or explore any concept.
```

## Maintain the concept batch

Treat the most recent numbered batch as task state.

- `Revise 4: <feedback>`: rewrite only that concept unless the change affects the shared brief.
- `Replace 2 and 8: <feedback>`: create new, non-overlapping concepts in those slots.
- `Explore 6: <feedback>`: return four textual variations with the same nine fields and no images.
- `Images for 3 and 7`: treat the named numbers as explicit authorization to generate concept art for only those concepts.
- Treat feedback about rendering, illustration style, or the entire ensemble as a shared art-direction update rather than a change to the concepts themselves. If the user asks to discuss or update the workflow without requesting a new image, update or explain the art direction without rendering. Regenerate the ensemble only when the user explicitly asks to apply the new direction to the batch.

Preserve unchanged numbers and identity across follow-ups. If numbering could refer to more than one batch, identify the intended batch from recent context or ask one concise question.

After a `Revise` or `Replace` request changes any concept's visible design, automatically render a refreshed ten-creature ensemble at the end. Do not regenerate it for an `Explore` request unless the user chooses a variation or explicitly asks for an image.

## Render polished creature-collection RPG character art

Render ensemble sheets and selected concept previews as original polished 2D creature-collection RPG character art with anime-influenced mascot design, clean cartoon linework, simplified animal anatomy, expressive features, and softly blended cel shading. This direction applies to concept exploration only. After the user approves a concept and asks to add it to the game, the `add-cosmoid` workflow remains responsible for converting it into directional battle assets.

Before generating, optionally inspect these three Fueguana v3 sprites with `view_image` only to calibrate silhouette clarity and facial readability at game scale:

```text
public/battles/cosmoids/fueguana_left_1_v3.png
public/battles/cosmoids/fueguana_up_1_v3.png
public/battles/cosmoids/fueguana_down_1_v3.png
```

Do not pass the Fueguana files or other existing creature art to the image generator as style references during concept generation. Use the written art direction below without copying an existing creature's anatomy, markings, palette, proportions, or signature features.

Apply this style consistently:

- clearly read as an original, family-friendly creature-collection RPG design rather than wildlife illustration, a generic western cartoon mascot, or a realistic animal;
- ground the design in believable creature anatomy, then exaggerate one dominant biological hook and two to four supporting traits;
- use simplified rounded proportions with selective exaggeration, avoiding extreme baby-like chibi anatomy; keep expressive eyes structurally integrated into the face;
- use lively asymmetrical three-quarter poses that reveal anatomy, locomotion, and the signature hook; avoid rigid front views, perfect bilateral posing, and repeated stance templates;
- use smooth, clean, antialiased dark-charcoal outlines with controlled line-weight variation and restrained interior detail;
- use rich flat base colors, controlled two-to-three-tone cel shading, softly blended shadow transitions, and restrained painted highlights; make surfaces feel smooth and tactile without becoming photorealistic;
- use moderate-to-high saturation, one cohesive dominant palette with a contrasting accent, and strong value separation so color regions remain readable at game-sprite size;
- use a clean white, off-white, or transparent background according to the requested output; do not add scenery, floor planes, cast shadows, or decorative frames;
- keep the facial focal point and full silhouette readable when reduced to battle-sprite size;
- simplify mechanical-looking biology: avoid evenly spaced nodes, exposed hinge systems, perfect manufactured geometry, or anatomy that reads as held equipment;
- preserve species individuality through body plan, posture, proportions, and shape rhythm rather than relying on surface markings or elemental effects.

Reject pixel art, pixelated edges, dithering, jagged outlines, photorealism, realistic wildlife painting, 3D rendering, plastic toy surfaces, heavy painterly brushwork, watercolor washes, rough sketches, thin unfinished linework, flat vector clip art, excessive gradients, extreme chibi proportions, generic plush-mascot anatomy, overly human anatomy, cluttered costumes, arbitrary accessories, excessive surface detail, muddy colors, dramatic environmental lighting, complex backgrounds, text, labels, logos, watermarks, cropped anatomy, and recognizable franchise character features.

Do not name or request the exact style of a living artist or an existing franchise in image prompts. Use the descriptive phrase `original polished 2D creature-collection RPG character art with anime-influenced mascot design and softly blended cel shading` and the concrete visual characteristics above. Keep creature count and composition instructions separate from this reusable style direction so it works for both solo and group images.

## Generate the automatic ensemble sheet

After presenting the ten textual concepts, use the installed `imagegen` skill and announce that use before generating. Do not ask for approval; requesting a concept batch authorizes this required ensemble preview.

Generate one landscape image containing exactly the ten concepts in a clean two-row grid of five. Arrange concepts 1 through 5 from left to right on the top row and 6 through 10 from left to right on the bottom row, but include no written numbers or labels. Build each creature from its `Visual Traits`, then `Signature Hook`, then `Core Concept`, then `Research Synthesis`, then `Type`. Use the written polished creature-collection RPG direction above without image style references unless the user explicitly supplies a compatible reference.

Apply the creature-first visual direction below to every design. Keep each entire silhouette visible with generous spacing, consistent rendering, and no overlap. Use a clean white or off-white background with no grounding shadows. Do not add scenery, humans, trainers, extra creatures, text, labels, UI, borders, logos, or watermarks.

Inspect the result for exactly ten distinct creatures, correct row count, recognizable concept-specific anatomy, a readable signature hook for each design, complete silhouettes, absence of humanoid anatomy or removable props, and a cohesive polished 2D finish using clean antialiased outlines, clear color regions, and softly blended cel shading rather than realistic wildlife rendering, 3D surfaces, or rough media. Check specifically for expressive structurally integrated eyes, varied asymmetrical poses, organic anatomy, and the absence of manufactured-looking detail. If the sheet materially fails one of those checks, make one targeted correction and inspect again. Render the final sheet inline.

The ensemble sheet is a batch overview, not approval to create individual asset images, icons, sprites, or game integration.

## Generate follow-up selected concept art

When the user explicitly selects one or more concepts for images, use the installed `imagegen` skill and announce that use before generating. The selection itself is approval; do not insert another prompt-approval step.

Default to one separate image per selected concept. If the user explicitly requests a group interaction, comparison, evolution lineup, or several selected Cosmoids in one composition, generate the requested shared image instead. Build each prompt from every selected record with this priority: `Visual Traits`, then `Signature Hook`, then `Core Concept`, then `Research Synthesis`, then `Type`. Translate the fact synthesis and signature hook into visible anatomy, markings, proportions, or pose without adding props. Do not add literal elemental effects solely because of the typing.

Use the written polished creature-collection RPG direction for every selected concept image. Do not supply the Fueguana sprites or other existing creature art as style-reference inputs. If the user supplies a compatible concept-art reference, inspect it and use it only for rendering qualities rather than copying creature anatomy or recognizable character features.

Use this visual direction:

- show each depicted Cosmoid as a full-body creature in a clear three-quarter view;
- keep every silhouette and all appendages inside the frame with generous padding and clear separation;
- creature-first, non-humanoid anatomy with a natural animal posture and coherent locomotion;
- personality communicated through anatomy, proportions, expression, and pose;
- object or thematic motifs integrated into biological structures, markings, or natural materials;
- no human torso, human hands, human feet, person-shaped stance, clothing, costume, armor, jewelry, gear, handheld item, weapon, tool, instrument, luggage, or removable prop unless the user explicitly requested that exact exception;
- a restrained design with one dominant biological idea, two to four supporting traits, and a clean uncluttered silhouette;
- an original polished 2D creature-collection RPG finish with smooth antialiased dark-charcoal outlines, controlled line-weight variation, rich flat base colors, two-to-three-tone cel shading, softly blended shadow transitions, and restrained painted highlights;
- expressive structurally integrated eyes, simplified but believable creature anatomy, readable silhouettes, a cohesive moderately saturated palette, strong value separation, and clear facial focal points;
- a lively asymmetrical three-quarter action pose that reveals locomotion and the signature hook;
- a clean white, off-white, or transparent background according to the requested output, with no floor plane or cast shadow;
- no text, labels, UI, logo, watermark, trainer, scenery, cropped anatomy, pixel art, pixelated edges, dithering, jagged outlines, 3D rendering, plastic toy surfaces, heavy painterly brushwork, watercolor washes, rough sketches, flat vector clip art, extreme chibi proportions, realistic fur or skin microtexture, photorealism, muddy colors, complex backgrounds, or recognizable franchise character features.

Inspect every result, including whether its signature hook is visible in silhouette or pose without relying on the written description. If it materially contradicts the selected concept, make one targeted correction and inspect again. Render final previews inline. Do not create icons, directional battle sprites, manifests, registry entries, or story-level integration during this workflow.

After the user approves an image and asks to add the creature to the game, hand off to the `add-cosmoid` skill using that image as the concept reference.
