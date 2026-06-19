# Project Notes

This file contains the core architecture guidelines, key conventions, engineering quirks, and roadmap ideas for Cosmoids Web. **Keep this file updated with persistent design patterns and gotchas.**

---

## 🛠️ Core Architecture & Tech Stack

### Tech Stack
- **Framework**: Next.js 16 (App Router) with React 19.
- **State Management**: Zustand (persisted).
- **Styling**: Tailwind CSS v4.
- **Testing**: Vitest, React Testing Library.

### Navigation & Flow
The application is a single-page app structure (`src/app/page.tsx`). Screens are conditionally rendered based on the `currentScreen` state in the Zustand store.
- **Flow**: `Screens.START` ➔ `Screens.PROFILES` ➔ `Screens.MODE_SELECT` ➔ `Screens.LEVEL_SELECT` (Story) or `Screens.CHALLENGE_SELECT` (Challenge).
- **Party Preparation**: In Story Mode, selecting a level routes the player to the Party Screen to arrange their team first. Pressing "Set Sail!" continues to the TD level. Challenge levels use a fixed roster (`premadeRoster` field in `TDLevelData`) and bypass the Party Screen.
- **Zustand Event Queue**: Dialogues and progression transitions are driven sequentially by an event queue defined in `gameStore.ts`.

---

## 🎨 Key Coding Conventions & Standards

### 📱 Base Styling & Layout (Mobile Landscape First)
- **Base Sizing**: Mobile landscape is the native baseline layout. Do not design or optimize for portrait.
- **Desktop Targeting**: Use the `lg:` breakpoint prefix exclusively for desktop overrides. Avoid intermediate breakpoints (`md:`, `sm:`).
- **Avoiding Overflow**: Constrain heights (e.g. using `h-52`, `max-h-[40vh]`, and small margins/paddings) so all interface elements fit on a compact mobile landscape screen without triggering vertical scrollbars.
- **Dialog Portraits**: Portrait images must be restricted to `max-h-[40vh]` in landscape mode to prevent clipping. Custom variants for orientation are defined in `globals.css` via `@custom-variant`.

### 💾 Creature Storage (Party vs. Box)
- **Active Party**: `creatures` array on `Profile` (max 6 active creatures).
- **Storage Box**: `storageCreatures` array on `Profile` (unlimited, paginated on UI).
- **Catch Logic**: In-level captures only get added to the active roster if roster size is under 6. If the party is full, caught creatures are sent directly to the profile's `storageCreatures`.
- **Level Recalculation**: During a level, only active party creatures (`creatures`) receive XP, level up, or evolve.

### 💬 Dialogs & Branching Jumps
- **Line ID Naming**: Use unique, descriptive strings for the `id` property on dialog lines that are target destinations (e.g., `choice_start`, not `line_1`).
- **Jumping**: Use `jumpToLineId` on dialog buttons to branch and skip directly to targeted line IDs.
- **Validation**: Dialog configurations must pass build-time validation (`pnpm validate:dialogs`), test-time validation (Vitest), and runtime defensive validation.

### ⚔️ Stats & Experience formulas
- **Stats Formula**: Towers and enemies use Pokemon Gen I/II formula. 
  - HP: `floor((2 * Base * Level) / 100) + Level + 10`
  - Non-HP: `floor((2 * Base * Level) / 100) + 5`
- **Damage Scaling**: Categorized into `physical` (scales on `attack`/`defense`) and `special` (scales on `specialAttack`/`specialDefense`).
- **Experience Curve**: Uses the Medium Fast level curve. Experience points are awarded dynamically based on the Pokemon Gen V+ scaled formula. Total XP is split evenly among all towers that dealt damage to the defeated enemy.

---

## ⚠️ Key Engineering Quirks & Gotchas

### 👆 Touch Drag-and-Drop vs Click Propagation
- **PointerEvents**: We use unified `PointerEvents` instead of HTML5 Drag-and-Drop or touch events for the Party Screen to ensure smooth drag-and-drop on both mouse and mobile touch screens.
- **Drop Detection**: We bypass HTML5 drop zones by utilizing `elementFromPoint` hit testing over `data-slot-index` attributes on `pointerup`.
- **Drag vs. Click Collision**: Pointer dragging fires a browser `click` event on pointer release. To prevent the click handler from firing when a drag finishes (e.g. opening menus accidentally), we track dragging using a `justDraggedRef` flag. This flag is set to `true` on drag end and checked/cleared in click handlers.

