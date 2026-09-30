import { afterEach, describe, expect, it } from 'vitest';

import { installAttackFixtures } from './fixtures';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import type { Enemy } from '@/engine/tower-defense/types';

installAttackFixtures();

const engines: TowerDefenseEngine[] = [];

afterEach(() => {
  engines.splice(0).forEach((engine) => engine.destroy());
});

function createEnemy(x = 47, y = 52.5): Enemy {
  return {
    id: 'rigging_target',
    definitionId: 'mouse_1',
    level: 7,
    position: { x, y },
    hp: 10000,
    maxHp: 10000,
    speed: 0,
    currentAttack: 10,
    currentSpecialAttack: 10,
    currentDefense: 10,
    currentSpecialDefense: 10,
    statusConditions: [],
    currentWaypointIndex: 1,
    pathIndex: 0,
    facingDirection: 'right',
    damagedByTowerIds: new Set(),
  };
}

function battle() {
  const engine = new TowerDefenseEngine(
    {
      paths: [
        [
          { x: 0, y: 50 },
          { x: 100, y: 50 },
        ],
      ],
      placementSpots: [
        { x: 40, y: 50 },
        { x: 55, y: 50 },
      ],
      waves: [{ id: 'empty', groups: [] }],
    },
    [
      {
        id: 'cocoonot-one',
        speciesId: 'bug_stage_2',
        level: 7,
        xp: 0,
        equippedAttacks: ['RIGGING_NEST'],
        isShiny: false,
      },
    ]
  );
  engines.push(engine);
  engine.placeTower('cocoonot-one', 40, 50);
  return { engine, source: engine.towers[0] };
}

describe('Summoned units and ownership', () => {
  it('creates the nest at a clearly offset position and releases five capped threadlings', () => {
    const { engine } = battle();
    engine.enemies = [createEnemy(75, 52.5)];

    engine.tick(16, 16);
    expect(engine.riggingNests).toHaveLength(1);
    expect(engine.riggingNests[0]).toMatchObject({
      position: { x: 43.5, y: 52.5 },
      ownerOrigin: { x: 40, y: 50 },
      spawnCount: 0,
    });

    let peakActiveThreadlings = 0;
    for (let second = 1; second <= 9; second += 1) {
      engine.tick(16 + second * 1000, 1000);
      peakActiveThreadlings = Math.max(
        peakActiveThreadlings,
        engine.riggingThreadlings.length
      );
    }

    expect(engine.riggingNests[0].spawnCount).toBe(5);
    expect(peakActiveThreadlings).toBeLessThanOrEqual(2);
  });

  it('moves a directional threadling into melee range and applies up to three bites', () => {
    const { engine, source } = battle();
    const target = createEnemy();
    engine.enemies = [target];

    engine.tick(16, 16);
    engine.tick(1016, 1000);

    expect(engine.riggingThreadlings).toHaveLength(1);
    expect(engine.riggingThreadlings[0].facingDirection).toBe('right');
    expect(target.hp).toBeLessThan(target.maxHp);
    expect(target.damagedByTowerIds.has(source.id)).toBe(true);

    engine.tick(1916, 900);
    engine.tick(2816, 900);
    expect(engine.riggingThreadlings).toHaveLength(0);
  });

  it('removes the setup when Cocoonot leaves the position where it tied the nest', () => {
    const { engine } = battle();
    engine.enemies = [createEnemy()];
    engine.tick(16, 16);
    engine.tick(1016, 1000);
    expect(engine.riggingNests).toHaveLength(1);
    expect(engine.riggingThreadlings).toHaveLength(1);

    engine.placeTower('cocoonot-one', 55, 50);
    engine.tick(1032, 16);

    expect(engine.riggingNests).toEqual([]);
    expect(engine.riggingThreadlings).toEqual([]);
  });
});
