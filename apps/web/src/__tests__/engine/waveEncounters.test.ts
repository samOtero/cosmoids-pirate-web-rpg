import { afterEach, describe, expect, it, vi } from 'vitest';
import * as encounters from '@/engine/tower-defense/waveEncounters';
import { expandWaveRepetitions } from '@/engine/tower-defense/waveSchedule';
import type { TDWaveGroup } from '@/engine/tower-defense/types';
import {
  validateTDLevelDraft,
  prepareTDLevelDraftForSave,
} from '@/utils/tdLevelDraft';
import { battle, battleSpecies } from './behaviorFixtures';

const rollEncounter = encounters.rollWaveEncounter;
afterEach(() => vi.restoreAllMocks());

function group(overrides: Partial<TDWaveGroup> = {}): TDWaveGroup {
  return {
    enemyDefinitionId: 'common',
    count: 3,
    spawnIntervalMs: 100,
    delayBeforeGroupMs: 50,
    pathIndex: 0,
    encounterPool: [
      { enemyDefinitionId: 'common', weight: 3 },
      { enemyDefinitionId: 'rare', weight: 1, pathIndex: 1 },
    ],
    ...overrides,
  };
}

function level(waveGroup = group()) {
  return {
    paths: [
      [
        { x: 0, y: 20 },
        { x: 1000, y: 20 },
      ],
      [
        { x: 0, y: 80 },
        { x: 1000, y: 80 },
      ],
    ],
    placementSpots: [],
    waveEnemyDefinitions: [
      { id: 'common', creatureId: 'test_common', level: 4 },
      { id: 'rare', creatureId: 'test_rare', level: 7, hpMultiplier: 2 },
    ],
    waves: [{ id: 'wildlife', groups: [waveGroup] }],
  };
}

