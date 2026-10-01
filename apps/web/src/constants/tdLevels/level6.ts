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
      x: 41.05,
      y: 25.46,
    },
    {
      x: 48.45,
      y: 32,
    },
    {
      x: 56,
      y: 25.72,
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
    triggerHealthFraction: 0.3,
    intermission: LEVEL_6_CURSED_INTERMISSION,
    transformationLineIndex: 2,
  },
  environmentUnits: [
    {
      position: {
        x: 32.25,
        y: 26.41,
      },
      tdConfigId: 'caleb_battle',
      facingDirection: 'up',
    },
    {
      position: {
        x: 29.2,
        y: 23.75,
      },
      tdConfigId: 'kip_battle',
      facingDirection: 'up',
    },
    {
      position: {
        x: 26.01,
        y: 28.13,
      },
      tdConfigId: 'maribel_capture',
      facingDirection: 'down',
      visualState: 'idle',
    },
    {
      position: {
        x: 65.24,
        y: 23.06,
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
        joinRadius: 6,
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
      level: 10,
      stationaryPosition: {
        x: 85,
        y: 14,
      },
      abilityId: 'VOLTUSK_ELECTRIC_ORB',
      hpMultiplier: 4,
      weakenedThreshold: 0.3,
    },
    {
      id: 'level_6_aguana',
      creatureId: 'aguana',
      level: 8,
      speedMultiplier: 1.1,
      hpMultiplier: 0.9,
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
        {
          enemyDefinitionId: 'level_6_aguana',
          count: 1,
          spawnIntervalMs: 1000,
          delayBeforeGroupMs: 800,
          pathIndex: 1,
          turnAroundAtEnd: true,
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
        {
          enemyDefinitionId: 'level_6_aguana',
          count: 2,
          spawnIntervalMs: 1200,
          delayBeforeGroupMs: 700,
          pathIndex: 1,
          turnAroundAtEnd: true,
        },
      ],
    },
  ],
  lives: 1,
  disableCapture: false,
  enemyHpMultiplier: 1,
  backgroundUrl: '/battles/bg/bg_level_6_three_lane_compact_v1.webp',
  backgroundScale: 2.5,
  initialView: {
    offsetX: 50,
    offsetY: 0,
    zoom: 0.7,
  },
  introMessage: 'Protect Tigrevel!',
};
