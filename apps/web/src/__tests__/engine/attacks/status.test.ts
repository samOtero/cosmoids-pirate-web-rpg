import { describe, expect, it, vi } from 'vitest';
import { ProjectileBehavior } from '@/engine/tower-defense/attacks/behaviors';
import { EffectProcessor } from '@/engine/tower-defense/attacks/EffectProcessor';
import { getActiveSpeedMultiplier } from '@/engine/tower-defense/speedModifiers';
import { makeAttack, makeBattle, makeEnemy } from './helpers';

describe('Shared on-hit effects', () => {
  it.each([
    { roll: 0.24, applies: true },
    { roll: 0.26, applies: false },
  ])(
    'uses the configured status chance independently of damage (roll $roll)',
    ({ roll, applies }) => {
      vi.spyOn(Math, 'random').mockReturnValue(roll);
      const attack = makeAttack({
        effects: [{ type: 'STUN', chance: 0.25, value: 700 }],
      });
      const { engine, source, target } = makeBattle(attack);
      ProjectileBehavior.execute(engine, source, attack);
      engine.tick(1000, 1000);
      expect(target.hp).toBeLessThan(target.maxHp);
      expect(target.statusConditions).toEqual(
        applies ? [{ type: 'STUN', durationMs: 700 }] : []
      );
    }
  );

  it('stun stops movement for its configured duration and then releases the enemy', () => {
    const attack = makeAttack({
      effects: [{ type: 'STUN', chance: 1, value: 700 }],
    });
    const { engine, source, target } = makeBattle(attack);
    ProjectileBehavior.execute(engine, source, attack);
    engine.tick(1000, 1000);
    target.speed = 1;
    const position = { ...target.position };
    engine.tick(1699, 699);
    expect(target.position).toEqual(position);
    expect(target.statusConditions).toEqual([{ type: 'STUN', durationMs: 1 }]);
    engine.tick(1700, 1);
    expect(target.statusConditions).toHaveLength(0);
    engine.tick(1716, 16);
    expect(target.position.x).toBeGreaterThan(position.x);
  });

  it('status immunity prevents the effect while allowing direct damage', () => {
    const attack = makeAttack({
      effects: [{ type: 'STUN', chance: 1, value: 700 }],
    });
    const { engine, source, target } = makeBattle(
      attack,
      {},
      { immuneToStatusEffects: true }
    );
    ProjectileBehavior.execute(engine, source, attack);
    engine.tick(1000, 1000);
    expect(target.hp).toBeLessThan(target.maxHp);
    expect(target.statusConditions).toHaveLength(0);
  });

  it('a zero-power move applies its effect and credits participation without damage', () => {
    const attack = makeAttack({
      power: 0,
      effects: [{ type: 'SPEED_SLOW', chance: 1, value: 0.5 }],
    });
    const { engine, source, target } = makeBattle(attack);
    const hit = vi.fn();
    engine.events.subscribe((event) => {
      if (event.type === 'ATTACK_DAMAGE_DEALT') hit(event);
    });
    EffectProcessor.applyDamageAndEffects(engine, source, target, attack);
    expect(target.hp).toBe(target.maxHp);
    expect(hit).not.toHaveBeenCalled();
    expect(getActiveSpeedMultiplier(target, 1_000_000)).toBe(0.5);
    expect(target.damagedByTowerIds).toEqual(new Set([source.id]));
    engine.events.emit({
      type: 'ENEMY_DIED',
      enemyId: target.id,
      enemyDefinitionId: target.definitionId,
      enemyLevel: target.level,
      participantTowerIds: [...target.damagedByTowerIds],
    });
    expect(source.creature.xp).toBeGreaterThan(0);
  });

  it('a slow projectile skips already slowed or speed-boosted targets and waits when none qualify', () => {
    const attack = makeAttack({
      power: 0,
      effects: [{ type: 'SPEED_SLOW', chance: 1, value: 0.5 }],
    });
    const { engine, source, target } = makeBattle(attack);
    target.speedSlowMultiplier = 0.5;
    const boosted = makeEnemy({
      id: 'boosted',
      position: { x: 12, y: 0 },
      speedBoostMultiplier: 2,
      speedBoostUntilMs: 5000,
    });
    const eligible = makeEnemy({ id: 'eligible', position: { x: 15, y: 0 } });
    engine.enemies = [target, boosted, eligible];
    ProjectileBehavior.execute(engine, source, attack);
    expect(engine.projectiles[0].targetId).toBe(eligible.id);
    eligible.speedSlowMultiplier = 0.5;
    engine.projectiles = [];
    expect(ProjectileBehavior.canExecute(engine, source, attack)).toBe(false);
    ProjectileBehavior.execute(engine, source, attack);
    expect(engine.projectiles).toHaveLength(0);
  });
});
