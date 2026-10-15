import { afterEach, describe, expect, it } from 'vitest';

import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import type { Enemy, Tower } from '@/engine/tower-defense/types';
import { LEVEL_6 } from '@/constants/tdLevels/level6';

const engines: TowerDefenseEngine[] = [];

afterEach(() => {
  engines.forEach((engine) => engine.destroy());
  engines.length = 0;
});

function createEngine() {
  const engine = new TowerDefenseEngine({
    paths: [
      [
        { x: 0, y: 20 },
        { x: 100, y: 20 },
      ],
      [
        { x: 0, y: 50 },
        { x: 100, y: 50 },
      ],
    ],
    placementSpots: [],
    waves: [{ id: 'empty', groups: [] }],
  });
  engines.push(engine);
  return engine;
}

function createHopper(): Enemy {
  return {
    id: 'hopper',
    definitionId: 'poguin',
    level: 8,
    position: { x: 30, y: 20 },
    hp: 20,
    maxHp: 20,
    speed: 1,
    currentAttack: 10,
    currentSpecialAttack: 10,
    currentDefense: 10,
    currentSpecialDefense: 10,
    statusConditions: [],
    currentWaypointIndex: 1,
    pathIndex: 0,
    facingDirection: 'right',
    damagedByTowerIds: new Set(),
    laneHopState: {
      targetPathIndex: 1,
      triggerProgress: 0.25,
      windupMs: 650,
      durationMs: 600,
      arcHeight: 58,
      phase: 'approaching',
      elapsedMs: 0,
    },
  };
}

function createTower(): Tower {
  return {
    id: 'tower',
    creature: {
      id: 'tower-creature',
      speciesId: 'starter_crab',
      level: 8,
      xp: 0,
      equippedAttacks: ['PINCH'],
      gender: 'female' as const,
      isShiny: false,
    },
    position: { x: 30, y: 20 },
    lastAttackTime: 0,
    currentAttack: 10,
    currentSpecialAttack: 10,
    currentDefense: 10,
    currentSpecialDefense: 10,
    hp: 100,
    maxHp: 100,
    equippedAttacksRuntime: [{ definitionId: 'PINCH', lastFiredTime: 0 }],
    selectedAttackIndex: 0,
    facingDirection: 'right',
    targetingMode: 'closest',
  };
}

function createBalancedEngine(startPathIndex: 0 | 2 = 0) {
  const engine = new TowerDefenseEngine({
    paths: [
      [
        { x: 0, y: 20 },
        { x: 100, y: 20 },
      ],
      [
        { x: 0, y: 50 },
        { x: 100, y: 50 },
      ],
      [
        { x: 0, y: 80 },
        { x: 100, y: 80 },
      ],
    ],
    placementSpots: [],
    waveEnemyDefinitions: [
      {
        id: 'poguin_balancer',
        creatureId: 'poguin',
        level: 8,
        balancedLaneHop: {
          pathIndices: [0, 2],
          triggerProgresses: [0.35, 0.65],
          windupMs: 650,
          durationMs: 600,
          arcHeight: 58,
        },
      },
    ],
    waves: [
      {
        id: 'balancing',
        groups: [
          {
            enemyDefinitionId: 'poguin_balancer',
            count: 1,
            spawnIntervalMs: 0,
            delayBeforeGroupMs: 0,
            pathIndex: startPathIndex,
          },
        ],
      },
    ],
  });
  engines.push(engine);
  engine.tick(0, 0);
  const jumper = engine.enemies[0];
  jumper.position = { x: 35, y: startPathIndex === 0 ? 20 : 80 };
  return { engine, jumper };
}

function createLaneMate(id: string, x: number, pathIndex: 0 | 2): Enemy {
  return {
    ...createHopper(),
    id,
    position: { x, y: pathIndex === 0 ? 20 : 80 },
    pathIndex,
    laneHopState: undefined,
  };
}

