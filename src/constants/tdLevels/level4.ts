import { TDLevelData } from '@/engine/tower-defense/types';

/**
 * Level 4 stays inside one navy-controlled market block. Mari advances to a
 * new delivery position after each cleared wave, while the unchecked wild
 * Sonarion line enters through a new pair of increasingly divided routes.
 */
export const LEVEL_4: TDLevelData = {
  paths: [
    [
      {
        x: 11.78,
        y: -0.16,
      },
      {
        x: 11.8,
        y: 29,
      },
      {
        x: 26.8,
        y: 29,
      },
      {
        x: 26.8,
        y: 50,
      },
      {
        x: 70.42,
        y: 50.34,
      },
    ],
    [
      {
        x: 10.11,
        y: 99.75,
      },
      {
        x: 10.11,
        y: 91.65,
      },
      {
        x: 16.16,
        y: 91.59,
      },
      {
        x: 16.13,
        y: 82.3,
      },
      {
        x: 26.85,
        y: 82.35,
      },
      {
        x: 26.78,
        y: 49.84,
      },
      {
        x: 70.81,
        y: 49.85,
      },
    ],
    [
      {
        x: 46,
        y: -3,
      },
      {
        x: 46,
        y: 16,
      },
      {
        x: 40,
        y: 16,
      },
      {
        x: 40,
        y: 31,
      },
      {
        x: 55,
        y: 31,
      },
      {
        x: 55,
        y: 50,
      },
      {
        x: 26.78,
        y: 49.94,
      },
      {
        x: 70.31,
        y: 50.23,
      },
    ],
    [
      {
        x: 47,
        y: 103,
      },
      {
        x: 47,
        y: 83,
      },
      {
        x: 47,
        y: 70.81,
      },
      {
        x: 49.22,
        y: 70.76,
      },
      {
        x: 49.07,
        y: 49.99,
      },
      {
        x: 26.78,
        y: 49.94,
      },
      {
        x: 70.42,
        y: 50.07,
      },
    ],
    [
      {
        x: 87.34,
        y: 8.9,
      },
      {
        x: 87.34,
        y: 19.93,
      },
      {
        x: 83.5,
        y: 20,
      },
      {
        x: 83.5,
        y: 27,
      },
      {
        x: 70.6,
        y: 27,
      },
      {
        x: 70.52,
        y: 51.19,
      },
      {
        x: 27.04,
        y: 51.14,
      },
    ],
    [
      {
        x: 89.6,
        y: 103,
      },
      {
        x: 89.6,
        y: 80,
      },
      {
        x: 83.5,
        y: 80,
      },
      {
        x: 83.5,
        y: 72,
      },
      {
        x: 74,
        y: 72,
      },
      {
        x: 74,
        y: 63,
      },
      {
        x: 78,
        y: 63,
      },
      {
        x: 77.99,
        y: 55.28,
      },
      {
        x: 70.49,
        y: 51.69,
      },
      {
        x: 26.75,
        y: 50.12,
      },
    ],
  ],
  placementSpots: [
    {
      x: 16.64,
      y: 22.91,
    },
    {
      x: 23.36,
      y: 40.18,
    },
    {
      x: 87.13,
      y: 24.58,
    },
    {
      x: 29.75,
      y: 24.34,
    },
    {
      x: 50.03,
      y: 13.79,
    },
    {
      x: 74.6,
      y: 33.23,
    },
    {
      x: 22.5,
      y: 58.79,
    },
    {
      x: 21.48,
      y: 75.69,
    },
    {
      x: 87.63,
      y: 73.44,
    },
    {
      x: 36.36,
      y: 19.76,
    },
    {
      x: 12.1,
      y: 84.62,
    },
    {
      x: 45.16,
      y: 60.59,
    },
    {
      x: 29.91,
      y: 70.96,
    },
    {
      x: 77.5,
      y: 22.31,
    },
    {
      x: 78.46,
      y: 67.82,
    },
    {
      x: 53.64,
      y: 25.36,
    },
    {
      x: 42.84,
      y: 79.29,
    },
    {
      x: 51.24,
      y: 75.98,
    },
    {
      x: 51.54,
      y: 36.24,
    },
    {
      x: 70.62,
      y: 66.89,
    },
    {
      x: 54.91,
      y: 55.07,
    },
    {
      x: 33.7,
      y: 55.99,
    },
    {
      x: 65.89,
      y: 44.36,
    },
  ],
  environmentUnits: [
    {
      position: {
        x: 19.36,
        y: 53.39,
      },
      tdConfigId: 'caleb_battle',
      facingDirection: 'right',
    },
    {
      position: {
        x: 38.06,
        y: 48.23,
      },
      tdConfigId: 'kip_battle',
      facingDirection: 'right',
    },
  ],
  startingTowers: [
    {
      creature: {
        id: 'kip_mopup',
        speciesId: 'mopup',
        level: 8,
        xp: 0,
        equippedAttacks: ['TACKLE'],
        activeAttackIndex: 0,
        targetingMode: 'first',
        isShiny: false,
      },
      position: {
        x: 40,
        y: 55,
      },
      facingDirection: 'right',
      isFixed: true,
      receivesExperience: false,
    },
  ],
  captureUnits: [
    {
      position: {
        x: 26.8,
        y: 50,
      },
      tdConfigId: 'maribel_capture',
      carrierSpeedMultiplier: 0.9,
      returnHome: {
        pathIndex: 0,
        speed: 2,
        delayMs: 500,
      },
      waveRelocations: [
        {
          afterWaveIndex: 0,
          path: [
            {
              x: 26.8,
              y: 50,
            },
            {
              x: 47,
              y: 50,
            },
          ],
          speed: 7,
        },
        {
          afterWaveIndex: 1,
          path: [
            {
              x: 47,
              y: 50,
            },
            {
              x: 70.6,
              y: 50,
            },
          ],
          speed: 7,
        },
      ],
    },
  ],
  waveEnemyDefinitions: [
    {
      id: 'ironbell_sonarion',
      creatureId: 'sonarion',
      level: 8,
      speedMultiplier: 1.7,
      hpMultiplier: 2,
      canCarryCaptureUnits: false,
      abilityId: 'SONARION_HOWL',
      weakenedThreshold: 0.4,
    },
    {
      id: 'ironbell_resonarion',
      creatureId: 'resonarion',
      level: 18,
      speedMultiplier: 0.45,
      hpMultiplier: 10,
    },
  ],
  waves: [
    {
      id: 'market_west',
      groups: [
        {
          enemyDefinitionId: 'ironbell_resonarion',
          count: 1,
          uncapturable: true,
          spawnIntervalMs: 1500,
          delayBeforeGroupMs: 100,
          pathIndex: 0,
          turnAroundAtEnd: true,
        },
        {
          enemyDefinitionId: 'ironbell_resonarion',
          count: 1,
          uncapturable: true,
          spawnIntervalMs: 1400,
          delayBeforeGroupMs: 4500,
          pathIndex: 2,
          turnAroundAtEnd: true,
          concurrentWithPrevious: false,
        },
        {
          enemyDefinitionId: 'ironbell_sonarion',
          count: 3,
          spawnIntervalMs: 1400,
          delayBeforeGroupMs: 12500,
          pathIndex: 4,
          turnAroundAtEnd: true,
          concurrentWithPrevious: false,
        },
      ],
    },
    {
      id: 'market_center',
      groups: [
        {
          enemyDefinitionId: 'ironbell_resonarion',
          count: 1,
          uncapturable: true,
          spawnIntervalMs: 1500,
          delayBeforeGroupMs: 100,
          pathIndex: 2,
          turnAroundAtEnd: true,
        },
        {
          enemyDefinitionId: 'ironbell_sonarion',
          count: 5,
          spawnIntervalMs: 1400,
          delayBeforeGroupMs: 5500,
          pathIndex: 0,
          turnAroundAtEnd: true,
          concurrentWithPrevious: true,
        },
        {
          enemyDefinitionId: 'ironbell_sonarion',
          count: 5,
          spawnIntervalMs: 1400,
          delayBeforeGroupMs: 8000,
          pathIndex: 4,
          turnAroundAtEnd: true,
          concurrentWithPrevious: true,
        },
      ],
    },
    {
      id: 'market_loading_yard',
      groups: [
        {
          enemyDefinitionId: 'ironbell_resonarion',
          count: 2,
          uncapturable: true,
          spawnIntervalMs: 4000,
          delayBeforeGroupMs: 3000,
          pathIndex: 0,
          turnAroundAtEnd: true,
          concurrentWithPrevious: false,
        },
        {
          enemyDefinitionId: 'ironbell_resonarion',
          count: 2,
          uncapturable: true,
          spawnIntervalMs: 4000,
          delayBeforeGroupMs: 3200,
          pathIndex: 2,
          turnAroundAtEnd: true,
          concurrentWithPrevious: false,
        },
        {
          enemyDefinitionId: 'ironbell_sonarion',
          count: 8,
          spawnIntervalMs: 850,
          delayBeforeGroupMs: 250,
          pathIndex: 0,
          turnAroundAtEnd: true,
        },
        {
          enemyDefinitionId: 'ironbell_sonarion',
          count: 8,
          spawnIntervalMs: 850,
          delayBeforeGroupMs: 1000,
          pathIndex: 0,
          turnAroundAtEnd: true,
          concurrentWithPrevious: false,
        },
        {
          enemyDefinitionId: 'ironbell_sonarion',
          count: 8,
          spawnIntervalMs: 850,
          delayBeforeGroupMs: 1050,
          pathIndex: 2,
          turnAroundAtEnd: true,
          concurrentWithPrevious: false,
        },
        {
          enemyDefinitionId: 'ironbell_sonarion',
          count: 8,
          spawnIntervalMs: 850,
          delayBeforeGroupMs: 1050,
          pathIndex: 2,
          turnAroundAtEnd: true,
          concurrentWithPrevious: false,
        },
      ],
    },
  ],
  enemyHpMultiplier: 2,
  backgroundUrl: '/battles/bg/bg_market_level_4.png',
  backgroundScale: 3,
  initialView: {
    offsetX: 0,
    offsetY: 0,
    zoom: 0.62,
  },
  openingPan: {
    fromOffsetX: 100,
    fromOffsetY: 100,
    durationMs: 2000,
  },
  introMessage: 'Protect the girl!',
};

