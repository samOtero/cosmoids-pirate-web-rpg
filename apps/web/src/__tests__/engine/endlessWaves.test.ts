import { describe, expect, it } from 'vitest';

import { LEVEL_5 } from '@/constants/tdLevels/level5';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import type { TDLevelData, Tower } from '@/engine/tower-defense/types';

// Hold enemies in place so tests can inspect waves without losing captives.
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
  const earlierEnemies = new Set(engine.enemies);
  for (let elapsed = 0; elapsed < 120000; elapsed += 50) {
    advance(engine, 50);
    if (engine.currentWaveIndex !== waveIndex) break;
  }
  expect(engine.currentWaveIndex).toBe(waveIndex + 1);
  return engine.enemies.filter((enemy) => !earlierEnemies.has(enemy));
}

describe('endless reinforcement waves', () => {
  it('grows each level 5 group every two waves without changing authored data or repeating gates', () => {
    const originalLevel = structuredClone(LEVEL_5);
    const engine = new TowerDefenseEngine(LEVEL_5);
    expect(finishWave(engine)).toHaveLength(8); // Five gates and three Bufflora.
    const baseEnemies = finishWave(engine);
    expect(baseEnemies).toHaveLength(6);

    for (const expectedCount of [2, 2, 3, 3]) {
      const waveIndex = engine.currentWaveIndex;
      const enemies = finishWave(engine);
      expect(enemies).toHaveLength(6 * expectedCount);
      for (const group of LEVEL_5.waves[1].groups) {
        const groupEnemies = enemies.filter(
          (enemy) =>
            enemy.waveEnemyDefinitionId === group.enemyDefinitionId &&
            enemy.pathIndex === group.pathIndex
        );
        expect(groupEnemies).toHaveLength(expectedCount);
        const baseEnemy = baseEnemies.find(
          (enemy) => enemy.waveEnemyDefinitionId === group.enemyDefinitionId
        )!;
        for (const enemy of groupEnemies) {
          expect(enemy.maxHp).toBeCloseTo(
            baseEnemy.maxHp * (1 + (waveIndex - 1) * 0.1)
          );
          expect(enemy.uncapturable).toBe(baseEnemy.uncapturable);
        }
      }
    }
    expect(engine.hasFinishedAllWaves).toBe(false);
    expect(
      engine.enemies.filter((enemy) => enemy.kind === 'structure')
    ).toHaveLength(5);
    expect(engine.waves).toHaveLength(2);
    expect(LEVEL_5).toEqual(originalLevel);
    engine.destroy();
  });

  it.each([
    { interval: undefined, step: undefined, counts: [1, 1, 1, 1] },
    { interval: 0, step: 1, counts: [1, 1, 1, 1] },
    { interval: 2, step: 0, counts: [1, 1, 1, 1] },
    { interval: 3, step: 2, counts: [1, 3, 3, 3] },
    { interval: 2, step: undefined, counts: [2, 2, 3, 3] },
  ])(
    'supports interval $interval and increase $step',
    ({ interval, step, counts }) => {
      const level: TDLevelData = {
        ...LEVEL_5,
        endlessWaves: {
          ...LEVEL_5.endlessWaves!,
          spawnCountIncreaseEveryWaves: interval,
          spawnCountIncreasePerStep: step,
        },
      };
      const engine = new TowerDefenseEngine(level);
      finishWave(engine);
      finishWave(engine);
      for (const count of counts) {
        expect(finishWave(engine)).toHaveLength(6 * count);
      }
      engine.destroy();
    }
  );

  it('adds to differing base counts and preserves the reinforcement delay', () => {
    const level = structuredClone(LEVEL_5);
    level.waves[1].groups[0].count = 2;
    const engine = new TowerDefenseEngine(level);
    finishWave(engine);
    expect(finishWave(engine)).toHaveLength(7);
    const existingCount = engine.enemies.length;
    advance(engine, level.endlessWaves!.delayBetweenWavesMs - 50);
    expect(engine.enemies).toHaveLength(existingCount);
    const reinforcements = finishWave(engine);
    expect(reinforcements).toHaveLength(13);
    expect(
      reinforcements.filter(
        (enemy) =>
          enemy.waveEnemyDefinitionId === 'level_5_marophis_wild' &&
          enemy.pathIndex === 0
      )
    ).toHaveLength(3);
    engine.destroy();
  });

  it('does not win when creatures are cleared, and stops reinforcements when the main bars break', () => {
    const engine = new TowerDefenseEngine(LEVEL_5);
    finishWave(engine);
    finishWave(engine);
    engine.enemies = engine.enemies.filter(
      (enemy) => enemy.kind === 'structure'
    );
    advance(engine, 50);
    expect(engine.hasFinishedAllWaves).toBe(false);
    expect(engine.hasDestroyedVictoryStructure).toBe(false);
    expect(finishWave(engine)).toHaveLength(12);

    const bars = engine.enemies.find((enemy) => enemy.winsLevelOnDestroy)!;
    bars.hp = 0;
    engine.emitEnemyDefeated(bars, {
      id: 'test-tower',
      position: bars.position,
    } as Tower);
    expect(engine.hasDestroyedVictoryStructure).toBe(true);
    const remainingIds = engine.enemies
      .filter((enemy) => enemy !== bars)
      .map((enemy) => enemy.id);
    advance(engine, 40000);
    expect(engine.enemies.map((enemy) => enemy.id)).toEqual(remainingIds);
    engine.destroy();
  });

  it('still finishes authored waves on finite levels', () => {
    const engine = new TowerDefenseEngine({
      ...LEVEL_5,
      endlessWaves: undefined,
    });
    expect(finishWave(engine)).toHaveLength(8);
    expect(finishWave(engine)).toHaveLength(6);
    expect(engine.hasFinishedAllWaves).toBe(true);
    advance(engine, 40000);
    expect(engine.enemies).toHaveLength(14);
    engine.destroy();
  });
});
