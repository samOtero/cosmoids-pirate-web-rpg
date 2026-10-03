import { describe, expect, it } from 'vitest';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import type { TDFlagDuelConfig } from '@/engine/tower-defense/types';
import { validateTDLevelDraft } from '@/utils/tdLevelDraft';
import { actor, battle, battleSpecies } from './behaviorFixtures';

function setup(overrides: Partial<TDFlagDuelConfig> = {}) {
  battleSpecies('test_flag_runner');
  battleSpecies('test_flag_guard');
  const flagDuel: TDFlagDuelConfig = {
    rivalFlagLives: 2,
    alliedRunner: {
      creatureId: 'test_flag_runner',
      level: 1,
      pathIndex: 0,
      speed: 10,
      spawnIntervalMs: 2000,
      firstSpawnDelayMs: 0,
      strikeDurationMs: 300,
    },
    defenders: [],
    ...overrides,
  };
  const level = {
    paths: [
      [
        { x: 0, y: 50 },
        { x: 4, y: 50 },
        { x: 10, y: 50 },
      ],
    ],
    placementSpots: [],
    waveEnemyDefinitions: [
      { id: 'test_guard', creatureId: 'test_flag_guard', level: 1 },
    ],
    waves: [{ id: 'empty', groups: [] }],
    lives: 3,
    flagDuel,
  };
  return { engine: battle(level), level };
}

function advance(engine: TowerDefenseEngine, durationMs: number) {
  let remaining = durationMs;
  while (remaining > 0) {
    const deltaMs = Math.min(50, remaining);
    engine.tick(engine.elapsedTimeMs + deltaMs, deltaMs);
    remaining -= deltaMs;
  }
}

describe('autonomous flag runners', () => {
  it('spawns on simulation time and follows the route through intermediate waypoints', () => {
    const { engine } = setup();
    advance(engine, 500);
    expect(engine.alliedFlagRunners).toHaveLength(1);
    expect(engine.alliedFlagRunners[0].position.x).toBeCloseTo(5);
    expect(engine.alliedFlagRunners[0].facingDirection).toBe('right');
    expect(engine.rivalFlagLives).toBe(2);
  });

  it('requires a flag strike, scores each runner once, and stops spawning after victory', () => {
    const { engine } = setup();
    advance(engine, 1000);
    expect(engine.alliedFlagRunners[0].strikeEndsAtMs).toBeDefined();
    expect(engine.rivalFlagLives).toBe(2);
    advance(engine, 300);
    expect(engine.rivalFlagLives).toBe(1);
    expect(engine.alliedFlagRunners).toHaveLength(0);
    expect(engine.hasCapturedRivalFlag).toBe(false);
    advance(engine, 2000);
    expect(engine.hasCapturedRivalFlag).toBe(true);
    expect(engine.rivalFlagLives).toBe(0);
    advance(engine, 4000);
    expect(engine.alliedFlagRunners).toHaveLength(0);
    expect(engine.lives).toBe(3);
  });

  it('honors delayed spawns and consumes a large movement step across multiple segments', () => {
    const { level } = setup();
    const delayed = battle({
      ...level,
      flagDuel: {
        ...level.flagDuel,
        alliedRunner: {
          ...level.flagDuel.alliedRunner,
          firstSpawnDelayMs: 500,
        },
      },
    });
    advance(delayed, 400);
    expect(delayed.alliedFlagRunners).toHaveLength(0);
    delayed.tick(1400, 1000);
    expect(delayed.alliedFlagRunners[0].position.x).toBeCloseTo(9);
    expect(delayed.rivalFlagLives).toBe(2);
  });

  it('lets a defender damage runners on its own cooldown and removes blocked runners', () => {
    const { engine } = setup({
      defenders: [
        {
          enemyDefinitionId: 'test_guard',
          range: 100,
          damage: 3,
          cooldownMs: 500,
        },
      ],
    });
    const guard = actor(engine, 'guard', 'test_flag_guard', 5);
    guard.waveEnemyDefinitionId = 'test_guard';
    advance(engine, 50);
    const runner = engine.alliedFlagRunners[0];
    expect(runner.hp).toBe(runner.maxHp - 3);
    expect(engine.flagDuelShots).toHaveLength(1);
    advance(engine, 450);
    expect(runner.hp).toBe(runner.maxHp - 3);
    engine.flagDuel!.defenders[0].damage = runner.maxHp;
    advance(engine, 50);
    expect(engine.alliedFlagRunners).toHaveLength(0);
    expect(engine.rivalFlagLives).toBe(2);
  });

  it('clears the route when a defender is defeated and does not score after player defeat', () => {
    const { engine } = setup({
      defenders: [
        {
          enemyDefinitionId: 'test_guard',
          range: 100,
          damage: 10000,
          cooldownMs: 1,
        },
      ],
    });
    const guard = actor(engine, 'guard', 'test_flag_guard', 5);
    guard.waveEnemyDefinitionId = 'test_guard';
    guard.hp = 0;
    advance(engine, 1300);
    expect(engine.rivalFlagLives).toBe(1);
    engine.lives = 0;
    advance(engine, 4000);
    expect(engine.rivalFlagLives).toBe(1);
    expect(engine.hasCapturedRivalFlag).toBe(false);
  });

  it('validates references and rejects unsafe spawn timings without mirroring level tuning', () => {
    const { level } = setup();
    const species = new Set(['test_flag_runner', 'test_flag_guard']);
    expect(validateTDLevelDraft(level, species)).toEqual([]);
    level.flagDuel.alliedRunner.spawnIntervalMs = 0;
    level.flagDuel.alliedRunner.pathIndex = 99;
    level.flagDuel.alliedRunner.creatureId = 'missing';
    level.flagDuel.defenders = [
      { enemyDefinitionId: 'missing', range: 1, damage: 1, cooldownMs: 1 },
    ];
    expect(validateTDLevelDraft(level, species)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('spawnIntervalMs'),
        expect.stringContaining('valid path'),
        expect.stringContaining('registered creature'),
        expect.stringContaining('creature encounters'),
      ])
    );
  });
});
