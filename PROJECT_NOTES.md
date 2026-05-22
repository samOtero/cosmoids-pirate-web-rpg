# Project Notes

This file contains notes and observations about the project and how to work with it. Update this file as you learn more about the project and how we should do our development.

## [2026-02-07] Architecture Summary

### Tech Stack

- **Framework**: Next.js 16 (App Router) with React 19.
- **State Management**: Zustand (persisted).
- **Styling**: Tailwind CSS v4.
- **Testing**: Vitest, React Testing Library.

### Core Architecture

- **Single Page App Structure**: The application main entry point is src/app/page.tsx, which conditionally renders different screens (Start, Profiles, Dialog, Map, Battle) based on the currentScreen state in the Zustand store.
- **Event-Driven Flow**: Game progression is managed via an eventQueue in gameStore.ts. Events (e.g., SHOW_DIALOG, START_BATTLE) are processed sequentially to drive the game forward.
- **Data Models**: Core types like Profile, Creature, and Item are defined in src/types/baseGame.ts.

### Features

### Core Concept: Cosmoids (Some are this are still TODO)

Cosmoids are creatures that live alongside humans as companions and helpers.

- **Types:** Similar to classic elemental types (Grass, Water, Fire). Types have distinct strengths and weaknesses against each other. Custom or unique types may be added later.
- **Attacks:** Cosmoids learn attacks via leveling up or special training. They hold up to 4 attacks at a time, changeable only outside of battle.
- **Attack Utility:** Primarily used for tower defense battling, but some attacks provide out-of-battle utility.
- **Limitations:** Cosmoids have restricted movepools based on their species and type.

> **Design Note:** Consider adding out-of-battle passive abilities, but evaluate if the added complexity is necessary for the core loop first.

---

### Tower Defense Battling Mechanics (Some of these are TODO)

Select a party of up to 6 Cosmoids to deploy in a level.

- **Capture:** Use a "Capture Doubloon" to catch weakened wild Cosmoid enemies and add them to your crew.
- **Progression:** Earn experience points by defeating or capturing enemies. Cosmoids retain their XP, levels, attacks, and evolutions across all levels.
- **Dynamic Combat:** Swap attacks mid-level for strategy. Freely move and swap deployed Cosmoids to dodge area-of-effect attacks or focus on specific zones.
- **In-Battle Events:** Cosmoids can level up, learn moves, evolve, take damage, or faint during a level.
- **Items:** Use items to heal or boost Cosmoids during combat.
- **Type Matchups:** Enemy and defender types dictate damage scaling (weaknesses and strengths).

### Battle Objectives (Battles are done but we don't cover all the different types of modes yet)

| Objective Type    | Description                                                                                             |
| :---------------- | :------------------------------------------------------------------------------------------------------ |
| **Candy Defense** | Protect story-relevant objects ("candy"). Lose a life if one is taken; lose the level if all are taken. |
| **Area Defense**  | Prevent enemies from reaching a specific map point. Lose points upon breach.                            |
| **Time Offense**  | Defeat a set number of enemies before the timer runs out.                                               |
| **Survival Time** | Survive for a specific duration without losing all lives (often combined with other modes).             |
| **Pending Ideas** | Need brainstorming for additional game modes!                                                           |

> **Potential Upgrade Idea:** Implement temporary in-level evolution or upgrade trees (similar to traditional TD tower upgrades). Need to explore how to make these choices interesting and support diverse playstyles.

---

### Exploration and Traveling (Still TODO)

Time advances as you move from node to node across the world map.

- **By Foot:** Navigate different nodes within a specific landmass or island.
- **By Ship:** Travel across the ocean between landmarks. Upgrading the ship allows for faster travel or access to dangerous waters.
- **Backtracking (Metroidvania):** Unlock new areas in older zones using new abilities (e.g., returning to a bush after getting the "Cut" equivalent).
- **Teleporting:** Befriend specific Cosmoids (e.g., a Thornado-generating Cosmoid) to fast-travel between nodes, similar to _The Wind Waker_.
- **Out-of-Battle Tools:** Cosmoids provide exploration utilities, such as pulling floating items onto the ship.
- **Ship Summoning:** Explore mechanics for recalling your docked ship from different coasts (potentially via a specific Cosmoid or upgrade).

