import { describe, expect, it } from 'vitest';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import type { TDFlagDuelConfig } from '@/engine/tower-defense/types';
import { validateTDLevelDraft } from '@/utils/tdLevelDraft';
import { actor, battle, battleSpecies } from './behaviorFixtures';
import type { PlayerCreature } from '@/types/baseGame';

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

describe('committed roster flag runners', () => {
  function playerSetup() {
    const { level: baseLevel } = setup({
      playerLaunch: {
        position: { x: 4, y: 50 },
        speed: 10,
        recoveryDurationMs: 500,
      },
    });
    const level = { ...baseLevel, placementSpots: [{ x: 5, y: 40 }] };
    // Keep automatic waves out of these lifecycle assertions.
    level.flagDuel.alliedRunner.firstSpawnDelayMs = 10000;
    const creature: PlayerCreature = {
      id: 'player-runner',
      speciesId: 'test_flag_runner',
      level: 5,
      xp: 0,
      equippedAttacks: ['TACKLE'],
      activeAttackIndex: 0,
      targetingMode: 'first',
      gender: 'female' as const,
      isShiny: false,
    };
    return { level, creature, engine: battle(level, [creature]) };
  }

  it('launches directly from the roster, follows the route without attacking, and cannot be recalled or duplicated', () => {
    const { engine, level, creature } = playerSetup();
    const launch = level.flagDuel.playerLaunch!.position;
    expect(engine.getTowerPlacementSpots()).toContainEqual(launch);
    expect(
      engine.getTowerDropSpot({ x: launch.x + 1, y: launch.y + 1 })
    ).toEqual(launch);
    expect(engine.getTowerDropSpot({ x: 5, y: 41 })).toEqual(
      level.placementSpots[0]
    );
    expect(engine.getTowerDropSpot({ x: 100, y: 0 })).toBeUndefined();
    const target = actor(engine, 'nearby-target', 'test_flag_guard', 5);
    const hp = target.hp;
    expect(engine.placeTower(creature.id, launch.x, launch.y)).toBe(true);
    expect(engine.towers).toHaveLength(0);
    expect(engine.alliedFlagRunners).toHaveLength(1);
    expect(engine.alliedFlagRunners[0].position).toEqual(launch);
    expect(engine.getFlagRunnerDeployment(creature.id)?.state).toBe('running');
    expect(engine.placeTower(creature.id, 5, 45)).toBe(false);
    expect(engine.launchFlagRunner(creature.id)).toBe(false);
    expect(engine.removeTower(creature.id)).toBe(false);
    advance(engine, 500);
    expect(engine.alliedFlagRunners[0].position.x).toBeCloseTo(9);
    expect(target.hp).toBe(hp);
    expect(engine.projectiles).toHaveLength(0);
    expect(creature.xp).toBe(0);
  });

  it('scores once, returns the same unit to availability, and preserves surviving health', () => {
    const { engine, creature } = playerSetup();
    engine.launchFlagRunner(creature.id);
    const runner = engine.alliedFlagRunners[0];
    runner.hp -= 2;
    advance(engine, 900);
    expect(engine.rivalFlagLives).toBe(1);
    expect(engine.alliedFlagRunners).toHaveLength(0);
    expect(engine.getFlagRunnerDeployment(creature.id)).toBeUndefined();
    advance(engine, 1000);
    expect(engine.rivalFlagLives).toBe(1);
    expect(engine.placeTower(creature.id, 4, 40)).toBe(true);
    expect(engine.towers[0].hp).toBe(runner.hp);
    expect(engine.towers[0].creature.id).toBe(creature.id);
  });

  it('recovers after defender knockout on simulation time before allowing redeployment', () => {
    const { engine, creature } = playerSetup();
    engine.flagDuel!.defenders = [
      {
        enemyDefinitionId: 'test_guard',
        range: 100,
        damage: 10000,
        cooldownMs: 1,
      },
    ];
    const guard = actor(engine, 'guard', 'test_flag_guard', 5);
    guard.waveEnemyDefinitionId = 'test_guard';
    engine.launchFlagRunner(creature.id);
    advance(engine, 50);
    expect(engine.alliedFlagRunners).toHaveLength(0);
    expect(engine.rivalFlagLives).toBe(2);
    expect(engine.getFlagRunnerDeployment(creature.id)).toEqual({
      state: 'recovering',
      remainingMs: 500,
    });
    expect(engine.placeTower(creature.id, 5, 40)).toBe(false);
    expect(engine.removeTower(creature.id)).toBe(false);
    advance(engine, 499);
    expect(engine.launchFlagRunner(creature.id)).toBe(false);
    advance(engine, 1);
    expect(engine.getFlagRunnerDeployment(creature.id)).toBeUndefined();
    expect(engine.placeTower(creature.id, 5, 40)).toBe(true);
    expect(engine.towers[0].hp).toBe(engine.towers[0].maxHp);
  });

  it('can commit an existing defender without retaining a duplicate tower or resetting its HP', () => {
    const { engine, creature } = playerSetup();
    engine.placeTower(creature.id, 5, 40);
    const tower = engine.towers[0];
    tower.hp -= 3;
    expect(engine.launchFlagRunner(creature.id)).toBe(true);
    expect(engine.towers).toHaveLength(0);
    expect(engine.alliedFlagRunners[0].hp).toBe(tower.hp);
    advance(engine, 900);
    engine.placeTower(creature.id, 5, 40);
    expect(engine.towers[0]).toBe(tower);
  });

  it('keeps automatic small waves running alongside roster deployments', () => {
    const { engine, creature } = playerSetup();
    engine.flagDuel!.alliedRunner.firstSpawnDelayMs = 0;
    // Use a fresh engine so its automatic spawn timer picks up the authored delay.
    const mixed = battle(
      {
        paths: engine.paths,
        placementSpots: [],
        waves: [],
        flagDuel: engine.flagDuel,
      },
      [creature]
    );
    mixed.launchFlagRunner(creature.id);
    advance(mixed, 50);
    expect(
      mixed.alliedFlagRunners.some(
        (unit) => unit.playerCreatureId === creature.id
      )
    ).toBe(true);
    expect(mixed.alliedFlagRunners.some((unit) => !unit.playerCreatureId)).toBe(
      true
    );
  });

  it('validates launch coordinates, speed, recovery, and separation from defense spots', () => {
    const { level } = playerSetup();
    const launch = level.flagDuel.playerLaunch!;
    launch.position.x = NaN;
    launch.speed = 0;
    launch.recoveryDurationMs = -1;
    expect(validateTDLevelDraft(level)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('within the map'),
        expect.stringContaining('speed must be positive'),
        expect.stringContaining('recoveryDurationMs'),
      ])
    );
    launch.position = { x: 5, y: 40 };
    level.placementSpots.push({ ...launch.position });
    expect(validateTDLevelDraft(level)).toContain(
      'Flag launch position must be separate from defensive spots.'
    );
    expect(validateTDLevelDraft(level)).toContain(
      'Flag launch position must be a waypoint on the runner path.'
    );
  });
});
