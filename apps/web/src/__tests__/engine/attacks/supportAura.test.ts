import { afterEach, describe, expect, it, vi } from 'vitest';

import { ATTACK_FIXTURES, installAttackFixtures } from './fixtures';
import {
  ProjectileBehavior,
  SupportAuraBehavior,
} from '@/engine/tower-defense/attacks/behaviors';
import {
  getAttackSpeedMultiplier,
  applyAttackSpeedBuff,
} from '@/engine/tower-defense/attackSpeedModifiers';
import { getActiveSpeedMultiplier } from '@/engine/tower-defense/speedModifiers';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';

installAttackFixtures();

const engines: TowerDefenseEngine[] = [];
afterEach(() => {
  engines.forEach((engine) => engine.destroy());
  engines.length = 0;
  vi.restoreAllMocks();
});

function createEngine(withTarget = true, level = 14) {
  const engine = new TowerDefenseEngine(
    {
      paths: [
        [
          { x: 0, y: 50 },
          { x: 100, y: 50 },
        ],
      ],
      placementSpots: [],
      waves: [],
    },
    ['caster', 'near', 'boundary', 'far', 'dead'].map((id) => ({
      id,
      speciesId: 'sonarion',
      level,
      xp: 0,
      equippedAttacks: ['RALLY_HOWL', 'STATIC_YIP'],
      isShiny: false,
    }))
  );
  engines.push(engine);
  for (const [id, x, y] of [
    ['caster', 40, 50],
    ['near', 50, 50],
    ['boundary', 40, 90],
    ['far', 40, 90.01],
    ['dead', 45, 50],
  ] as const) {
    engine.placeTower(id, x, y);
  }
  engine.towers.find((tower) => tower.creature.id === 'dead')!.hp = 0;
  if (withTarget)
    engine.spawnPreviewEnemy({
      id: 'target',
      creatureId: 'mouse_1',
      level: 14,
      position: { x: 58, y: 50 },
      isInvulnerable: true,
    });
  return engine;
}

