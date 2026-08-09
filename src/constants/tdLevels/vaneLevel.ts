import { TDLevelData } from '@/engine/tower-defense/types';
import { FOREST_LEVEL } from './forestLevel';

/**
 * Level 3 returns to the repaired boat battlefield while Captain Vane sends
 * her Bug Cosmoids down the forest path to destroy Caleb and Kip's escape.
 */
export const VANE_LEVEL: TDLevelData = {
  ...FOREST_LEVEL,
  captureUnits: [],
  waves: [
    {
      id: 'wave_1',
      groups: [
        {
          definitionId: 'bug_stage_1',
          count: 8,
          spawnIntervalMs: 1200,
          delayBeforeGroupMs: 100,
          pathIndex: 0,
          speedMultiplier: 2,
        },
      ],
    },
    {
      id: 'wave_2',
      groups: [
        {
          definitionId: 'bug_stage_1',
          count: 8,
          spawnIntervalMs: 1000,
          delayBeforeGroupMs: 100,
          pathIndex: 0,
          speedMultiplier: 2,
        },
        {
          definitionId: 'bug_stage_2',
          count: 5,
          spawnIntervalMs: 1400,
          delayBeforeGroupMs: 1800,
          pathIndex: 0,
          concurrentWithPrevious: true,
          speedMultiplier: 2,
        },
      ],
    },
    {
      id: 'wave_3',
      groups: [
        {
          definitionId: 'bug_stage_1',
          count: 10,
          spawnIntervalMs: 900,
          delayBeforeGroupMs: 100,
          pathIndex: 0,
          speedMultiplier: 2,
        },
        {
          definitionId: 'bug_stage_2',
          count: 6,
          spawnIntervalMs: 1200,
          delayBeforeGroupMs: 1200,
          pathIndex: 0,
          concurrentWithPrevious: true,
          speedMultiplier: 2,
        },
        {
          definitionId: 'bettle',
          count: 2,
          spawnIntervalMs: 2000,
          delayBeforeGroupMs: 3000,
          pathIndex: 0,
          concurrentWithPrevious: true,
          hpMultiplier: 1.5,
          speedMultiplier: 1.5,
        },
      ],
    },
  ],
  lives: 10,
};
