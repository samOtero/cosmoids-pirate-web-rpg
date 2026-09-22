---
name: design-cosmoid-concepts
description: Develop original Cosmoids from a required typing and short seed through a researched batch of ten, iterative feedback, explicit selection, identity-locked standalone art, iterative naming, and repository documentation. Use when the user wants to brainstorm, compare, refine, select, name, or document a new Cosmoid concept. Stop and ask before handing an approved documented concept to add-cosmoid for production game assets and integration.
---

# Design Cosmoid Concepts

Create a text-first concept batch, automatically render all ten designs in one ensemble sheet, and support as many feedback rounds as the user needs. After explicit selection, preserve the chosen visual identity through standalone art, naming, and documentation, then ask before beginning production game assets.

Before saving or integrating raster art intended for the app, follow the `Art source and deployment workflow` in the root `AGENTS.md`: retain its full-quality master under `art-source/`, create its runtime derivative with the configured optimizer, and never reference `art-source/` at runtime. Documentation-only concept images remain under `docs/` and must not be copied into `apps/web/public` by this workflow.

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
- Freely invent missing categories. When the seed supplies only an organism, animal, or body plan, proactively discover meaningful external anchors rather than deriving all ten concepts only from that organism's characteristics.
- Ask one concise question only when the type or seed is missing or genuinely ambiguous.
- Do not show an interpreted brief or pathway slate and do not ask for approval before concept generation.

## Generate ten concepts

Return exactly ten concepts in the first response. Do not generate or call an image tool during this phase.

### Start with a character nucleus

Design a memorable character species before optimizing the research fusion. For every concept, decide these elements internally:

1. **Story Role:** The role it naturally plays in an encounter, island community, relationship, or gameplay situation.
2. **Emotional Promise:** The immediate feeling it should create in the player, such as affection, amusement, admiration, unease, sympathy, curiosity, or awe.
3. **Temperament:** Its dominant attitude or way of approaching the world.
4. **Character Contradiction:** A tension that prevents the temperament from becoming one-note, such as a fearsome guardian that is afraid of being alone, a proud challenger that is physically clumsy, or a selfish collector that compulsively rescues lost things.
5. **Signature Behavior:** One repeatable action through which the species reveals its personality and premise.
6. **Relationship:** How it treats people, other Cosmoids, its environment, or any species-defining object or partner.

Summarize the character internally as:

`story role + emotional archetype + contradiction + signature behavior + inspirations + typing -> iconic Cosmoid character`

- Use the biological and external anchors to express the character nucleus; do not let research replace character design.
- Make the nucleus affect at least the face or expression, characteristic posture, silhouette or proportions, signature behavior, and gameplay or evolutionary premise.
- Keep species behavior repeatable. Do not rely on a personal backstory that would apply to only one individual.
- Give every concept a **five-second vignette**: one simple action a viewer could imagine immediately, such as ducking into a barrel when noticed, proudly offering an opponent a free strike, or trying to hide evidence of a prank.
- Make the vignette determine the pose, expression, and clearest visual feature rather than presenting the creature in a generic neutral stance.
- Give the concept ownership in the colorful pirate-era Cosmoids world. Establish why someone might encounter, misunderstand, befriend, exploit, or depend on the species. Not every design needs a nautical motif, but it should feel at home among distinctive islands and communities rather than imported from an unrelated setting.

### Build every concept through cross-domain fusion

Do not derive a complete Cosmoid only by exaggerating characteristics of its base organism. Every concept must combine its biological foundation with at least one meaningful inspiration from outside that foundation.

For every concept, identify these four supporting parts internally before naming or describing it:

1. **Biological Anchor:** The real organism, narrow clade, or coherent body plan that grounds the creature.
2. **External Anchor:** An independently meaningful idea from another domain, such as another organism or symbiotic partner, a plant or fungus, object, material, mechanism, craft, folklore, myth, superstition, idiom, pun, cultural practice, occupation, hierarchy, game, institution, natural phenomenon, landscape, place, emotional theme, social relationship, or narrative arc.
3. **Conceptual Bridge:** The specific visual, functional, linguistic, ecological, symbolic, cultural, or narrative relationship that makes the biological and external anchors belong together.
4. **Creature Outcome:** The anatomy, behavior, ecology, personality, attack premise, lifecycle, or evolution produced by that relationship.

Summarize the fusion internally as:

`biological or object anchor + external anchor + conceptual bridge + character nucleus -> signature creature concept`

