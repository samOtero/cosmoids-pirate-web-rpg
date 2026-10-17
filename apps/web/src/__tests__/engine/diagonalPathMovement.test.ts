import { SpeciesId } from '@/types/definitionIds';
import { describe, it, expect } from 'vitest';
import {
  stepUnitTowardsWaypoint,
  TowerDefenseEngine,
} from '@/engine/tower-defense/TowerDefenseEngine';
import { TDLevelData, Point } from '@/engine/tower-defense/types';

describe('stepUnitTowardsWaypoint', () => {
  it('moves strictly horizontally on horizontal segments and sets correct facing', () => {
    const pos: Point = { x: 10, y: 20 };
    const target: Point = { x: 50, y: 20 };
    const previous: Point = { x: 0, y: 20 };

    const result = stepUnitTowardsWaypoint(pos, target, 5, 1, previous, 'down');

    expect(result.reachedWaypoint).toBe(false);
    expect(result.facingDirection).toBe('right');
    expect(pos.x).toBeCloseTo(15);
    expect(pos.y).toBe(20);
  });

  it('moves strictly vertically on vertical segments and scales vertical distance by aspect ratio', () => {
    const pos: Point = { x: 20, y: 10 };
    const target: Point = { x: 20, y: 50 };
    const previous: Point = { x: 20, y: 0 };
    const aspectRatio = 2; // wide screen

    const result = stepUnitTowardsWaypoint(
      pos,
      target,
      5,
      aspectRatio,
      previous,
      'left'
    );

    expect(result.reachedWaypoint).toBe(false);
    expect(result.facingDirection).toBe('down');
    expect(pos.x).toBe(20);
    // When aspectRatio = 2, frameDistance = 5, deltaY = 5 * 2 = 10
    expect(pos.y).toBeCloseTo(20);
  });

  it('moves in a straight line on diagonal segments without stair-stepping', () => {
    const pos: Point = { x: 0, y: 0 };
    const target: Point = { x: 30, y: 30 };
    const previous: Point = { x: 0, y: 0 };

    const result = stepUnitTowardsWaypoint(pos, target, 5, 1, previous, 'down');

    expect(result.reachedWaypoint).toBe(false);
    // Both x and y move proportionally
    expect(pos.x).toBeGreaterThan(0);
    expect(pos.y).toBeGreaterThan(0);
    expect(pos.x).toBeCloseTo(pos.y);
    // 30 >= 30, horizontal preference resolves to 'right'
    expect(result.facingDirection).toBe('right');
  });

  it('maintains a consistent facing direction for the entire duration of an angled segment', () => {
    const start: Point = { x: 10, y: 10 };
    const target: Point = { x: 50, y: 20 }; // shallow diagonal: dx=40, dy=10
    const pos: Point = { ...start };

    const observedDirections: string[] = [];

    // Simulate several ticks along the segment
    while (Math.hypot(target.x - pos.x, target.y - pos.y) > 2) {
      const res = stepUnitTowardsWaypoint(pos, target, 3, 1, start, 'down');
      observedDirections.push(res.facingDirection);
    }

    // Facing direction must remain 'right' on EVERY tick without flipping
    expect(observedDirections.length).toBeGreaterThan(5);
    expect(observedDirections.every((dir) => dir === 'right')).toBe(true);
  });

  it('reaches the waypoint cleanly when within frame distance', () => {
    const pos: Point = { x: 19.5, y: 29.5 };
    const target: Point = { x: 20, y: 30 };

    const result = stepUnitTowardsWaypoint(
      pos,
      target,
      5,
      1,
      undefined,
      'right'
    );

    expect(result.reachedWaypoint).toBe(true);
    expect(pos.x).toBe(20);
    expect(pos.y).toBe(30);
  });
});

