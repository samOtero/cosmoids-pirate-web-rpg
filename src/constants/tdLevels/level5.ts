import { TDLevelData } from '@/engine/tower-defense/types';

/**
 * Level 5 takes place in Ironbell's flooded prison block. Three approaches
 * converge on Tigrevel's cell while the optional side-cell mechanics and the
 * final prison-break objective are developed.
 */
export const LEVEL_5: TDLevelData = {
  paths: [
    [
      { x: 17.5, y: 103 },
      { x: 17.5, y: 84 },
      { x: 21.5, y: 74 },
      { x: 20.5, y: 64 },
      { x: 20, y: 53 },
      { x: 21, y: 43 },
      { x: 26, y: 32 },
      { x: 34, y: 23 },
      { x: 42, y: 19 },
      { x: 50, y: 17 },
    ],
    [
      { x: 50, y: 103 },
      { x: 50, y: 83 },
      { x: 50, y: 65 },
      { x: 50, y: 50 },
      { x: 50, y: 33 },
      { x: 50, y: 17 },
    ],
    [
      { x: 82.5, y: 103 },
      { x: 82.5, y: 84 },
      { x: 78.5, y: 74 },
      { x: 79.5, y: 64 },
      { x: 80, y: 53 },
      { x: 79, y: 43 },
      { x: 74, y: 32 },
      { x: 66, y: 23 },
      { x: 58, y: 19 },
      { x: 50, y: 17 },
    ],
  ],
  placementSpots: [
    { x: 13, y: 84 },
    { x: 27, y: 84 },
    { x: 42, y: 84 },
    { x: 58, y: 84 },
    { x: 73, y: 84 },
    { x: 87, y: 84 },
    { x: 45, y: 45 },
    { x: 55, y: 45 },
    { x: 25, y: 18 },
    { x: 75, y: 18 },
  ],
  environmentUnits: [
    {
      position: { x: 44, y: 21 },
      tdConfigId: 'caleb_battle',
      facingDirection: 'right',
    },
    {
      position: { x: 50, y: 22 },
      tdConfigId: 'kip_battle',
      facingDirection: 'right',
    },
    {
      position: { x: 56, y: 21 },
      tdConfigId: 'maribel_capture',
      facingDirection: 'right',
    },
  ],
  waveEnemyDefinitions: [
    {
      id: 'level_5_placeholder_patrol',
      creatureId: 'sonarion',
      level: 8,
      speedMultiplier: 1.2,
    },
  ],
  waves: [
    {
      id: 'level_5_placeholder_wave',
      groups: [
        {
          enemyDefinitionId: 'level_5_placeholder_patrol',
          count: 1,
          spawnIntervalMs: 1200,
          delayBeforeGroupMs: 250,
          pathIndex: 0,
          uncapturable: true,
        },
        {
          enemyDefinitionId: 'level_5_placeholder_patrol',
          count: 1,
          spawnIntervalMs: 1200,
          delayBeforeGroupMs: 500,
          pathIndex: 1,
          concurrentWithPrevious: true,
          uncapturable: true,
        },
        {
          enemyDefinitionId: 'level_5_placeholder_patrol',
          count: 1,
          spawnIntervalMs: 1200,
          delayBeforeGroupMs: 750,
          pathIndex: 2,
          concurrentWithPrevious: true,
          uncapturable: true,
        },
      ],
    },
  ],
  lives: 3,
  disableCapture: true,
  enemyHpMultiplier: 1,
  backgroundUrl: '/battles/bg/bg_level_5_ironbell_prison.png',
  backgroundScale: 3,
  initialView: {
    offsetX: 50,
    offsetY: 0,
    zoom: 0.4,
  },
  introMessage: "Defend all three approaches to Tigrevel's cell!",
};
