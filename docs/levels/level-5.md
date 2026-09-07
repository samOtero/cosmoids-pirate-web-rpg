# Level 5 — Jail Break

> Working level-design record created August 30, 2026. `STORY_AND_THEMES.md` remains the source of truth for the game's overall premise, factions, themes, and dialogue rules. This document records the focused story, gameplay, art, implementation status, and open decisions for Level 5.

## Level Summary

- **Level-select name:** Jail Break
- **Location:** The flooded prison block beneath Ironbell's Navy fortress
- **Primary objective:** Break the main cell bars and free Tigrevel before the crew is overwhelmed.
- **Core gameplay idea:** Three enemy approaches converge on a visible Steel-type gate at the top center of the map. The player can eventually open connected side cells to release captive Cosmoids that join the effort to destroy the gate.
- **Story purpose:** Reveal Tigrevel, show the Navy using fear to justify cruelty, and establish that partnership is a choice rather than ownership.
- **Current status:** Story dialogue, layered battlefield background, three-path draft map, targetable main gate, destruction victory, distinct rescue behaviors for all four prisoners, and shared breakable prisoner gates are implemented. Final enemy waves and balance remain placeholders.

## Thematic Purpose

Level 5 directly supports two of the game's central themes:

- **Freedom versus control:** The Navy commander cages a creature that acted heroically because he considers uncontrolled power unacceptable.
- **Companionship versus exploitation:** Caleb initially wants to catch Tigrevel, but Tigrevel's eventual relationship with the children should be voluntary. It chooses to stay and help rather than becoming property.

The Navy should remain an institution made of individuals. The commander represents its controlling leadership, but the level should not imply that every Navy member is equally cruel.

## Story Continuity and Character Knowledge

### What Mari knows

- Mari first saw Tigrevel sitting alone on Ironbell's eastern beach.
- Razhounds attacked Mari, and Tigrevel drove them away without hurting her.
- The Navy commander declared Tigrevel dangerous and had it imprisoned beneath Ironbell.
- The Navy stopped feeding it, so Mari began secretly bringing it food.
- Mari believes Tigrevel deserves freedom.

### What Mari does not know

- Tigrevel previously had a trainer.
- The trainer is missing.
- The reason Tigrevel was alone on the beach is part of a longer mystery.

The missing trainer should not be explained during Level 5. Tigrevel can join the broader journey while refusing capture, allowing the unanswered history to remain a future story hook.

### Character motivations

- **Mari:** Free the creature that protected her and prevent the Navy from starving it.
- **Caleb:** Help immediately, but also prove himself by befriending or catching an extraordinary Cosmoid. His first instinct still treats capture as the obvious outcome.
- **Kip:** Help Mari while reacting more cautiously to an enormous unknown creature.
- **Tigrevel:** Escape captivity, then choose whether freedom means fleeing or protecting the children.
- **Navy commander:** Maintain absolute control over the fortress and any creature he considers dangerous.

### Longer arc direction

After the Navy confrontation in Level 6 is resolved, Tigrevel travels with the children voluntarily but does not allow itself to be captured. Mari also joins the sailing crew as its navigator, while Kip remains the artist and Cosmoid chronicler. The enlarged crew agrees that it needs a bigger boat. This September 6, 2026 direction supersedes the earlier plan for Mari to remain at Ironbell. These outcomes are planned story direction and are not yet represented by the current Level 5 ending, which stops at the commander's arrival. See [the Level 6 direction](level-6.md).

## Intro Sequence

The implemented introduction uses ten player-advanced panels, the ordinary maximum allowed by the project's dialogue rules.

1. Mari leads Caleb and Kip through the dripping undercroft.
2. Caleb asks what kind of Cosmoid needs a fortress for a cage.
3. Mari begins recounting seeing an unknown creature alone on the beach.
4. Razhounds surround Mari.
5. The creature drives them away.
6. The Navy captures it on the commander's order.
7. The children reach the cell and Tigrevel is revealed.
8. Tigrevel frightens Kip.
9. Caleb is amazed and declares that he wants to catch it.
10. A Navy guard discovers the group and orders them away.

### Memory-scene art direction

