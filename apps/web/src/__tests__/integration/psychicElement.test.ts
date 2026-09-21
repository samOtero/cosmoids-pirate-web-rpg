import { afterEach, describe, expect, it, vi } from 'vitest';

import { DORMATEE } from '@/constants/creatures';
import { EffectProcessor } from '@/engine/tower-defense/attacks/EffectProcessor';
import type { AttackDefinition } from '@/engine/tower-defense/attacks/types';
import type { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import type { Enemy, Tower } from '@/engine/tower-defense/types';
import { ElementType } from '@/types/baseGame';

function makeTower(): Tower {
  return {
    id: 'tower_dormatee',
    position: { x: 0, y: 0 },
    facingDirection: 'right',
    hp: 100,
    maxHp: 100,
    creature: { speciesId: 'dormatee', level: 9 },
    currentAttack: DORMATEE.baseStats.attack,
    currentSpecialAttack: DORMATEE.baseStats.specialAttack,
    currentDefense: DORMATEE.baseStats.defense,
    currentSpecialDefense: DORMATEE.baseStats.specialDefense,
    lastAttackTime: 0,
    equippedAttacksRuntime: [],
    selectedAttackIndex: 0,
  } as unknown as Tower;
}

function makeEnemy(elementTypes: ElementType[]): Enemy {
  return {
    id: 'psychic_test_enemy',
    definitionId: 'psychic_test_enemy',
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

function makePsychicAttack(): AttackDefinition {
  return {
    id: 'PSYCHIC_TEST_ATTACK',
    name: 'Psychic Test Attack',
    type: ElementType.PSYCHIC,
    category: 'special',
    power: 40,
    cooldownMs: 800,
    rangeIndex: 25,
    behaviorType: 'PROJECTILE',
    projectileSpeed: 1,
  };
}

describe('Psychic element support', () => {
  afterEach(() => vi.restoreAllMocks());

  it('registers Dormatee as a pure Psychic species', () => {
    expect(DORMATEE.type).toBe(ElementType.PSYCHIC);
    expect(DORMATEE.secondaryType).toBeUndefined();
  });

  it('deals super-effective Psychic damage against Poison', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const engine = { floatingTexts: [] } as unknown as TowerDefenseEngine;
    const target = makeEnemy([ElementType.POISON]);

    EffectProcessor.applyDamageAndEffects(
      engine,
      makeTower(),
      target,
      makePsychicAttack()
    );

    expect(target.hp).toBeLessThan(80);
  });

  it('treats Dark defenders as immune to Psychic damage', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const engine = { floatingTexts: [] } as unknown as TowerDefenseEngine;
    const target = makeEnemy([ElementType.DARK]);

    EffectProcessor.applyDamageAndEffects(
      engine,
      makeTower(),
      target,
      makePsychicAttack()
    );

    expect(target.hp).toBe(target.maxHp);
  });
});
