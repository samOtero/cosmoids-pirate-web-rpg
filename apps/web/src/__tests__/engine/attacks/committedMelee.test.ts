import { afterEach, describe, expect, it } from 'vitest';

import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';

import { ATTACK_FIXTURES, installAttackFixtures } from './fixtures';
import { PalmSlamBehavior } from '@/engine/tower-defense/attacks/palmSlam';
import type { Enemy } from '@/engine/tower-defense/types';

installAttackFixtures();

const engines: TowerDefenseEngine[] = [];

afterEach(() => {
  engines.splice(0).forEach((engine) => engine.destroy());
});

function createEnemy(id: string, x: number): Enemy {
  return {
    id,
    definitionId: 'mouse_1',
    level: 10,
    position: { x, y: 50 },
    hp: 300,
    maxHp: 300,
    speed: 0.01,
    currentAttack: 20,
    currentSpecialAttack: 20,
    currentDefense: 20,
    currentSpecialDefense: 20,
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
      placementSpots: [{ x: 40, y: 50 }],
      waves: [{ id: 'empty', groups: [] }],
    },
    [
      {
        id: 'yokodillo-one',
        speciesId: 'yokodillo',
        level: 10,
        xp: 0,
        equippedAttacks: ['PALM_SLAM', 'SHIKO_QUAKE'],
        gender: 'female' as const,
        isShiny: false,
      },
    ]
  );
  engines.push(engine);
  engine.placeTower('yokodillo-one', 40, 50);
  return { engine, source: engine.towers[0] };
}

describe('Committed melee impact', () => {
  it('strikes just one target after a 0.6-second wind-up and stays committed', () => {
    const { engine, source } = battle();
    const first = createEnemy('first', 45);
    const second = createEnemy('second', 55);
    engine.enemies = [first, second];

    PalmSlamBehavior.execute(engine, source, ATTACK_FIXTURES.PALM_SLAM);
    expect(source.palmSlam).toMatchObject({
      impactAtMs: 600,
      endsAtMs: 900,
      targetId: 'second',
      hasImpacted: false,
    });
    engine.tick(599, 599);
    expect(first.hp).toBe(first.maxHp);
    expect(second.hp).toBe(second.maxHp);
    engine.tick(600, 1);

    expect(first.hp).toBe(first.maxHp);
    expect(second.hp).toBeLessThan(second.maxHp);
    expect(second.statusConditions).toContainEqual({
      type: 'STUN',
      durationMs: 650,
    });
    expect(source.palmSlam?.hasImpacted).toBe(true);
    expect(engine.visualEffects).toContainEqual(
      expect.objectContaining({
        configId: 'attack_palm_slam_1',
        position: second.position,
        targetId: 'second',
        durationMs: 360,
      })
    );
    engine.tick(899, 299);
    expect(source.palmSlam).toBeDefined();
    engine.tick(900, 1);
    expect(source.palmSlam).toBeUndefined();
  });

  it('can strike another in-range target if its first target is lost', () => {
    const { engine, source } = battle();
    const first = createEnemy('first', 55);
    const second = createEnemy('second', 48);
    engine.enemies = [first, second];
    PalmSlamBehavior.execute(engine, source, ATTACK_FIXTURES.PALM_SLAM);
    expect(source.palmSlam?.targetId).toBe('first');

    first.hp = 0;
    engine.tick(600, 600);

    expect(second.hp).toBeLessThan(second.maxHp);
    expect(second.statusConditions).toContainEqual({
      type: 'STUN',
      durationMs: 650,
    });
  });

  it('starts in the normal attack loop and cannot be skipped by selecting Shiko Stomp', () => {
    const { engine, source } = battle();
    const target = createEnemy('target', 50);
    engine.enemies = [target];

    engine.tick(3100, 16);
    expect(source.palmSlam).toMatchObject({
      startedAtMs: 16,
      impactAtMs: 616,
      hasImpacted: false,
    });
    engine.setTowerAttack(source.creature.id, 1);
    engine.tick(3101, 599);
    expect(target.hp).toBe(target.maxHp);
    expect(source.shikoQuake).toBeUndefined();

    engine.tick(3102, 1);
    expect(target.hp).toBeLessThan(target.maxHp);
    expect(source.palmSlam?.hasImpacted).toBe(true);
    expect(source.shikoQuake).toBeUndefined();
  });

  it('damages status-immune structures without staggering them', () => {
    const { engine, source } = battle();
    const structure = createEnemy('structure', 50);
    structure.kind = 'structure';
    structure.immuneToStatusEffects = true;
    engine.enemies = [structure];

    PalmSlamBehavior.execute(engine, source, ATTACK_FIXTURES.PALM_SLAM);
    engine.tick(600, 600);

    expect(structure.hp).toBeLessThan(structure.maxHp);
    expect(structure.statusConditions).toEqual([]);
  });

  it('cancels a pending strike when Yokodillo moves', () => {
    const { engine, source } = battle();
    const target = createEnemy('target', 45);
    engine.enemies = [target];
    PalmSlamBehavior.execute(engine, source, ATTACK_FIXTURES.PALM_SLAM);

    engine.placeTower(source.creature.id, 42, 50);
    expect(source.palmSlam).toBeUndefined();
    engine.tick(600, 600);
    expect(target.hp).toBe(target.maxHp);
  });
});