Mari's account is visualized as Caleb imagines it: simplified, child-painted memory images that differ from the present-day scene. Because Caleb does not know Tigrevel's appearance while hearing the story, the early memory images avoid a clear reveal. The Navy-capture memory uses a shadowy figure rather than a tarp-covered animal. Tigrevel's actual design is first shown when the children reach the cell.

## Victory Sequence

The implemented victory dialogue uses seven panels:

1. The final iron bar breaks and Tigrevel steps free.
2. Mari celebrates its freedom.
3. Mari tells it to escape before more Navy officers arrive.
4. Tigrevel looks toward the exit, then deliberately stands between the children and approaching footsteps.
5. Kip realizes Tigrevel is choosing to stay and protect them.
6. Caleb declares that they will stand together.
7. The Navy commander arrives and says, “Touching. But no one leaves my fortress without my order.”

The ending is intentionally a cliffhanger similar to a major antagonist arriving at the end of an earlier level. It establishes Tigrevel's choice without resolving the commander confrontation.

## Defeat Sequence

The defeat scene uses the existing background of Tigrevel still inside the cell and one line from Mari:

> “I'm sorry, Tigrevel... we weren't strong enough to set you free.”

## Map and Spatial Layout

- Tigrevel's main cell sits at the **top center** so the objective is immediately visible.
- Three playable paths begin along the lower edge and converge on the main cell:
  - a curving left approach;
  - a short direct center approach;
  - a mirrored curving right approach.
- Caleb, Kip, and Mari appear in the upper corridor below the main cell.
- The Navy guard who discovers the group stands on the upper-right corridor, facing the children.
- Optional cells should connect directly to the traversable path network. No cell should appear isolated from the route.
- Tower placement supports all three approaches, with additional positions near the center and the main gate.

The current battlefield background is [`apps/web/public/battles/bg/bg_level_5_ironbell_prison.png`](../../apps/web/public/battles/bg/bg_level_5_ironbell_prison.png).

## Main Gate Objective

The cell bars are implemented as a stationary enemy structure so existing tower targeting, defensive typing, damage calculation, and health-bar rendering can be reused.

### Implemented properties

- **Definition:** `tigrevel_cell_bars`
- **Display label:** `CELL BARS • STEEL`
- **Typing:** Steel
- **Maximum HP:** 260
- **Defense:** 32
- **Special Defense:** 32
- **Movement:** Stationary
- **Capture:** Disabled
- **Status effects:** Structures are immune by default.
- **Health bar:** Wider than a normal enemy bar and permanently green at every HP level.
- **Target reticle:** No special lock reticle is required.
- **Victory:** Destroying the bars ends the battle immediately, even if other enemies remain alive.

Destroying the target emits the shared `STRUCTURE_DESTROYED` event with `winsLevel: true`. This allows future prisoner attacks, effects, animations, and progression hooks to react to the destruction without hard-coding them into Level 5.

## Side-Cell Prisoner System

### Current direction

The player can attack and break optional side-cell gates. Bramfrit, Sepippet, Parlet, and Corrogoon share the same painted gate damage and rubble images while retaining per-cell position, scale, rotation, and skew controls in the TD Level Editor. Bramfrit supplies sustained gate damage through its repeated ritual charge. Sepippet provides a one-time split assault: its real body sabotages Tigrevel's gate while three temporary shadow copies defend the enemy lanes. Parlet paints persistent mosaic currents that slow and periodically push enemies while sending synchronized Water surges into Tigrevel's gate. Corrogoon repeatedly launches acid-soaked grit at every hostile creature and surviving gate, damaging them over time while reducing both defensive stats.

Every prisoner should help with the same objective in a visibly different way. No single creature should be the only valid solution. The level may be balanced to be very difficult without freeing prisoners, but whether opening cells is a formal requirement or a powerful optional strategy remains undecided.

This system creates a meaningful choice beyond simply attacking hostile Cosmoids: the player can invest tower time in liberation to gain long-term breach power.

### Selected prisoner concepts

#### Corrogoon — Poison/Ground

