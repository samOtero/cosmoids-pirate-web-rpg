import { TDLevelData } from '@/engine/tower-defense/types';

/**
 * Temporary playable shell for Level 5. The final battle will be a breakout:
 * Caleb, Kip, and Mari must avoid capture while the party breaks Tigrevel's
 * prison bars. For now, this keeps the story flow playable while that bespoke
 * objective is developed.
 */
export const LEVEL_5: TDLevelData = {
  paths: [
    [
      { x: 102, y: 54 },
      { x: 72, y: 54 },
      { x: 48, y: 54 },
      { x: -2, y: 54 },
    ],
  ],
  placementSpots: [
    { x: 82, y: 38 },
    { x: 66, y: 70 },
    { x: 52, y: 37 },
    { x: 38, y: 70 },
    { x: 24, y: 38 },
  ],
  environmentUnits: [
    {
      position: { x: 18, y: 63 },
      tdConfigId: 'caleb_battle',
      facingDirection: 'right',
    },
    {
      position: { x: 25, y: 63 },
      tdConfigId: 'kip_battle',
      facingDirection: 'right',
    },
    {
      position: { x: 32, y: 63 },
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
          count: 3,
          spawnIntervalMs: 1200,
          delayBeforeGroupMs: 250,
          pathIndex: 0,
          uncapturable: true,
        },
      ],
    },
  ],
  lives: 3,
  disableCapture: true,
  enemyHpMultiplier: 1,
  backgroundUrl: '/battles/bg/bg_market_level_4.png',
  backgroundScale: 3,
  initialView: {
    offsetX: 0,
    offsetY: 50,
    zoom: 0.72,
  },
  introMessage:
    'Placeholder battle: the prison-break objective is coming next.',
};
