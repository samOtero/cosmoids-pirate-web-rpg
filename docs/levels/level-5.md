# Level 5 — The Caged Claw

> Working level-design record created August 30, 2026. `STORY_AND_THEMES.md` remains the source of truth for the game's overall premise, factions, themes, and dialogue rules. This document records the focused story, gameplay, art, implementation status, and open decisions for Level 5.

## Level Summary

- **Level-select name:** The Caged Claw
- **Location:** The flooded prison block beneath Ironbell's Navy fortress
- **Primary objective:** Break the main cell bars and free Tigrevel before the crew is overwhelmed.
- **Core gameplay idea:** Three enemy approaches converge on a visible Steel-type gate at the top center of the map. The player can eventually open connected side cells to release captive Cosmoids that join the effort to destroy the gate.
- **Story purpose:** Reveal Tigrevel, show the Navy using fear to justify cruelty, and establish that partnership is a choice rather than ownership.
- **Current status:** Story dialogue, backgrounds, three-path draft map, targetable gate structure, and destruction victory are implemented. Enemy waves and allied side-prisoner mechanics remain placeholders or concepts.

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

After the Navy confrontation is resolved, Tigrevel should travel with the children voluntarily but should not allow itself to be captured. Mari remains at Ironbell rather than joining the sailing crew. This outcome is planned story direction and is not yet represented by the current Level 5 ending, which stops at the commander's arrival.

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
- Optional cells should connect directly to the traversable path network. No cell should appear isolated from the route.
- Tower placement supports all three approaches, with additional positions near the center and the main gate.

The current battlefield background is [`public/battles/bg/bg_level_5_ironbell_prison.png`](../../public/battles/bg/bg_level_5_ironbell_prison.png).

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

The player should be able to attack and break optional side-cell gates. A freed prisoner becomes an allied autonomous unit, travels toward Tigrevel's cell, and contributes directly to breaking the main gate.

Every prisoner should help with the same objective in a visibly different way. No single creature should be the only valid solution. The level may be balanced to be very difficult without freeing prisoners, but whether opening cells is a formal requirement or a powerful optional strategy remains undecided.

This system creates a meaningful choice beyond simply attacking hostile Cosmoids: the player can invest tower time in liberation to gain long-term breach power.

### Selected prisoner concepts

#### Corrogoon — Poison/Ground

Corrogoon fires acid-soaked abrasive grit at the gate. Its planned **Scoured** effect reduces the gate's defense and improves damage from the player and every other prisoner.

- [Dedicated Corrogoon record](../cosmoids/corrogoon.md)

#### Bramfrit — Fire

Bramfrit formally challenges the gate, retreats three paces, pauses in a clearly telegraphed charge stance, and then strikes with its heated battering horns for a large burst of structure damage.

- [Dedicated Bramfrit record](../cosmoids/bramfrit.md)

#### Sepippet — Dark

Sepippet projects a false Navy guard while its own arms flatten into shadows and pass through the main gate's seams. The shadows remove internal locking pins, dealing defense-bypassing sabotage damage and leaving each removed component visibly absent.

- [Dedicated Sepippet record](../cosmoids/sepippet.md)

#### Parlet — Water

Parlet is a perfectionist parrotfish whose broad scales rearrange their colors into living mosaic patterns. Its identity is intentionally independent of the gate-breaking objective: it is a complete reef species that happens to have been imprisoned, and its eventual contribution should be chosen after the shared prisoner system is established.

- [Dedicated Parlet record](../cosmoids/parlet.md)

### Remaining prisoner directions

The broader prisoner roster has explored Poison, Dark, Water, Rock, Ground, and Fire roles. Corrogoon currently covers Poison/Ground, Bramfrit covers Fire, Sepippet covers Dark, and Parlet covers Water. Additional creatures should be selected one at a time, with each providing a distinct contribution, recognizable personality, and believable reason for Navy imprisonment.

### Bramfrit implementation status

- The icon, left-facing, upward-facing, and downward-facing game assets are complete.
- Bramfrit is registered as a Fire-type Cosmoid with a dated creature manifest.
- Its Level 5 prisoner definition is registered but intentionally excluded from enemy waves.
- Opening its optional cell and running its allied three-step charge remain future gameplay work.

### Corrogoon implementation status

- The icon, left-facing, upward-facing, and downward-facing game assets are complete.
- Corrogoon is registered as a Poison/Ground Cosmoid with a dated creature manifest.
- Its Level 5 prisoner definition is registered but intentionally excluded from enemy waves.
- Opening its optional cell, allied navigation, abrasive spray, and the **Scoured** gate effect remain future gameplay work.

### Parlet implementation status

- The icon, left-facing, upward-facing, and downward-facing game assets are complete.
- Parlet is registered as a Water-type Cosmoid with a dated creature manifest.
- Its Level 5 prisoner definition is registered but intentionally excluded from enemy waves.
- Its optional-cell location, release behavior, and contribution to the escape remain future gameplay work.

### Superseded or deferred guard idea

An earlier idea had a Navy guard move between cells and open them to release hostile Cosmoids. The current preferred direction is that the **player** breaks side-cell gates and releases allies. Guard movement and special behavior are deferred and should not be implemented until the prisoner system is established.