### ⚙️ Scrollable Backgrounds & Zooming
- **Zoom & Scroll**: Levels can configure a `backgroundScale > 1` (e.g., `1.5`) for maps larger than the viewport.
- **Coordinate Mapping**: Percentage-based layouts remain correct because coordinates map relative to background dimensions. Make sure any layout modifications update coordinates relative to the scaled background bounds, not raw screen coordinates.

### 🧪 Vite 8 / Vitest Type Compatibility
- **TypeScript Workaround**: To bypass compatibility differences between Vite 8's Rolldown-based plugin types and Vitest's rollup types in `vitest.config.ts`, the `react()` plugin configuration must be cast to `any`.

---

## 🔮 Roadmap Ideas & Features (TODO / Pending)

### Core Concept: Cosmoids
- Implement out-of-battle passive abilities (evaluate if complexity is worth the value).
- Complete type matchup balancing for advanced elemental classes.

### Battle Objectives
- **Area Defense**: Prevent enemies from reaching map points (loss of points on breach).
- **Time Offense**: Defeat N enemies before time expires.
- **Survival Time**: Survive for a specific duration.
- **Upgrades**: Temporary in-level evolution or upgrade trees (traditional TD tower upgrades).

### Exploration & Traveling
- **Foot & Ship**: Node-to-node traveling, upgrading ships to survive dangerous waters.
- **Backtracking**: Access blocked areas using newly unlocked Cosmoid field abilities (e.g., Cut equivalents).
- **Fast Travel**: Befriend Thornado-generating Cosmoids to fast-travel.
- **Ship Summoning**: Remote ship recall mechanics.

### Encounters & Economy
- **Events**: Sandbars, rival boarding parties, ghost ships, stowed-away creatures, weather storms.
- **Economy**: Earning income from quests/treasure, spending on upgrades/tools/clues.
- **Journal**: Torn pages, sketches, bounty hunter board, clue tracking.
- **Reputation**: Navy vs. Pirate faction standing, custom quests, branching endings.

---

## 📜 Recent Work & Migration Log

<details>
<summary>Click to view historical changelog</summary>

### [2026-06-19] Customizable Visual Effect Animations
Replaced the hardcoded 'Nibble' chomp animation in PixiBattlefield with a generic data-driven layer keyframe system (KEYFRAME_SPRITES). Added a dedicated Dev tool 'VFX Effect Editor' (accessible via Ctrl+D) to visually edit layers, image paths, timeline keyframes (positions, scale, rotation, alpha), preview loops on training dummies, and save back to tdConfigs.ts.

### [2026-05-21] Catch Redirection to Storage on Full Party
Implemented a limit on active party roster additions during levels. In `TowerDefenseEngine.captureEnemy()`, a caught creature is only pushed to the in-level active `roster` if the roster size is under 6. Added comprehensive unit tests in `creature.test.ts` to verify the logic under both state branches.

### [2026-05-21] Separate Storage Array for Party Screen
Split the single `creatures` array on the `Profile` type into two independent arrays: `creatures` (active party, max 6) and `storageCreatures` (storage box). The Party Screen now receives both arrays as separate props. The `reorderCreatures` store action uses a global index scheme (0-5 = party, 6+ = storage) to support cross-array swaps. `addCreatureToProfile` adds to party if under 6, otherwise to storage. `updateCreatures` only searches and updates the active party (`creatures`) array, as storage creatures are not present/active during a tower defense level. Bumped `CURRENT_PROFILE_VERSION` to 5 to trigger profile migration.

### [2026-05-21] Profile Start Dialogue Flow Update
Updated NEW_PLAYER_EVENTS in src/constants/events.ts so that when a profile is first started, the game plays the initial welcome dialogue (NEW_PLAYER_WELCOME_DIALOG) and then immediately routes the player to the Level Select screen (Screens.LEVEL_SELECT) instead of automatically playing the second dialogue and launching into the first level.

### [2026-05-21] Dynamic Dialog Placeholders
Added dynamic replacement of the `{StarterName}` placeholder inside the `DialogContent` component. The component resolves the starter name by matching the persistent `gameFlags` (e.g., `STARTER_PALMIT`, `STARTER_FUEGUANA`, `STARTER_MONKEG`) of the active profile against the starter species definitions (`STARTER_CRAB.name` etc.). This ensures the name remains correct even if the player reorders their party, moves their starter to storage, or releases it, while preserving build-time static validation of dialogue configurations.

### [2026-05-20] Party Screen Storybook Story
Added Storybook stories for `PartyScreen` inside `src/app/components/PartyScreen.stories.tsx`. The stories include a stateful interactive wrapper that manages dynamic creature drag-and-drop / tap-to-swap, a minimal early-game view with only the starter creature, and a large roster layout testing the Box pagination controls.