- Treat the external anchor as a source of structure and meaning, not a decoration added after the animal is designed.
- Make the external anchor affect at least three of these: name or wordplay; silhouette or anatomy; markings, growth, or biological material; characteristic behavior; habitat or ecology; typing expression or attack premise; personality or story role; lifecycle or evolutionary progression.
- Integrate the external anchor into the species' biology, behavior, ecological relationship, or evolutionary story. Do not communicate it only through a removable prop, isolated marking, or lore sentence.
- A second organism may remain visibly distinct when its relationship is species-level and biologically meaningful, such as symbiosis, parasitism, cultivation, mimicry, dependent growth, or a lifecycle partnership.
- When evolution is central, let the external story unfold across stages. Each stage should advance, invert, or complete the combined premise rather than merely becoming larger or stronger.
- Across a ten-concept batch, use external anchors from at least five different domains when the seed permits. Do not repeatedly pair the organism with ten machines, ten weapons, ten attacks, or ten variations of the same mechanism.
- Concepts may share a biological anchor, but their external anchors and conceptual bridges must create genuinely different premises.

### Give every concept a provisional working name

- Give every concept a clever, pronounceable portmanteau or pun derived from at least two meaningful parts of its premise, such as its organism, anatomy, material, mechanism, behavior, typing, theme, or social role.
- Make both source ideas relevant to the actual design. Do not combine arbitrary words merely because their sounds fit.
- Prefer names whose wordplay becomes satisfying once the concept is understood while still sounding natural when spoken aloud.
- Avoid plain descriptive compounds, an organism name with a generic elemental suffix, minor misspellings of a single word, opaque letter collisions, and names whose only connection is palette or attitude.
- Keep the underlying source words and wordplay clear internally, but do not add a separate name-etymology field to the user-facing batch.
- Treat every batch name as a working label, not the species' final name. Do not let a working name become final merely because the concept was selected.

### Choose the right identity relationship

Design every result as a coherent species or supernatural creature, but do not force every premise into realistic animal anatomy. Choose the relationship that best expresses the character nucleus:

1. **Embodied anatomy:** The external anchor transforms the creature's body, growth, material, or natural ability.
2. **Symbiotic partnership:** A plant, fungus, animal, or other organism remains visibly distinct because both species depend on the relationship.
3. **Inhabited object:** The species consistently lives inside, wears, or adapts a found object as part of its survival and identity.
4. **Constructed or carried object:** Every member builds, inherits, cultivates, or seeks one signature object that enables its defining behavior.
5. **Living object or construct:** The object itself is the creature's coherent body.
6. **Characterlike body plan:** A modestly humanoid, role-shaped, armored, or artificial silhouette is allowed when it creates the clearest original creature and does not merely resemble a person in costume.

- Default to a clear organism, plant, fungus, mythical-beast, object, or construct basis with coherent locomotion and a readable body plan.
- Allow a species-defining object, armor-like form, manufactured geometry, occupational cue, or modestly humanoid anatomy when the relationship is central to the species' behavior, ecology, story role, and silhouette.
- For an object relationship, establish why every member finds, builds, inherits, grows, protects, replaces, or depends upon that object. The premise may legitimately collapse if the object is removed; the relationship itself must remain specific and convincing.
- Reject arbitrary costumes, interchangeable accessories, visual jokes with no behavioral consequence, and props whose only job is to state a theme.
- Prefer biological integration when it strengthens the premise, but do not contort a naturally strong inhabited-object, constructed-object, or living-object idea merely to satisfy a removal test.
- Express personality through proportions, face, posture, movement, behavior, and object interaction. Clothing or equipment may support those signals but must not substitute for them.
- Translate occupations into a species-level behavior or relationship. A navigator might sense currents, inherit a living compass shell, or cultivate map-making algae; choose the version that produces the strongest character rather than applying a blanket ban.
- Pirate and seafaring ideas may appear through anatomy, habitat, behavior, constructed materials, inhabited objects, island culture, or maritime folklore. Avoid generic pirate costumes unless a more specific species relationship makes them indispensable.
- Keep the visual thesis simple: one dominant idea, one strong silhouette, one signature action, and two to four supporting traits. Avoid assembling a pile of literal references onto one body.

### Synthesize multiple researched facts

Identify a real organism basis at the species or narrow-clade level for every concept before naming it. If the seed does not supply one, choose a basis that supports the typing and theme. Also identify and research the important external anchor instead of treating the biological basis as the only source of facts.

