# Level 7 — Shore Leave

> Direction recorded and first playable slice implemented September 22, 2026. “Shore Leave” is the level-select name; the island itself remains unnamed. `STORY_AND_THEMES.md` remains the narrative source of truth. This document intentionally does not name the island's creature roster so that species, rarity, and encounter tuning can change without rewriting the stable level direction.

## Level Summary

- **Format:** A peaceful, exploration-first island interlude rather than a conventional tower-defense encounter.
- **Placement:** Immediately after the escape from Ironbell and the expansion of the sailing crew in Level 6.
- **Premise:** The crowded crew stops at a small wild island to rest, stretch its legs, and recover before continuing the search for a larger boat.
- **Required objective:** None.
- **Loss condition:** None. The player cannot lose the level.
- **Player activity:** Explore at an unhurried pace, observe island wildlife, initiate optional encounters, catch creatures if desired, or simply let the creatures cross the scene and leave naturally.
- **Completion:** The level completes like an ordinary encounter when every wildlife unit has been caught, defeated, or has exited at the end of its path. Closing the level early also counts as a successful completion and plays the same ending.
- **Story function:** Give the player and crew room to breathe after Levels 5 and 6, establish the new group dynamic, and remind the player that discovery and companionship matter even when no crisis demands intervention.
- **Status:** The single-screen red-sandstone shore, one-way land and aquatic wildlife routes, five-panel arrival with a dedicated landfall illustration, six-panel departure with its own late-afternoon crew tableau, cannot-lose rule, automatic completion, and successful early Close behavior are implemented. The playable view also gives the crew level-specific shore-leave poses: Tigrevel naps, Kip sketches in his journal, Mari checks her map and compass, and Caleb skips stones. Further interaction depth, rewards, and revisit rules remain open.

## Thematic Purpose

Level 7 is about **rest as part of adventure**. Previous levels ask the crew to resist control, free a captive creature, and survive a dangerous confrontation. This level deliberately lowers the stakes. Nobody needs rescuing, no villain controls the island, and the Stone Curse does not interrupt the visit.

The island should feel worthwhile because the world is alive, not because it contains an emergency. Curiosity is the player's motivation. Small observations, creature behavior, environmental details, and moments among the crew replace a central conflict.

This is also the first calm opportunity to see the newly expanded crew together. Their cramped boat provides the practical reason to stop, while the visit gives their new relationships space to become comfortable. The larger-boat need remains the journey's next practical concern, but Level 7 does not need to solve or meaningfully advance it.

## Island Identity

The island is a warm, mostly wild meeting place between land and sea. Its visual and environmental identity should combine sheltered water, sun-warmed stone, tidal terrain, and pockets of lush vegetation. The result should support terrestrial, shoreline, and aquatic wildlife without making the location feel designed around any one species.

The emotional impression is a natural rest stop:

- Clear, inviting water rather than threatening open ocean.
- Warm rock shelves and beaches where creatures can bask, play, forage, or sleep.
- Quiet lagoons or tidal pools that reward looking beneath the surface.
- Shaded vegetation and a small inland area that keep the island from becoming one continuous beach.
- Gentle movement from surf, leaves, foam, reflections, and wildlife rather than machinery, fortifications, or battle hazards.
- A bright, restorative palette that contrasts with Ironbell's enclosed stone and military pressure.

The island may contain traces of passing sailors or old maritime activity, but it should not require a populated settlement, governing faction, active pirate camp, or local crisis. Any ruins or abandoned objects should enrich exploration without turning the level into a mystery the player is obligated to solve.

## Experience Principles

### No obligation

The player must be able to finish without catching a creature, completing an activity, finding a rare encounter, or visiting every area. Wildlife may simply leave through its path endpoint, and Close provides an immediate successful exit. Avoid objective counters, mandatory checklists, completion percentages, and dialogue that treats early departure as failure.

### No punishment for curiosity

Optional encounters may create temporary challenge, but they cannot produce a level-wide defeat. If the player withdraws or loses an encounter, return them safely to exploration with the opportunity available again through a clear retry or revisit rule. Do not permanently remove a discovery because of one failed attempt.

### No hidden urgency

Do not use timers, advancing threats, endangered objectives, degrading resources, or dialogue implying that the crew must hurry. Music, animation, and interface language should support lingering.

