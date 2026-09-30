# 🌊 Oceanic Odyssey

Pirate-themed creature collection RPG with turn-based battles and island exploration.

## Tech Stack
Next.js 16 • React 19 • TypeScript • Tailwind CSS 4 • Zustand • Vitest

## Quick Start

```bash
pnpm install    # Auto-configures git hooks
pnpm dev        # http://localhost:3000
pnpm verify:quick # Typecheck, validate content, and run unit tests
pnpm test       # Run tests
pnpm build      # Production build
```

## Features
- 3 save profiles with localStorage persistence
- Island navigation with unlockable areas
- Creature collection
- Turn-based battle system
- Inventory management

## Project Structure
```
apps/
└── web/                  # @cosmoids/web: Next.js game
    ├── src/              # UI, game engine, content, and unit/integration tests
    ├── public/           # Shipped artwork and other browser assets
    ├── tests/            # Playwright browser tests
    ├── scripts/          # App-specific content and asset tooling
    └── package.json      # Web dependencies and scripts
docs/                     # Shared art, creature, and story documentation
package.json              # Repository tooling and forwarding commands
pnpm-workspace.yaml       # apps/* and future packages/* workspaces
pnpm-lock.yaml            # One dependency lockfile for the repository
```

Run the Quick Start commands from the repository root. Existing root scripts
forward to `@cosmoids/web`, so their working directory is `apps/web`. For direct
tools, use `pnpm --filter @cosmoids/web exec <tool>`; for example,
`pnpm --filter @cosmoids/web exec playwright test`.

Keep local web environment variables in `apps/web/.env.local` (untracked).
The web TypeScript alias `@/*` still maps to `apps/web/src/*`. Browser asset URLs
such as `/UI/Icons/fueguana_icon.png` remain unchanged.

Future apps belong under `apps/` (for example, `apps/api`); add shared packages
under `packages/` only when needed. Each workspace needs a unique package name.
Keep dependency declarations in the app/package that uses them and commit the
root lockfile after running `pnpm install`.

## Vercel deployment

Configure the web project with Root Directory `apps/web`, Framework Preset
Next.js, automatic pnpm installation, and Build Command `pnpm build`. Keep the
framework's default Output Directory; the static export is `apps/web/out` on
disk, or `out` relative to the Vercel project root.

Root Directory is a Vercel project setting. If `experimental` and `main` still
have different layouts, use a separate experimental project before changing
that setting. Update the production project's root when the migration reaches
its deployment branch. Keep the existing Node.js version and environment
variables; this migration does not require a framework upgrade.

## Dialog System & Validation

### Dialog Line Jumping Feature

The dialog system now supports **named line jumping** for branching dialog flows. This allows buttons to jump to specific lines within a dialog using the `jumpToLineId` property.

#### Usage Example

```typescript
const myDialog: DialogConfig = {
  sequence: [
    {
      id: "choice_menu",
      portraits: [{ key: SpeakerImageKey.GUIDE, displayName: "Guide" }],
      text: "Choose your path",
      buttons: [
        {
          label: "Accept",
          type: "confirm",
          jumpToLineId: "accept_path",
        },
        {
          label: "Decline",
          type: "cancel",
          jumpToLineId: "decline_path",
        },
      ],
    },
    {
      id: "accept_path",
      portraits: [{ key: SpeakerImageKey.GUIDE, displayName: "Guide" }],
      text: "Great! Let's go forward.",
    },
    {
      id: "decline_path",
      portraits: [{ key: SpeakerImageKey.GUIDE, displayName: "Guide" }],
      text: "I understand. You can try again later.",
    },
  ],
  backgroundImageKey: BackgroundImageKey.DEFAULT,
  next: { screen: Screens.MAP },
};
```

### Validation

Dialog configurations are validated at **multiple stages** to catch errors before production:

#### 1. **Build-Time Validation** (Recommended)
Catches issues during development and CI/CD before code ships.

```bash
pnpm validate:dialogs   # Validates all dialog configs
pnpm build              # Build the static web export
pnpm build:check        # Lint + Test + Build (full check)
```

#### 2. **Test-Time Validation**
Comprehensive test suite validates all dialog configurations:

```bash
pnpm test               # Runs all tests including dialog validation
pnpm test:ui            # Interactive test UI
pnpm test:coverage      # Coverage report
```

Tests are automatically run before pushes via the root Husky pre-push hook.

#### 3. **Runtime Validation**
Defensive validation in the dialog component catches any issues that slip through:

