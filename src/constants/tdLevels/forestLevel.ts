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
  waves: [
    {
      id: 'wave_1',
      groups: [
        {
          definitionId: 'senticle',
          count: 2,
          spawnIntervalMs: 1500,
          delayBeforeGroupMs: 100,
          pathIndex: 0,
          turnAroundAtEnd: true,
          uncapturable: true,
        },
        {
          definitionId: 'senticle',
          count: 3,
          spawnIntervalMs: 1200,
          delayBeforeGroupMs: 3000,
          pathIndex: 0,
          turnAroundAtEnd: true,
          concurrentWithPrevious: false,
          uncapturable: true,
        },
      ],
    },
    {
      id: 'wave_2',
      groups: [
        {
          definitionId: 'senticle',
          count: 4,
          spawnIntervalMs: 1200,
          delayBeforeGroupMs: 100,
          pathIndex: 0,
          turnAroundAtEnd: true,
          uncapturable: true,
        },
        {
          definitionId: 'senticle',
          count: 3,
          spawnIntervalMs: 1000,
          delayBeforeGroupMs: 2000,
          pathIndex: 0,
          turnAroundAtEnd: true,
          concurrentWithPrevious: false,
          uncapturable: true,
        },
      ],
    },
    {
      id: 'wave_3',
      groups: [
        {
          definitionId: 'senticle',
          count: 5,
          spawnIntervalMs: 1000,
          delayBeforeGroupMs: 100,
          pathIndex: 0,
          turnAroundAtEnd: true,
          uncapturable: true,
        },
        {
          definitionId: 'senticle',
          count: 5,
          spawnIntervalMs: 800,
          delayBeforeGroupMs: 2000,
          pathIndex: 0,
          turnAroundAtEnd: true,
          concurrentWithPrevious: false,
          uncapturable: true,
        },
      ],
    },
  ],
  enemyHpMultiplier: 2.5,
  lives: 10,
  backgroundUrl: '/battles/bg/bg_forest_battle.png',
};
