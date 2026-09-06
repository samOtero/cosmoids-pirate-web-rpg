import { describe, expect, it } from 'vitest';

import { BUFFLORA } from '@/constants/creatures';
import {
  AttackBehaviorRegistry,
  PoisonAoeBehavior,
} from '@/engine/tower-defense/attacks/behaviors';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { Enemy, Tower } from '@/engine/tower-defense/types';
import { ElementType } from '@/types/baseGame';

const levelData = {
  paths: [
    [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ],
  ],
  placementSpots: [],
  waves: [{ id: 'empty', groups: [] }],
};

const createBuffloraTower = (): Tower => ({
  id: 'bufflora_tower',
  creature: {
    id: 'bufflora_one',
    speciesId: 'bufflora',
    level: 8,
    xp: 0,
    equippedAttacks: ['TOXIC_POLLEN'],
    isShiny: false,
  },
  position: { x: 0, y: 0 },
  lastAttackTime: 0,
  currentAttack: 13,
  currentSpecialAttack: 15,
  currentDefense: 11,
  currentSpecialDefense: 13,
  hp: 25,
  maxHp: 25,
  equippedAttacksRuntime: [{ definitionId: 'TOXIC_POLLEN', lastFiredTime: 0 }],
  selectedAttackIndex: 0,
  facingDirection: 'right',
  targetingMode: 'closest',
});

const createEnemy = (
  id: string,
  x: number,
  options: { poisoned?: boolean; immune?: boolean } = {}
): Enemy => ({
  id,
  definitionId: 'mouse_1',
  level: 3,
  position: { x, y: 0 },
  hp: 100,
  maxHp: 100,
  speed: 0,
  currentAttack: 10,
  currentSpecialAttack: 10,
  currentDefense: 10,
  currentSpecialDefense: 10,
  statusConditions: options.poisoned
    ? [
        {
          type: 'POISON',
          durationMs: 4000,
          tickDamage: 2,
          lastTickTime: 0,
        },
      ]
    : [],
  immuneToStatusEffects: options.immune,
  currentWaypointIndex: 1,
  pathIndex: 0,
  facingDirection: 'right',
  damagedByTowerIds: new Set(),
});

describe('Toxic Pollen', () => {
  it('is a non-damaging Poison area attack learned by Bufflora at level 8', () => {
    expect(BUFFLORA.learnableAttacks).toContainEqual({
      level: 8,
      attackId: 'TOXIC_POLLEN',
    });
    expect(ATTACK_DEFS.TOXIC_POLLEN).toMatchObject({
      type: ElementType.POISON,
      category: 'special',
      power: 0,
      rangeIndex: 40,
      behaviorType: 'POISON_AOE',
      effects: [{ type: 'POISON', chance: 1 }],
      visualEffectConfigId: 'attack_toxic_pollen_1',
    });
    expect(AttackBehaviorRegistry.POISON_AOE).toBe(PoisonAoeBehavior);
  });

  it('requires a living, non-immune, unpoisoned target in range', () => {
    const engine = new TowerDefenseEngine(levelData);
    const source = createBuffloraTower();
    engine.enemies = [
      createEnemy('already_poisoned', 10, { poisoned: true }),
      createEnemy('immune', 20, { immune: true }),
      createEnemy('out_of_range', 50),
      { ...createEnemy('defeated', 15), hp: 0 },
    ];

    expect(
      PoisonAoeBehavior.canExecute(engine, source, ATTACK_DEFS.TOXIC_POLLEN)
    ).toBe(false);

    engine.enemies.push(createEnemy('eligible', 30));

    expect(
      PoisonAoeBehavior.canExecute(engine, source, ATTACK_DEFS.TOXIC_POLLEN)
    ).toBe(true);
    engine.destroy();
  });

  it('poisons every eligible target in range without damage or reapplication', () => {
    const engine = new TowerDefenseEngine(levelData);
    const source = createBuffloraTower();
    const first = createEnemy('first', 10);
    const second = createEnemy('second', 30);
    const alreadyPoisoned = createEnemy('already_poisoned', 20, {
      poisoned: true,
    });
    const immune = createEnemy('immune', 25, { immune: true });
    const outOfRange = createEnemy('out_of_range', 50);
    engine.enemies = [first, second, alreadyPoisoned, immune, outOfRange];

    PoisonAoeBehavior.execute(engine, source, ATTACK_DEFS.TOXIC_POLLEN);

    for (const target of [first, second]) {
      expect(target.hp).toBe(100);
      expect(target.statusConditions).toEqual([
        {
          type: 'POISON',
          durationMs: 5000,
          tickDamage: 1,
          lastTickTime: 0,
          stackCount: 1,
          damagePerStack: 1,
        },
      ]);
      expect(target.damagedByTowerIds).toEqual(new Set([source.id]));
    }
    expect(alreadyPoisoned.statusConditions).toHaveLength(1);
    expect(alreadyPoisoned.statusConditions[0]).toMatchObject({
      durationMs: 4000,
      tickDamage: 2,
    });
    expect(immune.statusConditions).toEqual([]);
    expect(outOfRange.statusConditions).toEqual([]);
    expect(engine.visualEffects).toContainEqual(
      expect.objectContaining({
        configId: 'attack_toxic_pollen_1',
        position: source.position,
        durationMs: 900,
        rangeIndex: ATTACK_DEFS.TOXIC_POLLEN.rangeIndex,
      })
    );

    const visualEffectCount = engine.visualEffects.length;
    PoisonAoeBehavior.execute(engine, source, ATTACK_DEFS.TOXIC_POLLEN);

    expect(first.statusConditions).toHaveLength(1);
    expect(second.statusConditions).toHaveLength(1);
    expect(alreadyPoisoned.statusConditions).toHaveLength(1);
    expect(engine.visualEffects).toHaveLength(visualEffectCount);
    expect(
      PoisonAoeBehavior.canExecute(engine, source, ATTACK_DEFS.TOXIC_POLLEN)
    ).toBe(false);
    engine.destroy();
  });
});
