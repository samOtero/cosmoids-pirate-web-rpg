import { describe, expect, it } from 'vitest';
import {
  AdaptiveTargetedAoeBehavior,
  InstantMeleeBehavior,
  PoisonAoeBehavior,
  ProjectileBehavior,
  SupportAuraBehavior,
  resolveAdaptiveTargetedAoeImpact,
} from '@/engine/tower-defense/attacks/behaviors';
import {
  ConstrictionBehavior,
  updateDeepwaterGrips,
} from '@/engine/tower-defense/attacks/deepwaterGrip';
import {
  PalmSlamBehavior,
  PALM_SLAM_IMPACT_MS,
  updatePalmSlams,
} from '@/engine/tower-defense/attacks/palmSlam';
import { makeAttack, makeBattle, makeEnemy } from './helpers';
import type { AttackDefinition } from '@/engine/tower-defense/attacks/types';

function createBattle(overrides: Partial<AttackDefinition> = {}) {
  const battle = makeBattle(
    makeAttack({ rangeIndex: 20, ...overrides }),
    {},
    {
      position: { x: 20, y: 0 },
      waveEnemyDefinitionId: 'extended',
    }
  );
  battle.engine.towerRangeMultiplier = 0.5;
  battle.engine.waveEnemyDefinitions.extended = {
    id: 'extended',
    level: 10,
    targetingRangeMultiplier: 3,
  };
  return battle;
}

describe('target-specific attack reach', () => {
  it.each([
    ['projectile', ProjectileBehavior],
    ['instant melee', InstantMeleeBehavior],
    ['targeted area', AdaptiveTargetedAoeBehavior],
  ] as const)(
    'allows %s activation only for the extended target',
    (_, behavior) => {
      const { engine, source, target, attack } = createBattle();
      expect(behavior.canExecute(engine, source, attack)).toBe(true);
      target.waveEnemyDefinitionId = undefined;
      expect(behavior.canExecute(engine, source, attack)).toBe(false);
      target.waveEnemyDefinitionId = 'extended';
      target.hp = 0;
      expect(behavior.canExecute(engine, source, attack)).toBe(false);
    }
  );

  it('fires at the extended target without treating nearby ordinary enemies as in reach', () => {
    const { engine, source, target, attack } = createBattle();
    engine.enemies.unshift(
      makeEnemy({ id: 'ordinary', position: { x: 19, y: 0 } })
    );
    ProjectileBehavior.execute(engine, source, attack);
    expect(engine.projectiles).toHaveLength(1);
    expect(engine.projectiles[0].targetId).toBe(target.id);
  });

  it('applies source-centered area effects per target without extending their reach to other enemies', () => {
    const { engine, source, target, attack } = createBattle({
      behaviorType: 'POISON_AOE',
    });
    const ordinary = makeEnemy({
      id: 'ordinary',
      position: { ...target.position },
    });
    engine.enemies.push(ordinary);
    PoisonAoeBehavior.execute(engine, source, attack);
    expect(target.hp).toBeLessThan(target.maxHp);
    expect(ordinary.hp).toBe(ordinary.maxHp);
  });

  it('keeps targeted splash radius independent of the acquisition bonus', () => {
    const { engine, source, target, attack } = createBattle({
      adaptiveTargetedAoe: { radiusIndex: 4, singleTargetPower: 80 },
    });
    const near = makeEnemy({ id: 'near', position: { x: 23, y: 0 } });
    const outside = makeEnemy({
      id: 'outside',
      position: { x: 26, y: 0 },
      waveEnemyDefinitionId: 'extended',
    });
    engine.enemies.push(near, outside);
    resolveAdaptiveTargetedAoeImpact(engine, source, attack, target, false);
    expect(target.hp).toBeLessThan(target.maxHp);
    expect(near.hp).toBeLessThan(near.maxHp);
    expect(outside.hp).toBe(outside.maxHp);
  });

  it('retains a committed target through its contact range check', () => {
    const { engine, source, target, attack } = createBattle({
      behaviorType: 'PALM_SLAM',
    });
    PalmSlamBehavior.execute(engine, source, attack);
    engine.elapsedTimeMs = PALM_SLAM_IMPACT_MS;
    updatePalmSlams(engine, [source], engine.enemies);
    expect(target.hp).toBeLessThan(target.maxHp);
  });

  it('maintains a sustained hold within the target allowance and releases beyond it', () => {
    const { engine, source, target, attack } = createBattle({
      behaviorType: 'CONSTRICTION',
      constriction: {
        durationMs: 1000,
        pulseIntervalMs: 100,
        resistanceMs: 200,
      },
    });
    ConstrictionBehavior.execute(engine, source, attack);
    engine.elapsedTimeMs = 100;
    updateDeepwaterGrips(engine, engine.enemies, 100);
    expect(source.deepwaterGrip?.targetId).toBe(target.id);
    expect(target.hp).toBeLessThan(target.maxHp);
    target.position.x = 31;
    updateDeepwaterGrips(engine, engine.enemies, 0);
    expect(source.deepwaterGrip).toBeUndefined();
  });

  it('does not extend ally support range or the ordinary range preview', () => {
    const { engine, source, attack } = createBattle({
      behaviorType: 'SUPPORT_AURA',
      supportBuff: { attackSpeedMultiplier: 1.2, durationMs: 1000 },
    });
    const ally = { ...source, id: 'ally', position: { x: 20, y: 0 } };
    engine.towers.push(ally);
    SupportAuraBehavior.execute(engine, source, attack);
    expect(source.attackSpeedBuff).toBeDefined();
    expect(ally.attackSpeedBuff).toBeUndefined();
    expect(engine.getTowerAttackRange(attack.rangeIndex)).toBe(10);
  });
});
