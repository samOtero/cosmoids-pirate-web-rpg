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

--