- Research every important real-world anchor when web access is available. For organisms, prefer authoritative natural-history sources such as museums, universities, government wildlife agencies, peer-reviewed literature, and specialist species databases. For objects and materials, prefer museum collections, technical institutions, standards bodies, and reliable histories of design or technology. Cross-check surprising or disputed claims.
- Build two internal inspiration pools. The **biological pool** contains useful facts about anatomy, physiology, movement, feeding, defense, reproduction, lifecycle, social behavior, habitat, symbiosis, vocalization, and verified etymology. The **external pool** contains useful structures, mechanisms, histories, stories, symbolism, language, progression, failure modes, sensory qualities, cultural uses, or relationships associated with potential outside inspirations.
- Build an internal palette of at least six useful facts across those pools, with enough information from both to support a real fusion.
- Select three to five complementary facts for each concept, normally using two biological facts and one to three external facts, or three biological facts and one or two external facts. Prefer facts that naturally reinforce the same mood, behavior, ecology, transformation, or evolutionary story instead of unrelated trivia.
- A fact earns a place only when it sharpens the character nucleus, iconic read, signature behavior, or evolution. Do not maximize the number of facts visible in the design, and do not turn the creature into a diagram of its research.
- Give each selected fact a job. Across the set, the facts must shape at least four of these: name, silhouette, anatomy, markings or material, behavior, habitat, typing expression, attack premise, or evolution. A fact merely listed in the description does not count.
- Synthesize rather than stack: combine the facts through the conceptual bridge into one causal design thesis. Do not bolt one visual motif onto the creature for every fact or use the external anchor only to justify a pun.
- Let facts have unequal weight. One fact may establish anatomy, another explain behavior, and another sharpen the theme; do not force every fact to become a separate visible feature.
- Use an organism's real common name, scientific name, or verified etymology as a thematic bridge when it produces a strong concept. Do not invent an etymology or present wordplay as biology.
- Keep factual claims and creative extrapolation distinct. Never fabricate a real-world fact to justify a design.
- Diversify both the fact syntheses and the cross-domain fusions across the batch. When concepts share an organism basis, use substantially different external anchors, bridges, and fact combinations.

Example pattern: `laughing gull's laugh-like call + seasonal dark hood + colony defense + jack-in-the-box spring action + the social theme of a warning chorus -> a squat shorebird whose expanding throat ruff snaps upright as a coordinated startling display`. The organism, external mechanism, and social theme converge on one behavior and silhouette; the ruff remains anatomy, not a costume.

### Give every concept a signature hook

Do not stop at `real animal + typing + themed markings`. Give each Cosmoid one memorable departure from its source organism: a feature, mechanism, behavior, relationship, transformation, lifecycle, or evolutionary story produced by its cross-domain fusion.

- Derive the signature hook from the biological anchor, external anchor, conceptual bridge, and seed theme. It is the creative conclusion of the fusion, not an extra random gimmick.
- Prefer hooks that change how the creature is built or how it acts: an unusual body plan, specialized organ, locomotion system, lifecycle state, conditional transformation, symbiosis, defensive reveal, nesting behavior, or attack mechanism.
- Make the hook affect at least three of these: silhouette or anatomy, characteristic pose or movement, behavior or ecology, typing expression or attack premise, name, and evolution.
- Keep one dominant hook per concept. Use two to four supporting traits to clarify it, not competing gimmicks.
- Make the hook species-level and repeatable, not a one-off accessory, profession, or personal backstory.
- Preserve instant readability. The viewer should first see a coherent creature, then discover the clever connection; avoid puzzle-box designs that require prose to understand.
- For embodied-anatomy concepts, apply the plain-animal test: if the typing effects and palette vanished, the silhouette, proportions, or signature action should still differ meaningfully from an ordinary specimen.
- For object relationships, apply the species-bond test: the object and creature must create a repeatable behavior, dependency, silhouette, or lifecycle specific enough that another object could not be substituted without redesigning the concept.
- Apply the recognition test: the defining hook must be recognizable through at least one of silhouette, characteristic action, repeated behavior, ecological relationship, lifecycle transformation, evolutionary sequence, or story role. Do not require every strong evolutionary or folklore hook to fit into one static silhouette.
- Reject hooks that closely reproduce the defining silhouette, gimmick, name logic, or evolutionary premise of an existing Pokemon, Cosmoid, or other recognizable franchise creature.

### Design for iconic compression

Optimize for memory and emotional clarity rather than explanatory density. Before keeping a concept, apply these tests:

- **Ten-word test:** A child should be able to describe the identity accurately in roughly ten words without reciting its research.
- **Five-second test:** The character, dominant hook, and emotional read should be apparent within five seconds.
- **Memory test:** After a brief look, someone should be able to sketch its dominant body shape and signature feature from memory.
- **Silhouette test:** The body plan, characteristic posture, or object relationship should remain identifiable as a solid shape.
- **Map-scale test:** The head, dominant shape, value grouping, and hook must survive at approximately 64 to 128 pixels.
- **One-surprise test:** There should be one feature or action people mention first, supported rather than competed with by the remaining details.

Use a controlled visual budget: one dominant shape, one secondary shape rhythm, two to four supporting traits, and two or three main color families plus a restrained accent. Let the face, line of action, and pose carry personality before surface texture or elemental effects.