### [2026-05-20] Storybook Fullscreen Layout Decorator Fix
Fixed a layout overflow issue where fullscreen screens (e.g. `PartyScreen`) in Storybook were padded and flex-centered by the global decorator in `.storybook/preview.tsx`. Modified the global decorator to dynamically inspect `context.parameters.layout` and omit the `p-4 min-h-screen flex items-center justify-center` styling when the story has `layout: 'fullscreen'`, applying a clean full-screen layout container instead.

### [2026-05-20] Vitest Config Vite 8 Type Mismatch Fix
Casted the react() plugin to any in vitest.config.ts. This bypasses TypeScript typechecking errors during next build arising from compatibility differences between Vite 8 (using Rolldown plugin types) and Vitest (using Vite 7 Rollup plugin types).

### [2026-05-20] Storybook Integration
Storybook has been integrated into the repository using `pnpm` and configured for Next.js and Tailwind CSS v4. Added custom viewport support for mobile landscape (896x414) in `.storybook/preview.tsx` to easily test components in landscape aspect ratios under the project default mobile layout policy. Added first set of component stories for `Button` and `TypeBadge` UI components.

### [2026-05-19] Mobile Tap-to-Swap Support for Party Screen
Added a tap-to-swap selection fallback to `PartyScreen.tsx` for mobile and touch-screen viewports since standard HTML5 drag-and-drop does not natively function on touch devices. Tapping any occupied slot selects that creature, applying a premium pulsing cyan outline (`ring-2 ring-cyan-400`), scale zoom (`scale-105`), dropshadow, and higher stacking index (`z-20`). Tapping another slot (whether occupied or empty) performs a swap or reorder and clears the selection. Navigating between pages in storage automatically deselects the current creature to prevent off-screen swaps. Updated visual helper text to guide players: 'Drag or tap to swap creatures between team slots and storage.'

### [2026-05-19] Party Screen Responsive Mobile Landscape Design
Optimized the Party Screen layout (`src/app/components/PartyScreen.tsx`) to natively support mobile landscape viewports in full compliance with the responsive styling policy. Added screen-size listeners to dynamically adjust the pagination limits (6 creatures per page on mobile landscape, 18 on desktop) and scaled slot paddings, margins, and sizes to ensure the active party is always visible and zero vertical overflow occurs on compact viewports.

### [2026-05-19] Party Screen Drag-and-Drop Fix
Fixed a critical bug in the party screen where dragging a creature to empty party slots or empty storage box slots did not work. The issue occurred because the `reorderCreatures` store action had a strict out-of-bounds check (`endIndex >= creatures.length`) and returned early without modifying the state. Since the UI grid slots are statically sized (6 for active team, and 6/18 for storage pages) and can exceed the player's total creature count, empty slots naturally map to out-of-bounds indices. Clamped `endIndex` to `creatures.length - 1` in `reorderCreatures` so that dropping on any empty slot successfully appends or shifts the creature to the end. Also added `onDragEnd` handlers in `PartyScreen.tsx` to ensure `draggedIndex` is cleared if a drag is canceled.

### [2026-05-18] Mobile Landscape Default Layout Policy (Profile & Mode Selection Screens)
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

### [2026-05-14] Dialog Screen Landscape Layout
The DialogContent component now uses Tailwind's landscape: variant to switch from vertical (portrait stacked above dialog) to horizontal (portrait left, dialog right) layout when in landscape orientation. Custom variants for landscape/portrait were added to globals.css via @custom-variant (required for Tailwind v4). Portrait images are constrained to max-h-[40vh] in landscape mode to prevent overflow.

### [2026-05-05] Pokmon EXP Formula Implemented
Implemented the Pokmon Gen V+ scaled experience formula in the Tower Defense engine. The flat `xpYield` system has been replaced. EXP is now calculated using `baseExperience` from the Creature definition and the levels of the enemy and tower. Using the Gen V rule, the total EXP is split evenly among all towers that participated in damaging the enemy. The level-up curve has also been changed to the Medium Fast curve.

### [2026-05-05] Base Experience Property Added to Creatures
Added a `baseExperience` field to the `Creature` interface in `baseGame.ts` and to all creature definitions in `creatures.ts`. This field will be used in the future for calculating how much experience is awarded when a creature is defeated. Values range from ~50 (weak/early creatures like Mouse, Bird) to ~140 (evolved creatures like Moth). No logic changes yet.

