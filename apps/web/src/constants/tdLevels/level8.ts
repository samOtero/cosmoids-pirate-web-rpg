import { TDLevelData } from '@/engine/tower-defense/types';

/**
 * Tournament layout prototype. Existing species are temporary visual stand-ins,
 * not the storyteller's approved roster. Automatic allied runners contest the
 * rival flag while player towers protect their flag and clear the rival defender.
 */
export const LEVEL_8: TDLevelData = {
  paths: [
    [
      { x: 88, y: 62 },
      { x: 70, y: 62 },
      { x: 50, y: 62 },
      { x: 30, y: 62 },
      { x: 12, y: 50 },
    ],
    [
      { x: 12, y: 50 },
      { x: 20, y: 38 },
      { x: 30, y: 38 },
      { x: 50, y: 38 },
      { x: 70, y: 38 },
      { x: 88, y: 50 },
    ],
  ],
  placementSpots: [
    { x: 25, y: 48 },
    { x: 35, y: 28 },
    { x: 45, y: 48 },
    { x: 55, y: 48 },
    { x: 35, y: 75 },
    { x: 55, y: 28 },
    { x: 55, y: 75 },
  ],
  waveEnemyDefinitions: [
    {
      id: 'practice_runner',
      creatureId: 'mouse_1',
      level: 8,
      speedMultiplier: 0.8,
      hpMultiplier: 2,
    },
    {
      id: 'practice_defender',
      creatureId: 'harlequill',
      level: 10,
      stationaryPosition: { x: 70, y: 48 },
      immuneToDisplacement: true,
      hpMultiplier: 5,
    },
  ],
  waves: [
    {
      id: 'opening_practice',
      groups: [
        {
          enemyDefinitionId: 'practice_defender',
          count: 1,
          spawnIntervalMs: 0,
          delayBeforeGroupMs: 0,
          pathIndex: 0,
        },
        {
          enemyDefinitionId: 'practice_runner',
          count: 4,
          spawnIntervalMs: 1800,
          delayBeforeGroupMs: 2500,
          concurrentWithPrevious: true,
          pathIndex: 0,
        },
      ],
    },
    {
      id: 'runner_practice',
      repeatCount: 2,
      delayBetweenRepeatsMs: 5000,
      groups: [
        {
          enemyDefinitionId: 'practice_runner',
          count: 4,
          spawnIntervalMs: 1800,
          delayBeforeGroupMs: 3500,
          pathIndex: 0,
        },
      ],
    },
  ],
  lives: 3,
  flagDuel: {
    rivalFlagLives: 3,
    alliedRunner: {
      creatureId: 'mouse_1',
      level: 8,
      pathIndex: 1,
      speed: 10,
      spawnIntervalMs: 2500,
      firstSpawnDelayMs: 500,
      strikeDurationMs: 450,
    },
    defenders: [
      {
        enemyDefinitionId: 'practice_defender',
        range: 18,
        damage: 12,
        cooldownMs: 1200,
      },
    ],
  },
  disableCapture: true,
  backgroundUrl: '/battles/bg/level_8_arena_prototype.svg',
  backgroundScale: 1,
  fitToScreen: true,
  introMessage: 'Capture their flag!',
};