Choose the external domain and conceptual bridge independently for each result. Useful bridge patterns include functional analogy, visual analogy, verified wordplay, folklore reenactment, ecological partnership, social hierarchy, cultural practice, natural-process mimicry, emotional metaphor, and evolutionary narrative. These are starting points, not a closed taxonomy.

For every fusion:

- Express the logic explicitly as `biological anchor + external anchor + bridge -> creature outcome`.
- Prefer one dominant bridge and at most one meaningful secondary bridge.
- Do not choose an external anchor only because its shape can be copied onto the animal. Give the pairing a functional, ecological, linguistic, cultural, symbolic, or narrative reason.
- Avoid generic external anchors such as unspecified armor, cannons, blades, royalty, or musical instruments unless a more specific mechanism, tradition, story, material, or system gives the fusion meaning.

Use the exact requested typing. Make the typing, anatomy, habitat, behavior, origin, and evolution mutually consistent. Do not add or drop a supplied type merely to create variety.

Before responding, silently audit and replace weak entries. Every pair of concepts must differ across at least three of these axes:

- biological or object basis;
- silhouette and anatomy;
- transformation mechanism;
- habitat;
- behavior;
- material or texture;
- evolutionary premise;
- interpretation of the seed theme;
- emotional archetype and player feeling;
- characteristic pose or five-second vignette;
- relationship with people, other Cosmoids, or a signature object.

Across a ten-concept batch, vary the emotional read as deliberately as the anatomy. Unless the seed strongly constrains the mood, include at least six distinct roles such as lovable underdog, proud challenger, shy helper, comic nuisance, protective guardian, elegant show-off, mysterious guide, unsettling scavenger, loyal worker, or rebellious troublemaker. Do not return ten serious animals that express the same attitude through different mechanisms.

Reject concepts that are cosmetic reskins, reuse the same name construction, have a name that is not a meaningful portmanteau or pun, use a supplied anchor only as decoration, are too vague to draw, closely resemble an existing Pokemon or Cosmoid, depend on an arbitrary costume or interchangeable prop, rely on a generic animal fact, or mention a fact without transforming the design. When available, scan current creature names, concise creature manifests, and representative shipped art in the repository before naming the batch; do not modify the repository during concept generation.

Also apply this cross-domain audit and replace any concept that fails:

- **Animal-plus-element test:** If the entire premise can be explained as an animal with elemental powers or an exaggerated natural ability, it lacks a meaningful external anchor.
- **Character test:** If the concept explains what the creature is made from but not what it wants, how it behaves, or how the player should feel about it, strengthen the character nucleus.
- **Relationship test:** If an external organism, object, occupation, or material can be swapped for something similar without changing the behavior, silhouette, ecology, and story role, the relationship is decorative.
- **Bridge test:** If the biological and external anchors connect only through a convenient shape or shallow pun, strengthen the functional, ecological, linguistic, cultural, symbolic, or narrative relationship.
- **Vignette test:** If no memorable five-second action demonstrates the premise and personality together, redesign the behavior or hook.
- **Lineage test:** When evolution is part of the premise, each stage must advance, invert, or complicate the emotional contradiction and external story instead of only becoming larger or stronger.
- **World-ownership test:** If the creature has no plausible encounter, relationship, misunderstanding, use, or conflict in the Cosmoids world, give its premise a specific social or ecological foothold.
- **Specificity test:** Replace a generic object, role, or aesthetic with a more specific mechanism, tradition, material, story, phrase, or system when that specificity would create the actual hook.

Reject concepts whose selected facts read like a trivia list instead of one thesis, whose hook is merely asserted in lore without shaping a recognizable behavior, relationship, lifecycle, evolution, or visual trait, or whose uniqueness comes only from color, elemental particles, markings, size, or an unsupported personality adjective. Before keeping an entry, summarize it internally as both `story role + emotion + contradiction + behavior -> memorable character` and `anchor + external inspiration + bridge -> signature hook`; redesign it if either chain is weak.

## Format the batch

Use numbered headings `1` through `10` so later selections remain unambiguous. Render every result with these exact user-facing fields:

