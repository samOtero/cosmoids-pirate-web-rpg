import { TDLevelData } from '@/engine/tower-defense/types';

/**
 * First playable three-corridor slice for the Level 6 officer confrontation.
 *
 * Poguin use the upper and lower lanes while Tigrevel is synchronized to the
 * unobstructed center track. Voltusk occupies the raised northern dais and Mari
 * waits in the southern recovery alcove. Voltusk bombards occupied upper spots
 * with dodgeable electric orbs. Poguin cooperatively haul Tigrevel through
 * steel-rope chains; lane hopping, Mari's healing, the bespoke cursed phase,
 * boss scripting, and final balance remain out of scope here.
 */
export const LEVEL_6: TDLevelData = {
  paths: [
    [
      { x: -1, y: 29 },
      { x: 9, y: 29 },
      { x: 20, y: 27 },
      { x: 35, y: 27 },
      { x: 50, y: 27 },
      { x: 65, y: 27 },
      { x: 78, y: 29 },
      { x: 86, y: 34 },
      { x: 89, y: 39 },
    ],
    [
      { x: -1, y: 50 },
      { x: 12, y: 50 },
      { x: 28, y: 50 },
      { x: 44, y: 50 },
      { x: 60, y: 50 },
      { x: 76, y: 50 },
      { x: 89, y: 50 },
    ],
    [
      { x: -1, y: 71 },
      { x: 9, y: 71 },
      { x: 20, y: 73 },
      { x: 35, y: 73 },
      { x: 50, y: 73 },
      { x: 65, y: 73 },
      { x: 78, y: 71 },
      { x: 86, y: 66 },
      { x: 89, y: 61 },
    ],
  ],
  placementSpots: [
    // Voltusk combat positions on the upper platform.
    { x: 28, y: 19 },
    { x: 50, y: 20 },
    { x: 72, y: 19 },
    // Mari recovery positions in the lower alcove.
    { x: 28, y: 81 },
    { x: 50, y: 80 },
    { x: 72, y: 81 },
  ],
  safePlacementSpotIndices: [3, 4, 5],
  environmentUnits: [
    {
      position: { x: 44, y: 88 },
      tdConfigId: 'caleb_battle',
      facingDirection: 'up',
    },
    {
      position: { x: 56, y: 88 },
      tdConfigId: 'kip_battle',
      facingDirection: 'up',
    },
    {
      position: { x: 50, y: 88 },
      tdConfigId: 'maribel_capture',
      facingDirection: 'up',
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
      position: { x: 82, y: 50 },
      facingDirection: 'left',
      isFixed: true,
      receivesExperience: false,
    },
  ],
  captureUnits: [
    {
      position: { x: 89, y: 50 },
      tdConfigId: 'tigrevel_netted',
      haulPathIndex: 1,
      groupHauling: {
        eligibleCreatureId: 'poguin',
        joinRadius: 12,
        baseSpeedMultiplier: 0.12,
        speedMultiplierPerAdditionalHauler: 0.16,
        maxSpeedMultiplier: 0.92,
      },
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
      stationaryPosition: { x: 50, y: 12 },
      abilityId: 'VOLTUSK_ELECTRIC_ORB',
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
          pathIndex: 2,
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
          pathIndex: 2,
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
  backgroundUrl: '/battles/bg/bg_level_6_three_lane_draft_v3.png',
  backgroundScale: 3,
  initialView: {
    offsetX: 50,
    offsetY: 50,
    zoom: 0.3,
  },
  introMessage: 'Protect Tigrevel!',
};