describe('weighted wildlife encounters', () => {
  it('stops after finite repeats, preserving intervals, inter-wave pauses, and independent rolls', () => {
    battleSpecies('test_common');
    battleSpecies('test_rare');
    const random = vi
      .fn()
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.9);
    vi.spyOn(encounters, 'rollWaveEncounter').mockImplementation((entry) =>
      rollEncounter(entry, random)
    );
    const authored = level(
      group({ count: 2, spawnIntervalMs: 40, delayBeforeGroupMs: 20 })
    );
    const wave = {
      ...authored.waves[0],
      repeatCount: 3,
      delayBetweenRepeatsMs: 60,
    };
    const configuration = { ...authored, waves: [wave], cannotLose: true };
    const original = structuredClone(configuration);
    const engine = battle(configuration);
    const arrivals: { time: number; id: string }[] = [];
    const seen = new Set<string>();
    for (let time = 10; time <= 500; time += 10) {
      engine.enemies.forEach((enemy) => {
        enemy.speed = 0;
      });
      engine.tick(time, 10);
      for (const enemy of engine.enemies) {
        if (!seen.has(enemy.id)) {
          seen.add(enemy.id);
          arrivals.push({ time, id: enemy.waveEnemyDefinitionId! });
        }
      }
    }
    expect(arrivals.map(({ time }) => time)).toEqual([
      20, 60, 130, 170, 240, 280,
    ]);
    expect(arrivals.map(({ id }) => id)).toEqual([
      'common',
      'rare',
      'rare',
      'common',
      'common',
      'rare',
    ]);
    expect(random).toHaveBeenCalledTimes(6);
    expect(engine.hasFinishedAllWaves).toBe(true);
    expect(engine.currentWaveIndex).toBe(3);
    expect(configuration).toEqual(original);
  });

  it('preserves concurrent offsets and sequential group delays in repeated schedules', () => {
    const waves = [
      {
        id: 'first',
        repeatCount: 2,
        delayBetweenRepeatsMs: 200,
        groups: [
          group({ delayBeforeGroupMs: 80 }),
          group({ delayBeforeGroupMs: 30, concurrentWithPrevious: true }),
          group({ delayBeforeGroupMs: 50 }),
        ],
      },
      { id: 'last', groups: [group()] },
    ];
    const original = structuredClone(waves);
    const expanded = expandWaveRepetitions(waves);
    expect(expanded).toHaveLength(3);
    expect(expanded[0].groups.map((entry) => entry.delayBeforeGroupMs)).toEqual(
      [80, 30, 50]
    );
    expect(expanded[1].groups.map((entry) => entry.delayBeforeGroupMs)).toEqual(
      [250, 200, 50]
    );
    expect(expanded[2]).toBe(waves[1]);
    expect(waves).toEqual(original);
  });
  it.each([
    { roll: 0, id: 'common', path: 0 },
    { roll: 0.74999, id: 'common', path: 0 },
    { roll: 0.75, id: 'rare', path: 1 },
    { roll: 0.99999, id: 'rare', path: 1 },
  ])('uses relative weights at roll $roll', ({ roll, id, path }) => {
    expect(rollEncounter(group(), () => roll)).toEqual({
      enemyDefinitionId: id,
      pathIndex: path,
    });
  });

  it('inherits the group route and does not consume randomness for fixed encounters', () => {
    const random = vi.fn(() => 0);
    const fixed = group({ encounterPool: undefined, pathIndex: 1 });
    expect(encounters.getWaveGroupEncounters(fixed)).toEqual([
      { enemyDefinitionId: 'common', weight: 1 },
    ]);
    expect(rollEncounter(fixed, random)).toEqual({
      enemyDefinitionId: 'common',
      pathIndex: 1,
    });
    expect(random).not.toHaveBeenCalled();
    expect(rollEncounter(group({ pathIndex: 1 }), random).pathIndex).toBe(1);
  });

  it('keeps a fixed fallback for an unusable runtime pool', () => {
    expect(rollEncounter(group({ encounterPool: [] }))).toEqual({
      enemyDefinitionId: 'common',
      pathIndex: 0,
    });
  });

  it('rolls at each timed spawn and preserves selected definitions, routes, and captures', () => {
    battleSpecies('test_common');
    battleSpecies('test_rare');
    const random = vi
      .fn()
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.2);
    vi.spyOn(encounters, 'rollWaveEncounter').mockImplementation((entry) =>
      rollEncounter(entry, random)
    );
    const authored = level();
    const before = structuredClone(authored);
    const engine = battle(authored);
    engine.tick(25, 25);
    expect(random).not.toHaveBeenCalled();
    engine.tick(50, 25);
    expect(engine.enemies).toHaveLength(1);
    engine.tick(100, 50);
    expect(engine.enemies).toHaveLength(1);
    engine.tick(150, 50);
    engine.tick(250, 100);
    expect(random).toHaveBeenCalledTimes(3);
    expect(
      engine.enemies.map((enemy) => [
        enemy.waveEnemyDefinitionId,
        enemy.pathIndex,
        enemy.level,
      ])
    ).toEqual([
      ['common', 0, 4],
      ['rare', 1, 7],
      ['common', 0, 4],
    ]);
    expect(engine.captureEnemy(engine.enemies[1].id)).toMatchObject({
      speciesId: 'test_rare',
      level: 7,
    });
    engine.tick(300, 50);
    expect(engine.hasFinishedAllWaves).toBe(true);
    expect(authored).toEqual(before);
  });

  it.each([{ uncapturable: true }, { isCursed: true }])(
    'preserves pool capture restrictions %j',
    (restriction) => {
      battleSpecies('test_common');
      battleSpecies('test_rare');
      vi.spyOn(encounters, 'rollWaveEncounter').mockImplementation((entry) =>
        rollEncounter(entry, () => 0.9)
      );
      const engine = battle(
        level(
          group({ ...restriction, delayBeforeGroupMs: 0, spawnIntervalMs: 0 })
        )
      );
      engine.tick(0, 16);
      expect(engine.enemies[0].definitionId).toBe('test_rare');
      expect(engine.enemies[0].uncapturable).toBe(true);
      expect(engine.captureEnemy(engine.enemies[0].id)).toBeNull();
    }
  );

  it('rerolls endless wildlife after the delay without escalating stats or counts', () => {
    battleSpecies('test_common');
    battleSpecies('test_rare');
    const random = vi
      .fn()
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.9);
    vi.spyOn(encounters, 'rollWaveEncounter').mockImplementation((entry) =>
      rollEncounter(entry, random)
    );
    const engine = battle({
      ...level(group({ count: 1, spawnIntervalMs: 0, delayBeforeGroupMs: 0 })),
      endlessWaves: { delayBetweenWavesMs: 100, hpIncreasePerWave: 0 },
      cannotLose: true,
      closeCompletesLevel: true,
    });
    engine.tick(0, 16);
    const initialHp = engine.enemies[0].maxHp;
    engine.tick(16, 16); // Load the next wave.
    engine.tick(66, 50);
    expect(random).toHaveBeenCalledTimes(1);
    engine.tick(116, 50);
    engine.tick(132, 16);
    engine.tick(232, 100);
    expect(engine.enemies.map((enemy) => enemy.waveEnemyDefinitionId)).toEqual([
      'rare',
      'common',
      'rare',
    ]);
    expect(engine.enemies[2].maxHp).toBe(initialHp);
    expect(engine.hasFinishedAllWaves).toBe(false);
    expect(engine.waves).toHaveLength(1);
  });
});