- **Working Name:** A provisional, pronounceable portmanteau or pun combining at least two meaningful parts of the premise.
- **Type:** The supplied typing.
- **Character Core:** One sentence stating the emotional promise, temperament, contradiction, and repeatable species-level behavior.
- **Signature Vignette:** One drawable five-second action that demonstrates the character and hook together.
- **Inspiration Sources:** Three to five concise items spanning both anchors: normally two biological facts plus one to three external facts, or three biological facts plus one or two external facts. Include direct source links when web research was used and distinguish verified sources from creative extrapolation.
- **Signature Hook:** One sentence naming the creature's memorable defining feature, mechanism, behavior, relationship, lifecycle, transformation, or evolutionary story and where it becomes recognizable.
- **Fusion Logic:** The concise flow `biological anchor + external anchor + conceptual bridge -> creature outcome`.
- **Core Concept:** One sentence stating the central design idea.
- **Description:** One or two Pokedex-style sentences about behavior, habitat, ecology, origin, or lore.
- **Visual Traits:** A drawable description covering silhouette, anatomy, materials, palette, proportions, notable features, and approximate size.
- **Evolutionary/Story Arc:** A short explanation of how evolution advances, inverts, or complicates the character contradiction and combined premise, or why the creature works as a single-stage species.

Keep `baseTheme` internally as the user's original seed when later revising or imaging a concept. Do not add rankings, recommendations, or image prompts. The automatic ten-creature ensemble is required; do not generate separate concept images unless the user asks.

After rendering the ensemble sheet, end with one compact instruction:

```text
Review the ensemble, choose a number to move forward with, or ask to revise, replace, or explore any concept.
```

## Maintain the concept batch

Treat the most recent numbered batch as task state.

- `Revise 4: <feedback>`: rewrite only that concept unless the change affects the shared brief.
- `Replace 2 and 8: <feedback>`: create new, non-overlapping concepts in those slots.
- `Explore 6: <feedback>`: return four textual variations with the same eleven fields and no images.
- `Images for 3 and 7`: create faithful comparison previews for only those concepts by applying the same crop-first identity-preservation procedure used for a final selection. Remain in the comparison phase; do not begin final naming or documentation until the user chooses one concept to move forward with.
- Treat feedback about rendering, illustration style, or the entire ensemble as a shared art-direction update rather than a change to the concepts themselves. If the user asks to discuss or update the workflow without requesting a new image, update or explain the art direction without rendering. Regenerate the ensemble only when the user explicitly asks to apply the new direction to the batch.

Preserve unchanged numbers and identity across follow-ups. If numbering could refer to more than one batch, identify the intended batch from recent context or ask one concise question.

After a `Revise` or `Replace` request changes any concept's visible design, automatically render a refreshed ten-creature ensemble at the end. Do not regenerate it for an `Explore` request unless the user chooses a variation or explicitly asks for an image.

Do not modify repository documentation or begin final naming while the user is still comparing concepts. Continue the numbered batch until the user explicitly identifies the concept they want to move forward with.

## Render polished creature-collection RPG character art

Render ensemble sheets and selected concept previews as original polished 2D creature-collection RPG character art with anime-influenced mascot design, clean cartoon linework, coherent stylized anatomy, expressive character acting, and softly blended cel shading. This direction applies to concept development only. After the approved concept is named and documented, and the user affirmatively accepts the production handoff, the `add-cosmoid` workflow remains responsible for converting it into directional battle assets.

Before generating, optionally inspect these three Fueguana v3 sprites with `view_image` only to calibrate silhouette clarity and facial readability at game scale:

```text
apps/web/public/battles/cosmoids/fueguana_left_1_v3.webp
apps/web/public/battles/cosmoids/fueguana_up_1_v3.webp
apps/web/public/battles/cosmoids/fueguana_down_1_v3.webp
```

Do not pass the Fueguana files or other existing creature art to the image generator as style references during concept generation. Use the written art direction below without copying an existing creature's anatomy, markings, palette, proportions, or signature features.

Apply this style consistently:

- clearly read as an original, family-friendly creature-collection RPG character rather than wildlife illustration, a generic western cartoon mascot, or a realistic animal;
- ground the design in a coherent animal, plant, object, construct, symbiotic, or characterlike body plan, then exaggerate one dominant hook and two to four supporting traits;
- make the Character Core and Signature Vignette immediately visible through expression, line of action, posture, and interaction with any species-defining object or partner;
- use simplified rounded proportions with selective exaggeration, avoiding extreme baby-like chibi anatomy; use expressive graphic creature-mascot eyes that are intentionally designed as part of the head rather than rendered with zoological realism;
- use lively asymmetrical three-quarter poses that reveal anatomy, locomotion, and the signature hook; avoid rigid front views, perfect bilateral posing, and repeated stance templates;
- use smooth, clean, antialiased dark-charcoal outlines with controlled line-weight variation and restrained interior detail;
- use rich flat base colors, controlled two-to-three-tone cel shading, softly blended shadow transitions, and restrained painted highlights; make surfaces feel smooth and tactile without becoming photorealistic;
- use moderate-to-high saturation, one cohesive dominant palette with a contrasting accent, and strong value separation so color regions remain readable at game-sprite size;
- use a clean white, off-white, or transparent background according to the requested output; do not add scenery, floor planes, cast shadows, or decorative frames;
- keep the facial focal point and full silhouette readable when reduced to battle-sprite size;
- use manufactured geometry, armor-like forms, or held and inhabited objects only when the selected identity relationship requires them; keep them stylized, uncluttered, and visibly central to the species rather than arbitrary equipment;
- preserve species individuality through body plan, posture, proportions, shape rhythm, emotional read, and signature action rather than relying on surface markings or elemental effects.

