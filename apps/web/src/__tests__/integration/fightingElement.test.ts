import { afterEach, describe, expect, it, vi } from 'vitest';

import { YOKODILLO } from '@/constants/creatures';
import { EffectProcessor } from '@/engine/tower-defense/attacks/EffectProcessor';
import type { AttackDefinition } from '@/engine/tower-defense/attacks/types';
import type { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import type { Enemy, Tower } from '@/engine/tower-defense/types';
import { ElementType } from '@/types/baseGame';

function makeTower(): Tower {
  return {
    id: 'tower_yokodillo',
    position: { x: 0, y: 0 },
    facingDirection: 'right',
    hp: 100,
    maxHp: 100,
    creature: { speciesId: 'yokodillo', level: 9 },
    currentAttack: YOKODILLO.baseStats.attack,
    currentSpecialAttack: YOKODILLO.baseStats.specialAttack,
    currentDefense: YOKODILLO.baseStats.defense,
    currentSpecialDefense: YOKODILLO.baseStats.specialDefense,
    lastAttackTime: 0,
    equippedAttacksRuntime: [],
    selectedAttackIndex: 0,
  } as unknown as Tower;
}

function makeEnemy(elementTypes: ElementType[]): Enemy {
  return {
    id: 'fighting_test_enemy',
    definitionId: 'fighting_test_enemy',
    position: { x: 10, y: 10 },
    facingDirection: 'left',
    hp: 100,
    maxHp: 100,
    level: 9,
    speed: 1,
    currentAttack: 50,
    currentSpecialAttack: 50,
    currentDefense: 50,
    currentSpecialDefense: 50,
    elementTypes,
    statusConditions: [],
    currentWaypointIndex: 0,
    pathIndex: 0,
    damagedByTowerIds: new Set<string>(),
  };
}

function makeFightingAttack(): AttackDefinition {
  return {
    id: 'FIGHTING_TEST_ATTACK',
    name: 'Fighting Test Attack',
    type: ElementType.FIGHTING,
    category: 'physical',
    power: 40,
    cooldownMs: 800,
    rangeIndex: 25,
    behaviorType: 'PROJECTILE',
    projectileSpeed: 1,
  };
}

function damageAgainst(type: ElementType): number {
  const engine = { floatingTexts: [] } as unknown as TowerDefenseEngine;
  const target = makeEnemy([type]);

  EffectProcessor.applyDamageAndEffects(
    engine,
    makeTower(),
    target,
    makeFightingAttack()
  );

  return target.maxHp - target.hp;
}

describe('Fighting element support', () => {
  afterEach(() => vi.restoreAllMocks());

  it('registers Yokodillo as a pure Fighting species', () => {
    expect(YOKODILLO.type).toBe(ElementType.FIGHTING);
    expect(YOKODILLO.secondaryType).toBeUndefined();
  });

  it('uses Pokémon-style Fighting effectiveness', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    const normalDamage = damageAgainst(ElementType.NORMAL);
    const rockDamage = damageAgainst(ElementType.ROCK);
    const psychicDamage = damageAgainst(ElementType.PSYCHIC);

    expect(rockDamage).toBe(normalDamage);
    expect(psychicDamage).toBeCloseTo(normalDamage / 4);
  });
});
