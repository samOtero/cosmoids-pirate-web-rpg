import { afterEach, describe, expect, it, vi } from 'vitest';

import { EffectProcessor } from '@/engine/tower-defense/attacks/EffectProcessor';
import { AttackDefinition } from '@/engine/tower-defense/attacks/types';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { Enemy, Tower } from '@/engine/tower-defense/types';
import { ElementType } from '@/types/baseGame';

function makeTower(speciesId: string): Tower {
  return {
    id: `tower_${speciesId}`,
    position: { x: 0, y: 0 },
    facingDirection: 'right',
    hp: 100,
    maxHp: 100,
    creature: { speciesId, level: 5 },
    currentAttack: 60,
    currentSpecialAttack: 60,
    currentDefense: 50,
    currentSpecialDefense: 50,
    lastAttackTime: 0,
    equippedAttacksRuntime: [],
    selectedAttackIndex: 0,
  } as unknown as Tower;
}

function makeEnemy(definitionId: string): Enemy {
  return {
    id: `enemy_${definitionId}`,
    definitionId,
    position: { x: 10, y: 10 },
    facingDirection: 'left',
    hp: 100,
    maxHp: 100,
    level: 5,
    speed: 1,
    currentAttack: 50,
    currentSpecialAttack: 50,
    currentDefense: 50,
    currentSpecialDefense: 50,
    statusConditions: [],
    currentWaypointIndex: 0,
    pathIndex: 0,
    damagedByTowerIds: new Set<string>(),
  };
}

function makeAttack(type: ElementType): AttackDefinition {
  return {
    id: 'TEST_ATTACK',
    name: 'Test Attack',
    type,
    category: 'physical',
    power: 40,
    cooldownMs: 800,
    rangeIndex: 25,
    behaviorType: 'PROJECTILE',
    projectileSpeed: 1,
  };
}

function damageFrom(speciesId: string, attackType: ElementType): number {
  const engine = { floatingTexts: [] } as unknown as TowerDefenseEngine;
  const target = makeEnemy('mopup');

  EffectProcessor.applyDamageAndEffects(
    engine,
    makeTower(speciesId),
    target,
    makeAttack(attackType)
  );

  return target.maxHp - target.hp;
}

describe('Elemental combat support', () => {
  afterEach(() => vi.restoreAllMocks());

  it('applies same-type attack bonus without depending on exact damage tuning', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const poisonStabDamage = damageFrom('snoutasco', ElementType.POISON);
    const poisonNonStabDamage = damageFrom('mopup', ElementType.POISON);

    expect(poisonNonStabDamage).toBeGreaterThan(0);
    expect(poisonStabDamage).toBeGreaterThan(poisonNonStabDamage);
  });

  it.each(Object.values(ElementType))(
    'can resolve %s attacks against a Poison defender',
    (attackType) => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const engine = { floatingTexts: [] } as unknown as TowerDefenseEngine;
      const target = makeEnemy('snoutasco');

      EffectProcessor.applyDamageAndEffects(
        engine,
        makeTower('mopup'),
        target,
        makeAttack(attackType)
      );

      expect(target.hp).toBeLessThan(target.maxHp);
      expect(Number.isFinite(target.hp)).toBe(true);
    }
  );
});