### Design graphic creature-mascot eyes

- Use biological or constructed eye anatomy as loose design inspiration rather than a realism constraint. Preserve useful species cues such as eyestalk placement, side-set positioning, an unusual pupil, an armored socket, or a lenslike attachment when they strengthen the creature, but freely simplify them into appealing character eyes.
- Give every eye a bold, readable outer silhouette, a clean iris-and-pupil mass or equivalent focal shape, controlled white sclera only where it improves the expression, and one or two crisp highlights. Keep the graphic structure readable at approximately 64 to 128 pixels.
- Let the eye shape express the Character Core: round or open for gentle, curious, nervous, or youthful creatures; angular or upturned for proud, forceful, or mischievous creatures; narrow or offset for sly characters; compact and high-contrast for stoic, eerie, or armored characters. These are starting points, not fixed personality codes.
- Integrate the eye shape into the head, brow ridge, eyestalk, shell, mask, socket, or facial plane so it feels designed with the creature rather than pasted onto it. Eyelid and brow shapes may be stylized into the surrounding anatomy, but avoid separate human eyebrows or cosmetic eyelashes unless the concept specifically justifies them.
- Vary eye size and construction across a batch. Cute or vulnerable designs may use larger eyes, while imposing, elegant, alien, or unsettling designs may use smaller or sharper eyes; do not force every species into the same pair of white ovals.
- Prioritize personality and creature appeal over strict zoological accuracy. A creature inspired by an eyeless or compound-eyed organism may still receive two readable character eyes when that creates the stronger Cosmoid design.
- Communicate emotion through the combined eye silhouette, iris or pupil direction, head angle, mouth, posture, line of action, and appendage gesture rather than relying on realistic eye detail or human facial acting alone.

Reject pixel art, pixelated edges, dithering, jagged outlines, photorealism, realistic wildlife painting, natural-history eye realism, realistic compound-eye microtexture, tiny unreadable bead eyes, 3D rendering, plastic toy surfaces, heavy painterly brushwork, watercolor washes, rough sketches, thin unfinished linework, flat vector clip art, excessive gradients, extreme chibi proportions, generic plush-mascot anatomy, generic human eyes, excessive eyelashes, floating eyebrows, oversized baby eyes, identical white oval eyes across unrelated species, overly human anatomy, cluttered costumes, arbitrary accessories, excessive surface detail, muddy colors, dramatic environmental lighting, complex backgrounds, text, labels, logos, watermarks, cropped anatomy, and recognizable franchise character features.

Do not name or request the exact style of a living artist or an existing franchise in image prompts. Use the descriptive phrase `original polished 2D creature-collection RPG character art with anime-influenced mascot design and softly blended cel shading` and the concrete visual characteristics above. Keep creature count and composition instructions separate from this reusable style direction so it works for both solo and group images.

## Generate the automatic ensemble sheet

After presenting the ten textual concepts, use the installed `imagegen` skill and announce that use before generating. Do not ask for approval; requesting a concept batch authorizes this required ensemble preview.

Generate one landscape image containing exactly the ten concepts in a clean two-row grid of five. Arrange concepts 1 through 5 from left to right on the top row and 6 through 10 from left to right on the bottom row, but include no written numbers or labels. Build each creature from its `Character Core`, then `Signature Vignette`, then the dominant silhouette and shape language in `Visual Traits`, then `Signature Hook`, `Fusion Logic`, `Core Concept`, `Inspiration Sources`, and `Type`. Use the written polished creature-collection RPG direction above without image style references unless the user explicitly supplies a compatible reference.

Apply the character-driven visual direction below to every design. Show each one performing or immediately entering its five-second vignette rather than standing in a repeated generic pose. Keep each entire silhouette visible with generous spacing, consistent rendering, and no overlap. Use a clean white or off-white background with no grounding shadows. Do not add scenery, humans, trainers, extra creatures, text, labels, UI, borders, logos, or watermarks.