Corrogoon fires a map-wide volley of acid-soaked abrasive grit every six seconds. Each glob tracks one living hostile creature or surviving gate and applies **Scoured** for ten seconds. Scoured deals 4 Poison damage every two seconds and reduces both Defense and Special Defense by 25%. Reapplication refreshes the duration instead of stacking. It deliberately bypasses structure status immunity, allowing Corrogoon to erode other side gates and chain-release prisoners through the normal destruction system.

- [Dedicated Corrogoon record](../cosmoids/corrogoon.md)

#### Bramfrit — Fire

Bramfrit formally challenges the gate, retreats three paces, pauses in a clearly telegraphed charge stance, and then strikes with its heated battering horns for a large burst of structure damage.

- [Dedicated Bramfrit record](../cosmoids/bramfrit.md)

#### Sepippet — Dark

When released, Sepippet sends a shadow copy to each enemy lane while its real body travels to Tigrevel's gate. For fifteen seconds, the untargetable copies prioritize nearby enemies carrying captives and deal periodic Dark damage, while the real Sepippet deals defense-bypassing sabotage damage to the main gate. The copies then stretch back and merge with the exhausted original.

- [Dedicated Sepippet record](../cosmoids/sepippet.md)

#### Parlet — Water

Parlet is a perfectionist parrotfish whose broad scales rearrange their colors into living mosaic patterns. When released, it paints a colorful Water current along each enemy approach. Enemies inside a current move more slowly, and synchronized surges periodically push them opposite their direction of travel. The colored mosaic crests then converge on Tigrevel's gate for a combined Water-damage strike.

- [Dedicated Parlet record](../cosmoids/parlet.md)

### Remaining prisoner directions

The broader prisoner roster has explored Poison, Dark, Water, Rock, Ground, and Fire roles. Corrogoon currently covers Poison/Ground, Bramfrit covers Fire, Sepippet covers Dark, and Parlet covers Water. Additional creatures should be selected one at a time, with each providing a distinct contribution, recognizable personality, and believable reason for Navy imprisonment.

### Bramfrit implementation status

- The icon, left-facing, upward-facing, and downward-facing game assets are complete.
- Bramfrit is registered as a Fire-type Cosmoid with a dated creature manifest.
- Its Level 5 prisoner definition remains excluded from enemy waves because the captive is represented by the objective-ally system.
- Its lower-left side-cell gate is implemented as a selectable Steel structure with painted transparent PNG states for intact, bent, heavily damaged, and persistent broken-rubble visuals.
- Destroying the side gate releases Bramfrit once, clears gate focus, shows a release callout, and sends Bramfrit along a fixed route toward the main cell.
- At the main gate, Bramfrit bows, retreats, visibly winds up, charges, and deals repeated 38-damage structure impacts. Its impacts can trigger the normal destruction victory.

### Corrogoon implementation status

- The icon, left-facing, upward-facing, and downward-facing game assets are complete.
- Corrogoon is registered as a Poison/Ground Cosmoid with a dated creature manifest.
- Its Level 5 prisoner definition is registered but intentionally excluded from enemy waves.
- Its optional lower-right cell gate is implemented with the shared damage-state images.
- Destroying the gate sends Corrogoon along the mirrored right-side route toward Tigrevel's cell.
- At the objective, Corrogoon launches a colorful acid-and-grit glob at every living hostile creature and surviving structure every six seconds.
- Each impact applies or refreshes ten seconds of **Scoured**, dealing 4 Poison damage every two seconds and reducing Defense and Special Defense to 75% of their normal values.
- Scoured works on normally status-immune structures. A damage-over-time kill uses the normal structure-destruction hooks, so it can free another prisoner or destroy Tigrevel's gate.
- Corrogoon's effect does not target towers or freed objective allies.

### Sepippet implementation status

- Sepippet is represented behind its left-side gate through the objective-ally system.
- Destroying the gate releases it along an authored route toward Tigrevel's cell.
- Reaching the objective creates three translucent, untargetable shadow copies at authored lane positions.
- Shadows attack nearby enemies for fifteen seconds and prioritize enemies carrying a captive.
- The real Sepippet simultaneously deals defense-bypassing Dark sabotage damage to Tigrevel's gate every two seconds.
- The projections disappear and Sepippet becomes exhausted when the timed assault ends.

### Parlet implementation status