### [2026-05-04] Special Attack / Special Defense Stats
Added `specialAttack` and `specialDefense` base stats to the `Creature` interface and all creature definitions. Added `category: 'physical' | 'special'` to `AttackDefinition`. Physical attacks (Scratch, Tackle, Vine Whip, String Shot) use `attack`/`defense`; special attacks (Ember, Bubble Beam) use `specialAttack`/`specialDefense`. Both `Tower` and `Enemy` runtime types now carry pre-calculated `currentSpecialAttack`, `currentDefense`, and `currentSpecialDefense` (alongside existing `currentAttack`). These stats are computed at spawn/placement time and recalculated on level-up and evolution in `TDProgressionManager`. The damage formula in `EffectProcessor.applyDamageAndEffects()` selects the appropriate stat pair based on the attack's category.

### [2026-05-03] Challenge Mode
Added challenge mode accessible from Mode Select -> Challenge Select -> TD Level. Challenge levels use a `premadeRoster` field on `TDLevelData` to provide fixed creatures instead of the player's party. The first challenge is 'One Life Gauntlet': Level 1's layout with 1 life and a single Fueguana (starter_iguana at level 1). Captures during challenge levels work in-level (added to engine roster) but are never persisted to the player's profile. Tower progress (XP, levels) is also not saved back. The `GO_TO_CHALLENGE_SELECT` event routes back to `Screens.CHALLENGE_SELECT`. The `CHALLENGE_LEVEL_ORDER` array in `src/constants/tdLevels/index.ts` drives the challenge select screen.

### [2026-05-02] Pokemon HP/Stat Formulas for TD Units
Towers and enemies now use the Pokemon stat formula (without IV/EV) for initial HP and attack. HP formula: `floor((2 * Base * Level) / 100) + Level + 10`. Non-HP stat formula: `floor((2 * Base * Level) / 100) + 5`. These are calculated via `calculateMaxHp` and `calculateStat` from `src/utils/resolvePlayerCreature.ts`. On level-up and evolution, tower HP is recalculated while preserving the current HP percentage. The `enemyHpMultiplier` in TDLevelData is still applied as a multiplier on top of the formula result.

### [2026-05-01] Mode Select Screen
Added `Screens.MODE_SELECT` between Profile and Level Select. Flow is now Start => Profiles => Mode Select => Level Select (Story) => Tower Defense. The Mode Select screen shows two cards: Story (active, routes to Level Select) and Challenge (disabled, 'Coming Soon'). `GO_TO_MODE_SELECT` event type added. Returning players after defeating the first battle now go to Mode Select. The `ModeSelectScreen` component lives at `src/app/components/ModeSelectScreen.tsx`.

### [2026-05-01] Level Select Screen Replaces Maps
Removed the World Map (`Screens.MAP`) and Island Map (`Screens.ISLAND_MAP`) screens. Replaced with a single Level Select screen (`Screens.LEVEL_SELECT`) that displays TD levels as numbered blocks in a grid. The flow is now Start => Profiles => Level Select => Tower Defense. Events `GO_TO_MAP`/`GO_TO_ISLAND_MAP` were consolidated into `GO_TO_LEVEL_SELECT`. `SHOW_ISLAND_MAP_DIALOG` became `SHOW_LEVEL_SELECT_DIALOG`. Level ordering is defined in `LEVEL_ORDER` array in `src/constants/tdLevels/index.ts`. Includes 4 placeholder locked levels beyond the 2 real ones.

### [2026-04-25] Tower Drag-and-Click Bug Fix
When dragging a tower via pointer events, the browser fires a 'click' event after 'pointerup'. Since dragStateRef was already reset by the time click fires, the attack selection menu would open. Fixed by adding a `justDraggedRef` flag that is set to true on pointerup (during a drag) and checked/cleared in the TowerButton onClick handler.

### [2026-03-26] Zoom Controls for TD Map
Added zoom in/out buttons (+/-) to PixiBattlefield when `backgroundScale > 1`. Zoom range is `1/backgroundScale` (fully zoomed out, entire bg visible) to `1` (normal view). All entity containers, spot graphics, and floating text scale by `zoom`. The `updateBgLayout` function reads `zoomRef` each tick so zoom changes take effect immediately. Display dimensions = `fullBg * zoom`, scroll limits shrink as you zoom out.

### [2026-03-26] Scrollable Background for TD Levels
Added optional `backgroundScale` property to `TDLevelData`. When set > 1 (e.g. 1.5), the background renders at that multiple of the screen height and supports vertical drag-to-scroll. The scroll offset is tracked via `scrollYRef` and applied to `bgBounds.y`, so all percentage-based entity positioning remains correct. Both `PixiBattlefield.tsx` and `PixiTDLevelEditor.tsx` support this feature. The forest level uses `backgroundScale: 1.5`.

</details>
