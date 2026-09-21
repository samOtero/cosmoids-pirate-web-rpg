import { TDLevelData } from '@/engine/tower-defense/types';
import { LEVEL_6_CURSED_INTERMISSION } from '@/constants/dialogs/level6CursedIntermission';

/**
 * First playable three-corridor slice for the Level 6 officer confrontation.
 *
 * Poguin use the upper and lower lanes while Tigrevel is synchronized to the
 * unobstructed center track. Mari waits in the upper-left recovery alcove while
 * Voltusk occupies the raised upper-right dais. Voltusk bombards combat spots
 * with dodgeable electric orbs. Poguin cooperatively haul Tigrevel through
 * steel-rope chains. Before they attach, Poguin make one telegraphed hop to
 * the opposite Poguin lane and cannot be newly targeted while airborne.
 * Mari feeds injured towers on the two safe upper-left recovery spots. At 30%
 * health, Voltusk pauses the fight for a short story intermission, gains the
 * cursed aura, and begins marking up to three distinct orb targets per attack.
 * Final encounter balance remains in progress.
 */
export const LEVEL_6: TDLevelData = {
  towerRangeMultiplier: 0.5,
  paths: [
    [
      {
        x: -1,
        y: 52,
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
        x: -1,
        y: 58,
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
      x: 70.99,
      y: 18.16,
    },
    {
      x: 79.83,
      y: 23.27,
    },
    {
      x: 88.11,
      y: 19.13,
    },
    {
      x: 11.22,
      y: 25.09,
    },
    {
      x: 25,
      y: 66,
    },
    {
      x: 24.98,
      y: 24.85,
    },
    {
      x: 34,
      y: 66,
    },
    {
      x: 16,
      y: 66,
    },
    {
      x: 25,
      y: 43,
    },
    {
      x: 16,
      y: 43,
    },
    {
      x: 44,
      y: 66,
    },
    {
      x: 35,
      y: 43,
    },
    {
      x: 54,
      y: 66,
    },
    {
      x: 45,
      y: 43,
    },
    {
      x: 55,
      y: 43,
    },
    {
      x: 65,
      y: 43,
    },
    {
      x: 64,
      y: 66,
    },
    {
      x: 75,
      y: 43,
    },
    {
      x: 86,
      y: 43,
    },
    {
      x: 75,
      y: 66,
    },
    {
      x: 86,
      y: 66,
    },
  ],
  safePlacementSpotIndices: [3, 5],
  towerRecovery: {
    placementSpotIndices: [3, 5],
    healerPosition: {
      x: 18,
      y: 14,
    },
    healerIdleFacingDirection: 'down',
    healFraction: 0.35,
    feedingIntervalMs: 8000,
    tutorial: {
      triggerHealthFraction: 0.75,
      speakerName: 'Mari',
      portraitUrl: '/dialog/maribel_determined.webp',
      message: "They're hurt! Bring them here—I packed food!",
      instruction: 'Drag the injured Cosmoid onto a glowing recovery spot.',
    },
  },
  cursedPhase: {
    enemyDefinitionId: 'level_6_voltusk',
    triggerHealthFraction: 0.3,
    intermission: LEVEL_6_CURSED_INTERMISSION,
    transformationLineIndex: 2,
  },
  environmentUnits: [
    {
      position: {
        x: 45.27,
        y: 31.48,
      },
      tdConfigId: 'caleb_battle',
      facingDirection: 'up',
    },
    {
      position: {
        x: 36.32,
        y: 29.22,
      },
      tdConfigId: 'kip_battle',
      facingDirection: 'up',
    },
    {
      position: {
        x: 18.07,
        y: 20.1,
      },
      tdConfigId: 'maribel_capture',
      facingDirection: 'down',
    },
    {
      position: {
        x: 61.46,
        y: 28.7,
      },
      tdConfigId: 'commander_strake_battle',
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
      position: {
        x: 82,
        y: 55,
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
        y: 55,
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
        x: 85,
        y: 14,
      },
      abilityId: 'VOLTUSK_ELECTRIC_ORB',
      hpMultiplier: 4,
      weakenedThreshold: 0.3,
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
  backgroundUrl: '/battles/bg/bg_level_6_three_lane_compact_v1.webp',
  backgroundScale: 2,
  initialView: {
    offsetX: 50,
    offsetY: 0,
    zoom: 0.7,
  },
  introMessage: 'Protect Tigrevel!',
};
