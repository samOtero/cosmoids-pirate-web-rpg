import { TDLevelData } from '@/engine/tower-defense/types';

/**
 * First playable two-lane slice for the Level 6 officer confrontation.
 *
 * Both lanes leave the same prison gate and converge on Tigrevel, so every
 * carrier retreats toward one unambiguous recapture destination. Tigrevel uses
 * the existing capture-objective rules to stand in for the future stacked
 * hauling mechanic. Lane hopping, allied damage and healing, the bespoke cursed
 * phase, boss scripting, and final encounter balance remain out of scope here.
 */
export const LEVEL_6: TDLevelData = {
  paths: [
    [
      { x: -1, y: 43 },
      { x: 6, y: 43 },
      { x: 12, y: 34 },
      { x: 15, y: 25 },
      { x: 24, y: 18 },
      { x: 37, y: 18 },
      { x: 50, y: 20 },
      { x: 63, y: 18 },
      { x: 75, y: 20 },
      { x: 82, y: 28 },
      { x: 86, y: 36 },
      { x: 89, y: 43 },
    ],
    [
      { x: -1, y: 43 },
      { x: 6, y: 43 },
      { x: 12, y: 52 },
      { x: 18, y: 61 },
      { x: 30, y: 61 },
      { x: 42, y: 65 },
      { x: 55, y: 66 },
      { x: 68, y: 63 },
      { x: 78, y: 57 },
      { x: 85, y: 50 },
      { x: 89, y: 43 },
    ],
  ],
  placementSpots: [
    { x: 22, y: 22 },
    { x: 38, y: 22 },
    { x: 62, y: 22 },
    { x: 77, y: 25 },
    { x: 22, y: 57 },
    { x: 39, y: 61 },
    { x: 61, y: 61 },
    { x: 78, y: 55 },
  ],
  environmentUnits: [
    {
      position: { x: 91, y: 72 },
      tdConfigId: 'caleb_battle',
      facingDirection: 'left',
    },
    {
      position: { x: 94, y: 74 },
      tdConfigId: 'kip_battle',
      facingDirection: 'left',
    },
    {
      position: { x: 97, y: 72 },
      tdConfigId: 'maribel_capture',
      facingDirection: 'left',
    },
  ],
  startingTowers: [
    {
      creature: {
        id: 'level_6_mopup',
        speciesId: 'mopup',
        level: 8,
        xp: 0,
        equippedAttacks: ['TACKLE'],
        activeAttackIndex: 0,
        targetingMode: 'first',
        isShiny: false,
      },
      position: { x: 82, y: 47 },
      facingDirection: 'left',
      isFixed: true,
      receivesExperience: false,
    },
  ],
  captureUnits: [
    {
      position: { x: 89, y: 43 },
      tdConfigId: 'tigrevel_netted',
      carrierSpeedMultiplier: 0.6,
    },
  ],
  waveEnemyDefinitions: [
    {
      id: 'level_6_poguin',
      creatureId: 'poguin',
      level: 8,
      speedMultiplier: 1.25,
      hpMultiplier: 1.25,
    },
    {
      id: 'level_6_voltusk',
      creatureId: 'voltusk',
      level: 10,
      speedMultiplier: 0.65,
      hpMultiplier: 4,
      weakenedThreshold: 0.5,
    },
  ],
  waves: [
    {
      id: 'poguin_haulers',
      groups: [
        {
          enemyDefinitionId: 'level_6_poguin',
          count: 3,
          spawnIntervalMs: 1300,
          delayBeforeGroupMs: 500,
          pathIndex: 0,
          turnAroundAtEnd: true,
          uncapturable: true,
        },
        {
          enemyDefinitionId: 'level_6_poguin',
          count: 3,
          spawnIntervalMs: 1300,
          delayBeforeGroupMs: 500,
          pathIndex: 1,
          turnAroundAtEnd: true,
          concurrentWithPrevious: true,
          uncapturable: true,
        },
      ],
    },
    {
      id: 'voltusk_advance',
      groups: [
        {
          enemyDefinitionId: 'level_6_voltusk',
          count: 1,
          spawnIntervalMs: 1000,
          delayBeforeGroupMs: 1000,
          pathIndex: 0,
          turnAroundAtEnd: true,
          uncapturable: true,
        },
        {
          enemyDefinitionId: 'level_6_poguin',
          count: 4,
          spawnIntervalMs: 1100,
          delayBeforeGroupMs: 1500,
          pathIndex: 1,
          turnAroundAtEnd: true,
          concurrentWithPrevious: true,
          uncapturable: true,
        },
      ],
    },
  ],
  lives: 1,
  disableCapture: false,
  enemyHpMultiplier: 1,
  backgroundUrl: '/battles/bg/bg_level_6_two_lane_draft.png',
  introMessage: 'Protect Tigrevel!',
};
