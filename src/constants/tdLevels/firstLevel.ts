import { TDLevelData } from '@/engine/tower-defense/types';

export const FIRST_LEVEL: TDLevelData = {
  paths: [
    [
      {
        x: 100,
        y: 65,
      },
      {
        x: 0,
        y: 65,
      },
    ],
  ],
  placementSpots: [
    {
      x: 73,
      y: 77,
    },
    {
      x: 55,
      y: 42,
    },
    {
      x: 55,
      y: 77,
    },
    {
      x: 73,
      y: 42,
    },
    {
      x: 38,
      y: 42,
    },
    {
      x: 38,
      y: 77,
    },
  ],
  environmentUnits: [
    {
      position: {
        x: 21.78,
        y: 40,
      },
      tdConfigId: 'caleb_battle',
    },
    {
      position: {
        x: 89.45,
        y: 40,
      },
      tdConfigId: 'rat_catcher_battle',
    },
    {
      position: {
        x: 9,
        y: 40.37,
      },
      tdConfigId: 'grandpa_battle',
    },
  ],
  captureUnits: [
    {
      position: {
        x: 6.71,
        y: 66,
      },
      tdConfigId: 'note_1',
    },
    {
      position: {
        x: 5.19,
        y: 62,
      },
      tdConfigId: 'note_1',
    },
    {
      position: {
        x: 7.62,
        y: 70,
      },
      tdConfigId: 'note_1',
    },
    {
      position: {
        x: 3.6,
        y: 69,
      },
      tdConfigId: 'note_1',
    },
    {
      position: {
        x: 7.53,
        y: 63,
      },
      tdConfigId: 'note_1',
    },
    {
      position: {
        x: 2.59,
        y: 64,
      },
      tdConfigId: 'note_1',
    },
    {
      position: {
        x: 9.04,
        y: 70,
      },
      tdConfigId: 'note_1',
    },
    {
      position: {
        x: 3.26,
        y: 71,
      },
      tdConfigId: 'note_1',
    },
    {
      position: {
        x: 6.44,
        y: 64,
      },
      tdConfigId: 'note_1',
    },
    {
      position: {
        x: 3.09,
        y: 70,
      },
      tdConfigId: 'note_1',
    },
    {
      position: {
        x: 2.93,
        y: 62,
      },
      tdConfigId: 'note_1',
    },
    {
      position: {
        x: 8.45,
        y: 64,
      },
      tdConfigId: 'note_1',
    },
  ],
  waves: [
    {
      id: 'wave_1771807082096',
      groups: [
        {
          definitionId: 'mouse_1',
          count: 1,
          spawnIntervalMs: 1500,
          delayBeforeGroupMs: 100,
          pathIndex: 0,
          turnAroundAtEnd: true,
          uncapturable: false,
        },
        {
          definitionId: 'mouse_1',
          count: 2,
          spawnIntervalMs: 1500,
          delayBeforeGroupMs: 3000,
          pathIndex: 0,
          turnAroundAtEnd: true,
          concurrentWithPrevious: false,
          uncapturable: false,
        },
        {
          definitionId: 'mouse_1',
          count: 3,
          spawnIntervalMs: 1500,
          delayBeforeGroupMs: 3000,
          pathIndex: 0,
          turnAroundAtEnd: true,
          concurrentWithPrevious: false,
          uncapturable: false,
        },
        {
          definitionId: 'mouse_1',
          count: 5,
          spawnIntervalMs: 1500,
          delayBeforeGroupMs: 3000,
          pathIndex: 0,
          turnAroundAtEnd: true,
          concurrentWithPrevious: false,
          uncapturable: false,
        },
      ],
    },
  ],
  enemyHpMultiplier: 2,
  lives: 10,
  backgroundUrl: '/battles/bg/bg_dock_battle_td_extended_single_lane.png',
  backgroundScale: 1.2,
};
