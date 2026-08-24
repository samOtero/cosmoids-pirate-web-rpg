import { afterEach, describe, expect, it, vi } from 'vitest';

import { TIGREVEL } from '@/constants/creatures';
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

function damageFrom(
  attackerSpeciesId: string,
  defenderSpeciesId: string,
  attackType: ElementType
): number {
  const attack: AttackDefinition = {
    id: 'TEST_ATTACK',
    name: 'Test Attack',
    type: attackType,
    category: 'physical',
    power: 40,
    cooldownMs: 800,
    rangeIndex: 25,
    behaviorType: 'PROJECTILE',
    projectileSpeed: 1,
  };
  const engine = { floatingTexts: [] } as unknown as TowerDefenseEngine;
  const target = makeEnemy(defenderSpeciesId);

  EffectProcessor.applyDamageAndEffects(
    engine,
    makeTower(attackerSpeciesId),
    target,
    attack
  );

  return target.maxHp - target.hp;
}

describe('Rock element', () => {
  afterEach(() => vi.restoreAllMocks());

  it('makes Tigrevel a pure Rock Cosmoid', () => {
    expect(TIGREVEL.type).toBe(ElementType.ROCK);
    expect(TIGREVEL.secondaryType).toBeUndefined();
  });

  it('applies Rock weaknesses and resistances', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const neutralDamage = damageFrom(
      'mouse_1',
      'tigrevel',
      ElementType.ELECTRIC
    );
    const waterDamage = damageFrom(
      'mouse_1',
      'tigrevel',
      ElementType.WATER
    );
    const fireDamage = damageFrom(
      'mouse_1',
      'tigrevel',
      ElementType.FIRE
    );

    expect(waterDamage).toBeGreaterThan(neutralDamage);
    expect(fireDamage).toBeLessThan(neutralDamage);
  });

  it('gives Tigrevel STAB and super-effective damage with Rock attacks', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const neutralDamage = damageFrom(
      'tigrevel',
      'starter_iguana',
      ElementType.ELECTRIC
    );
    const rockDamage = damageFrom(
      'tigrevel',
      'starter_iguana',
      ElementType.ROCK
    );

    expect(rockDamage).toBeGreaterThan(neutralDamage);
  });
});