describe('encounter pool validation and saving', () => {
  it.each([0, -1, 1.5, NaN, Infinity])(
    'rejects invalid repeat counts %s',
    (repeatCount) => {
      const authored = level();
      expect(
        validateTDLevelDraft({
          ...authored,
          waves: [{ ...authored.waves[0], repeatCount }],
        })
      ).toContain('Wave 1 repeat count must be a positive integer.');
    }
  );

  it.each([-1, NaN, Infinity])(
    'rejects invalid repeat delays %s',
    (delayBetweenRepeatsMs) => {
      const authored = level();
      expect(
        validateTDLevelDraft({
          ...authored,
          waves: [{ ...authored.waves[0], delayBetweenRepeatsMs }],
        })
      ).toContain('Wave 1 repeat delay cannot be negative.');
    }
  );
  it('preserves valid weighted pools through draft preparation', () => {
    const authored = level();
    expect(validateTDLevelDraft(authored)).toEqual([]);
    const saved = prepareTDLevelDraftForSave(authored);
    expect(saved.waves).toEqual(authored.waves);
    saved.waves[0].groups[0].encounterPool![0].weight = 99;
    expect(authored.waves[0].groups[0].encounterPool![0].weight).toBe(3);
  });

  it.each([0, -1, NaN, Infinity])('rejects invalid weights %s', (weight) => {
    expect(
      validateTDLevelDraft(
        level(
          group({ encounterPool: [{ enemyDefinitionId: 'common', weight }] })
        )
      )
    ).toContain('Wave 1, group 1, encounter 1 weight must be greater than 0.');
  });

  it('rejects empty pools, unknown definitions, and invalid route overrides', () => {
    expect(validateTDLevelDraft(level(group({ encounterPool: [] })))).toContain(
      'Wave 1, group 1 encounter pool needs at least one entry.'
    );
    expect(
      validateTDLevelDraft(
        level(
          group({
            encounterPool: [
              { enemyDefinitionId: 'missing', weight: 1, pathIndex: 2 },
            ],
          })
        )
      )
    ).toEqual([
      'Wave 1, group 1, encounter 1 references unknown enemy definition "missing".',
      'Wave 1, group 1, encounter 1 references an invalid path.',
    ]);
  });
});
