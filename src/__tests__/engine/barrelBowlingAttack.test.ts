import { afterEach, describe, expect, it, vi } from 'vitest';
import { MACASK, STARTER_MONKEY } from '@/constants/creatures';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import {
  getBarrelRoute,
  RollingBarrelBehavior,
} from '@/engine/tower-defense/attacks/rollingBarrel';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import type { Point } from '@/engine/tower-defense/types';
import { configureBowlingPreview } from '@/components/dev/barrelBowlingPreview';

const move = ATTACK_DEFS.BARREL_BOWLING;
const engines: TowerDefenseEngine[] = [];
afterEach(() => {
  engines.splice(0).forEach((engine) => engine.destroy());
  vi.restoreAllMocks();
});
function battle(
  path: Point[] = [
    { x: 0, y: 50 },
    { x: 100, y: 50 },
  ]
) {
  vi.spyOn(Math, 'random').mockReturnValue(0.99);
  const engine = new TowerDefenseEngine(
    { paths: [path], placementSpots: [], waves: [] },
    [
      {
        id: 'macask',
        speciesId: 'macask',
        level: 16,
        xp: 0,
        isShiny: false,
        equippedAttacks: ['BARREL_BOWLING', 'BARREL_BASH'],
      },
    ]
  );
  engines.push(engine);
  engine.placeTower('macask', 50, 60);
  const tower = engine.towers[0];
  tower.currentAttack = 50;
  tower.currentSpecialAttack = 5;
  tower.targetingMode = 'first';
  for (const attack of tower.equippedAttacksRuntime)
    attack.lastFiredTime = 1e12;
  return { engine, tower };
}
function enemy(
  engine: TowerDefenseEngine,
  id: string,
  x: number,
  y = 50,
  waypoint = 1
) {
  const unit = engine.spawnPreviewEnemy({
    id,
    creatureId: 'mouse_1',
    level: 16,
    position: { x, y },
  })!;
  unit.hp = unit.maxHp = 500;
  unit.currentDefense = 40;
  unit.currentSpecialDefense = 200;
  unit.currentWaypointIndex = waypoint;
  return unit;
}
function hp(engine: TowerDefenseEngine, id: string) {
  return engine.enemies.find((unit) => unit.id === id)!.hp;
}

