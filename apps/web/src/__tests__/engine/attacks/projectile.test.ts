import { describe, expect, it, vi } from 'vitest';
import { ProjectileBehavior } from '@/engine/tower-defense/attacks/behaviors';
import { makeAttack, makeBattle, makeEnemy } from './helpers';

describe('Shared projectile behavior', () => {
  it('deals no damage before impact, hits once, and disappears after impact', () => {
    const { engine, source, target, attack } = makeBattle();
    const hit = vi.fn();
    engine.events.subscribe((event) => {
      if (event.type === 'ATTACK_DAMAGE_DEALT') hit(event);
    });
    const origin = { ...source.position };
    ProjectileBehavior.execute(engine, source, attack);
    expect(target.hp).toBe(target.maxHp);
    expect(engine.projectiles).toHaveLength(1);
    engine.tick(1, 1);
    expect(target.hp).toBe(target.maxHp);
    engine.tick(1001, 1000);
    expect(target.hp).toBeLessThan(target.maxHp);
    expect(hit).toHaveBeenCalledTimes(1);
    expect(engine.projectiles).toHaveLength(0);
    expect(source.position).toEqual(origin);
    engine.tick(2001, 1000);
    expect(hit).toHaveBeenCalledTimes(1);
  });

  it.each([1, 3, 7])(
    'cosmetic trails do not multiply damage or effect rolls (%i segments)',
    (count) => {
      const attack = makeAttack({
        effects: [{ type: 'STUN', chance: 1, value: 800 }],
        projectilePattern: {
          count,
          spacing: 2,
          scales: Array.from({ length: count }, (_, i) => 1 / (i + 1)),
          damageMode: 'FIRST_ONLY',
        },
      });
      const { engine, source, target } = makeBattle(attack);
      const hit = vi.fn();
      engine.events.subscribe((event) => {
        if (event.type === 'ATTACK_DAMAGE_DEALT') hit(event);
      });
      ProjectileBehavior.execute(engine, source, attack);
      expect(engine.projectiles).toHaveLength(count);
      expect(
        engine.projectiles.filter((projectile) => projectile.dealsDamage)
      ).toHaveLength(1);
      engine.tick(1000, 1000);
      expect(target.statusConditions).toEqual([
        { type: 'STUN', durationMs: 800 },
      ]);
      engine.tick(2000, 1000);
      expect(hit).toHaveBeenCalledTimes(1);
      expect(engine.projectiles).toHaveLength(0);
      expect(target.damagedByTowerIds).toEqual(new Set([source.id]));
    }
  );

  it('a damaging multi-projectile pattern resolves each configured hit', () => {
    const attack = makeAttack({
      projectilePattern: {
        count: 3,
        spacing: 2,
        scales: [1, 1, 1],
        damageMode: 'EACH',
      },
    });
    const { engine, source } = makeBattle(attack);
    const hit = vi.fn();
    engine.events.subscribe((event) => {
      if (event.type === 'ATTACK_DAMAGE_DEALT') hit(event);
    });
    ProjectileBehavior.execute(engine, source, attack);
    engine.tick(1000, 1000);
    expect(hit).toHaveBeenCalledTimes(3);
  });

  it.each(['dead', 'out of range'] as const)(
    'does not activate against a target that is %s',
    (reason) => {
      const { engine, source, target, attack } = makeBattle();
      if (reason === 'dead') target.hp = 0;
      if (reason === 'out of range') target.position.x = 80;
      expect(ProjectileBehavior.canExecute(engine, source, attack)).toBe(false);
      ProjectileBehavior.execute(engine, source, attack);
      expect(engine.projectiles).toHaveLength(0);
      expect(engine.visualEffects).toHaveLength(0);
    }
  );

  it('expires without damaging a target removed while the projectile is in flight', () => {
    const { engine, source, target, attack } = makeBattle();
    const hit = vi.fn();
    engine.events.subscribe((event) => {
      if (event.type === 'ATTACK_DAMAGE_DEALT') hit(event);
    });
    ProjectileBehavior.execute(engine, source, attack);
    engine.enemies = [];
    engine.tick(1000, 1000);
    expect(target.hp).toBe(target.maxHp);
    expect(hit).not.toHaveBeenCalled();
    expect(engine.projectiles).toHaveLength(0);
  });

  it.each([
    ['right', 10, 0],
    ['left', -10, 0],
    ['up', 0, -10],
    ['down', 0, 10],
  ] as const)(
    'faces %s and anchors launch effects to the caster',
    (facing, x, y) => {
      const attack = makeAttack({
        launchVisualEffectConfigId: 'attack_static_yip_launch_1',
      });
      const { engine, source, target } = makeBattle(
        attack,
        {},
        { position: { x, y } }
      );
      ProjectileBehavior.execute(engine, source, attack);
      expect(source.facingDirection).toBe(facing);
      expect(engine.projectiles[0]).toMatchObject({
        origin: source.position,
        launchFacingDirection: facing,
        targetId: target.id,
      });
      expect(engine.visualEffects[0]).toMatchObject({
        configId: attack.launchVisualEffectConfigId,
        targetId: source.id,
        position: source.position,
        facingDirection: facing,
      });
    }
  );

  it('follows the selected targeting mode rather than the enemy array order', () => {
    const { engine, source, target, attack } = makeBattle();
    const closest = makeEnemy({ id: 'closest', position: { x: 5, y: 0 } });
    engine.enemies = [target, closest];
    ProjectileBehavior.execute(engine, source, attack);
    expect(engine.projectiles[0].targetId).toBe(closest.id);
  });
});
