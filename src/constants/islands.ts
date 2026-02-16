import { Island, BackgroundImageKey, BattleContext } from '@/types/baseGame';

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
          x: 30.926724137931032,
          y: 68.04597642686632,
        },
        events: [
          {
            type: 'START_BATTLE',
            payload: {
              context: 'FIRST_BATTLE',
            },
          },
        ],
      },
      {
        id: 1,
        name: 'Coconut Grove',
        description: 'A grove with fresh coconuts.',
        coordinates: {
          x: 39.6551724137931,
          y: 42.18390746134908,
        },
        events: [
          {
            type: 'START_BATTLE',
            payload: {
              context: BattleContext.FOREST_BUG_BATTLE,
            },
          },
        ],
      },
      {
        id: 2,
        name: 'Mysterious Cave',
        description: 'Dark and echoey.',
        coordinates: {
          x: 54.633620689655174,
          y: 53.10344769123414,
        },
        events: [],
      },
      {
        id: 3,
        name: 'Node 3',
        description: 'New Node Description',
        coordinates: {
          x: 63.254310344827594,
          y: 37.58620631192379,
        },
        events: [],
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
