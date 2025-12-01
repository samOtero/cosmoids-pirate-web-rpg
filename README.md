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

## Testing
- **Integration tests** cover profile management, state, and persistence
- **Pre-push hook** runs tests automatically before `git push`
- Coverage: Profile CRUD, navigation, form validation

## Scripts
- `pnpm test run` - Run all tests once
- `pnpm test:ui` - Visual test runner
- `pnpm test:coverage` - Coverage report

Built with [Next.js](https://nextjs.org) • State by [Zustand](https://github.com/pmndrs/zustand) • Tests with [Vitest](https://vitest.dev)
