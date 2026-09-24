import { TDLevelData } from '@/engine/tower-defense/types';

/**
 * A close, single-screen shoreline slice. Yokodillo patrols the folded land
 * route while Dormatee crosses the broad shallow-water foreground. Wildlife
 * leaves at the far end, and the level completes once every unit is gone.
 */
export const LEVEL_7: TDLevelData = {
  paths: [
    [
      { x: 102, y: 25 },
      { x: 65, y: 25 },
      { x: 65, y: 43 },
      { x: 20, y: 43 },
      { x: 20, y: 14 },
      { x: -2, y: 14 },
    ],
    [
      { x: 102, y: 70 },
      { x: 78, y: 69 },
      { x: 55, y: 72 },
      { x: 32, y: 68 },
      { x: 10, y: 72 },
      { x: -2, y: 69 },
    ],
  ],
  placementSpots: [
    { x: 89, y: 15 },
    { x: 84, y: 39 },
    { x: 73, y: 35 },
    { x: 55, y: 15 },
    { x: 51, y: 36 },
    { x: 35, y: 18 },
    { x: 33, y: 36 },
    { x: 9, y: 27 },
  ],
  environmentUnits: [
    {
      tdConfigId: 'tigrevel_shore_leave',
      position: { x: 50, y: 22 },
    },
    {
      tdConfigId: 'kip_shore_leave',
      position: { x: 80, y: 17 },
    },
    {
      tdConfigId: 'maribel_shore_leave',
      position: { x: 10, y: 42 },
    },
    {
      tdConfigId: 'caleb_shore_leave',
      position: { x: 91, y: 55 },
    },
  ],
  waveEnemyDefinitions: [
    {
      id: 'level_7_yokodillo',
      creatureId: 'yokodillo',
      level: 9,
      speedMultiplier: 0.8,
    },
    {
      id: 'level_7_dormatee',
      creatureId: 'dormatee',
      level: 9,
      speedMultiplier: 0.65,
    },
  ],
  waves: [
    {
      id: 'island_wildlife',
      groups: [
        {
          enemyDefinitionId: 'level_7_yokodillo',
          count: 3,
          spawnIntervalMs: 6000,
          delayBeforeGroupMs: 800,
          pathIndex: 0,
        },
        {
          enemyDefinitionId: 'level_7_dormatee',
          count: 2,
          spawnIntervalMs: 9000,
          delayBeforeGroupMs: 2500,
          pathIndex: 1,
          concurrentWithPrevious: true,
        },
      ],
    },
  ],
  lives: 1,
  cannotLose: true,
  closeCompletesLevel: true,
  introMessage: 'Explore at your own pace!',
  backgroundUrl: '/battles/bg/bg_level_7_red_sandstone_shore.webp',
  backgroundScale: 1,
};
