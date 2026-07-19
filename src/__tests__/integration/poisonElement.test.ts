import { afterEach, describe, expect, it, vi } from 'vitest';

import { EffectProcessor } from '@/engine/tower-defense/attacks/EffectProcessor';
import { AttackDefinition } from '@/engine/tower-defense/attacks/types';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { Enemy, Tower } from '@/engine/tower-defense/types';
import { ElementType } from '@/types/baseGame';

function makeTower(speciesId: string): Tower {
  return {
    id: 'tower',
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
    id: 'enemy',
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

describe('Poison element combat support', () => {
  afterEach(() => vi.restoreAllMocks());

  it('applies neutral Poison damage and Poison STAB without lookup gaps', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const engine = { floatingTexts: [] } as unknown as TowerDefenseEngine;
    const target = makeEnemy('mopup');

    EffectProcessor.applyDamageAndEffects(
      engine,
      makeTower('snoutasco'),
      target,
      makeAttack(ElementType.POISON)
    );

    expect(target.hp).toBe(94);
    expect(engine.floatingTexts[0]?.text).toBe('6');
  });

  it('accepts Poison defenders in every-type matchup records', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const engine = { floatingTexts: [] } as unknown as TowerDefenseEngine;
    const target = makeEnemy('snoutasco');

    EffectProcessor.applyDamageAndEffects(
      engine,
      makeTower('mopup'),
      target,
      makeAttack(ElementType.NORMAL)
    );

    expect(target.hp).toBe(96);
    expect(engine.floatingTexts[0]?.text).toBe('4');
  });
});
