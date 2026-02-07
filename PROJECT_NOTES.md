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
