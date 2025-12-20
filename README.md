# 🌊 Oceanic Odyssey

Pirate-themed creature collection RPG with turn-based battles and island exploration.

## Tech Stack
Next.js 16 • React 19 • TypeScript • Tailwind CSS 4 • Zustand • Vitest

## Quick Start

```bash
pnpm install    # Auto-configures git hooks
pnpm dev        # http://localhost:3000
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
src/
├── app/components/     # UI components
├── store/gameStore.ts  # Zustand state
├── types/baseGame.ts   # TypeScript types
└── __tests__/          # Integration tests
```

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
      speakerIndex: 0,
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
      speakerIndex: 0,
      text: "Great! Let's go forward.",
    },
    {
      id: "decline_path",
      portraits: [{ key: SpeakerImageKey.GUIDE, displayName: "Guide" }],
      speakerIndex: 0,
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
pnpm build              # Includes validation checks
pnpm build:check        # Lint + Test + Build (full check)
```

#### 2. **Test-Time Validation**
Comprehensive test suite validates all dialog configurations:

```bash
pnpm test               # Runs all tests including dialog validation
pnpm test:ui            # Interactive test UI
pnpm test:coverage      # Coverage report
```

Tests are automatically run before commits via Husky pre-push hook.

#### 3. **Runtime Validation**
Defensive validation in the dialog component catches any issues that slip through:

- Validates unique line IDs when dialog loads
- Throws descriptive errors with available IDs
- Prevents invalid jumps from breaking gameplay

### Validation Errors & Debugging

**Build-time errors** include:
- ❌ **Duplicate line IDs** - Same ID used twice in a dialog
- ❌ **Invalid jumpToLineId references** - Button jumps to non-existent line
- ❌ **Missing required properties** - Lines missing portraits, text, speakerIndex
- ❌ **Out-of-bounds speaker** - speakerIndex exceeds portrait count
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

- `src/utils/buildTimeDialogValidator.ts` - Build-time validation logic
- `src/utils/dialogLineValidator.ts` - Runtime validation utilities  
- `src/__tests__/utils/dialogLineValidator.test.ts` - Runtime validator tests
- `src/__tests__/utils/buildTimeDialogValidator.test.ts` - Build validator tests
- `src/__tests__/integration/dialogConfig.test.ts` - All dialog config integration tests

## Testing
- **Integration tests** cover profile management, state, and persistence
- **Pre-push hook** runs tests automatically before `git push`
- Coverage: Profile CRUD, navigation, form validation

## Scripts
- `pnpm test run` - Run all tests once
- `pnpm test:ui` - Visual test runner
- `pnpm test:coverage` - Coverage report

Built with [Next.js](https://nextjs.org) • State by [Zustand](https://github.com/pmndrs/zustand) • Tests with [Vitest](https://vitest.dev)
