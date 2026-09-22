# Cosmoids source art

This directory stores the repository's source-quality art library. Vercel
excludes the entire directory through the root `.vercelignore`; the web app
must not reference files here at runtime.

Runtime-ready assets belong in `apps/web/public`. When an asset is still used
by the game, this directory retains the source copy while `apps/web/public`
retains the current runtime copy. Art that has no runtime reference is kept
only here.

## Organization

- `app-icons/`: installable app and browser icons
- `backgrounds/battle/`: tower-defense and battle scenes
- `backgrounds/story/`: dialogue and narrative scenes
- `characters/battle/`: human battle sprites
- `characters/dialogue/`: human and creature dialogue portraits
- `creatures/directional-sprites/`: directional gameplay sprites
- `creatures/icons/`: compact creature portraits
- `creatures/journal/`: Kip's journal illustrations
- `creatures/legacy-renders/`: older or full-scene creature renders
- `effects/attacks/`: attack visual effects
- `props/story/`: story props and containers
- `props/structures/`: destructible and defensive structures
- `props/units/`: battle props and pickups
- `title/`: title-screen artwork

## Export workflow

1. Edit or replace the source-quality file in this directory.
2. Run the configured optimizer from the repository root. Journal art uses:

   ```sh
   pnpm assets:optimize:journals
   ```

   The journal pipeline writes 1024x1024 WebP derivatives to
   `apps/web/public/UI/Journal` at quality 84. Additional asset categories can
   be added to `apps/web/scripts/assets/optimize-art-assets.mjs` as their
   runtime requirements are established. Story backgrounds use:

   ```sh
   pnpm assets:optimize:story-backgrounds
   ```

   That pipeline writes WebP derivatives up to 1920x1080 at quality 86. It
   includes only narrative backgrounds referenced by the story system and
   intentionally excludes every background under `battles/bg`.

   Story portraits use:

   ```sh
   pnpm assets:optimize:story-portraits
   ```

   That pipeline writes transparency-preserving WebP derivatives up to
   1024x1024 at quality 88. It preserves the existing `public` versus
   `public/dialog` placement and excludes source-only unused portraits.

   Level backgrounds use:

   ```sh
   pnpm assets:optimize:level-backgrounds
   ```

   That pipeline writes quality-88 WebP derivatives without resizing. Exact
   source dimensions are retained because Pixi level geometry and camera
   behavior can depend on the background texture dimensions. Draft and unused
   level backgrounds remain source-only.

   Starter selection and showcase art uses:

   ```sh
   pnpm assets:optimize:starter-art
   ```

   That pipeline writes quality-88 transparency-preserving WebP derivatives
   without resizing. It combines the active chest art in `props/story` with
   the active full-size creature renders in `creatures/legacy-renders`.

   Battle character art uses:

   ```sh
   pnpm assets:optimize:battle-characters
   ```

   That pipeline writes quality-90 transparency-preserving WebP derivatives
   without resizing. Exact source dimensions are retained because Pixi sprite
   geometry and configured character placement can depend on texture size.

   New creature icons use:

   ```sh
   pnpm assets:optimize:creature-icons
   ```

   This pipeline writes 160x160 transparency-preserving WebP derivatives at
   quality 90 from the full-quality PNG masters in `creatures/icons`. Its
   explicit file list currently publishes the Aguana family without changing
   the existing PNG icon library.

   Directional and battle Cosmoid art uses:

   ```sh
   pnpm assets:optimize:battle-cosmoids
   ```

   That pipeline writes quality-90 transparency-preserving WebP derivatives
   without resizing. It publishes the production sprite library from
   `creatures/directional-sprites` while preserving exact Pixi texture sizes.

   Attack effects, battle units, and structures use:

   ```sh
   pnpm assets:optimize:battle-support
   ```

   Title-screen art and active root-level legacy creature renders use:

   ```sh
   pnpm assets:optimize:title-art
   pnpm assets:optimize:root-creature-art
   ```

   These pipelines write quality-90 transparency-preserving WebP derivatives
   without resizing. Unreferenced legacy renders remain source-only.
3. Update the runtime asset URL if its filename or format changed.
4. Verify that no application code references `art-source` directly.