Inspect the result for exactly ten distinct creatures, correct row count, recognizable concept-specific anatomy or object relationship, readable Character Cores and Signature Vignettes, complete silhouettes, distinct emotional archetypes, and a cohesive polished 2D finish using clean antialiased outlines, clear color regions, and softly blended cel shading rather than realistic wildlife rendering, 3D surfaces, or rough media. Check specifically for expressive graphic creature-mascot eyes, eye silhouettes that reinforce each Character Core, useful species cues without zoological literalism, varied eye language across the batch, clean iris or pupil focal shapes, controlled sclera and highlights, varied lines of action, memorable dominant shapes, map-scale clarity, and the absence of realistic compound-eye texture, tiny unreadable bead eyes, generic human eyes, oversized baby eyes, or repeated white oval eyes. Manufactured detail, modestly humanoid anatomy, or a removable object is acceptable when the selected identity relationship makes it indispensable. If the sheet materially fails one of those checks, make one targeted correction and inspect again. Render the final sheet inline.

The ensemble sheet is a batch overview, not approval to create individual asset images, icons, sprites, or game integration.

## Lock and render the selected concept

When the user explicitly chooses a concept to move forward with, establish a visual identity lock before generating its standalone art. The selected creature as it appears in the most recent ensemble sheet is the design authority; the written record explains that design but must never replace or reinterpret it.

1. Retain the most recent ensemble sheet that contains the selected design.
2. Locate the chosen cell from its number: 1-5 are left-to-right on the top row and 6-10 are left-to-right on the bottom row.
3. Crop that cell into a temporary visual identity anchor. Include the entire selected creature and exclude neighboring concepts, text, and unrelated marks. Inspect the crop before using it.
4. Record an identity checklist from the crop: silhouette; body plan and proportions; head and face shape; eye design; appendage count and placement; signature anatomy or object relationship; palette; markings; materials; and distinctive shape rhythm.
5. Use the installed `imagegen` skill and announce that use before generating. Supply the cropped identity anchor as an image reference and frame the operation as identity preservation or faithful enlargement, never as a fresh text-only generation.
6. Use the selected textual record only to clarify behavior, hidden anatomy, and intent. When prose and visible art differ, preserve the visible selected design unless the user explicitly requests a redesign.

Generate one separate full-body concept image for the selected creature. Build its prompt from the visual anchor first, followed by `Character Core`, `Signature Vignette`, `Visual Traits`, `Signature Hook`, `Fusion Logic`, `Core Concept`, `Inspiration Sources`, and `Type`. Do not add literal elemental effects solely because of the typing.

### Preserve the selected appearance

- Preserve the exact recognizable silhouette, body proportions, head and face, eyes, appendage count and placement, signature feature, palette, markings, materials, and overall shape language from the selected ensemble design.
- Preserve its characteristic posture and expression when practical. A small pose adjustment is allowed only to reveal the full body or clarify anatomy without changing the character's visual identity.
- Complete genuinely hidden anatomy conservatively from visible evidence and the coherent body plan. Do not use hidden areas as permission to add a new motif, appendage, costume, prop, marking system, or signature feature.
- Treat differences in resolution, framing, clean background, and clarified linework as acceptable production changes. Do not turn the result into an evolution, variant, reinterpretation, related species, or more detailed redesign.
- Never regenerate the selected creature from its written description alone. Always include the cropped identity anchor or the latest explicitly approved standalone image as the primary image reference.
- If the user explicitly changes the design during feedback, preserve everything outside that requested change. Once the user approves the revision, promote that revised image to the new identity authority.
- Naming must not alter the appearance. Documentation must describe the approved image rather than silently reconciling drift by rewriting the design.

Use the written polished creature-collection RPG direction for every selected concept image. Do not supply the Fueguana sprites or other existing creature art as style-reference inputs. The selected crop is an identity reference, not merely a rendering-style reference. If the user supplies another compatible concept-art reference, inspect it and clarify whether it updates identity or rendering qualities from the user's request; do not let an incidental style reference override the locked creature design.

Use this visual direction:

