import { afterEach, describe, expect, it, vi } from 'vitest';

import { ProjectileBehavior } from '@/engine/tower-defense/attacks/behaviors';
import { ATTACK_FIXTURES, installAttackFixtures } from './fixtures';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import type { Enemy } from '@/engine/tower-defense/types';

installAttackFixtures();

const engines: TowerDefenseEngine[] = [];

afterEach(() => {
  engines.splice(0).forEach((engine) => engine.destroy());
  vi.restoreAllMocks();
});

function createBattle() {
  vi.spyOn(Math, 'random').mockReturnValue(0.99);
  const creature = {
    id: 'knotia',
    speciesId: 'mouse_1',
    level: 14,
    xp: 0,
    equippedAttacks: ['LOOSE_END'],
    isShiny: false,
  };
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
    [creature]
  );
  engines.push(engine);
  engine.placeTower(creature.id, 0, 0);
  const tower = engine.towers[0];
  tower.currentAttack = 50;
  tower.equippedAttacksRuntime[0].lastFiredTime = 1e12;
  tower.targetingMode = 'closest';
  return { engine, tower };
}

function addEnemy(
  engine: TowerDefenseEngine,
  id: string,
  x: number,
  hp: number
): Enemy {
  const enemy = engine.spawnPreviewEnemy({
    id,
    creatureId: 'senticle',
    level: 14,
    position: { x, y: 0 },
  })!;
  enemy.hp = enemy.maxHp = hp;
  enemy.currentDefense = 40;
  enemy.speed = 0;
  return enemy;
}

describe('Knockout follow-up projectiles', () => {
  it('jumps once from a defeated target to the nearest enemy within 24 units', () => {
    const { engine, tower } = createBattle();
    const primary = addEnemy(engine, 'primary', 10, 1);
    const nearest = addEnemy(engine, 'nearest', 33, 1);
    const outsideInitialRadius = addEnemy(engine, 'outside', 36, 100);

    ProjectileBehavior.execute(engine, tower, ATTACK_FIXTURES.LOOSE_END);
    engine.tick(0, 200);

    expect(primary.hp).toBeLessThanOrEqual(0);
    expect(engine.projectiles).toHaveLength(1);
    expect(engine.projectiles[0]).toMatchObject({
      attackDefinitionId: 'LOOSE_END',
      targetId: nearest.id,
      position: { x: 10, y: 0 },
      looseEndFollowUp: true,
    });

    engine.tick(300, 300);

    expect(nearest.hp).toBeLessThanOrEqual(0);
    expect(outsideInitialRadius.hp).toBe(outsideInitialRadius.maxHp);
    expect(engine.projectiles).toHaveLength(0);
  });

  it('does not launch a follow-up when the primary target survives', () => {
    const { engine, tower } = createBattle();
    const primary = addEnemy(engine, 'primary', 10, 500);
    addEnemy(engine, 'nearby', 20, 500);

    ProjectileBehavior.execute(engine, tower, ATTACK_FIXTURES.LOOSE_END);
    engine.tick(0, 200);

    expect(primary.hp).toBeLessThan(primary.maxHp);
    expect(engine.projectiles).toHaveLength(0);
  });
});