---

### Encounters and Events (Still TODO)

Moving between nodes triggers encounters (scripted or random RNG). These are usually smaller than full levels.

| Encounter Type        | Description                                                                                                                                                                     |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Sandbars**          | Find Cosmoids needing rescue, or defend treasure/messages in bottles from wild Cosmoids.                                                                                        |
| **Other Ships**       | **Aggressive:** Try to board you. **Friendly:** Merchants offering items, quests, or lore. **Ghost Ships:** Appear in specific waters/times.                                    |
| **Flying Cosmoids**   | Engage airborne enemies; having a high mast or your own flying Cosmoids improves your chances.                                                                                  |
| **Swimming Cosmoids** | Aquatic enemies attempt to board, or discover a school of them to battle with your Water types. (Potential fishing mechanic?)                                                   |
| **Stowaways**         | Triggered after leaving an island. Can be destructive (eating sails), thieves, or friendly creatures needing a home. Attracted by cargo and departure location.                 |
| **Weather Events**    | Storms can push you back to earlier nodes if unprepared. Certain Cosmoids protect against specific weather or only spawn during it. (Need to define in-battle weather effects). |
| **Legendary Visits**  | Rare Water or Flying legendaries may visit the ship once specific progression or ship upgrades are met.                                                                         |

---

### Economy (Still TODO)

| Category            | Sources / Sinks                                                              |
| :------------------ | :--------------------------------------------------------------------------- |
| **Earning Income**  | Completing quests, finding treasure, selling items, defeating rival pirates. |
| **Spending Income** | Purchasing ship upgrades, buying items (food, tools), purchasing clues.      |

---

### Pokedex and Journal System (Still TODO)

A "Captain's Log" or "Field Journal" tracks creatures and lore.

- **Acquiring Clues:** Talk to NPCs, explore the environment, complete quests, or buy clues.
- **World Drops:** Find items like Torn Pages, Strange Scales, Maps, or Messages in a Bottle to trigger quests.
- **Tracking:** The journal catalogs available creatures per area and compiles collected clues (potentially unlocking sketches).
- **Bounty Board:** Complete specific hunts or quests for rewards.

> **Design Note:** Need to finalize if Cosmoids are found purely by being in the right place/time, or if clue-gathering is a mandatory mechanic for encounters.

---

### Factions and Reputation (Still TODO)

Interact with different Pirate Crews and the Navy.

- **Reputation System:** Gain reputation levels with different factions.
- **Dynamic Quests:** Unlock different quests depending on your current faction standing.
- **Potential Rewards:** Outfits, exclusive Cosmoids, unique ship upgrades, special evolutions, or branching story endings.

## [2026-03-26] Scrollable Background for TD Levels

Added optional `backgroundScale` property to `TDLevelData`. When set > 1 (e.g. 1.5), the background renders at that multiple of the screen height and supports vertical drag-to-scroll. The scroll offset is tracked via `scrollYRef` and applied to `bgBounds.y`, so all percentage-based entity positioning remains correct. Both `PixiBattlefield.tsx` and `PixiTDLevelEditor.tsx` support this feature. The forest level uses `backgroundScale: 1.5`.

## [2026-03-26] Zoom Controls for TD Map

Added zoom in/out buttons (+/-) to PixiBattlefield when `backgroundScale > 1`. Zoom range is `1/backgroundScale` (fully zoomed out, entire bg visible) to `1` (normal view). All entity containers, spot graphics, and floating text scale by `zoom`. The `updateBgLayout` function reads `zoomRef` each tick so zoom changes take effect immediately. Display dimensions = `fullBg * zoom`, scroll limits shrink as you zoom out.

## [2026-04-25] Tower Drag-and-Click Bug Fix

When dragging a tower via pointer events, the browser fires a 'click' event after 'pointerup'. Since dragStateRef was already reset by the time click fires, the attack selection menu would open. Fixed by adding a justDraggedRef flag that is set to true on pointerup (during a drag) and checked/cleared in the TowerButton onClick handler.

