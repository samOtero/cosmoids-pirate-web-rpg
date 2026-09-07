import { TDLevelData } from '@/engine/tower-defense/types';
import { ElementType } from '@/types/baseGame';

/**
 * Level 5 takes place in Ironbell's flooded prison block. Three approaches
 * converge on Tigrevel's cell. Escalating reinforcements continue until the
 * player breaks the main bars, with optional side-cell allies helping the breach.
 */
const PRISON_GATE_HP = 350;
export const LEVEL_5: TDLevelData = {
  paths: [
    [
      {
        x: 14.57,
        y: 103,
      },
      {
        x: 20.27,
        y: 83.23,
      },
      {
        x: 21.81,
        y: 73.9,
      },
      {
        x: 19.42,
        y: 63.46,
      },
      {
        x: 20.79,
        y: 50.48,
      },
      {
        x: 19.82,
        y: 37.2,
      },
      {
        x: 24.66,
        y: 26.86,
      },
      {
        x: 32.65,
        y: 20.47,
      },
      {
        x: 38.81,
        y: 19.26,
      },
      {
        x: 49.83,
        y: 21.69,
      },
      {
        x: 61.24,
        y: 19.56,
      },
    ],
    [
      {
        x: 49.6,
        y: 102.29,
      },
      {
        x: 49.66,
        y: 72.48,
      },
      {
        x: 49.71,
        y: 44.5,
      },
      {
        x: 49.83,
        y: 18.95,
      },
      {
        x: 59.53,
        y: 19.16,
      },
      {
        x: 38.99,
        y: 19.05,
      },
    ],
    [
      {
        x: 82.22,
        y: 102.89,
      },
      {
        x: 76.74,
        y: 75.22,
      },
      {
        x: 79.36,
        y: 62.24,
      },
      {
        x: 78.11,
        y: 50.08,
      },
      {
        x: 79.99,
        y: 43.39,
      },
      {
        x: 78.79,
        y: 35.48,
      },
      {
        x: 72.86,
        y: 25.34,
      },
      {
        x: 61.73,
        y: 19.16,
      },
      {
        x: 49.98,
        y: 21.59,
      },
      {
        x: 37.08,
        y: 19.36,
      },
    ],
    [
      {
        x: 50,
        y: 15.5,
      },
      {
        x: 50,
        y: -100,
      },
    ],
    [
      {
        x: 5.6,
        y: 65,
      },
      {
        x: -100,
        y: 65,
      },
    ],
  ],
  placementSpots: [
    {
      x: 10.94,
      y: 37.03,
    },
    {
      x: 8.48,
      y: 76.06,
    },
    {
      x: 15.88,
      y: 80.69,
    },
    {
      x: 25.35,
      y: 81.91,
    },
    {
      x: 44.92,
      y: 81.5,
    },
    {
      x: 54.79,
      y: 81.81,
    },
    {
      x: 73,
      y: 84,
    },
    {
      x: 83.15,
      y: 84.04,
    },
    {
      x: 87.58,
      y: 68.83,
    },
    {
      x: 86.72,
      y: 38.45,
    },
    {
      x: 45.49,
      y: 44.6,
    },
    {
      x: 53.88,
      y: 44.3,
    },
    {
      x: 43.72,
      y: 18.04,
    },
    {
      x: 55.3,
      y: 17.94,
    },
    {
      x: 16.28,
      y: 61.02,
    },
    {
      x: 22.99,
      y: 23.11,
    },
    {
      x: 23.68,
      y: 48.35,
    },
    {
      x: 46.52,
      y: 58.79,
    },
    {
      x: 76.28,
      y: 21.99,
    },
    {
      x: 75.03,
      y: 46.22,
    },
    {
      x: 82.73,
      y: 35.58,
    },
    {
      x: 8.71,
      y: 43.82,
    },
    {
      x: 11.74,
      y: 71.29,
    },
    {
      x: 89.4,
      y: 43.92,
    },
    {
      x: 90.49,
      y: 76.43,
    },
    {
      x: 82.16,
      y: 62.24,
    },
  ],
  environmentUnits: [
    {
      position: {
        x: 70.01,
        y: 75.52,
      },
      tdConfigId: 'navy_guard_battle',
      facingDirection: 'left',
    },
  ],
  captureUnits: [
    {
      position: {
        x: 35.9,
        y: 18.27,
      },
      tdConfigId: 'caleb_capture',
      carrierSpeedMultiplier: 0.9,
      returnHome: {
        pathIndex: 0,
        speed: 2,
        delayMs: 500,
      },
    },
    {
      position: {
        x: 49.66,
        y: 20.11,
      },
      tdConfigId: 'kip_capture',
      carrierSpeedMultiplier: 0.9,
      returnHome: {
        pathIndex: 1,
        speed: 2,
        delayMs: 500,
      },
    },
    {
      position: {
        x: 62.44,
        y: 17.77,
      },
      tdConfigId: 'maribel_capture',
      carrierSpeedMultiplier: 0.9,
      returnHome: {
        pathIndex: 2,
        speed: 2,
        delayMs: 500,
      },
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
        maxHp: 2500,
        defense: 32,
        specialDefense: 32,
        winsLevelOnDestroy: true,
      },
    },
    {
      id: 'bramfrit_cell_gate',
      level: 1,
      canCarryCaptureUnits: false,
      structure: {
        tdConfigId: 'bramfrit_cell_gate',
        displayName: 'BRAMFRIT CELL',
        elementTypes: [ElementType.STEEL],
        maxHp: PRISON_GATE_HP,
        defense: 14,
        specialDefense: 14,
        role: 'prisoner-gate',
        visualStyle: 'prison-gate',
        position: {
          x: 6.23,
          y: 75.24,
        },
        visualLayout: {
          standing: {
            offsetX: 8,
            offsetY: -139,
            width: 260,
            height: 306,
            rotationDegrees: -9.5,
            skewXDegrees: 4,
            skewYDegrees: -43.5,
          },
          rubble: {
            offsetX: 8,
            offsetY: -24,
            width: 260,
            height: 174,
            rotationDegrees: 0,
            skewXDegrees: 0,
            skewYDegrees: 0,
          },
          labelOffsetY: -380,
          healthBarOffsetY: -363,
        },
      },
    },
    {
      id: 'sepippet_cell_gate',
      level: 1,
      canCarryCaptureUnits: false,
      structure: {
        tdConfigId: 'sepippet_cell_gate',
        displayName: 'SEPIPPET CELL',
        elementTypes: [ElementType.STEEL],
        maxHp: PRISON_GATE_HP,
        defense: 14,
        specialDefense: 14,
        role: 'prisoner-gate',
        visualStyle: 'prison-gate',
        position: {
          x: 5.89,
          y: 41.97,
        },
        visualLayout: {
          standing: {
            offsetX: 8,
            offsetY: -139,
            width: 260,
            height: 306,
            rotationDegrees: -3.5,
            skewXDegrees: 4,
            skewYDegrees: -43.5,
          },
          rubble: {
            offsetX: 8,
            offsetY: -24,
            width: 260,
            height: 174,
            rotationDegrees: 0,
            skewXDegrees: 0,
            skewYDegrees: 0,
          },
          labelOffsetY: -380,
          healthBarOffsetY: -363,
        },
      },
    },
    {
      id: 'parlet_cell_gate',
      level: 1,
      canCarryCaptureUnits: false,
      structure: {
        tdConfigId: 'parlet_cell_gate',
        displayName: 'PARLET CELL',
        elementTypes: [ElementType.STEEL],
        maxHp: PRISON_GATE_HP,
        defense: 14,
        specialDefense: 14,
        role: 'prisoner-gate',
        visualStyle: 'prison-gate',
        position: {
          x: 92.56,
          y: 42.07,
        },
        visualLayout: {
          standing: {
            offsetX: 8,
            offsetY: -139,
            width: 260,
            height: 264,
            rotationDegrees: 4,
            skewXDegrees: -4,
            skewYDegrees: 43.5,
          },
          rubble: {
            offsetX: 8,
            offsetY: -24,
            width: 260,
            height: 174,
            rotationDegrees: 0,
            skewXDegrees: 0,
            skewYDegrees: 0,
          },
          labelOffsetY: -380,
          healthBarOffsetY: -363,
        },
      },
    },
    {
      id: 'corrogoon_cell_gate',
      level: 1,
      canCarryCaptureUnits: false,
      structure: {
        tdConfigId: 'corrogoon_cell_gate',
        displayName: 'CORROGOON CELL',
        elementTypes: [ElementType.STEEL],
        maxHp: 400,
        defense: 14,
        specialDefense: 14,
        role: 'prisoner-gate',
        visualStyle: 'prison-gate',
        position: {
          x: 92.5,
          y: 74.81,
        },
        visualLayout: {
          standing: {
            offsetX: 8,
            offsetY: -139,
            width: 260,
            height: 271,
            rotationDegrees: 9.5,
            skewXDegrees: -4,
            skewYDegrees: 43.5,
          },
          rubble: {
            offsetX: 8,
            offsetY: -24,
            width: 260,
            height: 174,
            rotationDegrees: 0,
            skewXDegrees: 0,
            skewYDegrees: 0,
          },
          labelOffsetY: -380,
          healthBarOffsetY: -363,
        },
      },
    },
    {
      id: 'level_5_bufflora_wild',
      creatureId: 'bufflora',
      level: 12,
      speedMultiplier: 1.1,
      canCarryCaptureUnits: true,
      weakenedThreshold: 0.25,
      hpMultiplier: 6,
    },
    {
      id: 'level_5_marophis_wild',
      creatureId: 'marophis',
      level: 12,
      speedMultiplier: 1.1,
      canCarryCaptureUnits: true,
      weakenedThreshold: 0.25,
      hpMultiplier: 6,
    },
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
          enemyDefinitionId: 'bramfrit_cell_gate',
          count: 1,
          spawnIntervalMs: 0,
          delayBeforeGroupMs: 0,
          pathIndex: 4,
          concurrentWithPrevious: true,
          uncapturable: true,
        },
        {
          enemyDefinitionId: 'sepippet_cell_gate',
          count: 1,
          spawnIntervalMs: 0,
          delayBeforeGroupMs: 0,
          pathIndex: 4,
          concurrentWithPrevious: true,
          uncapturable: true,
        },
        {
          enemyDefinitionId: 'parlet_cell_gate',
          count: 1,
          spawnIntervalMs: 0,
          delayBeforeGroupMs: 0,
          pathIndex: 4,
          concurrentWithPrevious: true,
          uncapturable: true,
        },
        {
          enemyDefinitionId: 'corrogoon_cell_gate',
          count: 1,
          spawnIntervalMs: 0,
          delayBeforeGroupMs: 0,
          pathIndex: 4,
          concurrentWithPrevious: true,
          uncapturable: true,
        },
        {
          enemyDefinitionId: 'level_5_bufflora_wild',
          count: 1,
          spawnIntervalMs: 1400,
          delayBeforeGroupMs: 1100,
          pathIndex: 0,
          concurrentWithPrevious: true,
          turnAroundAtEnd: true,
        },
        {
          enemyDefinitionId: 'level_5_bufflora_wild',
          count: 1,
          spawnIntervalMs: 1400,
          delayBeforeGroupMs: 1100,
          pathIndex: 1,
          concurrentWithPrevious: true,
          turnAroundAtEnd: true,
        },
        {
          enemyDefinitionId: 'level_5_bufflora_wild',
          count: 1,
          spawnIntervalMs: 1400,
          delayBeforeGroupMs: 1100,
          pathIndex: 2,
          concurrentWithPrevious: true,
          turnAroundAtEnd: true,
        },
      ],
    },
    {
      id: 'level_5_wave_2',
      groups: [
        {
          enemyDefinitionId: 'level_5_marophis_wild',
          count: 1,
          spawnIntervalMs: 1400,
          delayBeforeGroupMs: 8000,
          pathIndex: 0,
          concurrentWithPrevious: true,
          turnAroundAtEnd: true,
        },
        {
          enemyDefinitionId: 'level_5_marophis_wild',
          count: 1,
          spawnIntervalMs: 1400,
          delayBeforeGroupMs: 8000,
          pathIndex: 1,
          concurrentWithPrevious: true,
          turnAroundAtEnd: true,
        },
        {
          enemyDefinitionId: 'level_5_marophis_wild',
          count: 1,
          spawnIntervalMs: 1400,
          delayBeforeGroupMs: 8000,
          pathIndex: 2,
          concurrentWithPrevious: true,
          turnAroundAtEnd: true,
        },
        {
          enemyDefinitionId: 'level_5_bufflora_wild',
          count: 1,
          spawnIntervalMs: 1400,
          delayBeforeGroupMs: 8000,
          pathIndex: 0,
          concurrentWithPrevious: false,
          turnAroundAtEnd: true,
        },
        {
          enemyDefinitionId: 'level_5_bufflora_wild',
          count: 1,
          spawnIntervalMs: 1400,
          delayBeforeGroupMs: 8000,
          pathIndex: 1,
          concurrentWithPrevious: true,
          turnAroundAtEnd: true,
        },
        {
          enemyDefinitionId: 'level_5_bufflora_wild',
          count: 1,
          spawnIntervalMs: 1400,
          delayBeforeGroupMs: 8000,
          pathIndex: 2,
          concurrentWithPrevious: true,
          turnAroundAtEnd: true,
        },
      ],
    },
  ],
  endlessWaves: {
    delayBetweenWavesMs: 8000,
    hpIncreasePerWave: 0.1,
    spawnCountIncreaseEveryWaves: 2,
    spawnCountIncreasePerStep: 1,
  },
  lives: 3,
  disableCapture: false,
  enemyHpMultiplier: 1,
  backgroundUrl: '/battles/bg/bg_level_5_ironbell_prison_layered_v2.png',
  backgroundScale: 3,
  initialView: {
    offsetX: 50,
    offsetY: 0,
    zoom: 0.4,
  },
  objectiveAllies: [
    {
      id: 'bramfrit_rescue',
      creatureId: 'bramfrit',
      displayName: 'Bramfrit',
      gateDefinitionId: 'bramfrit_cell_gate',
      lockedPosition: {
        x: 6.227925631960878,
        y: 75.23566849732354,
      },
      releasePath: [
        {
          x: 20,
          y: 83,
        },
        {
          x: 22,
          y: 74,
        },
        {
          x: 19,
          y: 64,
        },
        {
          x: 21,
          y: 50,
        },
        {
          x: 20,
          y: 37,
        },
        {
          x: 25,
          y: 27,
        },
        {
          x: 33,
          y: 21,
        },
        {
          x: 39,
          y: 19,
        },
        {
          x: 42,
          y: 17,
        },
      ],
      moveSpeed: 8,
      targetStructureDefinitionId: 'tigrevel_cell_bars',
      behavior: {
        type: 'BRAMFRIT_CHARGE',
        chargeStart: {
          x: 36.5,
          y: 17,
        },
        strikePosition: {
          x: 44,
          y: 17,
        },
        damage: 50,
        bowDurationMs: 650,
        windupDurationMs: 1050,
        recoveryDurationMs: 1700,
        chargeSpeed: 18,
      },
    },
    {
      id: 'sepippet_rescue',
      creatureId: 'sepippet',
      displayName: 'Sepippet',
      gateDefinitionId: 'sepippet_cell_gate',
      lockedPosition: {
        x: 5.8934338762126695,
        y: 41.96573013697712,
      },
      releasePath: [
        {
          x: 10,
          y: 43,
        },
        {
          x: 20,
          y: 37,
        },
        {
          x: 25,
          y: 27,
        },
        {
          x: 33,
          y: 21,
        },
        {
          x: 39,
          y: 19,
        },
        {
          x: 42,
          y: 19,
        },
      ],
      moveSpeed: 9,
      targetStructureDefinitionId: 'tigrevel_cell_bars',
      behavior: {
        type: 'SEPIPPET_SHADOW_ASSAULT',
        durationMs: 15000,
        gateDamage: 30,
        gateAttackIntervalMs: 2000,
        shadowPositions: [
          {
            x: 20,
            y: 53,
          },
          {
            x: 50,
            y: 50,
          },
          {
            x: 80,
            y: 53,
          },
        ],
        shadowDamage: 25,
        shadowAttackIntervalMs: 1500,
        shadowAttackRange: 38,
      },
    },
    {
      id: 'parlet_rescue',
      creatureId: 'parlet',
      displayName: 'Parlet',
      gateDefinitionId: 'parlet_cell_gate',
      lockedPosition: {
        x: 92.82808022022613,
        y: 41.894774756185846,
      },
      releasePath: [
        {
          x: 80,
          y: 43,
        },
        {
          x: 79,
          y: 35,
        },
        {
          x: 73,
          y: 25,
        },
        {
          x: 62,
          y: 19,
        },
        {
          x: 58,
          y: 19,
        },
      ],
      moveSpeed: 8,
      targetStructureDefinitionId: 'tigrevel_cell_bars',
      behavior: {
        type: 'PARLET_MOSAIC_CURRENTS',
        currentPathIndices: [0, 1, 2],
        currentWidth: 5,
        slowMultiplier: 0.7,
        surgeIntervalMs: 10000,
        surgeVisualDurationMs: 1000,
        pushDistance: 50,
        gateDamagePerCurrent: 7,
      },
    },
    {
      id: 'corrogoon_rescue',
      creatureId: 'corrogoon',
      displayName: 'Corrogoon',
      gateDefinitionId: 'corrogoon_cell_gate',
      lockedPosition: {
        x: 92.50423336885933,
        y: 74.81245273143759,
      },
      releasePath: [
        {
          x: 77,
          y: 75,
        },
        {
          x: 79,
          y: 62,
        },
        {
          x: 78,
          y: 50,
        },
        {
          x: 80,
          y: 43,
        },
        {
          x: 79,
          y: 35,
        },
        {
          x: 73,
          y: 25,
        },
        {
          x: 60,
          y: 17,
        },
      ],
      moveSpeed: 8,
      targetStructureDefinitionId: 'tigrevel_cell_bars',
      behavior: {
        type: 'CORROGOON_SCOURING_VOLLEY',
        volleyIntervalMs: 6000,
        projectileTravelMs: 750,
        projectileStaggerMs: 55,
        scouredDurationMs: 10000,
        tickDamage: 7,
        tickIntervalMs: 2000,
        defenseMultiplier: 0.75,
        specialDefenseMultiplier: 0.75,
      },
    },
  ],
  introMessage: 'Destroy the cell gate!',
};
