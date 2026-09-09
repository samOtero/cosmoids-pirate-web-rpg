import { TDLevelData } from '@/engine/tower-defense/types';

/**
 * First playable three-corridor slice for the Level 6 officer confrontation.
 *
 * Poguin use the upper and lower lanes while Tigrevel is synchronized to the
 * unobstructed center track. Voltusk occupies the raised northern dais and Mari
 * waits in the southern recovery alcove. Voltusk bombards occupied upper spots
 * with dodgeable electric orbs. Poguin cooperatively haul Tigrevel through
 * steel-rope chains. Before they attach, Poguin make one telegraphed hop to
 * the opposite Poguin lane and cannot be newly targeted while airborne.
 * Mari's healing, the bespoke cursed phase, boss scripting, and final balance
 * remain out of scope here.
 */
export const LEVEL_6: TDLevelData = {
  paths: [
    [
      {
        x: -1,
        y: 43,
      },
      {
        x: 9,
        y: 43,
      },
      {
        x: 20,
        y: 43,
      },
      {
        x: 35,
        y: 43,
      },
      {
        x: 50,
        y: 43,
      },
      {
        x: 65,
        y: 43,
      },
      {
        x: 78,
        y: 43,
      },
      {
        x: 86,
        y: 43,
      },
      {
        x: 89,
        y: 43,
      },
    ],
    [
      {
        x: -1,
        y: 46,
      },
      {
        x: 12,
        y: 46,
      },
      {
        x: 28,
        y: 46,
      },
      {
        x: 44,
        y: 46,
      },
      {
        x: 60,
        y: 46,
      },
      {
        x: 76,
        y: 46,
      },
      {
        x: 89,
        y: 46,
      },
    ],
    [
      {
        x: -1,
        y: 49,
      },
      {
        x: 9,
        y: 49,
      },
      {
        x: 20,
        y: 49,
      },
      {
        x: 35,
        y: 49,
      },
      {
        x: 50,
        y: 49,
      },
      {
        x: 65,
        y: 49,
      },
      {
        x: 78,
        y: 49,
      },
      {
        x: 86,
        y: 49,
      },
      {
        x: 89,
        y: 49,
      },
    ],
  ],
  placementSpots: [
    {
      x: 42.37,
      y: 16.33,
    },
    {
      x: 50,
      y: 20,
    },
    {
      x: 57.71,
      y: 16.09,
    },
    {
      x: 41.21,
      y: 90.05,
    },
    {
      x: 24.51,
      y: 65.6,
    },
    {
      x: 57.23,
      y: 90.42,
    },
    {
      x: 31.28,
      y: 66.21,
    },
    {
      x: 17.59,
      y: 65.48,
    },
    {
      x: 24.64,
      y: 26.06,
    },
    {
      x: 17.86,
      y: 25.58,
    },
    {
      x: 40.8,
      y: 65.85,
    },
    {
      x: 31.76,
      y: 26.67,
    },
    {
      x: 50.11,
      y: 65.12,
    },
    {
      x: 40.73,
      y: 26.79,
    },
    {
      x: 49.97,
      y: 27.16,
    },
    {
      x: 59.35,
      y: 27.65,
    },
    {
      x: 59.22,
      y: 65.24,
    },
    {
      x: 71.82,
      y: 27.4,
    },
    {
      x: 81.95,
      y: 27.4,
    },
    {
      x: 70.72,
      y: 64.99,
    },
    {
      x: 81.74,
      y: 64.63,
    },
  ],
  safePlacementSpotIndices: [3, 4, 5],
  environmentUnits: [
    {
      position: {
        x: 26.22,
        y: 78.74,
      },
      tdConfigId: 'caleb_battle',
      facingDirection: 'up',
    },
    {
      position: {
        x: 76.13,
        y: 79.23,
      },
      tdConfigId: 'kip_battle',
      facingDirection: 'up',
    },
    {
      position: {
        x: 49.97,
        y: 87.74,
      },
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
      position: {
        x: 82,
        y: 46,
      },
      facingDirection: 'left',
      isFixed: true,
      receivesExperience: false,
    },
  ],
  captureUnits: [
    {
      position: {
        x: 89,
        y: 46,
      },
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
      stationaryPosition: {
        x: 50,
        y: 12,
      },
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
          laneHop: {
            targetPathIndex: 2,
            triggerProgress: 0.34,
            windupMs: 650,
            durationMs: 600,
            arcHeight: 58,
          },
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
          laneHop: {
            targetPathIndex: 0,
            triggerProgress: 0.66,
            windupMs: 650,
            durationMs: 600,
            arcHeight: 58,
          },
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
          laneHop: {
            targetPathIndex: 0,
            triggerProgress: 0.5,
            windupMs: 500,
            durationMs: 550,
            arcHeight: 62,
          },
        },
      ],
    },
  ],
  lives: 1,
  disableCapture: false,
  enemyHpMultiplier: 1,
  backgroundUrl: '/battles/bg/bg_level_6_three_lane_draft_v6.png',
  backgroundScale: 3,
  initialView: {
    offsetX: 50,
    offsetY: 50,
    zoom: 0.3,
  },
  introMessage: 'Protect Tigrevel!',
};
