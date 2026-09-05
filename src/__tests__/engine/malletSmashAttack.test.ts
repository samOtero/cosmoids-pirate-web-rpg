import { afterEach, describe, expect, it, vi } from 'vitest';

import { CARAPENTER } from '@/constants/creatures';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
import { AdaptiveTargetedAoeBehavior } from '@/engine/tower-defense/attacks/behaviors';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { getActiveSpeedMultiplier } from '@/engine/tower-defense/speedModifiers';
import { ElementType } from '@/types/baseGame';

afterEach(() => vi.restoreAllMocks());

const hammerAnimation = CREATURE_TD_CONFIGS.attack_mallet_smash_1.default.vfxAnimation!;
const contactMs = hammerAnimation.durationMs! * hammerAnimation.impactProgress!;

function createBattle() {
  const engine = new TowerDefenseEngine(
    {
      paths: [
        [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
        ],
      ],
      placementSpots: [],
      waves: [],
    },
    [
      {
        id: 'carapenter',
        speciesId: 'carapenter',
        level: 16,
        xp: 0,
        equippedAttacks: ['MALLET_SMASH'],
        isShiny: false,
      },
    ]
  );
  engine.placeTower('carapenter', 0, 0);
  const tower = engine.towers[0];
  tower.currentAttack = 50;
  tower.targetingMode = 'closest';
  return { engine, tower };
}

function addTarget(engine: TowerDefenseEngine, id: string, x: number) {
  const target = engine.spawnPreviewEnemy({
    id,
    creatureId: 'senticle',
    level: 16,
    position: { x, y: 0 },
  })!;
  target.hp = target.maxHp = 500;
  target.currentDefense = 40;
  return target;
}

