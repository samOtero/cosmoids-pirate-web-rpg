import { afterEach, describe, expect, it } from 'vitest';

import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import type { Enemy, Tower } from '@/engine/tower-defense/types';

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

describe('enemy lane hopping', () => {
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
