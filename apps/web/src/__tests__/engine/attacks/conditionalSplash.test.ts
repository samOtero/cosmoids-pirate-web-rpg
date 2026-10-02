import { describe, expect, it, vi } from 'vitest';
import { EffectProcessor } from '@/engine/tower-defense/attacks/EffectProcessor';
import { ElementType } from '@/types/baseGame';
import { makeAttack, makeBattle, makeEnemy } from './helpers';

function battle(burning = true) {
  return makeBattle(
    makeAttack({
      type: ElementType.FIRE,
      burningTargetSplash: {
        radiusIndex: 7,
        damageRatio: 0.4,
        visualEffectConfigId: 'attack_cinder_spit_sparks',
      },
      effects: [{ type: 'BURN', chance: 0.25 }],
    }),
    {},
    {
      position: { x: 10, y: 0 },
      statusConditions: burning ? [{ type: 'BURN', durationMs: 1000 }] : [],
    }
  );
}

describe('conditional damage splash', () => {
  it('copies a fraction of the primary hit to all other enemies within the impact radius', () => {
    const { engine, source, target, attack } = battle();
    const near = makeEnemy({ id: 'near', position: { x: 11, y: 0 } });
    const edge = makeEnemy({
      id: 'edge',
      position: { x: 17, y: 0 },
      currentSpecialDefense: 999,
    });
    const outside = makeEnemy({
      id: 'outside',
      position: { x: 17.1, y: 0 },
    });
    engine.enemies.push(near, edge, outside);
    // Neither source reach nor target-specific acquisition bonuses resize splash.
    engine.towerRangeMultiplier = 0.1;
    engine.waveEnemyDefinitions.extended = {
      id: 'extended',
      level: 10,
      targetingRangeMultiplier: 10,
    };
    outside.waveEnemyDefinitionId = 'extended';
    const damageEvents: { targetEnemyId: string; damage: number }[] = [];
    engine.events.subscribe((event) => {
      if (event.type === 'ATTACK_DAMAGE_DEALT') damageEvents.push(event);
    });

    EffectProcessor.applyDamageAndEffects(engine, source, target, attack);

    const primaryDamage = target.maxHp - target.hp;
    const splashDamage = Math.max(
      1,
      Math.floor(primaryDamage * attack.burningTargetSplash!.damageRatio)
    );
    expect(near.maxHp - near.hp).toBe(splashDamage);
    expect(edge.maxHp - edge.hp).toBe(splashDamage);
    expect(outside.hp).toBe(outside.maxHp);
    expect(damageEvents).toEqual([
      {
        type: 'ATTACK_DAMAGE_DEALT',
        towerId: source.id,
        targetEnemyId: target.id,
        attackDefId: attack.id,
        damage: primaryDamage,
      },
      {
        type: 'ATTACK_DAMAGE_DEALT',
        towerId: source.id,
        targetEnemyId: near.id,
        attackDefId: attack.id,
        damage: splashDamage,
      },
      {
        type: 'ATTACK_DAMAGE_DEALT',
        towerId: source.id,
        targetEnemyId: edge.id,
        attackDefId: attack.id,
        damage: splashDamage,
      },
    ]);
    expect(near.damagedByTowerIds.has(source.id)).toBe(true);
    expect(engine.visualEffects.map((effect) => effect.targetId)).toEqual([
      target.id,
      near.id,
      edge.id,
    ]);
  });

  it('starts splashing on the attack after a successful ignition', () => {
    const { engine, source, target, attack } = battle(false);
    const near = makeEnemy({ id: 'near', position: { x: 11, y: 0 } });
    engine.enemies.push(near);
    vi.mocked(Math.random).mockReturnValue(0.1);

    EffectProcessor.applyDamageAndEffects(engine, source, target, attack);
    expect(
      target.statusConditions.some((status) => status.type === 'BURN')
    ).toBe(true);
    expect(near.hp).toBe(near.maxHp);
    EffectProcessor.applyDamageAndEffects(engine, source, target, attack);
    expect(near.hp).toBeLessThan(near.maxHp);
    expect(near.statusConditions).toEqual([]);
  });

  it('does not treat an expired burn as active', () => {
    const { engine, source, target, attack } = battle();
    target.statusConditions[0].durationMs = 0;
    const near = makeEnemy({ id: 'near', position: { x: 11, y: 0 } });
    engine.enemies.push(near);
    EffectProcessor.applyDamageAndEffects(engine, source, target, attack);
    expect(near.hp).toBe(near.maxHp);
  });

  it('applies the move type matchup to each spark recipient without transferring effects', () => {
    const { engine, source, target, attack } = battle();
    const neutral = makeEnemy({ id: 'neutral' });
    const weak = makeEnemy({ id: 'weak', elementTypes: [ElementType.GRASS] });
    const resistant = makeEnemy({
      id: 'resistant',
      elementTypes: [ElementType.WATER],
    });
    engine.enemies.push(neutral, weak, resistant);
    EffectProcessor.applyDamageAndEffects(engine, source, target, attack);
    expect(weak.maxHp - weak.hp).toBeGreaterThan(neutral.maxHp - neutral.hp);
    expect(resistant.maxHp - resistant.hp).toBeLessThan(
      neutral.maxHp - neutral.hp
    );
    expect(weak.statusConditions).toEqual([]);
  });

  it('preserves secondary type immunities for moves using the shared mechanic', () => {
    const { engine, source, target, attack } = battle();
    attack.type = ElementType.ELECTRIC;
    const immune = makeEnemy({
      id: 'immune',
      elementTypes: [ElementType.GROUND],
    });
    engine.enemies.push(immune);
    EffectProcessor.applyDamageAndEffects(engine, source, target, attack);
    expect(immune.hp).toBe(immune.maxHp);
    expect(immune.damagedByTowerIds.size).toBe(0);
  });

  it('does not chain from burning secondary targets or transfer on-hit effects', () => {
    const { engine, source, target, attack } = battle();
    attack.effects = [{ type: 'BURN', chance: 1 }];
    const secondary = makeEnemy({
      id: 'secondary',
      position: { x: 16, y: 0 },
      statusConditions: [{ type: 'BURN', durationMs: 1000 }],
    });
    const beyondPrimary = makeEnemy({
      id: 'beyond_primary',
      position: { x: 20, y: 0 },
    });
    engine.enemies.push(secondary, beyondPrimary);
    EffectProcessor.applyDamageAndEffects(engine, source, target, attack);
    expect(secondary.hp).toBeLessThan(secondary.maxHp);
    expect(secondary.statusConditions).toHaveLength(1);
    expect(beyondPrimary.hp).toBe(beyondPrimary.maxHp);
  });

  it('skips dead and airborne enemies while preserving immortal preview HP', () => {
    const { engine, source, target, attack } = battle();
    const dead = makeEnemy({ id: 'dead', hp: 0 });
    const invulnerable = makeEnemy({
      id: 'invulnerable',
      isInvulnerable: true,
    });
    const airborne = makeEnemy({ id: 'airborne' });
    airborne.laneHopState = {
      phase: 'airborne',
      elapsedMs: 0,
      targetPathIndex: 1,
      triggerProgress: 0.5,
      windupMs: 200,
      durationMs: 400,
      arcHeight: 20,
    };
    engine.enemies.push(dead, invulnerable, airborne);
    EffectProcessor.applyDamageAndEffects(engine, source, target, attack);
    expect(dead.hp).toBe(0);
    for (const enemy of [dead, airborne]) {
      expect(enemy.damagedByTowerIds.size).toBe(0);
    }
    expect(invulnerable.hp).toBe(invulnerable.maxHp);
    expect(invulnerable.damagedByTowerIds.has(source.id)).toBe(true);
    expect(airborne.hp).toBe(airborne.maxHp);
  });

  it('requires a damaging primary hit and splashes only once during a multi-hit attack', () => {
    const { engine, source, target, attack } = battle();
    const near = makeEnemy({ id: 'near' });
    engine.enemies.push(near);
    attack.power = 0;
    EffectProcessor.applyDamageAndEffects(engine, source, target, attack);
    expect(near.hp).toBe(near.maxHp);
    attack.power = 40;
    attack.effects = [{ type: 'MULTI_HIT', chance: 1, value: 3 }];
    const hits = vi.fn();
    engine.events.subscribe((event) => {
      if (event.type === 'ATTACK_DAMAGE_DEALT') hits(event);
    });
    EffectProcessor.applyDamageAndEffects(engine, source, target, attack);
    expect(
      hits.mock.calls.filter(([event]) => event.targetEnemyId === near.id)
    ).toHaveLength(1);
  });

  it('shows splash damage and sparks in the lab without draining immortal targets', () => {
    const { engine, source, target, attack } = battle();
    target.isInvulnerable = true;
    const near = makeEnemy({ id: 'near', isInvulnerable: true });
    engine.enemies.push(near);
    EffectProcessor.applyDamageAndEffects(engine, source, target, attack);
    expect(target.hp).toBe(target.maxHp);
    expect(near.hp).toBe(near.maxHp);
    expect(engine.floatingTexts).toHaveLength(2);
    expect(engine.visualEffects.map((effect) => effect.targetId)).toEqual([
      target.id,
      near.id,
    ]);
  });

  it('uses the full resolved hit on a primary knockout and credits secondary defeats once', () => {
    const { engine, source, target, attack } = battle();
    target.hp = 1;
    const near = makeEnemy({ id: 'near', hp: 1 });
    engine.enemies.push(near);
    const defeat = vi.fn();
    engine.events.subscribe((event) => {
      if (event.type === 'ENEMY_DIED') defeat(event);
    });
    EffectProcessor.applyDamageAndEffects(engine, source, target, attack);
    expect(target.hp).toBeLessThanOrEqual(0);
    expect(near.hp).toBeLessThanOrEqual(0);
    expect(defeat).toHaveBeenCalledWith(
      expect.objectContaining({
        enemyId: near.id,
        participantTowerIds: [source.id],
      })
    );
    engine.emitEnemyDefeated(near, source);
    expect(defeat).toHaveBeenCalledTimes(1);
  });
});