describe('Mallet Smash', () => {
  it('replaces Carapenter\'s placeholder move as its level-16 evolution attack', () => {
    expect(CARAPENTER.learnableAttacks).toContainEqual({
      level: 16,
      attackId: 'MALLET_SMASH',
    });
    expect(CARAPENTER.learnableAttacks).not.toContainEqual({
      level: 12,
      attackId: 'VINE_WHIP',
    });
    expect(ATTACK_DEFS.MALLET_SMASH).toMatchObject({
      type: ElementType.GRASS,
      category: 'physical',
      power: 50,
      cooldownMs: 1200,
      projectileSpeed: 1,
      behaviorType: 'ADAPTIVE_TARGETED_AOE',
      effects: [{ type: 'SPEED_SLOW', chance: 0.3, value: 0.8 }],
      adaptiveTargetedAoe: {
        radiusIndex: 12,
        singleTargetPower: 75,
        singleTargetEffects: [
          { type: 'SPEED_SLOW', chance: 1, value: 0.5 },
        ],
      },
      visualEffectConfigId: 'attack_mallet_smash_1',
      isDashAttack: true,
      dashImpactHoldMs: 520,
    });
  });

  it('stops short, keeps the hammer on the target, and deals damage exactly at contact', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const { engine, tower } = createBattle();
    const target = addTarget(engine, 'isolated', 30);
    try {
      AdaptiveTargetedAoeBehavior.execute(engine, tower, ATTACK_DEFS.MALLET_SMASH);
      engine.tick(0, 100);
      expect(engine.projectiles[0].position.x).toBeGreaterThan(0);
      expect(engine.projectiles[0].position.x).toBeLessThan(14);
      expect(engine.visualEffects).toHaveLength(0);
      expect(target.hp).toBe(target.maxHp);

      engine.tick(0, 150);
      const dash = engine.projectiles[0];
      expect(dash).toMatchObject({
        position: { x: 14, y: 0 },
        hasImpacted: true,
        impactHoldDurationMs: 520,
      });
      expect(engine.visualEffects).toHaveLength(1);
      const hammer = engine.visualEffects[0];
      expect(hammer).toMatchObject({
        configId: 'attack_mallet_smash_1',
        position: { x: 30, y: 0 },
        targetId: target.id,
      });
      expect(hammer.elapsedMs).toBe(dash.impactElapsedMs);
      expect(target.hp).toBe(target.maxHp);
      expect(getActiveSpeedMultiplier(target, 1_000_000)).toBe(1);

      engine.tick(0, contactMs - dash.impactElapsedMs! - 1);
      expect(target.hp).toBe(target.maxHp);
      expect(hammer.elapsedMs).toBeCloseTo(contactMs - 1);
      engine.tick(0, 1);
      expect(target.hp).toBeLessThan(target.maxHp);
      expect(getActiveSpeedMultiplier(target, 1_000_000)).toBe(0.5);
      expect(hammer.elapsedMs).toBeCloseTo(contactMs);
      expect(engine.visualEffects).toHaveLength(1);
      const hpAfterContact = target.hp;

      engine.tick(0, 519 - dash.impactElapsedMs!);
      expect(engine.projectiles).toHaveLength(1);
      expect(target.hp).toBe(hpAfterContact);
      engine.tick(0, 2);
      expect(engine.projectiles).toHaveLength(0);
      expect(engine.visualEffects).toHaveLength(0);
      expect(target.hp).toBe(hpAfterContact);
    } finally {
      engine.destroy();
    }
  });

  it.each([
    { x: 30, y: 0, aspect: 1 },
    { x: -30, y: 0, aspect: 1 },
    { x: 0, y: 30, aspect: 1 },
    { x: 0, y: -30, aspect: 1 },
    { x: 15, y: 10, aspect: 16 / 9 },
  ])('keeps a consistent gap on approach to $x, $y at aspect $aspect', ({ x, y, aspect }) => {
    const { engine, tower } = createBattle();
    engine.setAspectRatio(aspect);
    const target = addTarget(engine, 'target', x);
    target.position.y = y;
    try {
      AdaptiveTargetedAoeBehavior.execute(engine, tower, ATTACK_DEFS.MALLET_SMASH);
      engine.tick(0, 250);
      const dash = engine.projectiles[0];
      expect(dash.hasImpacted).toBe(true);
      expect(engine.getAttackDistance(dash.position, target.position)).toBeCloseTo(16);
      target.position.x += 2;
      target.position.y += 1;
      engine.tick(0, 16);
      expect(engine.getAttackDistance(dash.position, target.position)).toBeCloseTo(16);
      expect(engine.visualEffects[0].position).toEqual(target.position);
    } finally {
      engine.destroy();
    }
  });

  it('does not dash past or back away from an already nearby enemy', () => {
    const { engine, tower } = createBattle();
    addTarget(engine, 'nearby', 10);
    try {
      AdaptiveTargetedAoeBehavior.execute(engine, tower, ATTACK_DEFS.MALLET_SMASH);
      engine.tick(0, 16);
      expect(engine.projectiles[0].position).toEqual(tower.position);
    } finally {
      engine.destroy();
    }
  });

  it('does not damage a removed target or restart its animation at contact', () => {
    const { engine, tower } = createBattle();
    const target = addTarget(engine, 'removed', 10);
    try {
      AdaptiveTargetedAoeBehavior.execute(engine, tower, ATTACK_DEFS.MALLET_SMASH);
      engine.tick(0, 16);
      engine.enemies = [];
      engine.tick(0, 400);
      expect(target.hp).toBe(target.maxHp);
      expect(engine.visualEffects).toHaveLength(1);
      engine.tick(0, 400);
      expect(engine.projectiles).toHaveLength(0);
      expect(engine.visualEffects).toHaveLength(0);
    } finally {
      engine.destroy();
    }
  });

  it('damages nearby enemies and applies the lighter crowd slow independently', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { engine, tower } = createBattle();
    const primary = addTarget(engine, 'primary', 10);
    const nearby = addTarget(engine, 'nearby', 14);
    const distant = addTarget(engine, 'distant', 30);
    try {
      AdaptiveTargetedAoeBehavior.execute(
        engine,
        tower,
        ATTACK_DEFS.MALLET_SMASH
      );
      engine.tick(0, 400);

      expect(primary.hp).toBeLessThan(primary.maxHp);
      expect(nearby.hp).toBeLessThan(nearby.maxHp);
      expect(distant.hp).toBe(distant.maxHp);
      expect(getActiveSpeedMultiplier(primary, 1_000_000)).toBe(0.8);
      expect(getActiveSpeedMultiplier(nearby, 1_000_000)).toBe(0.8);
      expect(getActiveSpeedMultiplier(distant, 1_000_000)).toBe(1);
    } finally {
      engine.destroy();
    }
  });

  it('uses more power against one target than against each member of a crowd', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const singleBattle = createBattle();
    const singleTarget = addTarget(singleBattle.engine, 'single', 10);
    const crowdBattle = createBattle();
    const crowdTarget = addTarget(crowdBattle.engine, 'crowd_primary', 10);
    addTarget(crowdBattle.engine, 'crowd_secondary', 14);
    try {
      AdaptiveTargetedAoeBehavior.execute(
        singleBattle.engine,
        singleBattle.tower,
        ATTACK_DEFS.MALLET_SMASH
      );
      AdaptiveTargetedAoeBehavior.execute(
        crowdBattle.engine,
        crowdBattle.tower,
        ATTACK_DEFS.MALLET_SMASH
      );
      singleBattle.engine.tick(0, 400);
      crowdBattle.engine.tick(0, 400);

      expect(500 - singleTarget.hp).toBeGreaterThan(500 - crowdTarget.hp);
    } finally {
      singleBattle.engine.destroy();
      crowdBattle.engine.destroy();
    }
  });
});
