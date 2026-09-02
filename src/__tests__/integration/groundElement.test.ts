import { afterEach, describe, expect, it, vi } from 'vitest';

import { CORROGOON } from '@/constants/creatures';
import { LEVEL_5 } from '@/constants/tdLevels/level5';
import { EffectProcessor } from '@/engine/tower-defense/attacks/EffectProcessor';
import type { AttackDefinition } from '@/engine/tower-defense/attacks/types';
import type { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import type { Enemy, Tower } from '@/engine/tower-defense/types';
import { ElementType } from '@/types/baseGame';

function makeTower(): Tower {
  return {
    id: 'tower_corrogoon',
    position: { x: 0, y: 0 },
    facingDirection: 'right',
    hp: 100,
    maxHp: 100,
    creature: { speciesId: 'corrogoon', level: 8 },
    currentAttack: 72,
    currentSpecialAttack: 62,
    currentDefense: 82,
    currentSpecialDefense: 64,
    lastAttackTime: 0,
    equippedAttacksRuntime: [],
    selectedAttackIndex: 0,
  } as unknown as Tower;
}

function makeEnemy(elementTypes: ElementType[]): Enemy {
  return {
    id: 'ground_test_enemy',
    definitionId: 'ground_test_enemy',
    position: { x: 10, y: 10 },
    facingDirection: 'left',
    hp: 100,
    maxHp: 100,
    level: 8,
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

function makeAttack(type: ElementType): AttackDefinition {
  return {
    id: 'GROUND_TEST_ATTACK',
    name: 'Ground Test Attack',
    type,
    category: 'physical',
    power: 40,
    cooldownMs: 800,
    rangeIndex: 25,
    behaviorType: 'PROJECTILE',
    projectileSpeed: 1,
  };
}

describe('Ground element support', () => {
  afterEach(() => vi.restoreAllMocks());

  it('registers Corrogoon as Poison/Ground', () => {
    expect(CORROGOON.type).toBe(ElementType.POISON);
    expect(CORROGOON.secondaryType).toBe(ElementType.GROUND);
  });

  it('registers Corrogoon as a Level 5 prisoner without spawning it as an enemy', () => {
    expect(LEVEL_5.waveEnemyDefinitions).toContainEqual(
      expect.objectContaining({
        id: 'level_5_corrogoon_prisoner',
        creatureId: 'corrogoon',
        level: 8,
        canCarryCaptureUnits: false,
      })
    );
    expect(
      LEVEL_5.waves.flatMap((wave) => wave.groups).some(
        (group) =>
          group.enemyDefinitionId === 'level_5_corrogoon_prisoner'
      )
    ).toBe(false);
  });

  it('applies Ground STAB and super-effective damage against Steel', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const engine = { floatingTexts: [] } as unknown as TowerDefenseEngine;
    const target = makeEnemy([ElementType.STEEL]);

    EffectProcessor.applyDamageAndEffects(
      engine,
      makeTower(),
      target,
      makeAttack(ElementType.GROUND)
    );

    expect(target.hp).toBeLessThan(90);
  });

  it('treats Ground defenders as immune to Electric damage', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const engine = { floatingTexts: [] } as unknown as TowerDefenseEngine;
    const target = makeEnemy([ElementType.POISON, ElementType.GROUND]);

    EffectProcessor.applyDamageAndEffects(
      engine,
      makeTower(),
      target,
      makeAttack(ElementType.ELECTRIC)
    );

    expect(target.hp).toBe(target.maxHp);
  });
});
