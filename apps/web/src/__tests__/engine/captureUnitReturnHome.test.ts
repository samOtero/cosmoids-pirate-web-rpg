import { SpeciesId } from '@/types/definitionIds';
import { describe, expect, it } from 'vitest';

import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { Enemy, TDLevelData } from '@/engine/tower-defense/types';
import { getCaptureUnitVisualState } from '@/utils/captureUnitVisualState';

const createLevel = (delayMs = 0): TDLevelData => ({
  paths: [
    [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ],
  ],
  placementSpots: [],
  captureUnits: [
    {
      tdConfigId: 'map_1',
      position: { x: 10, y: 10 },
      returnHome: { pathIndex: 0, speed: 10, delayMs },
    },
  ],
  waveEnemyDefinitions: [],
  waves: [{ id: 'empty', groups: [] }],
});

const createCarrier = (captureUnitId: string): Enemy => ({
  id: 'carrier',
  definitionId: SpeciesId.KNOTIA,
  level: 3,
  position: { x: 0, y: 0 },
  hp: 100,
  maxHp: 100,
  speed: 0,
  currentAttack: 10,
  currentSpecialAttack: 10,
  currentDefense: 10,
  currentSpecialDefense: 10,
  statusConditions: [],
  currentWaypointIndex: 1,
  pathIndex: 0,
  facingDirection: 'right',
  heldCaptureUnitId: captureUnitId,
  damagedByTowerIds: new Set(),
});

describe('returning capture objectives', () => {
  it('waits after a drop, follows path corners, and stops exactly at home', () => {
    const engine = new TowerDefenseEngine(createLevel(500));
    const objective = engine.captureUnits[0];
    const carrier = createCarrier(objective.id);
    objective.position = { ...carrier.position };
    objective.heldByEnemyId = carrier.id;

    expect(getCaptureUnitVisualState(objective, engine.elapsedTimeMs)).toBe(
      'carried'
    );
    expect(engine.dropCaptureUnit(carrier)).toBe(objective);
    expect(getCaptureUnitVisualState(objective, engine.elapsedTimeMs)).toBe(
      'idle'
    );
    engine.tick(400, 400);
    expect(objective.position).toEqual({ x: 0, y: 0 });
    expect(getCaptureUnitVisualState(objective, engine.elapsedTimeMs)).toBe(
      'idle'
    );

    engine.tick(500, 100);
    expect(objective.position).toEqual({ x: 1, y: 0 });
    expect(objective.facingDirection).toBe('right');
    expect(getCaptureUnitVisualState(objective, engine.elapsedTimeMs)).toBe(
      'right'
    );

    engine.tick(1400, 900);
    expect(objective.position).toEqual({ x: 10, y: 0 });

    engine.tick(1500, 100);
    expect(objective.position).toEqual({ x: 10, y: 1 });
    expect(objective.facingDirection).toBe('down');

    engine.tick(2500, 1000);
    expect(objective.position).toEqual(objective.homePosition);
    expect(objective.returnHomeAvailableAtMs).toBeUndefined();
    expect(getCaptureUnitVisualState(objective, engine.elapsedTimeMs)).toBe(
      'idle'
    );

    engine.destroy();
  });

  it('stays attached while carried and can be picked up while returning', () => {
    const engine = new TowerDefenseEngine(createLevel());
    const objective = engine.captureUnits[0];
    const carrier = createCarrier(objective.id);
    carrier.position = { x: 5, y: 0 };
    objective.position = { x: 5, y: 0 };
    objective.heldByEnemyId = carrier.id;
    engine.enemies = [carrier];

    engine.tick(100, 100);
    expect(objective.position).toEqual(carrier.position);
    expect(objective.heldByEnemyId).toBe(carrier.id);

    engine.dropCaptureUnit(carrier);
    carrier.itemPickupBlockedUntilMs = 1000;
    engine.tick(200, 100);
    expect(objective.position.x).toBe(6);
    expect(objective.heldByEnemyId).toBeUndefined();

    const interceptor = createCarrier('');
    interceptor.id = 'interceptor';
    interceptor.heldCaptureUnitId = undefined;
    interceptor.position = { ...objective.position };
    engine.enemies = [interceptor];
    engine.tick(300, 100);

    expect(interceptor.heldCaptureUnitId).toBe(objective.id);
    expect(objective.heldByEnemyId).toBe(interceptor.id);

    engine.destroy();
  });

  it('leaves capture objectives without return-home configuration stationary', () => {
    const level = createLevel();
    level.captureUnits![0].returnHome = undefined;
    const engine = new TowerDefenseEngine(level);
    const objective = engine.captureUnits[0];
    objective.position = { x: 0, y: 0 };

    engine.tick(1000, 1000);

    expect(objective.position).toEqual({ x: 0, y: 0 });
    engine.destroy();
  });

  it('allows a level to reserve capture-unit carrying for larger enemies', () => {
    const level = createLevel();
    level.waveEnemyDefinitions = [
      {
        id: 'juvenile_tracker',
        creatureId: SpeciesId.KNOTIA,
        level: 3,
        canCarryCaptureUnits: false,
      },
      {
        id: 'adult_carrier',
        creatureId: SpeciesId.KNOTIA,
        level: 3,
      },
    ];
    const engine = new TowerDefenseEngine(level);
    const objective = engine.captureUnits[0];
    const juvenile = createCarrier('');
    juvenile.id = 'juvenile';
    juvenile.heldCaptureUnitId = undefined;
    juvenile.waveEnemyDefinitionId = 'juvenile_tracker';
    juvenile.position = { ...objective.position };
    const adult = createCarrier('');
    adult.id = 'adult';
    adult.heldCaptureUnitId = undefined;
    adult.waveEnemyDefinitionId = 'adult_carrier';
    adult.position = { ...objective.position };
    engine.enemies = [juvenile, adult];

    engine.tick(100, 100);

    expect(juvenile.heldCaptureUnitId).toBeUndefined();
    expect(adult.heldCaptureUnitId).toBe(objective.id);
    expect(objective.heldByEnemyId).toBe(adult.id);
    engine.destroy();
  });

  it('synchronizes a capture objective to a separate hauling path', () => {
    const level = createLevel();
    level.paths = [
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 20, y: 0 },
      ],
      [
        { x: 0, y: 50 },
        { x: 10, y: 50 },
        { x: 20, y: 50 },
      ],
      [
        { x: 0, y: 100 },
        { x: 10, y: 100 },
        { x: 20, y: 100 },
      ],
    ];
    level.captureUnits = [
      {
        tdConfigId: 'map_1',
        position: { x: 20, y: 50 },
        haulPathIndex: 1,
        returnHome: { pathIndex: 1, speed: 10 },
      },
    ];

    const engine = new TowerDefenseEngine(level);
    const objective = engine.captureUnits[0];
    const carrier = createCarrier('');
    carrier.heldCaptureUnitId = undefined;
    carrier.position = { x: 19, y: 0 };
    carrier.currentWaypointIndex = 2;
    engine.enemies = [carrier];

    engine.tick(100, 0);

    expect(carrier.heldCaptureUnitId).toBe(objective.id);
    expect(objective.heldByEnemyId).toBe(carrier.id);

    carrier.position = { x: 10, y: 0 };
    engine.tick(200, 0);

    expect(objective.position).toEqual({ x: 10, y: 50 });
    expect(objective.facingDirection).toBe('left');
    expect(engine.dropCaptureUnit(carrier)).toBe(objective);
    expect(objective.returnHome?.pathIndex).toBe(1);
    engine.destroy();
  });
});