describe('Support aura and simulation cooldowns', () => {
  it('buffs self and every living teammate regardless of distance, without damage or movement changes', () => {
    const engine = createEngine();
    const [caster, near, boundary, far, dead] = engine.towers;
    near.speedSlowMultiplier = 0.5;
    const damage = vi.fn();
    engine.events.subscribe((event) => {
      if (event.type === 'ATTACK_DAMAGE_DEALT') damage(event);
    });
    SupportAuraBehavior.execute(engine, caster, ATTACK_FIXTURES.RALLY_HOWL);
    for (const recipient of [caster, near, boundary, far])
      expect(getAttackSpeedMultiplier(recipient, 0)).toBe(1.2);
    expect(dead.attackSpeedBuff).toBeUndefined();
    expect(getActiveSpeedMultiplier(near, 0)).toBe(0.5);
    expect(getActiveSpeedMultiplier(caster, 0)).toBe(1);
    expect(engine.enemies[0]).not.toHaveProperty('attackSpeedBuff');
    expect(engine.projectiles).toHaveLength(0);
    expect(damage).not.toHaveBeenCalled();
    expect(engine.visualEffects).toHaveLength(1);
    expect(engine.visualEffects[0]).toMatchObject({
      configId: 'attack_rally_howl_1',
      rangeIndex: 40,
      durationMs: 800,
    });
  });

  it('expires exactly after fifteen seconds, with 20% faster cadence rather than 20% less cooldown', () => {
    const engine = createEngine();
    const caster = engine.towers[0];
    SupportAuraBehavior.execute(engine, caster, ATTACK_FIXTURES.RALLY_HOWL);
    expect(800 / getAttackSpeedMultiplier(caster, 14999)).toBeCloseTo(666.6667);
    expect(getAttackSpeedMultiplier(caster, 15000)).toBe(1);
  });

  it('refreshes from another howl without stacking the multiplier or duration', () => {
    const engine = createEngine();
    const [caster, near] = engine.towers;
    SupportAuraBehavior.execute(engine, caster, ATTACK_FIXTURES.RALLY_HOWL);
    engine.elapsedTimeMs = 2000;
    SupportAuraBehavior.execute(engine, near, ATTACK_FIXTURES.RALLY_HOWL);
    expect(caster.attackSpeedBuff).toEqual({
      multiplier: 1.2,
      appliedAtMs: 2000,
      expiresAtMs: 17000,
    });
    expect(near.attackSpeedBuff?.multiplier).toBe(1.2);
  });

  it('snapshots global recipients: repositioning or losing the caster does not remove the buff', () => {
    const engine = createEngine();
    const [caster, near, , far] = engine.towers;
    SupportAuraBehavior.execute(engine, caster, ATTACK_FIXTURES.RALLY_HOWL);
    near.position = { x: 95, y: 95 };
    far.position = { x: 40, y: 50 };
    engine.towers = engine.towers.filter((tower) => tower !== caster);
    expect(getAttackSpeedMultiplier(near, 3000)).toBe(1.2);
    expect(getAttackSpeedMultiplier(far, 3000)).toBe(1.2);
  });

  it('waits for combat and is immediately ready for the opening howl', () => {
    const engine = createEngine(false);
    engine.towers = [engine.towers[0]];
    engine.tick(1, 1);
    expect(engine.towers[0].attackSpeedBuff).toBeUndefined();
    expect(
      engine.towers[0].equippedAttacksRuntime[0].readyAtMs
    ).toBeUndefined();
    engine.spawnPreviewEnemy({
      id: 'distant-target',
      creatureId: 'mouse_1',
      level: 1,
      position: { x: 90, y: 50 },
      isInvulnerable: true,
    });
    engine.tick(2, 1);
    expect(engine.towers[0].attackSpeedBuff?.expiresAtMs).toBe(15002);
    expect(engine.towers[0].equippedAttacksRuntime[0].readyAtMs).toBe(20002);
  });

  it('preserves the buff and the full cooldown when swapping away and back', () => {
    const engine = createEngine();
    engine.towers = [engine.towers[0]];
    const caster = engine.towers[0];
    engine.tick(1, 1);
    const buff = caster.attackSpeedBuff;
    const howlRuntime = caster.equippedAttacksRuntime[0];
    const shot = vi.spyOn(ProjectileBehavior, 'execute');
    engine.setTowerAttack('caster', 1);
    engine.tick(667, 666);
    expect(shot).toHaveBeenCalledTimes(1);
    expect(caster.attackSpeedBuff).toBe(buff);
    engine.setTowerAttack('caster', 0);
    engine.tick(1000, 333);
    expect(caster.equippedAttacksRuntime[0]).toBe(howlRuntime);
    expect(howlRuntime.readyAtMs).toBe(20001);
    expect(caster.attackSpeedBuff).toBe(buff);
    engine.tick(20000, 19000);
    expect(howlRuntime.readyAtMs).toBe(20001);
    engine.tick(20001, 1);
    expect(howlRuntime.readyAtMs).toBe(40001);
    expect(caster.attackSpeedBuff?.expiresAtMs).toBe(35001);
  });

  it('does not shorten the support cooldown with attack speed or wall-clock jumps', () => {
    const engine = createEngine();
    engine.towers = [engine.towers[0]];
    const caster = engine.towers[0];
    engine.tick(1, 1);
    applyAttackSpeedBuff(caster, 2, 20000, engine.elapsedTimeMs);
    engine.tick(1_000_000, 16);
    expect(caster.equippedAttacksRuntime[0].readyAtMs).toBe(20001);
    engine.tick(1_000_001, 19983);
    expect(caster.equippedAttacksRuntime[0].readyAtMs).toBe(20001);
  });

  it('returns damaging attacks to their ordinary cadence after the buff expires', () => {
    const engine = createEngine();
    engine.towers = [engine.towers[0]];
    const caster = engine.towers[0];
    engine.tick(1, 1);
    engine.setTowerAttack('caster', 1);
    caster.equippedAttacksRuntime[1].lastFiredTime = 14301;
    const shot = vi.spyOn(ProjectileBehavior, 'execute');
    engine.tick(15001, 15000);
    expect(shot).not.toHaveBeenCalled();
    engine.tick(15102, 101);
    expect(shot).toHaveBeenCalledTimes(1);
  });
});
