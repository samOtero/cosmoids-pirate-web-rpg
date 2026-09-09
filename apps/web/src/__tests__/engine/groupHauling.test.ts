import { afterEach, describe, expect, it } from 'vitest';

import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import type { Enemy, TDLevelData } from '@/engine/tower-defense/types';

const engines: TowerDefenseEngine[] = [];

afterEach(() => {
  engines.forEach((engine) => engine.destroy());
  engines.length = 0;
});

const level: TDLevelData = {
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
  captureUnits: [
    {
      tdConfigId: 'tigrevel_netted',
      position: { x: 100, y: 50 },
      haulPathIndex: 1,
      groupHauling: {
        eligibleCreatureId: 'poguin',
        joinRadius: 12,
        baseSpeedMultiplier: 0.1,
        speedMultiplierPerAdditionalHauler: 0.2,
        maxSpeedMultiplier: 0.7,
      },
    },
  ],
  waveEnemyDefinitions: [],
  waves: [{ id: 'empty', groups: [] }],
};

function createEnemy(
  id: string,
  x: number,
  pathIndex: number,
  definitionId = 'poguin'
): Enemy {
  return {
    id,
    definitionId,
    level: 8,
    position: { x, y: level.paths[pathIndex][0].y },
    hp: 100,
    maxHp: 100,
    speed: 1,
    currentAttack: 10,
    currentSpecialAttack: 10,
    currentDefense: 10,
    currentSpecialDefense: 10,
    statusConditions: [],
    currentWaypointIndex: 1,
    pathIndex,
    facingDirection: 'right',
    turnAroundAtEnd: true,
    damagedByTowerIds: new Set(),
  };
}

describe('cooperative capture-unit hauling', () => {
  it('chains Poguin together and increases the shared pull speed', () => {
    const engine = new TowerDefenseEngine(level);
    engines.push(engine);
    const objective = engine.captureUnits[0];
    const leader = createEnemy('leader', 100, 0);
    engine.enemies = [leader];

    engine.tick(0, 0);
    expect(objective.heldByEnemyId).toBe(leader.id);
    expect(leader.heldCaptureUnitId).toBe(objective.id);
    expect(leader.isMovingBackward).toBe(true);

    engine.tick(0, 100);
    expect(leader.position.x).toBeCloseTo(99.4, 4);
    expect(objective.position.x).toBeCloseTo(leader.position.x, 8);
    expect(objective.position.y).toBe(50);

    const helper = createEnemy('helper', 96, 0);
    const ineligible = createEnemy('outsider', 96, 0, 'mouse_1');
    engine.enemies.push(helper, ineligible);
    engine.tick(0, 0);

    expect(helper.heldCaptureUnitId).toBe(objective.id);
    expect(helper.captureHaulLinkTargetEnemyId).toBe(leader.id);
    expect(helper.isMovingBackward).toBe(true);
    expect(ineligible.heldCaptureUnitId).toBeUndefined();

    const leaderBeforeTwoHaulers = leader.position.x;
    engine.tick(0, 100);
    expect(leaderBeforeTwoHaulers - leader.position.x).toBeCloseTo(
      (100 / 16.666) * 0.3,
      6
    );

    const lowerLaneAnchor = createEnemy('lower-anchor', objective.position.x, 2);
    engine.enemies.push(lowerLaneAnchor);
    engine.tick(0, 0);
    expect(lowerLaneAnchor.heldCaptureUnitId).toBe(objective.id);
    expect(lowerLaneAnchor.captureHaulLinkTargetEnemyId).toBeUndefined();

    const leaderBeforeThreeHaulers = leader.position.x;
    engine.tick(0, 100);
    expect(leaderBeforeThreeHaulers - leader.position.x).toBeCloseTo(
      (100 / 16.666) * 0.5,
      6
    );
  });

  it('promotes a connected helper when the lead hauler is defeated', () => {
    const engine = new TowerDefenseEngine(level);
    engines.push(engine);
    const objective = engine.captureUnits[0];
    const leader = createEnemy('leader', 100, 0);
    const helper = createEnemy('helper', 96, 0);
    engine.enemies = [leader];
    engine.tick(0, 0);
    engine.enemies.push(helper);
    engine.tick(0, 0);

    leader.hp = 0;
    engine.tick(0, 0);

    expect(engine.enemies).not.toContain(leader);
    expect(objective.heldByEnemyId).toBe(helper.id);
    expect(helper.heldCaptureUnitId).toBe(objective.id);
    expect(helper.captureHaulLinkTargetEnemyId).toBeUndefined();
  });
});