- show each depicted Cosmoid as a full-body creature in a clear three-quarter view;
- keep every silhouette and all appendages inside the frame with generous padding and clear separation;
- a coherent animal, plant, object, construct, symbiotic, or characterlike body plan with understandable locomotion;
- the emotional promise, temperament, and contradiction communicated through anatomy, proportions, face, expression, line of action, pose, and behavior;
- the Signature Vignette legible as the creature's current or imminent action without requiring scenery;
- object and occupational motifs expressed through the selected identity relationship: biological integration, symbiosis, habitation, construction, carrying, living-object anatomy, or a coherent characterlike body plan;
- no arbitrary clothing, costume, armor, jewelry, gear, handheld item, weapon, tool, instrument, luggage, or removable prop whose only job is to state a theme; allow a species-defining object or role-shaped anatomy when its behavior and silhouette depend on it;
- a restrained design with one dominant idea, one secondary shape rhythm, two to four supporting traits, and a clean uncluttered silhouette;
- an original polished 2D creature-collection RPG finish with smooth antialiased dark-charcoal outlines, controlled line-weight variation, rich flat base colors, two-to-three-tone cel shading, softly blended shadow transitions, and restrained painted highlights;
- expressive graphic creature-mascot eyes with a bold readable outer shape, clean iris-and-pupil mass or equivalent focal shape, controlled sclera and crisp highlights, useful species cues, and a silhouette that reinforces the Character Core; simplified but believable creature anatomy, readable silhouettes, a cohesive moderately saturated palette, strong value separation, and clear facial focal points;
- a lively asymmetrical three-quarter action pose that reveals locomotion and the signature hook;
- a clean white, off-white, or transparent background according to the requested output, with no floor plane or cast shadow;
- no text, labels, UI, logo, watermark, trainer, scenery, cropped anatomy, pixel art, pixelated edges, dithering, jagged outlines, 3D rendering, plastic toy surfaces, heavy painterly brushwork, watercolor washes, rough sketches, flat vector clip art, extreme chibi proportions, natural-history eye realism, realistic compound-eye microtexture, tiny unreadable bead eyes, generic human eyes, excessive eyelashes, floating eyebrows, oversized baby eyes, identical white oval eyes across unrelated species, realistic fur or skin microtexture, photorealism, muddy colors, complex backgrounds, or recognizable franchise character features.

Inspect every result against the identity checklist before presenting it. Also confirm that the eye design follows the graphic creature-mascot rules above: it must reinforce the Character Core, remain readable at map scale, retain only useful species cues, and avoid both zoological realism and generic human-eye shorthand. Confirm that the Character Core, Signature Vignette, emotional read, and signature hook remain visible through silhouette, face, pose, or object interaction without relying on prose, and that the result passes the five-second, silhouette, map-scale, and one-surprise tests. Reject and correct any material drift before treating the image as a candidate. Render the faithful standalone preview inline and invite visual feedback. Continue focused revision rounds until the user explicitly approves the design.

Do not create icons, directional battle sprites, manifests, registry entries, stats, attacks, or story-level integration during this phase.

## Name the approved creature

Begin final naming only after the user has approved the selected standalone design.

- Treat the batch working name as one optional candidate with no special priority.
- If the user has not proposed a name, provide ten pronounceable candidates with one concise sentence explaining the meaningful source words and why each fits the approved creature.
- Build names from two or more relevant parts of the locked premise: organism, anatomy, material, mechanism, behavior, typing, external anchor, emotional contradiction, or story role.
- Support as many naming rounds as requested. Narrow, remix, or replace candidates according to feedback without changing the creature's appearance or concept.
- Do not declare a winner from preference signals such as “I like 3” when the user is still comparing. Lock the final name only when the user explicitly says to use, choose, or go with it.
- After the final name is locked, derive the lowercase snake_case ID from that name and scan existing creature names, manifests, and concept records for collisions.

## Document the finalized concept

After both the visual design and final name are explicitly approved, create or update the repository concept record. Follow established files in `docs/cosmoids` rather than inventing a separate format.

1. Save the approved standalone image as `docs/cosmoids/images/<id>-concept.png`. Preserve the approved image exactly apart from format-safe copying or transparent/background cleanup explicitly requested by the user.
2. Create `docs/cosmoids/<id>.md` and link the concept image near the top.
3. Record the final name and its wordplay, typing, biological or object basis, external inspirations, conceptual bridge, character core, signature behavior and vignette, visual direction, evolutionary or story premise, inspiration sources, creation date, and relevant story placement supplied by the user.
4. Clearly distinguish verified real-world inspiration from fictional extrapolation.
5. Record the identity checklist so future art preserves the selected silhouette, proportions, face, appendages, signature features, palette, markings, materials, and shape language.
6. Record genuinely unresolved decisions under `Open Decisions`; do not invent gameplay mechanics, stats, attacks, evolution details, capture rules, or story facts merely to make the document appear complete.
7. Update an existing shared Cosmoid concept index when the repository already maintains one, preserving its established structure.
8. Verify that every documented image path and source link resolves and that no provisional working name remains presented as final.

Report the created documentation and summarize any open decisions. Do not begin production assets automatically.

## Offer the production handoff

After documentation is complete, end by asking one concise question:

```text
Would you like me to create the production game assets and add <Final Name> to the game?
```

Only an affirmative response authorizes the `add-cosmoid` workflow. Hand it the approved standalone concept image and concept record. State that the approved image is the identity authority and must remain recognizable across the icon and directional sprites; changed viewing angles may reveal anatomy but must not redesign it.

If the user declines or continues discussing the concept, remain in concept development and do not generate production assets or modify game registries.
