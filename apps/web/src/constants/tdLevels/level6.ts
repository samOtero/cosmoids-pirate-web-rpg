import { TDLevelData } from '@/engine/tower-defense/types';
import { LEVEL_6_CURSED_INTERMISSION } from '@/constants/dialogs/level6CursedIntermission';

/**
 * First playable three-corridor slice for the Level 6 officer confrontation.
 *
 * Poguin use the upper and lower lanes while Tigrevel is synchronized to the
 * unobstructed center track. Mari waits in the upper-left alcove while Voltusk
 * occupies the raised upper-right dais. Voltusk aims dodgeable electric orbs
 * that briefly paralyze towers, slowing their attacks. Poguin haul Tigrevel through
 * steel-rope chains. Before they attach, Poguin can balance the two side lanes
 * at either shared crossing point and cannot be newly targeted while airborne.
 * At 30% health, Voltusk pauses the fight for a short story intermission, gains
 * the cursed aura, and marks up to three distinct orb targets per attack.
 * Alternating lane surges and a joint push repeat until Voltusk falls, with
 * twelve seconds of no spawning after each cycle to recover and attack the boss.
 * After Voltusk falls, spawning stops but surviving haulers must be cleared.
 * Final encounter balance remains in progress.
 */
export const LEVEL_6: TDLevelData = {
  towerRangeMultiplier: 0.5,
  paths: [
    [
      {
        x: -10.03,
        y: 51.85,
      },
      {
        x: 9,
        y: 52,
      },
      {
        x: 20,
        y: 52,
      },
      {
        x: 35,
        y: 52,
      },
      {
        x: 50,
        y: 52,
      },
      {
        x: 65,
        y: 52,
      },
      {
        x: 78,
        y: 52,
      },
      {
        x: 86,
        y: 52,
      },
      {
        x: 89,
        y: 52,
      },
    ],
    [
      {
        x: -1,
        y: 55,
      },
      {
        x: 12,
        y: 55,
      },
      {
        x: 28,
        y: 55,
      },
      {
        x: 44,
        y: 55,
      },
      {
        x: 60,
        y: 55,
      },
      {
        x: 76,
        y: 55,
      },
      {
        x: 89,
        y: 55,
      },
    ],
    [
      {
        x: -10.03,
        y: 57.87,
      },
      {
        x: 9,
        y: 58,
      },
      {
        x: 20,
        y: 58,
      },
      {
        x: 35,
        y: 58,
      },
      {
        x: 50,
        y: 58,
      },
      {
        x: 65,
        y: 58,
      },
      {
        x: 78,
        y: 58,
      },
      {
        x: 86,
        y: 58,
      },
      {
        x: 89,
        y: 58,
      },
    ],
  ],
  placementSpots: [
    {
      x: 44.27,
      y: 25.16,
    },
    {
      x: 49.46,
      y: 32.3,
    },
    {
      x: 55.01,
      y: 25.64,
    },
    {
      x: 25,
      y: 64,
    },
    {
      x: 34,
      y: 64,
    },
    {
      x: 16,
      y: 64,
    },
    {
      x: 25,
      y: 45,
    },
    {
      x: 16,
      y: 45,
    },
    {
      x: 44,
      y: 64,
    },
    {
      x: 35,
      y: 45,
    },
    {
      x: 54,
      y: 64,
    },
    {
      x: 45,
      y: 45,
    },
    {
      x: 55,
      y: 45,
    },
    {
      x: 65,
      y: 45,
    },
    {
      x: 64,
      y: 64,
    },
    {
      x: 75,
      y: 45,
    },
    {
      x: 86,
      y: 45,
    },
    {
      x: 75,
      y: 64,
    },
    {
      x: 86,
      y: 64,
    },
  ],
  cursedPhase: {
    enemyDefinitionId: 'level_6_voltusk',
    triggerHealthFraction: 0.25,
    intermission: LEVEL_6_CURSED_INTERMISSION,
    transformationLineIndex: 2,
  },
  environmentUnits: [
    {
      position: {
        x: 34.21,
        y: 29.65,
      },
      tdConfigId: 'caleb_battle',
      facingDirection: 'up',
    },
    {
      position: {
        x: 31.19,
        y: 27.52,
      },
      tdConfigId: 'kip_battle',
      facingDirection: 'up',
    },
    {
      position: {
        x: 27.82,
        y: 30.89,
      },
      tdConfigId: 'maribel_capture',
      facingDirection: 'down',
      visualState: 'idle',
    },
    {
      position: {
        x: 65.52,
        y: 29.38,
      },
      tdConfigId: 'commander_strake_battle',
      facingDirection: 'left',
    },
  ],
  startingTowers: [],
  captureUnits: [
    {
      position: {
        x: 89,
        y: 55,
      },
      tdConfigId: 'tigrevel_netted',
      haulPathIndex: 1,
      returnHome: {
        pathIndex: 1,
        speed: 1,
      },
      groupHauling: {
        eligibleCreatureId: 'poguin',
        pickupRadius: 6,
        joinRadius: 6,
        baseSpeedMultiplier: 0.1,
        speedMultiplierPerAdditionalHauler: 0.1,
        maxSpeedMultiplier: 0.6,
      },
    },
  ],
  waveEnemyDefinitions: [
    {
      id: 'level_6_poguin',
      creatureId: 'poguin',
      level: 14,
      speedMultiplier: 1.2,
      hpMultiplier: 4,
      balancedLaneHop: {
        pathIndices: [0, 2],
        triggerProgresses: [0.35, 0.65],
        windupMs: 650,
        durationMs: 600,
        arcHeight: 58,
      },
    },
    {
      id: 'level_6_voltusk',
      creatureId: 'voltusk',
      immuneToDisplacement: true,
      targetingRangeMultiplier: 2,
      level: 22,
      stationaryPosition: {
        x: 50,
        y: 25,
      },
      abilityId: 'VOLTUSK_ELECTRIC_ORB',
      hpMultiplier: 60,
      weakenedThreshold: 0.25,
    },
  ],
  waves: [
    {
      id: 'voltusk_and_first_haulers',
      groups: [
        {
          enemyDefinitionId: 'level_6_voltusk',
          count: 1,
          spawnIntervalMs: 0,
          delayBeforeGroupMs: 2000,
          pathIndex: 0,
          uncapturable: true,
        },
        {
          enemyDefinitionId: 'level_6_poguin',
          count: 3,
          spawnIntervalMs: 1300,
          delayBeforeGroupMs: 500,
          pathIndex: 0,
          turnAroundAtEnd: true,
          concurrentWithPrevious: true,
          uncapturable: true,
        },
        {
          enemyDefinitionId: 'level_6_poguin',
          count: 3,
          spawnIntervalMs: 1800,
          delayBeforeGroupMs: 1300,
          pathIndex: 2,
          turnAroundAtEnd: true,
          concurrentWithPrevious: true,
          uncapturable: true,
        },
      ],
    },
    {
      id: 'poguin_pressure_cycle',
      groups: [
        // Upper surge with a sparse lower-lane escort.
        {
          enemyDefinitionId: 'level_6_poguin',
          count: 5,
          spawnIntervalMs: 1100,
          delayBeforeGroupMs: 0,
          pathIndex: 0,
          turnAroundAtEnd: true,
          uncapturable: true,
        },
        {
          enemyDefinitionId: 'level_6_poguin',
          count: 2,
          spawnIntervalMs: 3200,
          delayBeforeGroupMs: 0,
          pathIndex: 2,
          turnAroundAtEnd: true,
          concurrentWithPrevious: true,
          uncapturable: true,
        },
        // Mirror the pressure after a short break.
        {
          enemyDefinitionId: 'level_6_poguin',
          count: 5,
          spawnIntervalMs: 1100,
          delayBeforeGroupMs: 6000,
          pathIndex: 2,
          turnAroundAtEnd: true,
          uncapturable: true,
        },
        {
          enemyDefinitionId: 'level_6_poguin',
          count: 2,
          spawnIntervalMs: 3200,
          delayBeforeGroupMs: 6000,
          pathIndex: 0,
          turnAroundAtEnd: true,
          concurrentWithPrevious: true,
          uncapturable: true,
        },
        // A coordinated push precedes the completely quiet recovery window.
        {
          enemyDefinitionId: 'level_6_poguin',
          count: 4,
          spawnIntervalMs: 1100,
          delayBeforeGroupMs: 6000,
          pathIndex: 0,
          turnAroundAtEnd: true,
          uncapturable: true,
        },
        {
          enemyDefinitionId: 'level_6_poguin',
          count: 4,
          spawnIntervalMs: 1100,
          delayBeforeGroupMs: 6000,
          pathIndex: 2,
          turnAroundAtEnd: true,
          concurrentWithPrevious: true,
          uncapturable: true,
        },
      ],
    },
  ],
  reinforcementBossDefinitionId: 'level_6_voltusk',
  endlessWaves: {
    delayBetweenWavesMs: 10000,
    hpIncreasePerWave: 0.05,
  },
  lives: 1,
  disableCapture: false,
  enemyHpMultiplier: 1,
  backgroundUrl: '/battles/bg/bg_level_6_three_lane_compact_v1.webp',
  backgroundScale: 2.5,
  initialView: {
    offsetX: 50,
    offsetY: 9,
    zoom: 0.6,
  },
  introMessage: 'Defeat Voltusk!',
};
