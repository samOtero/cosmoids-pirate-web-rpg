import { afterEach, describe, expect, it } from 'vitest';
import { BUG_STAGE_2, BUG_STAGE_3 } from '@/constants/creatures';
import {
  AttackBehaviorRegistry,
  RiggingNestBehavior,
} from '@/engine/tower-defense/attacks/behaviors';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import type { Enemy } from '@/engine/tower-defense/types';
import { ElementType } from '@/types/baseGame';

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

describe('Rigging Nest', () => {
  it('is the Bug family’s level-seven sustained setup move', () => {
    expect(BUG_STAGE_2.learnableAttacks).toContainEqual({
      level: 7,
      attackId: 'RIGGING_NEST',
    });
    expect(BUG_STAGE_3.learnableAttacks).toContainEqual({
      level: 7,
      attackId: 'RIGGING_NEST',
    });
    expect(ATTACK_DEFS.RIGGING_NEST).toMatchObject({
      type: ElementType.BUG,
      category: 'special',
      power: 15,
      cooldownMs: 12000,
      rangeIndex: 40,
      behaviorType: 'RIGGING_NEST',
      riggingNest: {
        durationMs: 10000,
        firstSpawnDelayMs: 1000,
        spawnIntervalMs: 2000,
        maxSpawns: 5,
        maxActiveThreadlings: 2,
        threadlingLifetimeMs: 3200,
        threadlingAttackIntervalMs: 900,
        threadlingMaxAttacks: 3,
        offset: { x: 3.5, y: 2.5 },
      },
    });
    expect(AttackBehaviorRegistry.RIGGING_NEST).toBe(RiggingNestBehavior);
  });

  it('uses raster nest art and left, up, and down threadling directions', () => {
    const visual = ATTACK_DEFS.RIGGING_NEST.riggingNest;
    expect(visual?.nestSpriteUrl).toBe('/UI/Icons/bugitor_icon.png');
    expect(visual?.threadlingSpriteUrls).toEqual({
      left: '/battles/cosmoids/bug_1_left_1.webp',
      right: '/battles/cosmoids/bug_1_left_1.webp',
      up: '/battles/cosmoids/bug_1_up_1.webp',
      down: '/battles/cosmoids/bug_1_down_1.webp',
    });
  });

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