describe('enemy lane hopping', () => {
  it('assigns Level 6 Poguin two shared automatic crossing points', () => {
    expect(
      LEVEL_6.waveEnemyDefinitions?.find(
        (definition) => definition.id === 'level_6_poguin'
      )?.balancedLaneHop?.triggerProgresses
    ).toEqual([0.35, 0.65]);
    expect(
      LEVEL_6.waves?.flatMap((wave) => wave.groups)
        .filter((group) => group.enemyDefinitionId === 'level_6_poguin')
        .every((group) => group.laneHop === undefined)
    ).toBe(true);

    const { jumper } = createBalancedEngine();
    expect(jumper.laneHopState).toMatchObject({
      phase: 'approaching',
      targetPathIndex: 2,
      triggerProgress: 0.35,
      balanceDecisionIndex: 0,
    });
    expect(createBalancedEngine(2).jumper.laneHopState?.targetPathIndex).toBe(0);
  });

  it('jumps at the first point when the opposite lane has fewer Poguin ahead', () => {
    const { engine, jumper } = createBalancedEngine();
    engine.enemies.push(createLaneMate('same-lane', 80, 0));

    engine.tick(0, 1);

    expect(jumper.laneHopState).toMatchObject({
      phase: 'windup',
      targetPathIndex: 2,
    });
  });

  it('waits for the second point if the opposite lane is busier, then rechecks', () => {
    const { engine, jumper } = createBalancedEngine();
    const otherLane = createLaneMate('other-lane', 80, 2);
    engine.enemies.push(otherLane);

    engine.tick(0, 1);
    expect(jumper.laneHopState).toMatchObject({
      phase: 'approaching',
      triggerProgress: 0.65,
      balanceDecisionIndex: 1,
    });

    otherLane.hp = 0;
    engine.enemies.push(createLaneMate('same-lane', 80, 0));
    jumper.position.x = 65;
    engine.tick(0, 1);
    expect(jumper.laneHopState?.phase).toBe('windup');
  });

  it('stays on its lane after both points if the opposite lane remains busier', () => {
    const { engine, jumper } = createBalancedEngine();
    engine.enemies.push(createLaneMate('other-lane', 80, 2));

    engine.tick(0, 1);
    jumper.position.x = 65;
    engine.tick(0, 1);

    expect(jumper.laneHopState?.phase).toBe('landed');
    expect(jumper.pathIndex).toBe(0);
  });

  it('alternates on ties and gives a Poguin that stays a second chance', () => {
    const { engine, jumper } = createBalancedEngine();
    engine.tick(0, 1);
    expect(jumper.laneHopState?.phase).toBe('windup');

    jumper.hp = 0;
    const next = createLaneMate('next', 35, 0);
    next.waveEnemyDefinitionId = 'poguin_balancer';
    next.laneHopState = {
      targetPathIndex: 2,
      triggerProgress: 0.35,
      windupMs: 650,
      durationMs: 600,
      arcHeight: 58,
      balanceDecisionIndex: 0,
      phase: 'approaching',
      elapsedMs: 0,
    };
    engine.enemies.push(next);
    engine.tick(0, 1);
    expect(next.laneHopState).toMatchObject({
      phase: 'approaching',
      triggerProgress: 0.65,
    });

    next.position.x = 65;
    engine.tick(0, 1);
    expect(next.laneHopState?.phase).toBe('windup');
  });

  it('telegraphs while targetable, becomes untargetable in flight, then lands on the other path', () => {
    const engine = createEngine();
    const hopper = createHopper();
    const tower = createTower();
    engine.enemies = [hopper];

    engine.tick(0, 1);
    expect(hopper.laneHopState).toMatchObject({
      phase: 'windup',
      destination: { x: 30, y: 50 },
    });
    expect(engine.getTargetForTower(tower, 100)?.id).toBe(hopper.id);

    engine.tick(649, 649);
    expect(hopper.laneHopState?.phase).toBe('airborne');
    expect(engine.getTargetForTower(tower, 100)).toBeNull();

    engine.tick(949, 300);
    expect(hopper.position).toEqual({ x: 30, y: 35 });
    expect(hopper.pathIndex).toBe(0);

    engine.tick(1249, 300);
    expect(hopper.laneHopState?.phase).toBe('landed');
    expect(hopper.position).toEqual({ x: 30, y: 50 });
    expect(hopper.pathIndex).toBe(1);
    expect(engine.getTargetForTower(tower, 100)?.id).toBe(hopper.id);
  });

  it('allows a previously committed projectile to kill an airborne hopper', () => {
    const engine = createEngine();
    const hopper = createHopper();
    hopper.hp = 5;
    hopper.laneHopState = {
      ...hopper.laneHopState!,
      phase: 'airborne',
      elapsedMs: 100,
      fromPathIndex: 0,
      fromPosition: { x: 30, y: 20 },
      destination: { x: 30, y: 50 },
      destinationWaypointIndex: 1,
    };
    engine.enemies = [hopper];
    engine.projectiles = [
      {
        id: 'committed-shot',
        sourceId: 'removed-tower',
        targetId: hopper.id,
        position: { ...hopper.position },
        target: { ...hopper.position },
        speed: 100,
        damage: 10,
      },
    ];

    expect(engine.isEnemyTargetable(hopper)).toBe(false);
    engine.tick(16.666, 16.666);

    expect(hopper.laneHopState.phase).toBe('airborne');
    expect(hopper.hp).toBeLessThanOrEqual(0);
    expect(engine.enemies).toHaveLength(0);
  });
});
