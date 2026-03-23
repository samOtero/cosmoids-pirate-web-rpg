import {
  Island,
  BackgroundImageKey,
  BattleContext,
  StoryProgression,
} from '@/types/baseGame';

export const ISLANDS: Island[] = [
  {
    id: 0,
    name: 'Home Shore',
    description: 'A peaceful starting beach.',
    difficulty: 1,
    coordinates: {
      x: 10,
      y: 80,
    },
    backgroundImageKey: 'Island_1',
    unlocked: true,
    cleared: false,
    nodes: [
      {
        id: 0,
        name: 'Landing Point',
        description: 'Where your journey begins.',
        coordinates: {
          x: 36.206896551724135,
          y: 62.10727910885866,
        },
        events: [
          {
            type: 'GO_TO_TOWER_DEFENSE',
            payload: {
              context: 'FIRST_LEVEL',
            },
          },
        ],
      },
      {
        id: 1,
        name: 'Coconut Grove',
        description: 'A grove with fresh coconuts.',
        requiresStoryProgression: StoryProgression.DEFEAT_FIRST_BATTLE,
        coordinates: {
          x: 58.94396551724138,
          y: 41.226053055218806,
        },
        events: [
          {
            type: 'START_BATTLE',
            payload: {
              context: 'FOREST_BUG_BATTLE',
            },
          },
        ],
      },
    ],
  },
  {
    id: 1,
    name: 'Coral Reef',
    description: 'Vibrant colors hide lurking dangers.',
    difficulty: 2,
    coordinates: {
      x: 30,
      y: 60,
    },
    unlocked: false,
    cleared: false,
    nodes: [],
  },
  {
    id: 2,
    name: 'Stormy Atoll',
    description: 'Constant rain strengthens water types.',
    difficulty: 3,
    coordinates: {
      x: 50,
      y: 40,
    },
    unlocked: false,
    cleared: false,
    nodes: [],
  },
  {
    id: 3,
    name: 'Volcanic Crag',
    description: 'Intense heat and tough enemies.',
    difficulty: 4,
    coordinates: {
      x: 70,
      y: 20,
    },
    unlocked: false,
    cleared: false,
    nodes: [],
  },
  {
    id: 4,
    name: 'Abyssal Point',
    description: 'The edge of the known world.',
    difficulty: 5,
    coordinates: {
      x: 90,
      y: 50,
    },
    unlocked: false,
    cleared: false,
    nodes: [],
  },
] as any;