## Current Battle Placeholder

The present battle is a mechanical draft rather than a balanced final encounter:

- One stationary cell-bar structure spawns at the main cell.
- One uncapturable Level 8 Sonarion patrol approaches on each of the three lanes.
- The player has three lives.
- Capture is disabled for the entire level.
- The current message says: “Defend all three approaches to Tigrevel's cell!”

The placeholder patrols validate lane geometry, tower targeting, structure targeting, and destruction victory. They do not represent the intended final wave design.

## Art and Dialogue Assets

### Story backgrounds

- [`public/bg_level_5_ironbell_undercroft.png`](../../public/bg_level_5_ironbell_undercroft.png)
- [`public/bg_level_5_memory_beach.png`](../../public/bg_level_5_memory_beach.png)
- [`public/bg_level_5_memory_razhound_attack.png`](../../public/bg_level_5_memory_razhound_attack.png)
- [`public/bg_level_5_memory_tigrevel_rescue.png`](../../public/bg_level_5_memory_tigrevel_rescue.png)
- [`public/bg_level_5_memory_navy_capture.png`](../../public/bg_level_5_memory_navy_capture.png)
- [`public/bg_level_5_tigrevel_cell.png`](../../public/bg_level_5_tigrevel_cell.png)
- [`public/bg_level_5_tigrevel_freed.png`](../../public/bg_level_5_tigrevel_freed.png)
- [`public/bg_level_5_tigrevel_protects_kids.png`](../../public/bg_level_5_tigrevel_protects_kids.png)

### Human portraits

- [`public/dialog/navy_guard_alert.png`](../../public/dialog/navy_guard_alert.png)
- [`public/dialog/navy_commander_neutral.png`](../../public/dialog/navy_commander_neutral.png)

### Tigrevel assets

- [`public/UI/Icons/tigrevel_icon.png`](../../public/UI/Icons/tigrevel_icon.png)
- [`public/UI/Journal/tigrevel_journal.png`](../../public/UI/Journal/tigrevel_journal.png)
- [`public/battles/cosmoids/tigrevel_left.png`](../../public/battles/cosmoids/tigrevel_left.png)
- [`public/battles/cosmoids/tigrevel_up.png`](../../public/battles/cosmoids/tigrevel_up.png)
- [`public/battles/cosmoids/tigrevel_down.png`](../../public/battles/cosmoids/tigrevel_down.png)

## Implementation Reference

| Area                                                  | Primary file                                              | Status                 |
| ----------------------------------------------------- | --------------------------------------------------------- | ---------------------- |
| Level registration                                    | `src/constants/tdLevels/index.ts`                         | Implemented            |
| Battlefield layout and placeholder wave               | `src/constants/tdLevels/level5.ts`                        | Draft implemented      |
| Intro dialogue                                        | `src/constants/dialogs/level5Intro.ts`                    | Implemented            |
| Victory dialogue                                      | `src/constants/dialogs/level5Win.ts`                      | Implemented            |
| Defeat dialogue                                       | `src/constants/dialogs/level5Lose.ts`                     | Implemented            |
| Gate structure definition                             | `src/constants/tdLevels/level5.ts`                        | Implemented            |
| Structure spawning and destruction event              | `src/engine/tower-defense/TowerDefenseEngine.ts`          | Implemented            |
| Green structure health bar and label                  | `src/app/components/tower-defense/PixiBattlefield.tsx`    | Implemented            |
| Immediate destruction victory                         | `src/app/components/tower-defense/TowerDefenseScreen.tsx` | Implemented and tested |
| Optional side-cell gates                              | —                                                         | Not implemented        |
| Freed-prisoner allied behavior                        | —                                                         | Not implemented        |
| Final waves and balance                               | —                                                         | Not designed           |
| Gate destruction animation or persistent broken state | —                                                         | Not implemented        |

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
- Tigrevel chooses to remain with and protect the children after being freed.
- The Navy commander arrives at the end as the cliffhanger.

## Open Decisions

- Decide whether freeing side prisoners is formally required or simply makes an otherwise difficult gate practical.
- Define how the player targets side-cell gates and how those structures interact with ordinary enemy-targeting priority.
- Decide whether side gates have different typings, defenses, or health values.
- Define allied prisoner pathfinding, invulnerability or health, target selection, and behavior when enemies block the route.
- Select the remaining prisoner creatures and give each a unique gate contribution.
- Replace the placeholder Sonarions with final Navy-controlled enemies and waves.
- Decide whether enemies primarily threaten player lives, delay the breach, attack allied prisoners, or combine those pressures.
- Balance the main gate after prisoner contributions exist; the current 260 HP and defenses are provisional.
- Create gate damage stages, destruction effects, audio, and a persistent destroyed-cell visual if needed.
- Determine how Tigrevel's voluntary, uncaptured companionship is represented in the roster and later battles.
- Decide when Mari stays behind and how that farewell is shown.
- Decide where the commander's confrontation occurs and whether it becomes Level 6, an overworld sequence, or another encounter.
- Plan the first subtle clue about Tigrevel's missing trainer without revealing the mystery during this level.
