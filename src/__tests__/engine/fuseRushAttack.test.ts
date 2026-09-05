import { afterEach, describe, expect, it, vi } from 'vitest';
import { STARTER_IGUANA, VELOCINDER } from '@/constants/creatures';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { EffectProcessor } from '@/engine/tower-defense/attacks/EffectProcessor';
import { ProjectileBehavior } from '@/engine/tower-defense/attacks/behaviors';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { ElementType } from '@/types/baseGame';

const engines: TowerDefenseEngine[] = [];
const move = ATTACK_DEFS.FUSE_RUSH;
afterEach(() => {
  engines.splice(0).forEach((engine) => engine.destroy());
  vi.restoreAllMocks();
});

function battle() {
  vi.spyOn(Math, 'random').mockReturnValue(0.99);
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
    ['first', 'second'].map((id) => ({
      id,
      speciesId: 'velocinder',
      level: 16,
      xp: 0,
      equippedAttacks: ['FUSE_RUSH', 'SCRATCH'],
      isShiny: false,
    }))
  );
  engines.push(engine);
  engine.placeTower('first', 40, 50);
  engine.placeTower('second', 41, 50);
  const [first, second] = engine.towers;
  for (const tower of engine.towers) {
    tower.currentAttack = 50;
    tower.currentSpecialAttack = 5;
    // These tests explicitly launch hits, avoiding automatic attacks.
    tower.equippedAttacksRuntime.forEach(
      (attack) => (attack.lastFiredTime = 1e12)
    );
  }
  const target = engine.spawnPreviewEnemy({
    id: 'target',
    creatureId: 'mouse_1',
    level: 16,
    position: { x: 45, y: 50 },
  })!;
  target.hp = target.maxHp = 5000;
  target.currentDefense = 40;
  target.currentSpecialDefense = 200;
  target.speed = 0;
  return { engine, first, second, target };
}

