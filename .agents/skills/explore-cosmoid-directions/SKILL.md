---
name: explore-cosmoid-directions
description: Explore six distinct, high-level creative directions for a future Cosmoid from a required creature anchor and theme, character, relationship, institution, emotional arc, story premise, or other narrative context. Use before detailed creature design when the user wants to discover what the creature should mean, compare symbolic or thematic interpretations, combine promising directions, or turn a character-inspired idea into an original creature-design brief. Do not generate finished Cosmoid concepts or images; after the user selects a direction and typing, hand the brief to design-cosmoid-concepts.
---

# Explore Cosmoid Directions

Find the meaningful premise before solving the final anatomy. Convert `creature + theme` into six different creative spines, let the user choose or combine them, then prepare a concise handoff for detailed concept design.

## Accept the input

Require two inputs in labeled or natural-language form:

```text
Creature: Dog
Theme: A timid child connected to the navy, a formidable mentor, and the humiliation of being reduced to menial work.
```

- Treat `Creature` as the persistent biological, mythical, plant, fungal, or artificial-creature anchor. It may be broad, such as `dog`, or narrow, such as `Portuguese water dog`.
- Treat `Theme` as meaning rather than decoration. It may contain a character, relationship, institution, status, contradiction, memory, mood, event, setting, or story arc.
- Accept optional typing, desired role, evolutionary stage, tone, canon notes, and must-keep or must-avoid constraints.
- Ask one concise question only when the creature or theme is missing or genuinely ambiguous.
- Do not require typing during direction exploration. A direction should earn its typing rather than being reverse-engineered from one.

## Build the meaning map

Before proposing directions, analyze the input internally as a set of usable meanings:

1. Identify three to six qualities, behaviors, cultural associations, or biological facts carried by the creature anchor.
2. Identify three to six facts or motifs in the theme: relationships, loyalties, wounds, aspirations, institutions, rank, labor, power, irony, emotional change, or recurring symbols.
3. Identify the theme's central tension. Prefer a tension such as `loyalty versus shame`, `inheritance versus self-definition`, or `small social rank versus large moral courage` over a broad genre label.
4. Find bridges where the creature and theme reinforce, complicate, or ironically invert one another.

When a named work, historical subject, culture, organism, object, or technical mechanism is important and web access is available, research the relevant anchor before using it. Prefer authoritative or first-party sources where practical, cite factual claims, and separate verified facts from creative interpretation. Treat the user's stated interpretation as the intended creative premise even when multiple readings exist.

## Generate six directions

Return exactly six directions in the first response. Keep them upstream of finished creature design: do not name a species, finalize a body plan, write Pokedex lore, or call an image tool.

Make every direction preserve the creature anchor and answer a different thematic question. Diversify across at least four of these axes:

- emotional thesis;
- character relationship or social role;
- status, power, or institutional interpretation;
- biological or ecological translation;
- transformation or evolutionary promise;
- tone, such as sincere, comic, tragic, uncanny, or aspirational;
- likely battle role or type expression.

For each direction, use these exact fields:

- **Direction:** A short evocative title that describes the idea, not a creature name.
- **Concept Logic:** A compact chain in the form `theme fact + creature meaning + metaphor or mechanism -> original creature premise`.
- **What It Says:** The emotional or narrative statement that makes this direction worth pursuing.
- **Creature Expression:** Two or three sentences describing how anatomy, behavior, ecology, material, movement, or evolution could express the idea without locking a final design.
- **Type Opportunities:** One to three plausible single or dual typings with one short reason each. Treat them as options unless the user already supplied an exact type.
- **Design Risk:** The main cliché, over-literal reading, franchise resemblance, or visual trap to avoid.

Keep every chain causal. A reference that only changes palette, markings, costume, or accessories is not a direction. Translate institutions and occupations into ecology and behavior; translate objects into anatomy, material, growth, secretions, or locomotion. Preserve emotional meaning through the transformation.

Use the user's mop-dog example as a reasoning pattern: `naval association + formidable mentor lineage + reduced status and menial labor + canine loyalty -> an underdog creature whose mop-like biology embodies both service and humiliation`. The strength comes from several meanings converging on one premise, not from placing a naval costume or a handheld mop on a dog.

## Apply originality guardrails

- Use a referenced character or franchise only as a thematic source. Do not reproduce recognizable clothing, insignia, weapons, silhouettes, names, catchphrases, or signature powers.
- Prefer analogy, inversion, compression, and consequence over direct one-to-one references.
- Keep the creature first. Express the premise through species-level anatomy, behavior, ecology, lifecycle, or material rather than a personal costume or prop.
- Reject directions that are merely `creature + job`, `creature + element`, a palette swap, a pun without consequences, or the same thesis with different visuals.
- Preserve room for the later design skill to research organism facts and discover a signature hook. A direction should constrain meaning more than surface detail.

## Format the slate

Begin with a compact **Core Tension** statement of no more than two sentences. Then number the six directions `1` through `6` and use the exact fields above.

Do not rank the directions or silently choose a winner. End with:

```text
Choose a direction, combine two, or ask to replace or shift any of them. Once the creative spine and typing are set, I can pass it into detailed Cosmoid design.
```

## Develop the selected direction

Treat the latest numbered slate as task state.

- `Develop 3`: deepen only direction 3 into a handoff brief.
- `Combine 2 + 5`: synthesize their strongest compatible meanings into one spine; do not merely list both.
- `Replace 4: <feedback>`: replace only direction 4 and preserve the other numbers.
- `Shift 1 toward <feedback>`: revise the thesis and consequences of direction 1 without prematurely finishing the design.

When the user selects or combines a direction, return this brief:

- **Creature Anchor:** The required creature basis and any allowable variation.
- **Theme Core:** The central tension and emotional statement.
- **Creative Spine:** One causal sentence linking source meanings to the creature premise.
- **Biological Translation:** The anatomy, behavior, ecology, material, or lifecycle territories that should carry the meaning.
- **Must Preserve:** Three to five defining ideas.
- **Avoid:** The major literal, derivative, or incoherent interpretations.
- **Typing:** The confirmed typing, or two to three recommended options if none is confirmed.
- **Design Seed:** A compact natural-language seed ready for `design-cosmoid-concepts`.

If typing is still open, recommend options and ask the user to choose only when they ask to continue into detailed design. Do not fabricate a final choice. Once the direction and exact typing are confirmed, hand the brief to `design-cosmoid-concepts`; do not generate a redundant second direction slate.

## Keep this phase text-only

Do not generate ensemble sheets, concept art, icons, sprites, manifests, attacks, stats, or game integration during this workflow. The purpose is to choose what the creature means. Use `design-cosmoid-concepts` for the researched ten-concept expansion and `add-cosmoid` only after the user approves a concept image and asks to integrate it.