## [2026-05-01] Level Select Screen Replaces Maps

Removed the World Map (`Screens.MAP`) and Island Map (`Screens.ISLAND_MAP`) screens. Replaced with a single Level Select screen (`Screens.LEVEL_SELECT`) that displays TD levels as numbered blocks in a grid. The flow is now Start => Profiles => Level Select => Tower Defense. Events `GO_TO_MAP`/`GO_TO_ISLAND_MAP` were consolidated into `GO_TO_LEVEL_SELECT`. `SHOW_ISLAND_MAP_DIALOG` became `SHOW_LEVEL_SELECT_DIALOG`. Level ordering is defined in `LEVEL_ORDER` array in `src/constants/tdLevels/index.ts`. Includes 4 placeholder locked levels beyond the 2 real ones.

## [2026-05-01] Mode Select Screen

Added `Screens.MODE_SELECT` between Profile and Level Select. Flow is now Start => Profiles => Mode Select => Level Select (Story) => Tower Defense. The Mode Select screen shows two cards: Story (active, routes to Level Select) and Challenge (disabled, 'Coming Soon'). `GO_TO_MODE_SELECT` event type added. Returning players after defeating the first battle now go to Mode Select. The `ModeSelectScreen` component lives at `src/app/components/ModeSelectScreen.tsx`.

## [2026-05-02] Pokemon HP/Stat Formulas for TD Units

Towers and enemies now use the Pokemon stat formula (without IV/EV) for initial HP and attack. HP formula: `floor((2 * Base * Level) / 100) + Level + 10`. Non-HP stat formula: `floor((2 * Base * Level) / 100) + 5`. These are calculated via `calculateMaxHp` and `calculateStat` from `src/utils/resolvePlayerCreature.ts`. On level-up and evolution, tower HP is recalculated while preserving the current HP percentage. The `enemyHpMultiplier` in TDLevelData is still applied as a multiplier on top of the formula result.

## [2026-05-03] Challenge Mode

Added challenge mode accessible from Mode Select -> Challenge Select -> TD Level. Challenge levels use a `premadeRoster` field on `TDLevelData` to provide fixed creatures instead of the player's party. The first challenge is 'One Life Gauntlet': Level 1's layout with 1 life and a single Fueguana (starter_iguana at level 1). Captures during challenge levels work in-level (added to engine roster) but are never persisted to the player's profile. Tower progress (XP, levels) is also not saved back. The `GO_TO_CHALLENGE_SELECT` event routes back to `Screens.CHALLENGE_SELECT`. The `CHALLENGE_LEVEL_ORDER` array in `src/constants/tdLevels/index.ts` drives the challenge select screen.

## [2026-05-04] Special Attack / Special Defense Stats

Added `specialAttack` and `specialDefense` base stats to the `Creature` interface and all creature definitions. Added `category: 'physical' | 'special'` to `AttackDefinition`. Physical attacks (Scratch, Tackle, Vine Whip, String Shot) use `attack`/`defense`; special attacks (Ember, Bubble Beam) use `specialAttack`/`specialDefense`. Both `Tower` and `Enemy` runtime types now carry pre-calculated `currentSpecialAttack`, `currentDefense`, and `currentSpecialDefense` (alongside existing `currentAttack`). These stats are computed at spawn/placement time and recalculated on level-up and evolution in `TDProgressionManager`. The damage formula in `EffectProcessor.applyDamageAndEffects()` selects the appropriate stat pair based on the attack's category.

## [2026-05-05] Base Experience Property Added to Creatures

Added a `baseExperience` field to the `Creature` interface in `baseGame.ts` and to all creature definitions in `creatures.ts`. This field will be used in the future for calculating how much experience is awarded when a creature is defeated. Values range from ~50 (weak/early creatures like Mouse, Bird) to ~140 (evolved creatures like Moth). No logic changes yet�just the data field.

## [2026-05-05] Pok�mon EXP Formula Implemented

