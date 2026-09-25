import { afterEach, describe, expect, it, vi } from 'vitest';

import { BIRD_1 } from '@/constants/creatures';
import { ProjectileBehavior } from '@/engine/tower-defense/attacks/behaviors';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import type { Enemy } from '@/engine/tower-defense/types';
import { ElementType } from '@/types/baseGame';
import { getDefaultAttacksForLevel } from '@/utils/resolvePlayerCreature';

const engines: TowerDefenseEngine[] = [];

afterEach(() => {
  engines.splice(0).forEach((engine) => engine.destroy());
  vi.restoreAllMocks();
});

function createBattle() {
  vi.spyOn(Math, 'random').mockReturnValue(0.99);
  const creature = {
    id: 'harlequill',
    speciesId: 'harlequill',
    level: 9,
    xp: 0,
    equippedAttacks: ['FLYING_COLORS'],
    isShiny: false,
  };
  const engine = new TowerDefenseEngine(
    {
      paths: [[{ x: 0, y: 0 }, { x: 100, y: 0 }]],
      placementSpots: [],
      waves: [],
    },
    [creature]
  );
  engines.push(engine);
  engine.placeTower(creature.id, 0, 0);
  const tower = engine.towers[0];
  tower.currentSpecialAttack = 50;
  tower.equippedAttacksRuntime[0].lastFiredTime = 1e12;
  tower.targetingMode = 'closest';
  return { engine, tower };
}

function addEnemy(
  engine: TowerDefenseEngine,
  id: string,
  y: number
): Enemy {
  const enemy = engine.spawnPreviewEnemy({
    id,
    creatureId: 'senticle',
    level: 9,
    position: { x: 10, y },
  })!;
  enemy.hp = enemy.maxHp = 500;
  enemy.currentSpecialDefense = 40;
  enemy.speed = 0;
  return enemy;
}

describe('Flying Colors', () => {
  it('replaces Dart in Harlequill’s new learnset with the agreed stats', () => {
    expect(getDefaultAttacksForLevel(BIRD_1, 9)).toEqual([
      'PECK',
      'FUNNY_DANCE',
      'FLYING_COLORS',
    ]);
    expect(BIRD_1.learnableAttacks).not.toContainEqual({
      level: 9,
      attackId: 'QUICK_ATTACK',
    });
    expect(ATTACK_DEFS.QUICK_ATTACK).toBeDefined();
    expect(ATTACK_DEFS.FLYING_COLORS).toMatchObject({
      type: ElementType.FLYING,
      category: 'special',
      power: 30,
      cooldownMs: 1200,
      rangeIndex: 50,
      projectileSpeed: 1.4,
      projectileVisual: { type: 'FLYING_COLORS' },
      flyingColors: { maxTargets: 3, hopRange: 40 },
      visualEffectConfigId: 'attack_flying_colors_1',
    });
  });

  it('hits three unique spread-out targets without a knockout or tower-range requirement on hops', () => {
    const { engine, tower } = createBattle();
    const first = addEnemy(engine, 'first', 0);
    const routeSecond = addEnemy(engine, 'route_second', 25);
    const routeThird = addEnemy(engine, 'route_third', 60);
    const fartherDeadEnd = addEnemy(engine, 'dead_end', -35);
    const fourth = addEnemy(engine, 'fourth', 95);

    expect(engine.isPositionInTowerRange(tower.position, routeThird.position, 50)).toBe(false);
    ProjectileBehavior.execute(engine, tower, ATTACK_DEFS.FLYING_COLORS);
    expect(engine.projectiles[0].targetId).toBe(first.id);

    engine.tick(0, 200);
    expect(first.hp).toBeLessThan(first.maxHp);
    expect(first.hp).toBeGreaterThan(0);
    expect(engine.projectiles).toHaveLength(1);
    expect(engine.projectiles[0]).toMatchObject({
      targetId: routeSecond.id,
      position: { ...first.position },
      flyingColorsHitIds: [first.id],
    });

    engine.tick(200, 400);
    expect(routeSecond.hp).toBeLessThan(routeSecond.maxHp);
    expect(engine.projectiles).toHaveLength(1);
    expect(engine.projectiles[0]).toMatchObject({
      targetId: routeThird.id,
      position: { ...routeSecond.position },
      flyingColorsHitIds: [first.id, routeSecond.id],
    });

    engine.tick(600, 500);
    expect(routeThird.hp).toBeLessThan(routeThird.maxHp);
    expect(engine.projectiles).toHaveLength(0);
    expect(fartherDeadEnd.hp).toBe(fartherDeadEnd.maxHp);
    expect(fourth.hp).toBe(fourth.maxHp);
  });

  it('stops after one hit when there is no eligible enemy within 40 units', () => {
    const { engine, tower } = createBattle();
    const first = addEnemy(engine, 'first', 0);
    const far = addEnemy(engine, 'far', 60);

    ProjectileBehavior.execute(engine, tower, ATTACK_DEFS.FLYING_COLORS);
    engine.tick(0, 200);

    expect(first.hp).toBeLessThan(first.maxHp);
    expect(far.hp).toBe(far.maxHp);
    expect(engine.projectiles).toHaveLength(0);
  });

  it('keeps the earlier impact position in its routing after a knockout', () => {
    const { engine, tower } = createBattle();
    const first = addEnemy(engine, 'first', 0);
    first.hp = first.maxHp = 1;
    const second = addEnemy(engine, 'second', 25);
    const third = addEnemy(engine, 'third', 60);

    ProjectileBehavior.execute(engine, tower, ATTACK_DEFS.FLYING_COLORS);
    engine.tick(0, 200);
    expect(first.hp).toBeLessThanOrEqual(0);
    expect(engine.projectiles[0].targetId).toBe(second.id);

    engine.tick(200, 400);
    expect(engine.projectiles[0]).toMatchObject({
      targetId: third.id,
      flyingColorsHitIds: [first.id, second.id],
      flyingColorsHitPositions: [
        { x: 10, y: 0 },
        { x: 10, y: 25 },
      ],
    });
  });
});
