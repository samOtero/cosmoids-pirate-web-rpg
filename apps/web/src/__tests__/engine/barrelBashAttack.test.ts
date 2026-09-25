import { afterEach, describe, expect, it, vi } from 'vitest';

import { MACASK, STARTER_MONKEY } from '@/constants/creatures';
import { ProjectileBehavior } from '@/engine/tower-defense/attacks/behaviors';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import type { Enemy, Tower } from '@/engine/tower-defense/types';
import { ElementType } from '@/types/baseGame';

const levelData = {
  paths: [
    [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ],
  ],
  placementSpots: [],
  waves: [{ id: 'empty', groups: [] }],
};

const createMonkegTower = (): Tower => ({
  id: 'monkeg_tower',
  creature: {
    id: 'monkeg',
    speciesId: 'starter_monkey',
    level: 6,
    xp: 0,
    equippedAttacks: ['BARREL_BASH'],
    isShiny: false,
  },
  position: { x: 0, y: 0 },
  lastAttackTime: 0,
  currentAttack: 65,
  currentSpecialAttack: 44,
  currentDefense: 58,
  currentSpecialDefense: 55,
  hp: 100,
  maxHp: 100,
  equippedAttacksRuntime: [{ definitionId: 'BARREL_BASH', lastFiredTime: 0 }],
  selectedAttackIndex: 0,
  facingDirection: 'right',
  targetingMode: 'closest',
});

const createEnemy = (id: string, x: number): Enemy => ({
  id,
  definitionId: 'mouse_1',
  level: 5,
  position: { x, y: 0 },
  hp: 100,
  maxHp: 100,
  speed: 0,
  currentAttack: 10,
  currentSpecialAttack: 10,
  currentDefense: 40,
  currentSpecialDefense: 40,
  statusConditions: [],
  currentWaypointIndex: 1,
  pathIndex: 0,
  facingDirection: 'right',
  damagedByTowerIds: new Set(),
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Barrel Bash', () => {
  it("is Monkeg's level-6 signature move and remains in Macask's learnset", () => {
    expect(
      STARTER_MONKEY.learnableAttacks.find(
        (attack) => attack.attackId === 'BARREL_BASH'
      )
    ).toEqual({ level: 6, attackId: 'BARREL_BASH' });
    expect(MACASK.learnableAttacks).toContainEqual({
      level: 6,
      attackId: 'BARREL_BASH',
    });
    expect(
      STARTER_MONKEY.learnableAttacks.some(
        (attack) => attack.attackId === 'WATER_GUN'
      )
    ).toBe(false);
  });

  it('is a slower, stronger physical Water dash with a guaranteed secondary push', () => {
    expect(ATTACK_DEFS.BARREL_BASH).toMatchObject({
      type: ElementType.WATER,
      category: 'physical',
      power: 40,
      cooldownMs: 1200,
      projectileSpeed: 1.15,
      isDashAttack: true,
      dashTrailType: 'WATER',
      visualEffectConfigId: 'attack_barrel_bash_1',
      secondaryImpactPush: { radiusIndex: 12, distance: 8 },
    });
    expect(ATTACK_DEFS.BARREL_BASH.effects).toBeUndefined();
  });

  it('damages only the primary target and pushes nearby secondary enemies backward', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const engine = new TowerDefenseEngine(levelData);
    const monkeg = createMonkegTower();
    const primary = createEnemy('primary', 10);
    const nearby = createEnemy('nearby', 18);
    const distant = createEnemy('distant', 30);
    engine.towers = [monkeg];
    engine.enemies = [primary, nearby, distant];

    ProjectileBehavior.execute(engine, monkeg, ATTACK_DEFS.BARREL_BASH);
    expect(engine.projectiles).toHaveLength(1);
    expect(engine.projectiles[0].targetId).toBe(primary.id);
    engine.tick(0, 200);

    expect(primary.hp).toBeLessThan(primary.maxHp);
    expect(primary.position).toEqual({ x: 10, y: 0 });
    expect(primary.statusConditions).toEqual([]);
    expect(nearby.hp).toBe(nearby.maxHp);
    expect(nearby.position.x).toBeCloseTo(10);
    expect(distant.hp).toBe(distant.maxHp);
    expect(distant.position).toEqual({ x: 30, y: 0 });
    expect(engine.visualEffects).toContainEqual(
      expect.objectContaining({
        configId: 'attack_barrel_bash_1',
        targetId: primary.id,
        durationMs: 400,
      })
    );
    engine.destroy();
  });
});
