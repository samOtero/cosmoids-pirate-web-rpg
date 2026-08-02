import { TDLevelData } from '@/engine/tower-defense/types';

export const FOREST_LEVEL: TDLevelData = {
  paths: [
    [
      {
        x: 102.24,
        y: 21.21,
      },
      {
        x: 60.1,
        y: 21.21,
      },
      {
        x: 60,
        y: 80,
      },
      {
        x: 27.33,
        y: 79.74,
      },
    ],
  ],
  placementSpots: [
    {
      x: 78.7,
      y: 12.48,
    },
    {
      x: 67.56,
      y: 33.07,
    },
    {
      x: 49.48,
      y: 33.21,
    },
    {
      x: 52.12,
      y: 67.3,
    },
    {
      x: 67.12,
      y: 67.3,
    },
    {
      x: 67.21,
      y: 48.58,
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
        x: 51.5,
        y: 24.51,
      },
      tdConfigId: 'caleb_battle',
      facingDirection: 'right',
    },
    {
      position: {
        x: 44.96,
        y: 58.51,
      },
      tdConfigId: 'kip_battle',
      facingDirection: 'right',
    },
  ],
  captureUnits: [
    {
      position: {
        x: 33.48,
        y: 78,
      },
      tdConfigId: 'food_supplies',
    },
    {
      position: {
        x: 35.56,
        y: 81.68,
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
        x: 33.14,
        y: 81.27,
      },
      tdConfigId: 'food_supplies',
    },
    {
      position: {
        x: 35.96,
        y: 78.13,
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
          definitionId: 'harlequill',
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
          definitionId: 'harlequill',
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
          definitionId: 'harlequill',
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
  initialView: {
    offsetX: 50,
    offsetY: 0,
    zoom: 0.9,
  },
  openingPan: {
    fromOffsetY: 100,
    durationMs: 2000,
  },
};
