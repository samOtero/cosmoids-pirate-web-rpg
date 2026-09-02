import { ElementType } from '@/types/baseGame';
import { TDLevelData } from '@/engine/tower-defense/types';
import { TD_LEVELS } from '@/constants/tdLevels';
import { TD_CREATURE_DEFS } from '@/engine/tower-defense/TowerDefenseEngine';
import { ENEMY_ABILITY_DEFS } from '@/engine/tower-defense/enemyAbilities';
import {
  cloneTDLevelDraft,
  createEmptyTDLevelDraft,
  prepareTDLevelDraftForSave,
  validateTDLevelDraft,
} from '@/utils/tdLevelDraft';

describe('TD level drafts', () => {
  it('creates a valid empty level', () => {
    expect(createEmptyTDLevelDraft()).toEqual({
      paths: [[]],
      placementSpots: [],
      captureUnits: [],
      waveEnemyDefinitions: [],
      waves: [],
    });
  });

  it('deep-clones loaded level data', () => {
    const original = createEmptyTDLevelDraft();
    const cloned = cloneTDLevelDraft(original);

    cloned.paths[0].push({ x: 10, y: 20 });

    expect(original.paths[0]).toEqual([]);
  });

  it('preserves future top-level and nested fields while preparing a save', () => {
    const futureLevel = {
      paths: [[{ x: 10.126, y: 20.555, futurePointField: 'path metadata' }]],
      placementSpots: [{ x: 30.999, y: 40.001, futurePlacementField: true }],
      captureUnits: [
        {
          tdConfigId: 'chest_wooden',
          position: { x: 50.555, y: 60.444, futurePositionField: 7 },
          futureCaptureField: 'capture metadata',
        },
      ],
      environmentUnits: [
        {
          tdConfigId: 'caleb_battle',
          position: { x: 70.555, y: 80.444 },
          futureEnvironmentField: 'environment metadata',
        },
      ],
      waveEnemyDefinitions: [
        {
          id: 'starter_crab_variant',
          creatureId: 'starter_crab',
          level: 1,
          futureDefinitionField: 'definition metadata',
        },
      ],
      waves: [
        {
          id: 'wave_1',
          futureWaveField: 'wave metadata',
          groups: [
            {
              enemyDefinitionId: 'starter_crab_variant',
              count: 1,
              spawnIntervalMs: 1000,
              delayBeforeGroupMs: 0,
              pathIndex: 0,
              futureGroupField: 'group metadata',
            },
          ],
        },
      ],
      futureTopLevelField: { enabled: true },
    } as unknown as TDLevelData;

    const saved = prepareTDLevelDraftForSave(futureLevel) as TDLevelData & {
      futureTopLevelField: { enabled: boolean };
    };

    expect(saved.futureTopLevelField).toEqual({ enabled: true });
    expect(saved).toMatchObject({
      paths: [[{ x: 10.13, y: 20.55, futurePointField: 'path metadata' }]],
      placementSpots: [{ x: 31, y: 40, futurePlacementField: true }],
      captureUnits: [
        {
          futureCaptureField: 'capture metadata',
          position: { x: 50.55, y: 60.44, futurePositionField: 7 },
        },
      ],
      environmentUnits: [
        {
          futureEnvironmentField: 'environment metadata',
          position: { x: 70.56, y: 80.44 },
        },
      ],
      waveEnemyDefinitions: [{ futureDefinitionField: 'definition metadata' }],
      waves: [
        {
          futureWaveField: 'wave metadata',
          groups: [{ futureGroupField: 'group metadata' }],
        },
      ],
    });
    expect(futureLevel.paths[0][0].x).toBe(10.126);
  });

  it('rounds editable structure placement and visual layout values', () => {
    const level = createEmptyTDLevelDraft();
    level.waveEnemyDefinitions.push({
      id: 'cell_gate',
      level: 1,
      structure: {
        tdConfigId: 'cell_gate',
        displayName: 'CELL GATE',
        elementTypes: [ElementType.STEEL],
        maxHp: 20,
        defense: 5,
        specialDefense: 5,
        position: { x: 5.678, y: 65.432 },
        visualLayout: {
          standing: {
            offsetX: 8.126,
            offsetY: -139.555,
            width: 260.126,
            height: 430.555,
            rotationDegrees: 1.126,
            skewXDegrees: -2.555,
            skewYDegrees: 3.444,
          },
          rubble: {
            offsetX: 8.126,
            offsetY: -24.555,
            width: 260.126,
            height: 174.555,
            rotationDegrees: -1.126,
            skewXDegrees: 2.555,
            skewYDegrees: -3.444,
          },
          labelOffsetY: -380.126,
          healthBarOffsetY: -363.555,
        },
      },
    });

    const saved = prepareTDLevelDraftForSave(level);
    expect(saved.waveEnemyDefinitions[0].structure).toMatchObject({
      position: { x: 5.68, y: 65.43 },
      visualLayout: {
        standing: {
          offsetX: 8.13,
          offsetY: -139.56,
          width: 260.13,
          height: 430.56,
          rotationDegrees: 1.13,
          skewXDegrees: -2.56,
          skewYDegrees: 3.44,
        },
        rubble: {
          offsetX: 8.13,
          offsetY: -24.55,
          width: 260.13,
          height: 174.56,
          rotationDegrees: -1.13,
          skewXDegrees: 2.56,
          skewYDegrees: -3.44,
        },
        labelOffsetY: -380.13,
        healthBarOffsetY: -363.56,
      },
    });
  });

  it('rejects invalid structure visual layout values', () => {
    const level = createEmptyTDLevelDraft();
    level.waveEnemyDefinitions.push({
      id: 'cell_gate',
      level: 1,
      structure: {
        tdConfigId: 'cell_gate',
        displayName: 'CELL GATE',
        elementTypes: [ElementType.STEEL],
        maxHp: 20,
        defense: 5,
        specialDefense: 5,
        position: { x: Number.NaN, y: 65 },
        visualLayout: {
          standing: {
            offsetX: Number.NaN,
            offsetY: 0,
            width: -1,
            height: 100,
            rotationDegrees: Number.NaN,
          },
          rubble: { offsetX: 0, offsetY: 0, width: 100, height: 0 },
          labelOffsetY: Number.NaN,
          healthBarOffsetY: Number.POSITIVE_INFINITY,
        },
      },
    });

    expect(validateTDLevelDraft(level)).toEqual(
      expect.arrayContaining([
        'Enemy definition 1 structure position must have finite x and y coordinates.',
        'Enemy definition 1 structure standing offsets must be finite.',
        'Enemy definition 1 structure standing size must be greater than 0.',
        'Enemy definition 1 structure standing rotation and skew must be finite.',
        'Enemy definition 1 structure rubble size must be greater than 0.',
        'Enemy definition 1 structure label offset must be finite.',
        'Enemy definition 1 structure health bar offset must be finite.',
      ])
    );
  });

  it('reports structural problems before a level is saved', () => {
    const invalidLevel: TDLevelData = {
      paths: [[{ x: 101, y: 20 }]],
      placementSpots: [],
      waveEnemyDefinitions: [
        {
          id: 'broken_enemy',
          creatureId: 'missing_enemy',
          level: 0,
          speedMultiplier: 0,
          hpMultiplier: 0,
          defenseMultiplier: 0,
          specialDefenseMultiplier: 0,
          abilityId: 'missing_ability',
        },
      ],
      waves: [
        {
          id: 'wave_1',
          groups: [
            {
              enemyDefinitionId: 'missing_definition',
              count: 0,
              spawnIntervalMs: -1,
              delayBeforeGroupMs: 0,
              pathIndex: 4,
            },
          ],
        },
      ],
    };

    expect(
      validateTDLevelDraft(
        invalidLevel,
        new Set(['known_enemy']),
        new Set(['known_ability'])
      )
    ).toEqual(
      expect.arrayContaining([
        'Path 1 needs at least two points.',
        'Enemy definition 1 references unknown creature "missing_enemy".',
        'Enemy definition 1 level must be a positive integer.',
        'Enemy definition 1 speed multiplier must be greater than 0.',
        'Enemy definition 1 HP multiplier must be greater than 0.',
        'Enemy definition 1 defense multiplier must be greater than 0.',
        'Enemy definition 1 special defense multiplier must be greater than 0.',
        'Enemy definition 1 references unknown ability "missing_ability".',
        'Wave 1, group 1 references unknown enemy definition "missing_definition".',
        'Wave 1, group 1 count must be a positive integer.',
        'Wave 1, group 1 spawn interval cannot be negative.',
        'Wave 1, group 1 references an invalid path.',
      ])
    );
  });

  it('accepts every currently registered level', () => {
    const creatureIds = new Set(Object.keys(TD_CREATURE_DEFS));
    const abilityIds = new Set(Object.keys(ENEMY_ABILITY_DEFS));

    Object.entries(TD_LEVELS).forEach(([context, config]) => {
      expect(
        validateTDLevelDraft(config.levelData, creatureIds, abilityIds),
        context
      ).toEqual([]);
    });
  });

  it('validates return-home capture objective settings', () => {
    const level: TDLevelData = {
      paths: [
        [
          { x: 0, y: 50 },
          { x: 100, y: 50 },
        ],
      ],
      placementSpots: [],
      captureUnits: [
        {
          tdConfigId: 'map_1',
          position: { x: 100, y: 50 },
          returnHome: { pathIndex: 2, speed: 0, delayMs: -1 },
        },
      ],
      waveEnemyDefinitions: [],
      waves: [],
    };

    expect(validateTDLevelDraft(level)).toEqual([
      'Capture unit 1 return-home behavior references an invalid path.',
      'Capture unit 1 return-home speed must be greater than 0.',
      'Capture unit 1 return-home delay cannot be negative.',
    ]);
  });

  it('validates the optional initial view against the background scale', () => {
    const level: TDLevelData = {
      paths: [
        [
          { x: 0, y: 50 },
          { x: 100, y: 50 },
        ],
      ],
      placementSpots: [],
      waveEnemyDefinitions: [],
      waves: [],
      backgroundScale: 2,
      initialView: { offsetX: -1, offsetY: 101, zoom: 0.2 },
    };

    expect(validateTDLevelDraft(level)).toEqual([
      'Initial view X offset must be between 0 and 100.',
      'Initial view Y offset must be between 0 and 100.',
      'Initial view zoom must be between 0.5 and 1.',
    ]);
  });

  it('rejects non-positive enemy-definition HP multipliers', () => {
    const level: TDLevelData = {
      paths: [
        [
          { x: 0, y: 50 },
          { x: 100, y: 50 },
        ],
      ],
      placementSpots: [],
      waveEnemyDefinitions: [
        {
          id: 'invalid_mouse',
          creatureId: 'mouse_1',
          level: 3,
          hpMultiplier: 0,
        },
      ],
      waves: [
        {
          id: 'wave_1',
          groups: [
            {
              enemyDefinitionId: 'invalid_mouse',
              count: 1,
              spawnIntervalMs: 0,
              delayBeforeGroupMs: 0,
              pathIndex: 0,
            },
          ],
        },
      ],
    };

    expect(validateTDLevelDraft(level)).toContain(
      'Enemy definition 1 HP multiplier must be greater than 0.'
    );
  });

  it('allows multiple uniquely configured definitions for the same creature', () => {
    const level: TDLevelData = {
      paths: [
        [
          { x: 0, y: 50 },
          { x: 100, y: 50 },
        ],
      ],
      placementSpots: [],
      waveEnemyDefinitions: [
        {
          id: 'mouse_scout',
          creatureId: 'mouse_1',
          level: 3,
          speedMultiplier: 2,
        },
        {
          id: 'mouse_tank',
          creatureId: 'mouse_1',
          level: 7,
          hpMultiplier: 4,
          defenseMultiplier: 2,
        },
      ],
      waves: [
        {
          id: 'wave_1',
          groups: [
            {
              enemyDefinitionId: 'mouse_scout',
              count: 1,
              spawnIntervalMs: 0,
              delayBeforeGroupMs: 0,
              pathIndex: 0,
            },
            {
              enemyDefinitionId: 'mouse_tank',
              count: 1,
              spawnIntervalMs: 0,
              delayBeforeGroupMs: 0,
              pathIndex: 0,
              concurrentWithPrevious: true,
            },
          ],
        },
      ],
    };

    expect(validateTDLevelDraft(level, new Set(['mouse_1']))).toEqual([]);
  });

  it('rejects invalid enemy goal damage', () => {
    const level = createEmptyTDLevelDraft();
    level.paths = [
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ],
    ];
    level.waveEnemyDefinitions = [
      {
        id: 'invalid_goal_damage',
        creatureId: 'mouse_1',
        level: 3,
        goalDamage: 0,
      },
    ];

    expect(validateTDLevelDraft(level)).toContain(
      'Enemy definition 1 goal damage must be a positive integer.'
    );
  });

  it('validates enemy weakened threshold', () => {
    const level = createEmptyTDLevelDraft();
    level.paths = [
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ],
    ];
    level.waveEnemyDefinitions = [
      {
        id: 'invalid_weakened_threshold',
        creatureId: 'mouse_1',
        level: 3,
        weakenedThreshold: 1.5,
      },
      {
        id: 'zero_weakened_threshold',
        creatureId: 'mouse_1',
        level: 3,
        weakenedThreshold: 0,
      },
    ];

    const errors = validateTDLevelDraft(level);
    expect(errors).toContain(
      'Enemy definition 1 weakened threshold must be greater than 0 and at most 1.'
    );
    expect(errors).toContain(
      'Enemy definition 2 weakened threshold must be greater than 0 and at most 1.'
    );

    level.waveEnemyDefinitions = [
      {
        id: 'valid_weakened_threshold',
        creatureId: 'mouse_1',
        level: 3,
        weakenedThreshold: 0.5,
      },
    ];
    expect(validateTDLevelDraft(level)).not.toContain(
      'Enemy definition 1 weakened threshold must be greater than 0 and at most 1.'
    );
  });
});
