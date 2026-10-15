import { afterEach, describe, expect, it } from 'vitest';

import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { ShikoQuakeBehavior } from '@/engine/tower-defense/attacks/behaviors';
import { ATTACK_FIXTURES, installAttackFixtures } from './fixtures';
import type { Enemy } from '@/engine/tower-defense/types';

installAttackFixtures();

const engines: TowerDefenseEngine[] = [];

afterEach(() => {
  engines.splice(0).forEach((engine) => engine.destroy());
});

function createEnemy(id: string, x: number): Enemy {
  return {
    id,
    definitionId: 'mouse_1',
    level: 10,
    position: { x, y: 50 },
    hp: 300,
    maxHp: 300,
    speed: 0.01,
    currentAttack: 20,
    currentSpecialAttack: 20,
    currentDefense: 20,
    currentSpecialDefense: 20,
    statusConditions: [],
    currentWaypointIndex: 1,
    pathIndex: 0,
    facingDirection: 'right',
    damagedByTowerIds: new Set(),
  };
}

function battle() {
  const engine = new TowerDefenseEngine(
    {
      paths: [
        [
          { x: 0, y: 50 },
          { x: 100, y: 50 },
        ],
      ],
      placementSpots: [{ x: 40, y: 50 }],
      waves: [{ id: 'empty', groups: [] }],
    },
    [
      {
        id: 'yokodillo-one',
        speciesId: 'yokodillo',
        level: 10,
        xp: 0,
        equippedAttacks: ['SHIKO_QUAKE'],
        gender: 'female' as const,
        isShiny: false,
      },
    ]
  );
  engines.push(engine);
  engine.placeTower('yokodillo-one', 40, 50);
  return { engine, source: engine.towers[0] };
}

describe('Committed area impact', () => {
  it('damages and staggers up to three eligible creatures on the slam frame', () => {
    const { engine, source } = battle();
    const first = createEnemy('first', 45);
    const second = createEnemy('second', 58);
    const third = createEnemy('third', 75);
    const distant = createEnemy('distant', 90);
    engine.enemies = [first, second, third, distant];

    ShikoQuakeBehavior.execute(engine, source, ATTACK_FIXTURES.SHIKO_QUAKE);

    expect(source.shikoQuake).toMatchObject({
      startedAtMs: 0,
      impactAtMs: 360,
      endsAtMs: 700,
      hasImpacted: false,
    });
    expect(first.hp).toBe(first.maxHp);
    engine.tick(359, 359);
    expect(first.hp).toBe(first.maxHp);
    expect(engine.visualEffects).toEqual([]);
    engine.tick(360, 1);

    for (const target of [first, second, third]) {
      expect(target.hp).toBeLessThan(target.maxHp);
      expect(target.statusConditions).toContainEqual({
        type: 'STUN',
        durationMs: 350,
      });
      expect(target.damagedByTowerIds.has(source.id)).toBe(true);
    }
    expect(distant.hp).toBe(distant.maxHp);
    expect(distant.statusConditions).toEqual([]);
    expect(source.shikoQuake?.hasImpacted).toBe(true);
    expect(
      engine.visualEffects
        .filter((effect) => effect.configId === 'attack_shiko_quake_hit_1')
        .map((effect) => effect.targetId)
    ).toEqual(['third', 'second', 'first']);
  });

  it('caps a crowded stomp at three targets in the selected targeting order', () => {
    const { engine, source } = battle();
    const targets = [45, 50, 55, 60, 75].map((x) =>
      createEnemy(`enemy-${x}`, x)
    );
    engine.enemies = targets;

    ShikoQuakeBehavior.execute(engine, source, ATTACK_FIXTURES.SHIKO_QUAKE);
    engine.tick(359, 359);
    engine.tick(360, 1);

    expect(
      targets.filter((enemy) => enemy.hp < enemy.maxHp).map((enemy) => enemy.id)
    ).toEqual(['enemy-55', 'enemy-60', 'enemy-75']);
    expect(
      engine.visualEffects
        .filter((effect) => effect.configId === 'attack_shiko_quake_hit_1')
        .map((effect) => effect.targetId)
    ).toEqual(['enemy-75', 'enemy-60', 'enemy-55']);
    expect(
      engine.visualEffects.filter(
        (effect) => effect.configId === 'attack_shiko_quake_1'
      )
    ).toHaveLength(1);
  });

  it('starts from Yokodillo’s normal attack loop and remains committed through impact', () => {
    const { engine, source } = battle();
    const target = createEnemy('target', 50);
    engine.enemies = [target];

    engine.tick(2500, 16);
    expect(source.shikoQuake).toMatchObject({
      startedAtMs: 16,
      impactAtMs: 376,
      hasImpacted: false,
    });
    expect(target.hp).toBe(target.maxHp);

    engine.tick(2860, 360);
    expect(source.shikoQuake?.hasImpacted).toBe(true);
    expect(target.hp).toBeLessThan(target.maxHp);
  });

  it('damages status-immune structures without staggering them and emits one radius effect', () => {
    const { engine, source } = battle();
    const structure = createEnemy('structure', 50);
    structure.kind = 'structure';
    structure.immuneToStatusEffects = true;
    engine.enemies = [structure];

    ShikoQuakeBehavior.execute(engine, source, ATTACK_FIXTURES.SHIKO_QUAKE);
    engine.tick(360, 360);

    expect(structure.hp).toBeLessThan(structure.maxHp);
    expect(structure.statusConditions).toEqual([]);
    expect(engine.visualEffects).toContainEqual(
      expect.objectContaining({
        configId: 'attack_shiko_quake_1',
        position: source.position,
        rangeIndex: 40,
        durationMs: 420,
      })
    );
  });

  it('cancels a pending slam when Yokodillo is moved off its origin', () => {
    const { engine, source } = battle();
    const target = createEnemy('target', 45);
    engine.enemies = [target];
    ShikoQuakeBehavior.execute(engine, source, ATTACK_FIXTURES.SHIKO_QUAKE);

    engine.placeTower(source.creature.id, 42, 50);
    expect(source.shikoQuake).toBeUndefined();
    engine.tick(500, 500);
    expect(target.hp).toBe(target.maxHp);
    expect(target.statusConditions).toEqual([]);
  });
});