- The icon, left-facing, upward-facing, and downward-facing game assets are complete.
- Parlet is registered as a Water-type Cosmoid with a dated creature manifest.
- Its Level 5 prisoner definition remains excluded from enemy waves because the captive is represented by the objective-ally system.
- Its optional right-side cell gate is implemented with the shared damage-state images.
- Destroying the gate sends Parlet along an authored route toward Tigrevel's cell.
- At the objective, Parlet channels three persistent, animated mosaic currents over the enemy paths.
- Enemies in those currents move at 70% speed and are pushed backward every 4.5 seconds.
- Each synchronized surge deals 24 combined Water damage to Tigrevel's gate.

### Superseded or deferred guard idea

An earlier idea had a Navy guard move between cells and open them to release hostile Cosmoids. The current preferred direction is that the **player** breaks side-cell gates and releases allies. Guard movement and special behavior are deferred and should not be implemented until the prisoner system is established.

## Current Battle Waves

The present battle is a mechanical draft rather than a balanced final encounter:

- One stationary cell-bar structure spawns at the main cell, alongside four side-cell gates. Structures spawn only once.
- The opening wave sends one capturable Bufflora along each lane. The second authored wave sends one Marophis along each lane, followed by one Bufflora along each lane.
- After the two authored waves, the second wave's creature groups repeat indefinitely. Each reinforcement wave starts after a 12-second pause following the previous wave's last spawn, plus the authored lane delays. Living enemies and intact gates do not block reinforcements.
- `endlessWaves.spawnCountIncreaseEveryWaves` controls how often each creature spawn group's count grows, currently every 2 waves. `spawnCountIncreasePerStep` sets the additive increase, currently 1: waves 1–2 use authored counts, waves 3–4 add one per group, waves 5–6 add two, and so on. Counts are always calculated from the authored groups; structures never repeat. Omitting the interval or setting it to 0 disables count growth.
- Each repeated wave adds 10% of the creatures' original health: wave 3 has 110%, wave 4 has 120%, and so on. Levels, capture rules, movement speeds, and gate stats stay fixed.
- Clearing enemies never wins this encounter. Destroying Tigrevel's main bars wins immediately and stops reinforcements.
- The player has three lives.
- Capture is enabled for wild creatures; Sonarion patrols and structures remain uncapturable.
- The current message invites the player to focus fire on a prisoner gate and begin the breakout.

The endless escalation is implemented; the enemy roster and balance remain provisional.

## Art and Dialogue Assets

### Story backgrounds

- [`apps/web/public/bg_level_5_ironbell_undercroft.png`](../../apps/web/public/bg_level_5_ironbell_undercroft.png)
- [`apps/web/public/bg_level_5_memory_beach.png`](../../apps/web/public/bg_level_5_memory_beach.png)
- [`apps/web/public/bg_level_5_memory_razhound_attack.png`](../../apps/web/public/bg_level_5_memory_razhound_attack.png)
- [`apps/web/public/bg_level_5_memory_tigrevel_rescue.png`](../../apps/web/public/bg_level_5_memory_tigrevel_rescue.png)
- [`apps/web/public/bg_level_5_memory_navy_capture.png`](../../apps/web/public/bg_level_5_memory_navy_capture.png)
- [`apps/web/public/bg_level_5_tigrevel_cell.png`](../../apps/web/public/bg_level_5_tigrevel_cell.png)
- [`apps/web/public/bg_level_5_tigrevel_freed.png`](../../apps/web/public/bg_level_5_tigrevel_freed.png)
- [`apps/web/public/bg_level_5_tigrevel_protects_kids.png`](../../apps/web/public/bg_level_5_tigrevel_protects_kids.png)

### Human portraits

- [`apps/web/public/dialog/navy_guard_alert.png`](../../apps/web/public/dialog/navy_guard_alert.png)
- [`apps/web/public/dialog/navy_commander_neutral.png`](../../apps/web/public/dialog/navy_commander_neutral.png)

### Human battlefield assets

- [`apps/web/public/battles/characters/navy_guard_battle.png`](../../apps/web/public/battles/characters/navy_guard_battle.png)

### Tigrevel assets

