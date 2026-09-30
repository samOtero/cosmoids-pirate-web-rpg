import { afterEach, describe, expect, it, vi } from 'vitest';

import { BUFFLORA } from '@/constants/creatures';
import {
  AttackBehaviorRegistry,
  PoisonAoeBehavior,
} from '@/engine/tower-defense/attacks/behaviors';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { Enemy, Tower } from '@/engine/tower-defense/types';
import { ElementType } from '@/types/baseGame';
import {
  findPoison,
  TOXIC_POLLEN_POISON_ID,
  VENOM_SPRAY_POISON_ID,
} from '@/engine/tower-defense/poison';

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
  options: {
    poisonId?: 'TOXIC_POLLEN' | 'VENOM_SPRAY';
    immune?: boolean;
  } = {}
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
  statusConditions: options.poisonId
    ? [
        {
          type: 'POISON',
          poisonId: options.poisonId,
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

afterEach(() => vi.restoreAllMocks());

describe('Toxic Pollen', () => {
  it('stores a 40-power damage budget in a distinct Poison area debuff', () => {
    expect(BUFFLORA.learnableAttacks).toContainEqual({
      level: 8,
      attackId: 'TOXIC_POLLEN',
    });
    expect(ATTACK_DEFS.TOXIC_POLLEN).toMatchObject({
      type: ElementType.POISON,
      category: 'special',
      power: 0,
      cooldownMs: 2400,
      rangeIndex: 40,
      behaviorType: 'POISON_AOE',
      effects: [
        {
          type: 'POISON',
          chance: 1,
          poisonId: TOXIC_POLLEN_POISON_ID,
          totalPower: 40,
          durationMs: 5000,
          tickCount: 5,
        },
      ],
      visualEffectConfigId: 'attack_toxic_pollen_1',
    });
    expect(AttackBehaviorRegistry.POISON_AOE).toBe(PoisonAoeBehavior);
  });

  it('requires a living, non-immune target without Toxic Pollen in range', () => {
    const engine = new TowerDefenseEngine(levelData);
    const source = createBuffloraTower();
    engine.enemies = [
      createEnemy('already_pollened', 10, {
        poisonId: TOXIC_POLLEN_POISON_ID,
      }),
      createEnemy('immune', 20, { immune: true }),
      createEnemy('out_of_range', 50),
      { ...createEnemy('defeated', 15), hp: 0 },
    ];

    expect(
      PoisonAoeBehavior.canExecute(engine, source, ATTACK_DEFS.TOXIC_POLLEN)
    ).toBe(false);

    engine.enemies.push(
      createEnemy('venomed_but_eligible', 30, {
        poisonId: VENOM_SPRAY_POISON_ID,
      })
    );

    expect(
      PoisonAoeBehavior.canExecute(engine, source, ATTACK_DEFS.TOXIC_POLLEN)
    ).toBe(true);
    engine.destroy();
  });

  it('deals no impact damage, coexists with venom, and spends its exact damage over five ticks', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const engine = new TowerDefenseEngine(levelData);
    const source = createBuffloraTower();
    const first = createEnemy('first', 10);
    const second = createEnemy('second', 30);
    const alreadyPollened = createEnemy('already_pollened', 20, {
      poisonId: TOXIC_POLLEN_POISON_ID,
    });
    const alreadyVenomed = createEnemy('already_venomed', 15, {
      poisonId: VENOM_SPRAY_POISON_ID,
    });
    const immune = createEnemy('immune', 25, { immune: true });
    const outOfRange = createEnemy('out_of_range', 50);
    engine.enemies = [
      first,
      second,
      alreadyPollened,
      alreadyVenomed,
      immune,
      outOfRange,
    ];

    PoisonAoeBehavior.execute(engine, source, ATTACK_DEFS.TOXIC_POLLEN);

    for (const target of [first, second, alreadyVenomed]) {
      expect(target.hp).toBe(100);
      expect(findPoison(target, TOXIC_POLLEN_POISON_ID)).toMatchObject({
        type: 'POISON',
        poisonId: TOXIC_POLLEN_POISON_ID,
        durationMs: 5000,
        tickDamage: 2,
        remainingDamage: 10,
        ticksRemaining: 5,
        tickIntervalMs: 1000,
        nextTickAtMs: 1000,
        expiresAtMs: 5000,
      });
      expect(target.damagedByTowerIds).toEqual(new Set([source.id]));
    }
    expect(alreadyVenomed.statusConditions).toHaveLength(2);
    expect(alreadyPollened.statusConditions).toHaveLength(1);
    expect(alreadyPollened.statusConditions[0]).toMatchObject({
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
    expect(alreadyPollened.statusConditions).toHaveLength(1);
    expect(alreadyVenomed.statusConditions).toHaveLength(2);
    expect(engine.visualEffects).toHaveLength(visualEffectCount);
    expect(
      PoisonAoeBehavior.canExecute(engine, source, ATTACK_DEFS.TOXIC_POLLEN)
    ).toBe(false);

    engine.enemies = [first];
    for (let tick = 1; tick <= 5; tick += 1) {
      engine.tick(tick * 1000, 1000);
      expect(first.hp).toBe(100 - tick * 2);
    }
    expect(first.statusConditions).toHaveLength(0);
    engine.destroy();
  });
});
