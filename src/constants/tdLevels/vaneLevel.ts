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
      id: 'vane_bugitor',
      creatureId: 'bug_stage_2',
      level: 8,
      speedMultiplier: 2,
    },
    {
      id: 'vane_tailwind_moth',
      creatureId: 'bug_stage_3',
      level: 8,
      speedMultiplier: 1.5,
      hpMultiplier: 2,
      abilityId: 'MOTH_TAILWIND',
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
          count: 8,
          spawnIntervalMs: 1200,
          delayBeforeGroupMs: 100,
          pathIndex: 0,
        },
      ],
    },
    {
      id: 'wave_2',
      groups: [
        {
          enemyDefinitionId: 'vane_buglet',
          count: 8,
          spawnIntervalMs: 1000,
          delayBeforeGroupMs: 100,
          pathIndex: 0,
        },
        {
          enemyDefinitionId: 'vane_bugitor',
          count: 5,
          spawnIntervalMs: 1400,
          delayBeforeGroupMs: 1800,
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
          count: 10,
          spawnIntervalMs: 900,
          delayBeforeGroupMs: 100,
          pathIndex: 0,
        },
        {
          enemyDefinitionId: 'vane_bugitor',
          count: 6,
          spawnIntervalMs: 1200,
          delayBeforeGroupMs: 1200,
          pathIndex: 0,
          concurrentWithPrevious: true,
        },
        {
          enemyDefinitionId: 'vane_tailwind_moth',
          count: 1,
          spawnIntervalMs: 1000,
          delayBeforeGroupMs: 2000,
          pathIndex: 0,
          concurrentWithPrevious: true,
        },
        {
          enemyDefinitionId: 'vane_bettle_guard',
          count: 2,
          spawnIntervalMs: 2000,
          delayBeforeGroupMs: 3000,
          pathIndex: 0,
          concurrentWithPrevious: true,
        },
      ],
    },
  ],
  lives: 10,
};