describe('Barrel Bowling', () => {
  it('is Macask’s level-16 physical Water evolution move, not a Monkeg dash', () => {
    expect(MACASK.learnableAttacks).toContainEqual({
      level: 16,
      attackId: 'BARREL_BOWLING',
    });
    expect(
      MACASK.learnableAttacks.some(
        (attack) => attack.attackId === 'BUBBLE_BEAM'
      )
    ).toBe(false);
    expect(
      STARTER_MONKEY.learnableAttacks.some(
        (attack) => attack.attackId === 'BARREL_BOWLING'
      )
    ).toBe(false);
    expect(move).toMatchObject({
      category: 'physical',
      type: 'Water',
      power: 50,
      cooldownMs: 1600,
      rangeIndex: 40,
    });
    expect(move.isDashAttack).toBeUndefined();
    expect(move.effects).toBeUndefined();
  });

  it('lobs without damage, then pierces each enemy once up to its distance limit', () => {
    const { engine, tower } = battle();
    enemy(engine, 'front', 60);
    enemy(engine, 'middle', 40);
    enemy(engine, 'back', 20);
    enemy(engine, 'beyond', 9);
    enemy(engine, 'off-path', 35, 60);
    RollingBarrelBehavior.execute(engine, tower, move);
    const barrel = engine.projectiles[0];
    expect(barrel.rollingBarrel?.phase).toBe('lob');
    engine.tick(0, 399);
    expect(hp(engine, 'front')).toBe(500);
    engine.tick(0, 1);
    expect(hp(engine, 'front')).toBe(482);
    expect(barrel.rollingBarrel?.phase).toBe('roll');
    for (let i = 0; i < 10; i += 1) engine.tick(0, 100);
    expect(['front', 'middle', 'back'].map((id) => hp(engine, id))).toEqual([
      482, 482, 482,
    ]);
    expect(hp(engine, 'beyond')).toBe(500);
    expect(hp(engine, 'off-path')).toBe(500);
    expect(barrel.position).toEqual({ x: 15, y: 50 });
    expect(barrel.rollingBarrel?.distanceRolled).toBeCloseTo(45);
    expect(engine.projectiles).toHaveLength(0);
    expect(engine.visualEffects.at(-1)?.configId).toBe(
      'attack_barrel_bowling_splash'
    );
    engine.tick(0, 100);
    expect(hp(engine, 'back')).toBe(482);
  });

  it('sweeps every segment on a bent route instead of cutting through the corner', () => {
    const { engine, tower } = battle([
      { x: 0, y: 30 },
      { x: 60, y: 30 },
      { x: 60, y: 90 },
    ]);
    enemy(engine, 'front', 60, 55, 2);
    enemy(engine, 'vertical', 60, 40, 2);
    enemy(engine, 'horizontal', 48, 30, 1);
    enemy(engine, 'cut-corner', 50, 45, 1);
    RollingBarrelBehavior.execute(engine, tower, move);
    const barrel = engine.projectiles[0];
    engine.tick(0, 1400);
    expect(
      ['front', 'vertical', 'horizontal'].map((id) => hp(engine, id))
    ).toEqual([482, 482, 482]);
    expect(hp(engine, 'cut-corner')).toBe(500);
    expect(barrel.position).toEqual({ x: 40, y: 30 });
    expect(barrel.facingDirection).toBe('left');
  });

  it.each([1, 16 / 9, 9 / 16])(
    'uses the same on-screen roll distance and collision width at aspect %s',
    (aspect) => {
      const { engine } = battle();
      engine.setAspectRatio(aspect);
      engine.backgroundScale = 1.2;
      const target = enemy(engine, 'front', 80);
      const route = getBarrelRoute(engine, target, 30);
      const distance = route
        .slice(1)
        .reduce(
          (total, point, i) =>
            total + engine.getAttackDistance(route[i], point),
          0
        );
      expect(distance).toBeCloseTo(30);
      expect(route.at(-1)?.x).toBeCloseTo(80 - 30 / (aspect * 1.2));
    }
  );

  it('uses the target’s own path and current segment, even on intersecting routes', () => {
    const { engine } = battle();
    engine.paths.push([
      { x: 10, y: 10 },
      { x: 60, y: 10 },
      { x: 60, y: 70 },
      { x: 10, y: 70 },
    ]);
    const target = enemy(engine, 'front', 40, 70, 3);
    target.pathIndex = 1;
    expect(getBarrelRoute(engine, target, 40)).toEqual([
      { x: 40, y: 70 },
      { x: 60, y: 70 },
      { x: 60, y: 50 },
    ]);
    target.isMovingBackward = true;
    target.currentWaypointIndex = 2;
    expect(getBarrelRoute(engine, target, 40)).toEqual([
      { x: 40, y: 70 },
      { x: 60, y: 70 },
      { x: 60, y: 50 },
    ]);
  });

  it('retains its flight and roll after its target dies or its caster is removed', () => {
    const { engine, tower } = battle();
    const target = enemy(engine, 'front', 60);
    enemy(engine, 'back', 40);
    RollingBarrelBehavior.execute(engine, tower, move);
    target.hp = 0;
    engine.removeTower('macask');
    engine.tick(0, 1400);
    expect(hp(engine, 'back')).toBe(482);
    expect(engine.projectiles).toHaveLength(0);
  });

  it('ends safely at path entrances, duplicate waypoints, and structure targets', () => {
    const { engine, tower } = battle([
      { x: 0, y: 50 },
      { x: 0, y: 50 },
      { x: 100, y: 50 },
    ]);
    engine.placeTower('macask', 5, 60);
    const target = enemy(engine, 'front', 8, 50, 2);
    expect(getBarrelRoute(engine, target, 45)).toEqual([
      { x: 8, y: 50 },
      { x: 0, y: 50 },
    ]);
    target.kind = 'structure';
    target.immuneToStatusEffects = true;
    RollingBarrelBehavior.execute(engine, tower, move);
    engine.tick(0, 400);
    expect(hp(engine, 'front')).toBe(482);
    expect(engine.projectiles).toHaveLength(0);
  });

  it('gives each barrel its own hit set and credits kills only once', () => {
    const { engine, tower } = battle();
    const target = enemy(engine, 'front', 60);
    const defeated: string[] = [];
    engine.events.subscribe((event) => {
      if (event.type === 'ENEMY_DIED') defeated.push(event.enemyId);
    });
    RollingBarrelBehavior.execute(engine, tower, move);
    engine.tick(0, 400);
    RollingBarrelBehavior.execute(engine, tower, move);
    engine.tick(0, 400);
    expect(hp(engine, 'front')).toBe(464);
    engine.enemies[0].hp = 1;
    RollingBarrelBehavior.execute(engine, tower, move);
    RollingBarrelBehavior.execute(engine, tower, move);
    engine.tick(0, 400);
    expect(defeated.filter((id) => id === target.id)).toHaveLength(1);
  });

  it('obeys ordinary targeting settings and range', () => {
    const { engine, tower } = battle();
    enemy(engine, 'near', 52);
    enemy(engine, 'far', 75);
    tower.targetingMode = 'closest';
    RollingBarrelBehavior.execute(engine, tower, move);
    expect(engine.projectiles.at(-1)?.targetId).toBe('near');
    tower.targetingMode = 'first';
    RollingBarrelBehavior.execute(engine, tower, move);
    expect(engine.projectiles.at(-1)?.targetId).toBe('far');
    engine.placeTower('macask', 0, 0);
    expect(RollingBarrelBehavior.canExecute(engine, tower, move)).toBe(false);
  });

  it('sets up horizontal, vertical, and bent lanes in the lab without accumulating actors', () => {
    const { engine } = battle();
    enemy(engine, 'attack-preview-primary-target', 60);
    for (const direction of ['horizontal', 'vertical', 'bend'] as const) {
      configureBowlingPreview(engine, direction);
      expect(engine.enemies).toHaveLength(4);
      const target = engine.enemies[0];
      const route = getBarrelRoute(engine, target, 45);
      expect(route.length).toBeGreaterThan(1);
      if (direction === 'vertical') expect(route.at(-1)?.x).toBe(60);
      if (direction === 'bend') expect(route).toContainEqual({ x: 60, y: 30 });
    }
  });
});
