import { TDLevelData } from '@/engine/tower-defense/types';
import { TD_LEVELS } from '@/constants/tdLevels';
import { TD_CREATURE_DEFS } from '@/engine/tower-defense/TowerDefenseEngine';
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
      waves: [
        {
          id: 'wave_1',
          futureWaveField: 'wave metadata',
          groups: [
            {
              definitionId: 'starter_crab',
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
      waves: [
        {
          futureWaveField: 'wave metadata',
          groups: [{ futureGroupField: 'group metadata' }],
        },
      ],
    });
    expect(futureLevel.paths[0][0].x).toBe(10.126);
  });

  it('reports structural problems before a level is saved', () => {
    const invalidLevel: TDLevelData = {
      paths: [[{ x: 101, y: 20 }]],
      placementSpots: [],
      waves: [
        {
          id: 'wave_1',
          groups: [
            {
              definitionId: 'missing_enemy',
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
      validateTDLevelDraft(invalidLevel, new Set(['known_enemy']))
    ).toEqual(
      expect.arrayContaining([
        'Path 1 needs at least two points.',
        'Wave 1, group 1 references unknown enemy "missing_enemy".',
        'Wave 1, group 1 count must be a positive integer.',
        'Wave 1, group 1 spawn interval cannot be negative.',
        'Wave 1, group 1 references an invalid path.',
      ])
    );
  });

  it('accepts every currently registered level', () => {
    const creatureIds = new Set(Object.keys(TD_CREATURE_DEFS));

    Object.entries(TD_LEVELS).forEach(([context, config]) => {
      expect(
        validateTDLevelDraft(config.levelData, creatureIds),
        context
      ).toEqual([]);
    });
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

  it('rejects non-positive group HP multipliers', () => {
    const level: TDLevelData = {
      paths: [
        [
          { x: 0, y: 50 },
          { x: 100, y: 50 },
        ],
      ],
      placementSpots: [],
      waves: [
        {
          id: 'wave_1',
          groups: [
            {
              definitionId: 'mouse_1',
              count: 1,
              spawnIntervalMs: 0,
              delayBeforeGroupMs: 0,
              pathIndex: 0,
              hpMultiplier: 0,
            },
          ],
        },
      ],
    };

    expect(validateTDLevelDraft(level)).toContain(
      'Wave 1, group 1 HP multiplier must be greater than 0.'
    );
  });
});
