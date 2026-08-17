import { TDLevelData } from '@/engine/tower-defense/types';
import { FOREST_LEVEL } from './forestLevel';

/**
 * Level 3 returns to the repaired boat battlefield while Captain Vane sends
 * her Bug Cosmoids down the forest path to destroy Caleb and Kip's escape.
 */
export const VANE_LEVEL: TDLevelData = {
  ...FOREST_LEVEL,
  captureUnits: [],
  waveEnemyDefinitions: [
    {
      id: 'vane_buglet',
      creatureId: 'bug_stage_1',
      level: 3,
      speedMultiplier: 2,
    },
    {
      id: 'vane_bettle_guard',
      creatureId: 'bettle',
      level: 1,
      speedMultiplier: 1.5,
      hpMultiplier: 1.5,
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
          enemyDefinitionId: 'vane_bettle_guard',
          count: 1,
          spawnIntervalMs: 1000,
          delayBeforeGroupMs: 100,
          pathIndex: 0,
          uncapturable: true,
        },
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
  lives: 10,
};