- [`apps/web/public/UI/Icons/tigrevel_icon.png`](../../apps/web/public/UI/Icons/tigrevel_icon.png)
- [`apps/web/public/UI/Journal/tigrevel_journal.png`](../../apps/web/public/UI/Journal/tigrevel_journal.png)
- [`apps/web/public/battles/cosmoids/tigrevel_left.png`](../../apps/web/public/battles/cosmoids/tigrevel_left.png)
- [`apps/web/public/battles/cosmoids/tigrevel_up.png`](../../apps/web/public/battles/cosmoids/tigrevel_up.png)
- [`apps/web/public/battles/cosmoids/tigrevel_down.png`](../../apps/web/public/battles/cosmoids/tigrevel_down.png)

## Implementation Reference

| Area                                                  | Primary file                                              | Status                                  |
| ----------------------------------------------------- | --------------------------------------------------------- | --------------------------------------- |
| Level registration                                    | `apps/web/src/constants/tdLevels/index.ts`                         | Implemented                             |
| Battlefield layout and placeholder wave               | `apps/web/src/constants/tdLevels/level5.ts`                        | Draft implemented                       |
| Intro dialogue                                        | `apps/web/src/constants/dialogs/level5Intro.ts`                    | Implemented                             |
| Victory dialogue                                      | `apps/web/src/constants/dialogs/level5Win.ts`                      | Implemented                             |
| Defeat dialogue                                       | `apps/web/src/constants/dialogs/level5Lose.ts`                     | Implemented                             |
| Gate structure definition                             | `apps/web/src/constants/tdLevels/level5.ts`                        | Implemented                             |
| Structure spawning and destruction event              | `apps/web/src/engine/tower-defense/TowerDefenseEngine.ts`          | Implemented                             |
| Green structure health bar and label                  | `apps/web/src/app/components/tower-defense/PixiBattlefield.tsx`    | Implemented                             |
| Immediate destruction victory                         | `apps/web/src/app/components/tower-defense/TowerDefenseScreen.tsx` | Implemented and tested                  |
| Optional side-cell gates                              | `apps/web/src/constants/tdLevels/level5.ts`                        | Four shared-image gates implemented     |
| Freed-prisoner allied behavior                        | `apps/web/src/engine/tower-defense/TowerDefenseEngine.ts`          | All four prisoner behaviors implemented |
| Final waves and balance                               | —                                                         | Not designed                            |
| Gate destruction animation or persistent broken state | `apps/web/src/app/components/tower-defense/PixiBattlefield.tsx`    | Side-gate stages and rubble implemented |

## Confirmed Decisions

- Tigrevel's cell is visible at the top center of the battlefield.
- The map has three approaches that converge on the cell.
- The main bars are a Steel-type enemy structure.
- Towers can target and damage the bars through ordinary combat systems.
- The structure health bar remains green and has no lock reticle.
- Destroying the bars wins immediately, regardless of remaining enemies.
- Side cells connect to the path network.
- The player, not the guard, should release allied prisoners.
- Every freed prisoner contributes to breaking Tigrevel's gate.
- A tapped structure becomes the focused target for towers that have it in range.
- Freed objective allies are invulnerable, non-capturable, and ignored by enemies in the initial implementation.
- Tigrevel chooses to remain with and protect the children after being freed.
- The Navy commander arrives at the end as the cliffhanger.
- His confrontation continues in Level 6; Mari and Tigrevel join the crew after it, with Mari serving as navigator.

## Open Decisions

- Decide whether freeing side prisoners is formally required or simply makes an otherwise difficult gate practical.
- Decide whether side gates have different typings, defenses, or health values.
- Decide whether later prisoners reuse authored routes and invulnerability or introduce more general allied navigation and danger.
- Replace the placeholder Sonarions with final Navy-controlled enemies and waves.
- Decide whether enemies primarily threaten player lives, delay the breach, attack allied prisoners, or combine those pressures.
- Balance the main gate after prisoner contributions exist; the current 260 HP and defenses are provisional.
- Create matching damage stages for the main gate and remaining cells, plus destruction effects and audio.
- Determine how Tigrevel's voluntary, uncaptured companionship is represented in the roster and later battles.
- Plan the first subtle clue about Tigrevel's missing trainer without revealing the mystery during this level.
