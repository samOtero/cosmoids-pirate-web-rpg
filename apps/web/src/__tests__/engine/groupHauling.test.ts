import { afterEach, describe, expect, it } from 'vitest';

import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import type { Enemy, TDLevelData } from '@/engine/tower-defense/types';
import { LEVEL_6 } from '@/constants/tdLevels/level6';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
import { getCaptureUnitVisualState } from '@/utils/captureUnitVisualState';

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
      returnHome: { pathIndex: 1, speed: 1 },
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
  it('lets Tigrevel walk slowly home while no Poguin is pulling', () => {
    expect(LEVEL_6.captureUnits?.[0].returnHome).toEqual({
      pathIndex: 1,
      speed: 1,
    });
    for (const state of [
      'default',
      'idle',
      'carried',
      'left',
      'right',
      'up',
      'down',
    ] as const) {
      expect(CREATURE_TD_CONFIGS.tigrevel_netted[state]?.flipX).toBe(true);
    }

    const engine = new TowerDefenseEngine(level);
    engines.push(engine);
    const objective = engine.captureUnits[0];
    const leader = createEnemy('leader', 100, 0);
    engine.enemies = [leader];
    engine.tick(0, 0);
    engine.tick(0, 1000);
    const pulledPosition = objective.position.x;
    expect(pulledPosition).toBeLessThan(100);

    leader.hp = 0;
    engine.tick(0, 0);
    expect(objective.heldByEnemyId).toBeUndefined();
    engine.tick(0, 1000);
    expect(objective.position.x).toBeCloseTo(pulledPosition + 1, 6);
    expect(objective.position.y).toBe(50);
    expect(objective.facingDirection).toBe('right');
    expect(getCaptureUnitVisualState(objective, engine.elapsedTimeMs)).toBe(
      'right'
    );

    const replacement = createEnemy('replacement', objective.position.x, 0);
    engine.enemies.push(replacement);
    engine.tick(0, 0);
    expect(objective.heldByEnemyId).toBe(replacement.id);
    const recapturedPosition = objective.position.x;
    engine.tick(0, 100);
    expect(objective.position.x).toBeLessThan(recapturedPosition);
    expect(getCaptureUnitVisualState(objective, engine.elapsedTimeMs)).toBe(
      'carried'
    );
  });

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

  it('breaks a distant branch when its middle hauler is defeated', () => {
    const engine = new TowerDefenseEngine(level);
    engines.push(engine);
    const objective = engine.captureUnits[0];
    const leader = createEnemy('leader', 100, 0);
    const bridge = createEnemy('bridge', 90, 0);
    const tail = createEnemy('tail', 80, 0);
    engine.enemies = [leader, bridge, tail];
    engine.tick(0, 0);

    expect(bridge.captureHaulLinkTargetEnemyId).toBe(leader.id);
    expect(tail.captureHaulLinkTargetEnemyId).toBe(bridge.id);
    bridge.hp = 0;
    engine.tick(0, 0);

    expect(objective.heldByEnemyId).toBe(leader.id);
    expect(tail.heldCaptureUnitId).toBeUndefined();
    expect(tail.captureHaulLinkTargetEnemyId).toBeUndefined();
    expect(tail.captureHaulRegroupTargetId).toBe(objective.id);
    expect(tail.isMovingBackward).toBe(false);
    expect(tail.itemPickupBlockedUntilMs).toBe(1000);
    expect(engine.floatingTexts).toContainEqual(
      expect.objectContaining({ text: 'Rope broke!' })
    );

    const before = leader.position.x;
    engine.tick(0, 100);
    expect(before - leader.position.x).toBeCloseTo((100 / 16.666) * 0.1, 6);
    expect(tail.heldCaptureUnitId).toBeUndefined();

    engine.tick(0, 100);
    expect(tail.position.x).toBeCloseTo(92, 2);
    engine.tick(0, 600);
    expect(tail.position.x).toBeCloseTo(92, 2);
    expect(tail.heldCaptureUnitId).toBeUndefined();
    engine.tick(0, 200);
    expect(tail.heldCaptureUnitId).toBe(objective.id);
    expect(tail.captureHaulLinkTargetEnemyId).toBe(leader.id);
    expect(tail.captureHaulRegroupTargetId).toBeUndefined();
  });

  it('keeps another nearby anchor pulling when one branch breaks', () => {
    const engine = new TowerDefenseEngine(level);
    engines.push(engine);
    const objective = engine.captureUnits[0];
    const leader = createEnemy('leader', 100, 0);
    const bridge = createEnemy('bridge', 90, 0);
    const tail = createEnemy('tail', 80, 0);
    const otherAnchor = createEnemy('other-anchor', 100, 2);
    engine.enemies = [leader, bridge, tail, otherAnchor];
    engine.tick(0, 0);
    bridge.hp = 0;
    engine.tick(0, 0);

    expect(otherAnchor.heldCaptureUnitId).toBe(objective.id);
    expect(tail.heldCaptureUnitId).toBeUndefined();
    const before = leader.position.x;
    engine.tick(0, 100);
    expect(before - leader.position.x).toBeCloseTo((100 / 16.666) * 0.3, 6);
  });

  it('releases a branch whose live rope stretches beyond joining distance', () => {
    const engine = new TowerDefenseEngine(level);
    engines.push(engine);
    const objective = engine.captureUnits[0];
    const leader = createEnemy('leader', 100, 0);
    const bridge = createEnemy('bridge', 90, 0);
    const tail = createEnemy('tail', 80, 0);
    engine.enemies = [leader, bridge, tail];
    engine.tick(0, 0);

    bridge.position.x = 80;
    engine.tick(0, 0);

    expect(objective.heldByEnemyId).toBe(leader.id);
    expect(bridge.heldCaptureUnitId).toBeUndefined();
    expect(tail.heldCaptureUnitId).toBeUndefined();
  });

  it('sends a loose Poguin back toward Tigrevel when the objective moves behind it', () => {
    const engine = new TowerDefenseEngine(level);
    engines.push(engine);
    const objective = engine.captureUnits[0];
    const leader = createEnemy('leader', 100, 0);
    const bridge = createEnemy('bridge', 90, 0);
    const tail = createEnemy('tail', 80, 0);
    engine.enemies = [leader, bridge, tail];
    engine.tick(0, 0);
    bridge.hp = 0;
    engine.tick(0, 0);

    leader.position.x = 60;
    objective.position.x = 60;
    engine.tick(0, 100);

    expect(tail.isMovingBackward).toBe(true);
    expect(tail.position.x).toBeLessThan(80);
    expect(tail.heldCaptureUnitId).toBeUndefined();
  });

  it('drops the objective if a defeated lead has no nearby replacement', () => {
    const engine = new TowerDefenseEngine(level);
    engines.push(engine);
    const objective = engine.captureUnits[0];
    const leader = createEnemy('leader', 100, 0);
    const bridge = createEnemy('bridge', 90, 0);
    const tail = createEnemy('tail', 80, 0);
    engine.enemies = [leader, bridge, tail];
    engine.tick(0, 0);
    bridge.position.x = 85;
    tail.position.x = 75;
    leader.hp = 0;
    engine.tick(0, 0);

    expect(objective.heldByEnemyId).toBeUndefined();
    expect(bridge.heldCaptureUnitId).toBeUndefined();
    expect(tail.heldCaptureUnitId).toBeUndefined();
  });
});