- Validates unique line IDs when dialog loads
- Throws descriptive errors with available IDs
- Prevents invalid jumps from breaking gameplay

### Validation Errors & Debugging

**Build-time errors** include:
- ❌ **Duplicate line IDs** - Same ID used twice in a dialog
- ❌ **Invalid jumpToLineId references** - Button jumps to non-existent line
- ❌ **Missing required properties** - Lines missing portraits and text
- ⚠️ **Unreachable lines** - Lines with IDs that can't be reached

Example error message:
```
[DialogLineValidator] Line with ID "choice_confirm" not found in dialog "ChoiceDialog". 
Available line IDs: choice_start, choice_fire, choice_grass, choice_water.
```

### Best Practices

1. **Always use `id` for lines with buttons** that will be jump targets
2. **Keep IDs meaningful** - Use descriptive names like `choice_start`, not `line_1`
3. **Validate after changes** - Run `pnpm validate:dialogs` when editing dialogs
4. **Test complex flows** - Add test cases for branching dialogs
5. **Use type safety** - Let TypeScript catch enum and property errors early

### File Organization

- `apps/web/src/utils/buildTimeDialogValidator.ts` - Build-time validation logic
- `apps/web/src/utils/dialogLineValidator.ts` - Runtime validation utilities
- `apps/web/src/__tests__/utils/dialogLineValidator.test.ts` - Runtime validator tests
- `apps/web/src/__tests__/utils/buildTimeDialogValidator.test.ts` - Build validator tests
- `apps/web/src/__tests__/integration/dialogConfig.test.ts` - All dialog config integration tests

## Testing
- **Integration tests** cover profile management, state, and persistence
- **Pre-push hook** runs tests automatically before `git push`
- Coverage: Profile CRUD, navigation, form validation

For a fast, non-browser verification pass after making a change, run:

```bash
pnpm verify:quick
```

This checks TypeScript and runs dialog validation, creature registry checks, and the
Vitest unit and integration projects without the browser-based Storybook
project. Run `pnpm lint` separately while the existing lint backlog is being
cleaned up.

Creature gameplay data is authored in `apps/web/src/constants/creatures.ts`.
There are no duplicate creature manifests to synchronize when tuning stats or
learnsets. `pnpm test:creatures` discovers every species from the runtime registry
and checks attack/evolution references, shipped artwork, and directional visuals.
Creation history lives in documentation; see [creature provenance](docs/art/CREATURE_PROVENANCE.md).

Attack tests in `apps/web/src/__tests__/engine/attacks` exercise shared mechanics
with controlled inputs: projectile hits, physical/special damage, status,
targeting, cooldowns, and distinct behaviors such as chaining and summons.
Their fixtures are independent of production tuning; balancing a move does not
require updating expected copies of its settings. Registry checks discover all
current attacks and validate behavior and asset references. Run `pnpm test:attacks`
for this focused suite.

Evolution and enemy-ability tests also use controlled species and ability inputs.
They cover progression choices, event order, buffs, activation limits, and
ground-targeted projectiles without fixing real creatures' evolution levels or
enemy abilities' balance settings. Enemy-ability registry checks discover current
abilities and level references automatically. Run `pnpm test:progression` for
these checks.

Visual and level registry tests discover current content and check shipped assets,
usable routes, and valid references. Controlled behavior tests cover image-loading
transitions, capture restrictions, elemental matchups and affinity, and journal
milestone unlocks. They do not freeze scene coordinates, art scales, species typing,
or story sightings. Journal checks validate all supplied notes; notes remain optional
while creatures are being developed. Run `pnpm test:content` for these checks.

## Scripts
- `pnpm verify:quick` - Run the fast local verification suite
- `pnpm typecheck` - Check TypeScript without emitting files
- `pnpm lint` - Run the complete ESLint suite
- `pnpm test:unit` - Run non-Storybook Vitest tests once
- `pnpm test:creatures` - Validate every runtime creature's integration
- `pnpm test:attacks` - Check shared attack mechanics and registry integration
- `pnpm test:progression` - Check evolution and enemy-ability mechanics and integration
- `pnpm test:content` - Check visuals, levels, elemental combat, and journal behavior
- `pnpm test run` - Run all tests once
- `pnpm test:ui` - Visual test runner
- `pnpm test:coverage` - Coverage report

Built with [Next.js](https://nextjs.org) • State by [Zustand](https://github.com/pmndrs/zustand) • Tests with [Vitest](https://vitest.dev)
