import { describe, expect, it } from 'vitest';
import type { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import type { TDLevelData, Tower } from '@/engine/tower-defense/types';
import { validateTDLevelDraft } from '@/utils/tdLevelDraft';
import { battle, battleSpecies } from './behaviorFixtures';

function reinforcementBattle(overrides: Partial<TDLevelData> = {}) {
  battleSpecies('test_reinforcement_species');
  const level: TDLevelData = {
    paths: [
      [
        { x: 0, y: 40 },
        { x: 1000, y: 40 },
      ],
      [
        { x: 0, y: 60 },
        { x: 1000, y: 60 },
      ],
    ],
    placementSpots: [],
    waveEnemyDefinitions: [
      { id: 'test_boss', creatureId: 'test_reinforcement_species', level: 5 },
      { id: 'test_helper', creatureId: 'test_reinforcement_species', level: 5 },
    ],
    reinforcementBossDefinitionId: 'test_boss',
    waves: [
      {
        id: 'opening',
        groups: [
          {
            enemyDefinitionId: 'test_boss',
            count: 1,
            spawnIntervalMs: 0,
            delayBeforeGroupMs: 0,
            pathIndex: 0,
          },
        ],
      },
      {
        id: 'pressure',
        groups: [
          {
            enemyDefinitionId: 'test_helper',
            count: 2,
            spawnIntervalMs: 100,
            delayBeforeGroupMs: 0,
            pathIndex: 0,
          },
          {
            enemyDefinitionId: 'test_helper',
            count: 2,
            spawnIntervalMs: 100,
            delayBeforeGroupMs: 0,
            pathIndex: 1,
            concurrentWithPrevious: true,
          },
          {
            enemyDefinitionId: 'test_helper',
            count: 1,
            spawnIntervalMs: 100,
            delayBeforeGroupMs: 200,
            pathIndex: 1,
          },
        ],
      },
    ],
    endlessWaves: { delayBetweenWavesMs: 1000, hpIncreasePerWave: 0 },
    ...overrides,
  };
  return { level, engine: battle(level) };
}

function advance(engine: TowerDefenseEngine, durationMs: number) {
  for (let elapsed = 0; elapsed < durationMs; elapsed += 50) {
    engine.enemies.forEach((enemy) => {
      enemy.speed = 0;
    });
    engine.tick(engine.elapsedTimeMs + 50, 50);
  }
}

function finishWave(engine: TowerDefenseEngine) {
  const waveIndex = engine.currentWaveIndex;
  for (let elapsed = 0; elapsed < 5000; elapsed += 50) {
    advance(engine, 50);
    if (engine.currentWaveIndex !== waveIndex) return;
  }
  throw new Error('Wave did not finish spawning');
}

describe('repeating reinforcements with a boss objective', () => {
  it('pauses every opening lane for the recovery delay and repeats with survivors still present', () => {
    const { engine, level } = reinforcementBattle();
    const authoredLevel = structuredClone(level);
    finishWave(engine);
    finishWave(engine);
    const originalEnemies = [...engine.enemies];
    expect(originalEnemies).toHaveLength(6);
    for (let cycle = 0; cycle < 3; cycle++) {
      const existingCount = engine.enemies.length;
      advance(engine, level.endlessWaves!.delayBetweenWavesMs - 50);
      expect(engine.enemies).toHaveLength(existingCount);
      finishWave(engine);
      expect(engine.enemies).toHaveLength(existingCount + 5);
      expect(engine.hasFinishedAllWaves).toBe(false);
    }
    expect(
      engine.enemies.filter(
        (enemy) => enemy.waveEnemyDefinitionId === 'test_boss'
      )
    ).toHaveLength(1);
    expect(new Set(engine.enemies.map((enemy) => enemy.maxHp)).size).toBe(1);
    expect(engine.enemies).toEqual(expect.arrayContaining(originalEnemies));
    expect(level).toEqual(authoredLevel);
  });

  it('stops spawning only for the selected boss and keeps survivors active until cleared', () => {
    const { engine } = reinforcementBattle();
    finishWave(engine);
    finishWave(engine);
    const helper = engine.enemies.find(
      (enemy) => enemy.waveEnemyDefinitionId === 'test_helper'
    )!;
    const boss = engine.enemies.find(
      (enemy) => enemy.waveEnemyDefinitionId === 'test_boss'
    )!;
    const source = { id: 'test_tower' } as Tower;
    helper.hp = 0;
    engine.emitEnemyDefeated(helper, source);
    expect(engine.hasFinishedAllWaves).toBe(false);
    boss.hp = 0;
    engine.emitEnemyDefeated(boss, source);
    expect(engine.hasFinishedAllWaves).toBe(true);
    const stoppedAt = engine.elapsedTimeMs;
    engine.tick(stoppedAt + 50, 50);
    const survivors = [...engine.enemies];
    expect(survivors).toHaveLength(4);
    expect(engine.enemies).not.toContain(boss);
    const movingHelper = survivors[0];
    movingHelper.speed = 1;
    const previousX = movingHelper.position.x;
    engine.tick(engine.elapsedTimeMs + 50, 50);
    expect(movingHelper.position.x).toBeGreaterThan(previousX);
    advance(engine, 5000);
    expect(engine.elapsedTimeMs).toBeGreaterThan(stoppedAt);
    expect(engine.enemies).toEqual(survivors);
    survivors.forEach((enemy) => {
      enemy.hp = 0;
    });
    advance(engine, 50);
    expect(engine.hasFinishedAllWaves).toBe(true);
    expect(engine.enemies).toHaveLength(0);
  });

  it('cancels pending groups when the boss falls during the opening', () => {
    const { engine } = reinforcementBattle();
    finishWave(engine);
    const boss = engine.enemies[0];
    boss.hp = 0;
    engine.emitEnemyDefeated(boss, { id: 'test_tower' } as Tower);
    advance(engine, 5000);
    expect(engine.hasFinishedAllWaves).toBe(true);
    expect(engine.enemies).toHaveLength(0);
  });

  it('allows surviving haulers to lose the objective after the boss is defeated', () => {
    const { engine } = reinforcementBattle({
      captureUnits: [
        { tdConfigId: 'test_capture', position: { x: 1000, y: 40 } },
      ],
    });
    finishWave(engine);
    finishWave(engine);
    const boss = engine.enemies.find(
      (enemy) => enemy.waveEnemyDefinitionId === 'test_boss'
    )!;
    boss.hp = 0;
    engine.emitEnemyDefeated(boss, { id: 'test_tower' } as Tower);
    const helper = engine.enemies.find(
      (enemy) => enemy.waveEnemyDefinitionId === 'test_helper'
    )!;
    const objective = engine.captureUnits[0];
    objective.heldByEnemyId = helper.id;
    helper.heldCaptureUnitId = objective.id;
    helper.currentWaypointIndex = engine.paths[helper.pathIndex].length;
    const previousLives = engine.lives;
    advance(engine, 50);
    expect(engine.lives).toBe(previousLives - 1);
    expect(engine.captureUnits).toHaveLength(0);
    expect(engine.enemies).not.toContain(helper);
  });

  it('recognizes a boss killed by ongoing damage without a direct defeat event', () => {
    const { engine } = reinforcementBattle();
    finishWave(engine);
    const boss = engine.enemies.find(
      (enemy) => enemy.waveEnemyDefinitionId === 'test_boss'
    )!;
    boss.hp = 1;
    boss.statusConditions.push({
      type: 'BURN',
      durationMs: 5000,
      tickDamage: 2,
      lastTickTime: 0,
    });
    advance(engine, 1100);
    expect(engine.hasFinishedAllWaves).toBe(true);
    expect(engine.enemies).not.toContain(boss);
  });

  it('validates the configured boss reference without relying on authored content', () => {
    const { level } = reinforcementBattle();
    expect(validateTDLevelDraft(level)).toEqual([]);
    expect(
      validateTDLevelDraft({
        ...level,
        reinforcementBossDefinitionId: 'missing',
      })
    ).toContain('The reinforcement boss must reference a creature encounter.');
  });
});
