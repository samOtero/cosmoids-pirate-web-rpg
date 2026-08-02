import { TDLevelData } from '@/engine/tower-defense/types';

export const FOREST_LEVEL: TDLevelData = {
  paths: [
    [
      {
        x: 100,
        y: 50,
      },
      {
        x: 60,
        y: 50,
      },
      {
        x: 60,
        y: 80,
      },
      {
        x: 0,
        y: 80,
      },
    ],
  ],
  placementSpots: [
    {
      x: 80,
      y: 38,
    },
    {
      x: 80,
      y: 62,
    },
    {
      x: 60,
      y: 38,
    },
    {
      x: 45,
      y: 68,
    },
    {
      x: 45,
      y: 90,
    },
    {
      x: 25,
      y: 68,
    },
  ],
  environmentUnits: [
    {
      position: {
        x: 26,
        y: 87,
      },
      tdConfigId: 'rebuilt_boat',
    },
    {
      position: {
        x: 43,
        y: 65,
      },
      tdConfigId: 'caleb_battle',
      facingDirection: 'right',
    },
    {
      position: {
        x: 55,
        y: 65,
      },
      tdConfigId: 'kip_battle',
      facingDirection: 'right',
    },
  ],
  captureUnits: [
    {
      position: {
        x: 34.16,
        y: 77.14,
      },
      tdConfigId: 'food_supplies',
    },
    {
      position: {
        x: 36.25,
        y: 77.53,
      },
      tdConfigId: 'food_supplies',
    },
    {
      position: {
        x: 38.3,
        y: 78.11,
      },
      tdConfigId: 'food_supplies',
    },
    {
      position: {
        x: 39.93,
        y: 78.24,
      },
      tdConfigId: 'food_supplies',
    },
    {
      position: {
        x: 41.98,
        y: 78.95,
      },
      tdConfigId: 'food_supplies',
    },
    {
      position: {
        x: 33.79,
        y: 80.49,
      },
      tdConfigId: 'food_supplies',
    },
    {
      position: {
        x: 35.75,
        y: 80.69,
      },
      tdConfigId: 'food_supplies',
    },
    {
      position: {
        x: 38.22,
        y: 81.59,
      },
      tdConfigId: 'food_supplies',
    },
    {
      position: {
        x: 40.35,
        y: 81.46,
      },
      tdConfigId: 'food_supplies',
    },
    {
      position: {
        x: 42.94,
        y: 82.04,
      },
      tdConfigId: 'food_supplies',
    },
  ],
  waves: [
    {
      id: 'wave_1',
      groups: [
        {
          definitionId: 'mouse_1',
          count: 5,
          spawnIntervalMs: 1500,
          delayBeforeGroupMs: 100,
          pathIndex: 0,
          turnAroundAtEnd: true,
        },
        {
          definitionId: 'bird_1',
          count: 2,
          spawnIntervalMs: 1200,
          delayBeforeGroupMs: 3000,
          pathIndex: 0,
          turnAroundAtEnd: true,
          concurrentWithPrevious: false,
        },
      ],
    },
    {
      id: 'wave_2',
      groups: [
        {
          definitionId: 'mouse_1',
          count: 7,
          spawnIntervalMs: 1200,
          delayBeforeGroupMs: 100,
          pathIndex: 0,
          turnAroundAtEnd: true,
        },
        {
          definitionId: 'bird_1',
          count: 4,
          spawnIntervalMs: 1000,
          delayBeforeGroupMs: 2000,
          pathIndex: 0,
          turnAroundAtEnd: true,
          concurrentWithPrevious: false,
        },
        {
          definitionId: 'bettle',
          count: 1,
          spawnIntervalMs: 1400,
          delayBeforeGroupMs: 2200,
          pathIndex: 0,
          level: 4,
          turnAroundAtEnd: true,
          concurrentWithPrevious: false,
        },
      ],
    },
    {
      id: 'wave_3',
      groups: [
        {
          definitionId: 'bird_1',
          count: 1,
          spawnIntervalMs: 1500,
          delayBeforeGroupMs: 100,
          pathIndex: 0,
          level: 15,
          turnAroundAtEnd: true,
          uncapturable: true,
          isCursed: true,
        },
        {
          definitionId: 'bettle',
          count: 2,
          spawnIntervalMs: 1600,
          delayBeforeGroupMs: 3500,
          pathIndex: 0,
          level: 6,
          turnAroundAtEnd: true,
          concurrentWithPrevious: false,
        },
      ],
    },
  ],
  enemyHpMultiplier: 2.5,
  lives: 10,
  backgroundUrl: '/battles/bg/bg_coastal_island_battle.png',
  backgroundScale: 2,
};