describe('Hot Streak', () => {
  it('is Velocinder’s physical Fire evolution move, replacing the stage-two placeholder', () => {
    expect(VELOCINDER.learnableAttacks).toContainEqual({
      level: 16,
      attackId: 'FUSE_RUSH',
    });
    expect(
      VELOCINDER.learnableAttacks?.some(
        (move) => move.attackId === 'QUICK_ATTACK'
      )
    ).toBe(false);
    expect(
      STARTER_IGUANA.learnableAttacks?.some(
        (move) => move.attackId === 'FUSE_RUSH'
      )
    ).toBe(false);
    expect(move).toMatchObject({
      type: ElementType.FIRE,
      category: 'physical',
      power: 45,
      name: 'Hot Streak',
      cooldownMs: 600,
      behaviorType: 'PROJECTILE',
      isDashAttack: true,
      dashTrailType: 'FIRE',
      fuseRushCombo: { hitsToTrigger: 3, damageMultiplier: 2 },
    });
    expect(move.effects).toBeUndefined();
    expect(move.adaptiveTargetedAoe).toBeUndefined();
  });

  it('cycles one, two, detonation, one and doubles resolved damage without AOE or statuses', () => {
    const { engine, first, target } = battle();
    const nearby = engine.spawnPreviewEnemy({
      creatureId: 'mouse_1',
      level: 16,
      position: { x: 46, y: 50 },
    })!;
    const nearbyHp = nearby.hp;
    const damages: number[] = [];
    for (const marks of [1, 2, 0, 1]) {
      const hp = target.hp;
      EffectProcessor.applyDamageAndEffects(engine, first, target, move);
      damages.push(hp - target.hp);
      expect(target.fuseRushMarks).toBe(marks);
    }
    // Physical Fire STAB, level 16, 45 power, 50 Attack / 40 Defense.
    expect(damages).toEqual([16, 16, 32, 16]);
    expect(nearby.hp).toBe(nearbyHp);
    expect(nearby.fuseRushMarks).toBeUndefined();
    expect(target.statusConditions).toEqual([]);
    expect(engine.visualEffects.map((vfx) => vfx.configId)).toEqual([
      'attack_fuse_rush_hit',
      'attack_fuse_rush_hit',
      'attack_fuse_rush_detonation',
      'attack_fuse_rush_hit',
    ]);
  });

  it('shares marks and uses the finishing tower’s Attack rather than the setup tower’s', () => {
    const { engine, first, second, target } = battle();
    EffectProcessor.applyDamageAndEffects(engine, first, target, move);
    EffectProcessor.applyDamageAndEffects(engine, first, target, move);
    second.currentAttack = 100;
    const hp = target.hp;
    EffectProcessor.applyDamageAndEffects(engine, second, target, move);
    const finisher = hp - target.hp;
    const afterFinisher = target.hp;
    EffectProcessor.applyDamageAndEffects(engine, second, target, move);
    expect(finisher).toBe((afterFinisher - target.hp) * 2);
    expect(finisher).toBeGreaterThan(32);
    expect(target.damagedByTowerIds).toEqual(new Set([first.id, second.id]));
  });

  it('keeps enemy-specific marks through time, attack swaps, and tower repositioning', () => {
    const { engine, first, target } = battle();
    EffectProcessor.applyDamageAndEffects(engine, first, target, move);
    EffectProcessor.applyDamageAndEffects(engine, first, target, move);
    engine.setTowerAttack('first', 1);
    EffectProcessor.applyDamageAndEffects(
      engine,
      first,
      target,
      ATTACK_DEFS.SCRATCH
    );
    engine.placeTower('first', 5, 5);
    engine.tick(0, 600000);
    expect(engine.enemies[0].fuseRushMarks).toBe(2);
    engine.placeTower('first', 40, 50);
    engine.setTowerAttack('first', 0);
    ProjectileBehavior.execute(engine, first, move);
    engine.tick(0, 100);
    expect(engine.enemies[0].fuseRushMarks).toBe(0);
    expect(
      engine.visualEffects.some(
        (effect) => effect.configId === 'attack_fuse_rush_detonation'
      )
    ).toBe(true);
  });

  it('counts successful projectile impacts, including shared hits in the same tick, not launches', () => {
    const { engine, first, second, target } = battle();
    ProjectileBehavior.execute(engine, first, move);
    ProjectileBehavior.execute(engine, second, move);
    ProjectileBehavior.execute(engine, first, move);
    expect(target.fuseRushMarks).toBeUndefined();
    engine.tick(0, 100);
    expect(engine.enemies[0].hp).toBe(5000 - 64);
    expect(engine.enemies[0].fuseRushMarks).toBe(0);
    expect(engine.projectiles).toHaveLength(0);
    expect(
      engine.visualEffects.filter(
        (vfx) => vfx.configId === 'attack_fuse_rush_detonation'
      )
    ).toHaveLength(1);
  });

  it('keeps existing targeting modes even when another enemy is ready to detonate', () => {
    const { engine, first, target } = battle();
    const marked = engine.spawnPreviewEnemy({
      id: 'marked',
      creatureId: 'mouse_1',
      level: 16,
      position: { x: 60, y: 50 },
    })!;
    marked.fuseRushMarks = 2;
    marked.hp = marked.maxHp * 0.2;
    first.targetingMode = 'closest';
    ProjectileBehavior.execute(engine, first, move);
    expect(engine.projectiles.at(-1)?.targetId).toBe(target.id);
    first.targetingMode = 'lowest-hp-percent';
    ProjectileBehavior.execute(engine, first, move);
    expect(engine.projectiles.at(-1)?.targetId).toBe(marked.id);
    expect(marked.fuseRushMarks).toBe(2);
    expect(target.fuseRushMarks).toBeUndefined();
  });

  it('does not build marks on dead targets or when a projectile loses its target', () => {
    const { engine, first, target } = battle();
    target.hp = 1;
    EffectProcessor.applyDamageAndEffects(engine, first, target, move);
    expect(target.fuseRushMarks).toBeUndefined();
    const effectCount = engine.visualEffects.length;
    EffectProcessor.applyDamageAndEffects(engine, first, target, move);
    expect(engine.visualEffects).toHaveLength(effectCount);
    target.hp = 100;
    ProjectileBehavior.execute(engine, first, move);
    engine.enemies = [];
    engine.tick(0, 100);
    expect(target.fuseRushMarks).toBeUndefined();
  });

  it('shows the full combo on immortal attack-lab targets without depleting HP', () => {
    const { engine, first, target } = battle();
    target.isInvulnerable = true;
    for (let i = 0; i < 3; i += 1)
      EffectProcessor.applyDamageAndEffects(engine, first, target, move);
    expect(target.hp).toBe(target.maxHp);
    expect(target.fuseRushMarks).toBe(0);
    expect(engine.visualEffects.at(-1)?.configId).toBe(
      'attack_fuse_rush_detonation'
    );
  });
});
