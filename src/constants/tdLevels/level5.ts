import { TDLevelData } from '@/engine/tower-defense/types';
import { ElementType } from '@/types/baseGame';

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
    // Stationary objective path. The distant second point keeps the structure
    // active while its zero movement speed anchors it to the cell door.
    [
      { x: 50, y: 15.5 },
      { x: 50, y: -100 },
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
    { x: 44.5, y: 18.5 },
    { x: 55.5, y: 18.5 },
  ],
  captureUnits: [
    {
      position: { x: 38, y: 24 },
      tdConfigId: 'caleb_capture',
      carrierSpeedMultiplier: 0.9,
      returnHome: { pathIndex: 0, speed: 2, delayMs: 500 },
    },
    {
      position: { x: 50, y: 27 },
      tdConfigId: 'kip_capture',
      carrierSpeedMultiplier: 0.9,
      returnHome: { pathIndex: 1, speed: 2, delayMs: 500 },
    },
    {
      position: { x: 62, y: 24 },
      tdConfigId: 'maribel_capture',
      carrierSpeedMultiplier: 0.9,
      returnHome: { pathIndex: 2, speed: 2, delayMs: 500 },
    },
  ],
  waveEnemyDefinitions: [
    {
      id: 'tigrevel_cell_bars',
      level: 1,
      canCarryCaptureUnits: false,
      structure: {
        tdConfigId: 'tigrevel_cell_bars',
        displayName: 'CELL BARS',
        elementTypes: [ElementType.STEEL],
        maxHp: 260,
        defense: 32,
        specialDefense: 32,
        winsLevelOnDestroy: true,
      },
    },
    {
      id: 'level_5_placeholder_patrol',
      creatureId: 'sonarion',
      level: 8,
      speedMultiplier: 1.2,
    },
    {
      id: 'level_5_bufflora_wild',
      creatureId: 'bufflora',
      level: 8,
      speedMultiplier: 1.1,
      canCarryCaptureUnits: false,
      weakenedThreshold: 0.45,
    },
    {
      id: 'level_5_marophis_wild',
      creatureId: 'marophis',
      level: 8,
      speedMultiplier: 0.9,
      canCarryCaptureUnits: false,
      weakenedThreshold: 0.45,
    },
    // Registered for the planned optional-cell allied-prisoner system. It is
    // intentionally not spawned as an enemy while that behavior is pending.
    {
      id: 'level_5_bramfrit_prisoner',
      creatureId: 'bramfrit',
      level: 8,
      speedMultiplier: 0.75,
      canCarryCaptureUnits: false,
    },
    {
      id: 'level_5_sepippet_prisoner',
      creatureId: 'sepippet',
      level: 8,
      speedMultiplier: 0.85,
      canCarryCaptureUnits: false,
    },
    {
      id: 'level_5_parlet_prisoner',
      creatureId: 'parlet',
      level: 8,
      speedMultiplier: 0.8,
      canCarryCaptureUnits: false,
    },
    {
      id: 'level_5_corrogoon_prisoner',
      creatureId: 'corrogoon',
      level: 8,
      speedMultiplier: 0.7,
      canCarryCaptureUnits: false,
    },
  ],
  waves: [
    {
      id: 'level_5_placeholder_wave',
      groups: [
        {
          enemyDefinitionId: 'tigrevel_cell_bars',
          count: 1,
          spawnIntervalMs: 0,
          delayBeforeGroupMs: 0,
          pathIndex: 3,
          uncapturable: true,
        },
        {
          enemyDefinitionId: 'level_5_placeholder_patrol',
          count: 1,
          spawnIntervalMs: 1200,
          delayBeforeGroupMs: 250,
          pathIndex: 0,
          concurrentWithPrevious: true,
          uncapturable: true,
          turnAroundAtEnd: true,
        },
        {
          enemyDefinitionId: 'level_5_placeholder_patrol',
          count: 1,
          spawnIntervalMs: 1200,
          delayBeforeGroupMs: 500,
          pathIndex: 1,
          concurrentWithPrevious: true,
          uncapturable: true,
          turnAroundAtEnd: true,
        },
        {
          enemyDefinitionId: 'level_5_placeholder_patrol',
          count: 1,
          spawnIntervalMs: 1200,
          delayBeforeGroupMs: 750,
          pathIndex: 2,
          concurrentWithPrevious: true,
          uncapturable: true,
          turnAroundAtEnd: true,
        },
        {
          enemyDefinitionId: 'level_5_bufflora_wild',
          count: 2,
          spawnIntervalMs: 1400,
          delayBeforeGroupMs: 1100,
          pathIndex: 0,
          concurrentWithPrevious: true,
        },
        {
          enemyDefinitionId: 'level_5_marophis_wild',
          count: 1,
          spawnIntervalMs: 1400,
          delayBeforeGroupMs: 1350,
          pathIndex: 2,
          concurrentWithPrevious: true,
        },
      ],
    },
  ],
  lives: 3,
  disableCapture: false,
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
