import { afterEach, describe, expect, it } from 'vitest';
import { YOKODILLO } from '@/constants/creatures';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import {
  AttackBehaviorRegistry,
  ShikoQuakeBehavior,
} from '@/engine/tower-defense/attacks/behaviors';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import type { Enemy } from '@/engine/tower-defense/types';
import { ElementType } from '@/types/baseGame';

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
        isShiny: false,
      },
    ]
  );
  engines.push(engine);
  engine.placeTower('yokodillo-one', 40, 50);
  return { engine, source: engine.towers[0] };
}

describe('Shiko Quake', () => {
  it('is Yokodillo’s level-ten physical Fighting area move', () => {
    expect(YOKODILLO.learnableAttacks).toContainEqual({
      level: 10,
      attackId: 'SHIKO_QUAKE',
    });
    expect(ATTACK_DEFS.SHIKO_QUAKE).toMatchObject({
      type: ElementType.FIGHTING,
      category: 'physical',
      power: 35,
      cooldownMs: 2400,
      rangeIndex: 22,
      behaviorType: 'SHIKO_QUAKE',
      effects: [{ type: 'STUN', chance: 1, value: 350 }],
      visualEffectConfigId: 'attack_shiko_quake_1',
    });
    expect(AttackBehaviorRegistry.SHIKO_QUAKE).toBe(ShikoQuakeBehavior);
    expect(
      CREATURE_TD_CONFIGS.attack_shiko_quake_1.default.vfxAnimation
    ).toEqual({ type: 'SHIKO_QUAKE', durationMs: 420 });
  });

  it('damages and staggers every eligible creature on the slam frame', () => {
    const { engine, source } = battle();
    const first = createEnemy('first', 45);
    const second = createEnemy('second', 58);
    const distant = createEnemy('distant', 70);
    engine.enemies = [first, second, distant];

    ShikoQuakeBehavior.execute(engine, source, ATTACK_DEFS.SHIKO_QUAKE);

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

    for (const target of [first, second]) {
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

    ShikoQuakeBehavior.execute(engine, source, ATTACK_DEFS.SHIKO_QUAKE);
    engine.tick(360, 360);

    expect(structure.hp).toBeLessThan(structure.maxHp);
    expect(structure.statusConditions).toEqual([]);
    expect(engine.visualEffects).toContainEqual(
      expect.objectContaining({
        configId: 'attack_shiko_quake_1',
        position: source.position,
        rangeIndex: 22,
        durationMs: 420,
      })
    );
  });

  it('cancels a pending slam when Yokodillo is moved off its origin', () => {
    const { engine, source } = battle();
    const target = createEnemy('target', 45);
    engine.enemies = [target];
    ShikoQuakeBehavior.execute(engine, source, ATTACK_DEFS.SHIKO_QUAKE);

    engine.placeTower(source.creature.id, 42, 50);
    expect(source.shikoQuake).toBeUndefined();
    engine.tick(500, 500);
    expect(target.hp).toBe(target.maxHp);
    expect(target.statusConditions).toEqual([]);
  });
});
