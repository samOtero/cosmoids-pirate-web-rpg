---
name: design-animal-led-cosmoids
description: Develop and document a Cosmoid or evolution family when a specific real animal, unusual species, or biological discovery is the primary creative seed. Research the animal first, sort useful facts into visual, lore, and broad gameplay roles, decide whether any added theme is actually needed, design distinct stages, refine identity-locked art, name the family, and document it. Use this instead of design-cosmoid-concepts for biology-first requests; do not use it for theme-first, character-first, or broad ten-direction concept batches.
---

# Design Animal-Led Cosmoids

Turn fascination with a real animal into a coherent Cosmoid species or evolution family. Let the organism's most surprising biology lead the concept. Keep the species premise separate from the nature or personality of individual creatures.

Before saving or integrating raster art intended for the app, follow the `Art source and deployment workflow` in the root `AGENTS.md`: retain its full-quality master under `art-source/`, create its runtime derivative with the configured optimizer, and never reference `art-source/` at runtime. Documentation-only concept images remain under `docs/` and must not be copied into `apps/web/public` by this workflow.

This workflow is deliberately separate from `design-cosmoid-concepts`. Do not modify, replace, or silently import that workflow's mandatory character-nucleus or cross-domain-fusion requirements.

## Preserve the central distinction

Design the **species concept** here. Do not define a universal individual nature.

- Do not create brave, timid, mischievous, solemn, friendly, or aggressive variants as part of this workflow.
- Do not make one temperament the biological explanation for the design.
- A pose or expression may communicate an immediate action, alertness, effort, age, or physical confidence, but it does not establish how every individual behaves.
- When documentation requires a character core, phrase it as species-level ecological role, player-facing impression, and signature behavior. Explicitly leave individual temperament open.
- Do not explore how different natures would visually alter the species unless the user starts a separate task for that purpose.

## Accept the seed

Require:

- **Type(s):** The intended single or dual typing.
- **Animal seed:** A real species, narrow animal group, or biological oddity that caught the user's interest.

Accept optional constraints such as desired stage count, story role, habitat, or a request not to add another theme. Ask one concise question only if the typing or animal seed is genuinely missing.

Treat a statement such as “I heard aquatic iguanas exist and that surprised me” as a strong seed. The reason the animal caught the user's attention is design data; preserve that contrast or surprise throughout the line.

## Work through explicit checkpoints

Move through the phases below in order. Pause after each major creative checkpoint so the user can select facts, structures, and images before later work depends on them.

Maintain these decisions as task state:

1. Approved biological facts and central fascination
2. Approved design thesis and fact-to-role map
3. Approved stage structure
4. Current visual authority for every stage
5. Approved entries and broad gameplay directions
6. Final locked names
7. Completed documentation

Do not let later naming, lore, or gameplay discussion silently redesign approved art.

## Phase 1: Research the animal before designing

Browse authoritative sources. Prefer museums, universities, government wildlife agencies, conservation institutions, specialist species organizations, and peer-reviewed research. Cross-check facts that are surprising, disputed, or unusually specific.

Find a compact set of useful facts across several categories:

- habitat and ecological niche;
- feeding and resource use;
- locomotion and characteristic posture;
- anatomy and visible adaptations;
- physiology and environmental tolerances;
- defense and survival strategies;
- lifecycle, maturation, or size-linked behavioral changes;
- relationships with other organisms or people;
- verified name meanings or cultural associations when genuinely relevant.

Return roughly six to ten high-value facts with direct links. For each fact, state briefly why it could matter to the creature. Do not design a concept batch yet, and do not pad the list with generic trivia.

Keep verified biology distinct from inference. If a design possibility extrapolates beyond the source, label it as a possibility rather than a fact.

## Phase 2: Build one biological design thesis

After the user reacts to the research, consolidate the selected facts into one sentence:

`animal + surprising adaptation or ecological contrast + intended type -> species identity`

Sort the selected facts into four roles:

- **Visual:** Must affect silhouette, anatomy, proportions, material, palette, markings, or stage progression.
- **Entry and lore:** Best communicated through habitat, feeding, ecology, or relationships in the Cosmoids world.
- **Gameplay direction:** A source for later abilities or attacks, without yet defining mechanics.
- **Background only:** Useful understanding that does not need visible or mechanical representation.

A fact may support more than one role, but every major design feature should trace back to an approved fact or clearly labeled fictional bridge.

### Decide whether an added theme is needed

Do not automatically add an occupation, object, myth, personality archetype, or second organism.

The animal alone is sufficient when its selected facts already provide:

- one memorable visual read;
- one signature behavior;
- enough material for the requested evolution structure;
- plausible lore and broad gameplay hooks;
- a clear reason it belongs in the Cosmoids world.

Add another theme only when the concept remains visually generic, lacks a species-level hook, or the user requests one. State what problem the added theme solves. Never obscure the original animal fact that made the seed exciting.

For a biology-only concept, world integration may come from ecological usefulness, sailor knowledge, island custom, misunderstanding, harvesting, conservation, or coexistence rather than costume or props.

## Phase 3: Shape the evolution family

Recommend a stage count grounded in the biology, but follow an explicit user choice.

For every stage, define:

- ecological role or foraging range;
- biological facts emphasized;
- dominant silhouette and proportions;
- feature that is undeveloped, developing, or mature;
- likely entry subject;
- broad gameplay emphasis.

### Make stages meaningfully distinct

Never make the first stage only a smaller copy of the last.

Use one or more grounded forms of progression:

- juvenile and adult niche differences;
- shallow-water versus deep-water behavior;
- speed and flexibility versus mass and endurance;
- undeveloped versus mature organs, growths, armor, fins, claws, or displays;
- changing diet, habitat, locomotion, or social relationship;
- increasing control over the same biological process.

Preserve family continuity through the animal basis, palette logic, face construction, key anatomy, or repeated shape rhythm. Each stage should still be identifiable on its own at game scale.

If the animal exhibits reversible size change, seasonal morphology, metamorphosis, or another non-linear process, record it as a family trait without confusing it with the permanent evolution sequence.

## Phase 4: Explore the family visually

When image generation is requested or the approved stage structure is ready for visual exploration, use the installed `imagegen` skill and follow the repository's creature-art direction.

Default to **five complete family concepts** on one comparison sheet when designing a two-stage line. Show each pair together so the user can judge both continuity and stage differentiation. Use a clean off-white background, full readable silhouettes, no scenery, and no written labels unless the user requests them.

Each pair must preserve the same approved biological thesis while varying meaningful visual decisions such as:

- body proportions and line of action;
- how the signature adaptation changes across stages;
- head, feet, tail, fin, crest, or armor construction;
- palette distribution and marking rhythm;
- how strongly juvenile and adult silhouettes contrast.

Do not turn the five pairs into five unrelated themes.

### Selection and focused refinement

- If the user chooses a complete pair, crop or save each selected stage as a separate identity anchor.
- If the user approves only one stage, lock that stage and keep it visually unchanged.
- For an unresolved stage, generate ten variants that all evolve from or into the locked design. Vary the unresolved silhouette and stage-specific development rather than redesigning the approved stage.
- Apply requested revisions narrowly. Preserve everything outside the requested change.
- Promote each explicitly approved revision to the new visual authority.

Inspect anchors and final images for complete anatomy, readable eyes and face, appendage count, palette, markings, signature feature, and family continuity. A selected clean full-body crop may serve as the base image when the user approves it; do not regenerate merely to increase resolution.

Before leaving this phase, obtain or preserve one approved standalone base image for every stage.

## Phase 5: Write the species entries

Draft one compact Cosmoid-entry description for each stage after its concept and visual identity are stable.

- Keep each entry to one or two sentences.
- Give each stage a different subject rather than repeating the same fact.
- Let the first stage usually establish its immediate habitat, feeding challenge, locomotion, or immature adaptation.
- Let the later stage extend the ecology through greater range, endurance, control, mature anatomy, or a relationship with islanders and sailors.
- Preserve the distinction between real inspiration and fictional worldbuilding.

Revise the entries with the user before treating them as documentation text.

## Phase 6: Record broad gameplay sources

At this stage, capture only the approved biological directions that could later become abilities or attacks. Examples include anchoring claws, a forceful tail, salt expulsion, heat retention, reversible size change, camouflage, pressure resistance, or specialized feeding anatomy.

Do not invent move names, damage values, cooldowns, stats, evolution levels, or detailed mechanics unless the user explicitly asks to enter gameplay design. A concise directional list is sufficient.

Keep stage emphasis clear: a juvenile may express mobility and grip while the adult expresses endurance, power, or mature control of the same system.

## Phase 7: Name the approved family

Begin naming only after the visual family, entries, and broad concept are approved.

Provide ten name pairs for a two-stage family, or ten individual candidates for a single-stage species. Draw from meaningful parts of the locked concept:

- animal common or scientific name;
- aquatic, terrestrial, aerial, or habitat language;
- signature movement or anatomy;
- biological process;
- mature world relationship;
- relevant language roots whose meaning can be verified.

Explain each construction briefly. Keep names pronounceable and avoid arbitrary syllable collisions.

Use feedback to narrow or remix the set. Preference language such as “I like this one” does not lock a final name while comparison is continuing. Lock names when the user clearly chooses them or proceeds to documentation using them.

After selection, derive lowercase snake-case IDs and scan creature records, manifests, concept documents, and the shared catalog for collisions.

## Phase 8: Document without beginning production

Follow the established structure in `docs/cosmoids`.

For each stage:

1. Copy the approved base image unchanged to `docs/cosmoids/images/<id>-concept.png`.
2. Create `docs/cosmoids/<id>.md` and link the image near the top.
3. Record its final name and wordplay, typing, stage, animal basis, design thesis, selected biological facts, fictional extrapolations, entry, signature behavior, visual identity checklist, evolutionary relationship, broad gameplay directions, creation date, and supplied story placement.
4. State that individual nature remains open and is not prescribed by the species concept.
5. Put unresolved scale, mechanics, attacks, evolution conditions, habitat distribution, capture rules, story placement, and journal art under `Open Decisions`.
6. Link the family records to one another.
7. Update `COSMOID_CONCEPTS.md` while preserving unrelated work already present.

Verify that local image links exist, external research links resolve, copied images exactly match their approved sources, names have no collisions, and no working name is presented as final.

Do not create icons, directional battle sprites, manifests, registry entries, stats, attacks, encounter placement, or journal art during this workflow.

End by asking whether the user wants to begin the production handoff for the documented creature or family. Only an affirmative response authorizes use of `add-cosmoid`.

## Completion standard

The workflow is complete when:

- the original animal fascination remains obvious;
- verified biology and fictional extrapolation are clearly separated;
- an added theme was used only if it materially strengthened the concept;
- evolutionary stages differ by ecology, function, and silhouette rather than size alone;
- approved visual identities are preserved;
- individual nature has not been baked into the species design;
- entries and gameplay directions reflect the selected facts;
- final names and collision-free IDs are recorded;
- base images, dedicated records, and the shared catalog are updated;
- production work has not begun without separate approval.
