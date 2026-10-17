import { SpeciesId } from '@/types/definitionIds';
import { TDLevelData } from '@/engine/tower-defense/types';

/**
 * A close, single-screen shoreline slice with independently rolled wildlife.
 * Land visitors follow the folded route; Dormatee and Aguana cross the shallows.
 * A finite wildlife visit ends after the last arrivals clear, or on leaving early.
 */
export const LEVEL_7: TDLevelData = {
  paths: [
    [
      { x: 100.5, y: 27.39 },
      { x: 65.24, y: 31.72 },
      { x: 64.74, y: 45.8 },
      { x: 16.35, y: 40.03 },
      { x: 15.81, y: 16.86 },
      { x: -2.32, y: 10.42 },
    ],
    [
      { x: 100.77, y: 99.03 },
      { x: 76.22, y: 70.03 },
      { x: 57.71, y: 58.38 },
      { x: 26.39, y: 58.44 },
      { x: 10, y: 72 },
      { x: -2, y: 69 },
    ],
  ],
  placementSpots: [
    { x: 79.42, y: 24.14 },
    { x: 64.52, y: 25.11 },
    { x: 70.92, y: 37.5 },
    { x: 55, y: 15 },
    { x: 59.54, y: 37.2 },
    { x: 31.64, y: 49.23 },
    { x: 31.88, y: 35.69 },
    { x: 21.72, y: 24.32 },
    { x: 38.93, y: 52.28 },
    { x: 54.68, y: 50.78 },
    { x: 79.87, y: 63.71 },
  ],
  environmentUnits: [
    {
      tdConfigId: 'tigrevel_shore_leave',
      position: { x: 43.14, y: 35.45 },
    },
    {
      tdConfigId: 'kip_shore_leave',
      position: { x: 56, y: 30.58 },
    },
    {
      tdConfigId: 'maribel_shore_leave',
      position: { x: 16.65, y: 51.46 },
    },
    {
      tdConfigId: 'caleb_shore_leave',
      position: { x: 78.01, y: 51.88 },
    },
  ],
  waveEnemyDefinitions: [
    {
      id: 'level_7_yokodillo',
      creatureId: SpeciesId.YOKODILLO,
      level: 12,
      speedMultiplier: 1,
      hpMultiplier: 6,
      weakenedThreshold: 0.3,
    },
    {
      id: 'level_7_dormatee',
      creatureId: SpeciesId.DORMATEE,
      level: 12,
      speedMultiplier: 0.65,
      hpMultiplier: 6,
      weakenedThreshold: 0.3,
    },
    {
      id: 'level_7_aguana',
      creatureId: SpeciesId.AGUANA,
      level: 12,
      speedMultiplier: 1.1,
      hpMultiplier: 5,
      weakenedThreshold: 0.3,
    },
    {
      id: 'level_7_harlequill',
      creatureId: SpeciesId.HARLEQUILL,
      level: 12,
      speedMultiplier: 1.1,
      hpMultiplier: 4,
    },
    {
      id: 'level_7_knotia',
      creatureId: SpeciesId.KNOTIA,
      level: 12,
      speedMultiplier: 1.4,
      hpMultiplier: 4,
    },
    {
      id: 'level_7_sailkworm',
      creatureId: SpeciesId.SAILKWORM,
      level: 6,
      speedMultiplier: 1.1,
      hpMultiplier: 4,
    },
  ],
  waves: [
    {
      id: 'island_wildlife',
      repeatCount: 20,
      delayBetweenRepeatsMs: 5000,
      groups: [
        {
          enemyDefinitionId: 'level_7_yokodillo',
          encounterPool: [
            { enemyDefinitionId: 'level_7_yokodillo', weight: 15 },
            { enemyDefinitionId: 'level_7_dormatee', weight: 5, pathIndex: 1 },
            { enemyDefinitionId: 'level_7_aguana', weight: 10, pathIndex: 1 },
            { enemyDefinitionId: 'level_7_harlequill', weight: 25 },
            { enemyDefinitionId: 'level_7_knotia', weight: 25 },
            { enemyDefinitionId: 'level_7_sailkworm', weight: 20 },
          ],
          count: 10,
          spawnIntervalMs: 800,
          delayBeforeGroupMs: 800,
          pathIndex: 0,
        },
      ],
    },
  ],
  lives: 1,
  cannotLose: true,
  closeCompletesLevel: true,
  introMessage: 'Relax!',
  backgroundUrl: '/battles/bg/bg_level_7_red_sandstone_shore.webp',
  backgroundScale: 2,
  initialView: { offsetX: 50, offsetY: 22, zoom: 0.8 },
};
