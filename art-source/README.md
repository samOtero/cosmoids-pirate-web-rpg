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
2. Export a web-sized PNG, WebP, or AVIF derivative to the corresponding
   runtime location under `apps/web/public`.
3. Update the runtime asset URL if its filename or format changed.
4. Verify that no application code references `art-source` directly.