Implemented the Pok�mon Gen V+ scaled experience formula in the Tower Defense engine. The flat \xpYield\ system has been replaced. EXP is now calculated using \aseExperience\ from the Creature definition and the levels of the enemy and tower. Using the Gen V rule, the total EXP is split evenly among all towers that participated in damaging the enemy. The level-up curve has also been changed to the Medium Fast curve (\L�\).

## [2026-05-14] Dialog Screen Landscape Layout
The DialogContent component now uses Tailwind's landscape: variant to switch from vertical (portrait stacked above dialog) to horizontal (portrait left, dialog right) layout when in landscape orientation. Custom variants for landscape/portrait were added to globals.css via @custom-variant (required for Tailwind v4). Portrait images are constrained to max-h-[40vh] in landscape mode to prevent overflow.

## [2026-05-18] Mobile Landscape Default Layout Policy (Profile & Mode Selection Screens)

Adopted a mobile-first responsive styling policy for screens intended primarily for mobile landscape gameplay where portrait orientation is not supported.
- **Mobile First Approach**: Mobile landscape layout is the default/base styling, and desktop-specific enhancements are layered on top via `lg:` prefixes.
- **Profile Selection Screen (`src/app/components/profileScreen.tsx`)**:
  - Grid: `grid-cols-3` by default horizontally aligns the 3 profiles, with `lg:grid-cols-3` retained for desktop.
  - Height & Sizing: Uses `h-52` by default to fit perfectly in landscape height without scrollbars, scaling to `lg:h-64` on desktop.
  - Scale Factors: Shrunk padding/margins (`p-2 lg:p-4`), page titles (`text-xl lg:text-3xl`), avatar containers (`w-12 h-12 lg:w-16 lg:h-16`), and interactive elements to prevent vertical overflow.
- **Mode Selection Screen (`src/app/components/ModeSelectScreen.tsx`)**:
  - Grid: `grid-cols-2` by default horizontally aligns the "Story" and "Challenge" cards, overriding the vertical stack layout on mobile devices.
  - Card Dimensions: Card padding and min-height default to compact styles (`p-4 min-h-[160px]`), scaling up on desktop (`lg:p-8 lg:min-h-[220px]`).
  - Typography & Icons: Header title (`text-lg lg:text-3xl`), descriptions (`text-xs lg:text-sm`), and buddy icons (`w-12 h-12 lg:w-20 lg:h-20`) scale up gracefully via `lg:` overrides.

## [2026-05-19] Party Screen Responsive Mobile Landscape Design

Optimized the Party Screen layout (\src/app/components/PartyScreen.tsx\) to natively support mobile landscape viewports in full compliance with the responsive styling policy. Added screen-size listeners to dynamically adjust the pagination limits (6 creatures per page on mobile landscape, 18 on desktop) and scaled slot paddings, margins, and sizes to ensure the active party is always visible and zero vertical overflow occurs on compact viewports.

## [2026-05-19] Party Screen Drag-and-Drop Fix

Fixed a critical bug in the party screen where dragging a creature to empty party slots or empty storage box slots did not work. The issue occurred because the \eorderCreatures\ store action had a strict out-of-bounds check (\endIndex >= creatures.length\) and returned early without modifying the state. Since the UI grid slots are statically sized (6 for active team, and 6/18 for storage pages) and can exceed the player's total creature count, empty slots naturally map to out-of-bounds indices. Clamped \endIndex\ to \creatures.length - 1\ in \eorderCreatures\ so that dropping on any empty slot successfully appends or shifts the creature to the end. Also added \onDragEnd\ handlers in \PartyScreen.tsx\ to ensure \draggedIndex\ is cleared if a drag is canceled.

## [2026-05-19] Mobile Tap-to-Swap Support for Party Screen

Added a tap-to-swap selection fallback to \PartyScreen.tsx\ for mobile and touch-screen viewports since standard HTML5 drag-and-drop does not natively function on touch devices. Tapping any occupied slot selects that creature, applying a premium pulsing cyan outline (\ing-2 ring-cyan-400\), scale zoom (\scale-105\), dropshadow, and higher stacking index (\z-20\). Tapping another slot (whether occupied or empty) performs a swap or reorder and clears the selection. Navigating between pages in storage automatically deselects the current creature to prevent off-screen swaps. Updated visual helper text to guide players: 'Drag or tap to swap creatures between team slots and storage.'

