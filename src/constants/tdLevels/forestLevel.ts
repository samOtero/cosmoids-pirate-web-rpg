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
        {
          definitionId: 'mopup',
          count: 1,
          spawnIntervalMs: 1300,
          delayBeforeGroupMs: 1800,
          pathIndex: 0,
          level: 5,
          turnAroundAtEnd: true,
          speedMultiplier: 1.25,
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
        {
          definitionId: 'mopup',
          count: 2,
          spawnIntervalMs: 1100,
          delayBeforeGroupMs: 1800,
          pathIndex: 0,
          level: 5,
          turnAroundAtEnd: true,
          speedMultiplier: 1.25,
        },
        {
          definitionId: 'snoutasco',
          count: 1,
          spawnIntervalMs: 1200,
          delayBeforeGroupMs: 1700,
          pathIndex: 0,
          level: 5,
          turnAroundAtEnd: true,
          speedMultiplier: 1.15,
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
        {
          definitionId: 'mopup',
          count: 3,
          spawnIntervalMs: 900,
          delayBeforeGroupMs: 1600,
          pathIndex: 0,
          level: 5,
          turnAroundAtEnd: true,
          speedMultiplier: 1.25,
        },
        {
          definitionId: 'snoutasco',
          count: 2,
          spawnIntervalMs: 1050,
          delayBeforeGroupMs: 1400,
          pathIndex: 0,
          level: 6,
          turnAroundAtEnd: true,
          speedMultiplier: 1.15,
        },
      ],
    },
  ],
  enemyHpMultiplier: 2.5,
  lives: 10,
  backgroundUrl: '/battles/bg/bg_coastal_island_battle.png',
  backgroundScale: 2,
};