### Observation before combat

Wildlife should appear to inhabit the island before it becomes a battle target. Whenever practical, let the player see a creature sleeping, feeding, swimming, playing, displaying, or interacting with its habitat before choosing whether to approach it.

### Optional catching

Catching remains an important reward, but it is not the moral or mechanical measure of success. The player may encounter wildlife and choose to leave it undisturbed. A peaceful observation should still feel like a complete interaction.

### Small surprises

The island should contain several brief discoveries rather than one dominant spectacle. A change in behavior, a hidden path, an unusual environmental response, or a comic crew reaction can provide the payoff. These moments should remain compact enough that the level keeps its relaxed rhythm.

## Flexible Spatial Structure

The first playable map is one close, fixed-camera slice rather than a view of the whole island. It shows inland red sandstone and vegetation across the upper half, a narrow beach through the middle, and broad sheltered water across the foreground. The land route folds left, down toward the beach, then left and back inland; a separate aquatic route crosses the open foreground so swimming wildlife remains clearly visible.

Useful environmental beats include:

1. **Landing and rest area:** The boat and crew remain easy to locate. This is a place of safety rather than a defended objective.
2. **Open shoreline:** A readable introductory space with shallow water, tide pools, and visible wildlife activity.
3. **Sheltered water:** A calmer lagoon, cove, or inlet that supports swimming, resting, and less common discoveries.
4. **Sun-warmed stone:** A rocky shelf or volcanic outcrop that contrasts with the water and creates a natural gathering place.
5. **Shaded interior:** A compact vegetated area or clearing that broadens the habitat and provides playful land-based interactions.
6. **Return route or overlook:** A short path that visually reconnects the island to the boat and the wider voyage.

These are spatial functions, not locked map rooms. They may be combined, reordered, or simplified during implementation. Every major branch should either reveal something interesting or reconnect efficiently to the main route.

## Player Flow

### Arrival

Use a short introduction of five to ten player-advanced panels, with five as the preferred target. The scene should establish only what the player needs:

- The boat has become uncomfortably crowded.
- The crew has safely escaped Ironbell and needs a pause.
- The island appears calm and suitable for shore leave.
- The player is free to explore or let the wildlife pass without interference.

The sequence should end quickly enough that the player experiences the change of pace through play rather than through an explanation of relaxation.

### Free exploration

After the introduction, the full visit is optional and player-directed. There is no required order. The player may follow visible wildlife, inspect environmental details, begin optional encounters, let every creature leave undisturbed, or close the level early.

Avoid replacing a formal objective with an implicit mandatory sequence. No particular interaction is required to complete the level.

### Departure

There is no dedicated return-to-boat control or confirmation. The level ends automatically after all wildlife units are gone, using the same ordinary win flow as other levels. Pressing Close also completes the level successfully and proceeds to the same ending instead of invoking a loss route.

The closing sequence should also remain within five to ten panels, with five as the preferred target. It may acknowledge what the crew enjoyed or observed, but it must not shame the player for missed content or assume that a particular creature was caught. The crew resumes its voyage and the search for a more suitable boat.

## Optional Interaction Framework

The level should support a mixture of optional interaction shapes without requiring all of them in the first implementation:

- **Observation moments:** The player watches a short behavior and may receive a journal entry, field note, or equivalent discovery acknowledgment.
- **Approach encounters:** A creature reacts to proximity, movement, or a simple environmental interaction before offering a battle or capture opportunity.
- **Friendly challenges:** Sparring, races, pushing games, or other playful tests can use combat-like systems without implying hostility or creating a loss state.
- **Habitat interactions:** Water, rocks, vegetation, tracks, food, or found objects reveal behavior or briefly change the environment.
- **Quiet discoveries:** Some rewards may come from noticing a concealed resting place or waiting instead of acting immediately.
- **Crew moments:** Short optional reactions can establish personality and relationships without becoming separate dialogue-heavy quests.

The implementation should select only the interactions that are readable and enjoyable. Variety matters more than quantity, and none should become a checklist the player feels compelled to clear.

## Encounter and Capture Rules