describe('TowerDefenseEngine diagonal path traversal', () => {
  const mockDiagonalLevel: TDLevelData = {
    paths: [
      [
        { x: 0, y: 0 },
        { x: 40, y: 40 }, // diagonal segment
        { x: 40, y: 80 }, // vertical segment
      ],
    ],
    placementSpots: [],
    waveEnemyDefinitions: [
      {
        id: 'bug_scout',
        creatureId: SpeciesId.SAILKWORM,
        level: 3,
        speedMultiplier: 1,
      },
    ],
    waves: [
      {
        id: 'wave_1',
        groups: [
          {
            enemyDefinitionId: 'bug_scout',
            count: 1,
            spawnIntervalMs: 0,
            delayBeforeGroupMs: 0,
            pathIndex: 0,
          },
        ],
      },
    ],
  };

  it('keeps stable facing and proportional coordinate updates as enemy moves along diagonal', () => {
    const engine = new TowerDefenseEngine(mockDiagonalLevel, []);
    engine.aspectRatio = 1;

    // Tick to spawn enemy
    let time = 0;
    engine.tick(time, 16);

    expect(engine.enemies.length).toBe(1);
    const enemy = engine.enemies[0];
    expect(enemy.currentWaypointIndex).toBe(1);

    const facings: string[] = [];

    // Advance engine tick-by-tick along the diagonal segment
    for (let i = 0; i < 20; i++) {
      time += 100;
      engine.tick(time, 100);
      if (enemy.currentWaypointIndex === 1) {
        facings.push(enemy.facingDirection);
        // Position should remain on line y = x (with tolerance for floating point)
        expect(Math.abs(enemy.position.x - enemy.position.y)).toBeLessThan(
          0.01
        );
      }
    }

    // Must never flip between right and down during the diagonal segment
    expect(facings.length).toBeGreaterThan(5);
    const firstFacing = facings[0];
    expect(facings.every((f) => f === firstFacing)).toBe(true);

    engine.destroy();
  });

  it('switches facing cleanly at the corner without jitter', () => {
    const engine = new TowerDefenseEngine(mockDiagonalLevel, []);
    engine.aspectRatio = 1;

    let time = 0;
    engine.tick(time, 16);

    // Fast-forward until enemy transitions from waypoint 1 (diagonal) to waypoint 2 (vertical)
    let reachedVertical = false;
    for (let step = 0; step < 200; step++) {
      time += 100;
      engine.tick(time, 100);
      const enemy = engine.enemies[0];
      if (!enemy) break;

      if (enemy.currentWaypointIndex === 2) {
        // Step into the vertical segment
        time += 100;
        engine.tick(time, 100);
        reachedVertical = true;
        expect(enemy.facingDirection).toBe('down');
        break;
      }
    }

    expect(reachedVertical).toBe(true);
    engine.destroy();
  });

  it('correctly flips facing and moves backwards on turnaround at end of diagonal path', () => {
    const turnaroundLevel: TDLevelData = {
      paths: [
        [
          { x: 0, y: 0 },
          { x: 30, y: 30 },
        ],
      ],
      placementSpots: [],
      waveEnemyDefinitions: [
        {
          id: 'bug_patrol',
          creatureId: SpeciesId.SAILKWORM,
          level: 3,
          speedMultiplier: 2,
        },
      ],
      waves: [
        {
          id: 'wave_1',
          groups: [
            {
              enemyDefinitionId: 'bug_patrol',
              count: 1,
              spawnIntervalMs: 0,
              delayBeforeGroupMs: 0,
              pathIndex: 0,
              turnAroundAtEnd: true,
            },
          ],
        },
      ],
    };

    const engine = new TowerDefenseEngine(turnaroundLevel, []);
    engine.aspectRatio = 1;

    let time = 0;
    engine.tick(time, 16);

    const enemy = engine.enemies[0];
    expect(enemy.facingDirection).toBe('right');

    // Advance until enemy reaches end and turns around
    let turnedAround = false;
    for (let step = 0; step < 200; step++) {
      time += 100;
      engine.tick(time, 100);

      if (enemy.isMovingBackward) {
        turnedAround = true;
        expect(enemy.facingDirection).toBe('left');
        break;
      }
    }

    expect(turnedAround).toBe(true);
    engine.destroy();
  });
});