## [2026-05-19] Party Screen Custom Pointer Drag-and-Drop
Replaced HTML5 Drag & Drop and tap-to-move mechanisms with unified PointerEvents on the Party Screen. Supports smooth drag-and-drop interactions across mouse and mobile landscape touch screens. Uses elementFromPoint hit-testing over data-slot-index attributes on pointerup for drop detection, bypassing a fixed floating drag preview styled with pointer-events-none.

## [2026-05-20] Storybook Integration\
Storybook has been integrated into the repository using \pnpm\ and configured for Next.js and Tailwind CSS v4. Added custom viewport support for mobile landscape (896x414) in \.storybook/preview.tsx\ to easily test components in landscape aspect ratios under the project default mobile layout policy. Added first set of component stories for \Button\ and \TypeBadge\ UI components.

## [2026-05-20] Party Screen Storybook Story
Added Storybook stories for \PartyScreen\ inside \src/app/components/PartyScreen.stories.tsx\. The stories include a stateful interactive wrapper that manages dynamic creature drag-and-drop / tap-to-swap, a minimal early-game view with only the starter creature, and a large roster layout testing the Box pagination controls.

## [2026-05-20] Storybook Fullscreen Layout Decorator Fix
Fixed a layout overflow issue where fullscreen screens (e.g. \PartyScreen\) in Storybook were padded and flex-centered by the global decorator in \.storybook/preview.tsx\. Modified the global decorator to dynamically inspect \context.parameters.layout\ and omit the \p-4 min-h-screen flex items-center justify-center\ styling when the story has \layout: 'fullscreen'\, applying a clean full-screen layout container instead.

## [2026-05-20] Vitest Config Vite 8 Type Mismatch Fix
Casted the react() plugin to any in vitest.config.ts. This bypasses TypeScript typechecking errors during next build arising from compatibility differences between Vite 8 (using Rolldown plugin types) and Vitest (using Vite 7 Rollup plugin types).

## [2026-05-20] Party Screen Before Level Entry
When selecting a story level from the Level Select screen, the player is now routed to the Party Screen first to arrange their team before entering the level. The Party Screen shows a 'Set Sail!' button (via the new optional `onContinue` prop) that proceeds through any queued intro events and then into the Tower Defense level. Pressing 'Back' clears the pending level events and returns to Level Select. Challenge levels skip the party screen entirely and go directly to Tower Defense, matching their existing behavior of using premade rosters.

## [2026-05-21] Separate Storage Array for Party Screen
Split the single `creatures` array on the `Profile` type into two independent arrays: `creatures` (active party, max 6) and `storageCreatures` (storage box). The Party Screen now receives both arrays as separate props. The `reorderCreatures` store action uses a global index scheme (0-5 = party, 6+ = storage) to support cross-array swaps. `addCreatureToProfile` adds to party if under 6, otherwise to storage. `updateCreatures` only searches and updates the active party (`creatures`) array, as storage creatures are not present/active during a tower defense level. Bumped `CURRENT_PROFILE_VERSION` to 5 to trigger profile migration.

## [2026-05-21] Catch Redirection to Storage on Full Party

Implemented a limit on active party roster additions during levels. In `TowerDefenseEngine.captureEnemy()`, a caught creature is only pushed to the in-level active `roster` if the roster size is under 6. Added comprehensive unit tests in `creature.test.ts` to verify the logic under both state branches.

## [2026-05-21] Profile Start Dialogue Flow Update
Updated NEW_PLAYER_EVENTS in src/constants/events.ts so that when a profile is first started, the game plays the initial welcome dialogue (NEW_PLAYER_WELCOME_DIALOG) and then immediately routes the player to the Level Select screen (Screens.LEVEL_SELECT) instead of automatically playing the second dialogue and launching into the first level.