- Every wildlife encounter is optional.
- The level must remain completable with zero captures.
- Encounters should arise from visible behavior or exploration rather than unexplained wave spawning whenever the game structure allows it.
- A failed or abandoned encounter returns the player to a safe state and does not cause level defeat.
- Rare encounters should not rely on a single permanently missable attempt.
- Creature aggression should read as territoriality, play, surprise, or ordinary wild behavior rather than evidence that the island is secretly dangerous.
- Catching a creature should not imply that every observed creature must be fought.
- Exact species, type distribution, encounter count, locations, rarity, capture tuning, and special abilities belong in roster data or creature-specific records, not this document.

## Progression and Rewards

The primary reward is access to new wildlife and a low-pressure space in which to explore it. Additional rewards may include journal progress, ordinary items, environmental discoveries, or small bonuses, but the level should not hide essential story progression or a uniquely necessary upgrade behind exhaustive exploration.

Set the formal completion flag after either automatic completion or a successful Close. Optional discoveries should save independently so that completion does not erase or invalidate unfinished exploration.

Whether the island becomes revisitable remains open. If it is not revisitable, the first visit should avoid permanently missable content that materially affects the player's collection or build options. If it is revisitable, return visits should begin directly in exploration without replaying the full arrival story.

## Narrative and Character Boundaries

- Keep the tone warm, lightly comic, and observant.
- Let the crew's behavior show that it is beginning to function as a group.
- Preserve Mari's role as navigator and Kip's role as artist and Cosmoid chronicler.
- Tigrevel travels voluntarily and must not be framed as captured property.
- Do not introduce a villain, authority conflict, curse outbreak, rescue mission, or surprise boss merely to manufacture conventional stakes.
- Do not deliver major Stone Curse or Isle of Whispers revelations here.
- Do not resolve the need for a larger boat; departure simply returns the crew to that continuing practical goal.
- Keep ordinary arrival and departure sequences within the established five-to-ten-panel limit.

## Presentation Direction

The level should communicate safety and openness before the player reads any instructions. Favor broad sightlines near the landing, gentle ambient motion, clear routes, and wildlife visible at a distance. Audio should emphasize water, breeze, leaves, and creature calls. Music should feel curious and restful without becoming sleepy or emotionally weightless.

Interface prompts should use invitational language such as **Explore**, **Observe**, **Approach**, and **Rest**. Avoid urgent verbs or objective framing such as **Defend**, **Survive**, **Rescue**, or **Clear all enemies**.

## Implementation Guardrails

- Do not reuse the ordinary defeat screen for optional encounter setbacks.
- Do not assign health, timer, escort, defense, or capture quotas to the level itself.
- Do not add a dedicated return-to-boat button; Close is the early successful exit.
- Separate species selection and spawn tuning from the stable level definition.
- Allow story text to remain roster-agnostic so roster changes do not require dialogue rewrites.
- Avoid assuming that the player owns, catches, or even sees any one specific species.
- Preserve the distinction between level completion and optional discovery completion.
- Save progress when the level completes automatically or through Close; additional autosaves may accompany meaningful discoveries.

## Confirmed Direction

- Level 7 is a relaxing island stop after Ironbell.
- The crew goes ashore to rest and stretch its legs.
- The level has no required objective and no loss condition.
- Exploration, observation, encounters, and catching are optional.
- Wildlife follows each route once and exits instead of turning around.
- The level completes when all wildlife units are gone; Close also counts as a win and plays the same ending.
- The first playable map is a single-screen red-sandstone shoreline slice with a folded land route and a separate open-water route.
- The five-panel arrival and six-panel departure lead directly into the search for a larger boat.
- The island supports shoreline, aquatic, rocky, and lightly vegetated habitats.
- There is no required villain, crisis, boss, or Stone Curse event.
- Creature roster details remain outside this document.

## Open Decisions

- Final island name.
- Which optional interaction types are feasible in the first playable version.
- Further encounter presentation, retry behavior, rarity, and capture tuning.
- Reward structure and journal integration.
- Whether the island is revisitable and how its wildlife resets.

## Related Records

- [Level 6 — Ironbell Officer Confrontation](level-6.md)
- [Levels 8–10 — Harbor Tournament Arc](harbor-tournament-arc.md)
- [Story, themes, and dialogue guide](../../STORY_AND_THEMES.md)
