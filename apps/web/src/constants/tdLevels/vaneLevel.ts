import { TDLevelData } from '@/engine/tower-defense/types';
import { FOREST_LEVEL } from './forestLevel';

/**
 * Level 3 returns to the repaired boat battlefield while Captain Vane sends
 * her Bug Cosmoids down the forest path to destroy Caleb and Kip's escape.
 */
export const VANE_LEVEL: TDLevelData = {
  paths: [
    [
      {
        x: 102.24,
        y: 21.21,
      },
      {
        x: 35.36,
        y: 21.27,
      },
      {
        x: 35.2,
        y: 51.38,
      },
      {
        x: 78.31,
        y: 51.14,
      },
      {
        x: 78,
        y: 79.14,
      },
      {
        x: 26.94,
        y: 78.73,
      },
    ],
  ],
  placementSpots: [
    {
      x: 77.89,
      y: 12.18,
    },
    {
      x: 71.52,
      y: 31.09,
    },
    {
      x: 60.36,
      y: 11.04,
    },
    {
      x: 44.52,
      y: 29.14,
    },
    {
      x: 44.47,
      y: 44.64,
    },
    {
      x: 71.52,
      y: 44.07,
    },
    {
      x: 71.31,
      y: 59.17,
    },
    {
      x: 71.05,
      y: 71.02,
    },
    {
      x: 58.63,
      y: 70.7,
    },
    {
      x: 53.68,
      y: 58.93,
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
        x: 59.79,
        y: 43.67,
      },
      tdConfigId: 'caleb_battle',
      facingDirection: 'right',
    },
    {
      position: {
        x: 37.99,
        y: 73.3,
      },
      tdConfigId: 'kip_battle',
      facingDirection: 'right',
    },
    {
      position: {
        x: 89,
        y: 45,
      },
      tdConfigId: 'captain_vane_battle',
      facingDirection: 'left',
    },
  ],
  startingTowers: [
    {
      creature: {
        id: 'kip_mopup',
        speciesId: 'mopup',
        level: 5,
        xp: 0,
        equippedAttacks: ['TACKLE'],
        activeAttackIndex: 0,
        targetingMode: 'first',
        isShiny: false,
      },
      position: {
        x: 48.5,
        y: 42,
      },
      facingDirection: 'right',
      isFixed: true,
      receivesExperience: false,
    },
  ],
  captureUnits: [],
  waveEnemyDefinitions: [
    {
      id: 'vane_buglet',
      creatureId: 'bug_stage_1',
      level: 5,
      speedMultiplier: 2,
      hpMultiplier: 4,
    },
    {
      id: 'vane_bettle_guard',
      creatureId: 'bettle',
      level: 12,
      speedMultiplier: 0.45,
      goalDamage: 10,
      hpMultiplier: 15,
      abilityId: 'BETTLE_HARDEN',
    },
  ],
  waves: [
    {
      id: 'wave_1',
      groups: [
        {
          enemyDefinitionId: 'vane_buglet',
          count: 3,
          spawnIntervalMs: 1400,
          delayBeforeGroupMs: 100,
          pathIndex: 0,
        },
        {
          enemyDefinitionId: 'vane_bettle_guard',
          count: 1,
          spawnIntervalMs: 1000,
          delayBeforeGroupMs: 100,
          pathIndex: 0,
          uncapturable: true,
        },
        {
          enemyDefinitionId: 'vane_buglet',
          count: 5,
          spawnIntervalMs: 1200,
          delayBeforeGroupMs: 2000,
          pathIndex: 0,
        },
      ],
    },
    {
      id: 'wave_2',
      groups: [
        {
          enemyDefinitionId: 'vane_buglet',
          count: 6,
          spawnIntervalMs: 1100,
          delayBeforeGroupMs: 100,
          pathIndex: 0,
        },
        {
          enemyDefinitionId: 'vane_buglet',
          count: 6,
          spawnIntervalMs: 1000,
          delayBeforeGroupMs: 4000,
          pathIndex: 0,
          concurrentWithPrevious: true,
        },
      ],
    },
    {
      id: 'wave_3',
      groups: [
        {
          enemyDefinitionId: 'vane_buglet',
          count: 8,
          spawnIntervalMs: 900,
          delayBeforeGroupMs: 4500,
          pathIndex: 0,
          concurrentWithPrevious: true,
        },
        {
          enemyDefinitionId: 'vane_buglet',
          count: 5,
          spawnIntervalMs: 800,
          delayBeforeGroupMs: 10000,
          pathIndex: 0,
          concurrentWithPrevious: true,
        },
      ],
    },
  ],
  enemyHpMultiplier: 2,
  lives: 10,
  backgroundUrl: '/battles/bg/bg_coastal_island_battle_path_level_3.png',
  backgroundScale: 2,
  initialView: {
    offsetX: 50,
    offsetY: 0,
    zoom: 0.7,
  },
  openingPan: {
    fromOffsetY: 100,
    durationMs: 2000,
  },
};
