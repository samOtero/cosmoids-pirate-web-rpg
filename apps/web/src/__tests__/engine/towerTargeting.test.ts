import { describe, it, expect } from 'vitest';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { Enemy, Tower } from '@/engine/tower-defense/types';

describe('Tower Targeting Modes', () => {
  const levelData = {
    paths: [
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
      ],
    ],
    placementSpots: [{ x: 5, y: 5 }],
  };

  const createMockEnemy = (
    id: string,
    x: number,
    y: number,
    hp: number,
    maxHp: number,
    waypoint: number = 1,
    pathIdx: number = 0,
    isBackward: boolean = false
  ): Enemy => ({
    id,
    definitionId: 'senticle',
    level: 5,
    position: { x, y },
    hp,
    maxHp,
    speed: 1,
    currentAttack: 10,
    currentSpecialAttack: 10,
    currentDefense: 10,
    currentSpecialDefense: 10,
    statusConditions: [],
    currentWaypointIndex: waypoint,
    pathIndex: pathIdx,
    facingDirection: 'down',
    turnAroundAtEnd: false,
    isMovingBackward: isBackward,
    damagedByTowerIds: new Set(),
  });

  const createMockTower = (x: number, y: number, mode: any = 'first'): Tower => ({
    id: 'tower_1',
    creature: {
      id: 'c1',
      speciesId: 'starter_crab',
      level: 1,
      xp: 0,
      equippedAttacks: ['PINCH'],
      isShiny: false,
    },
    position: { x, y },
    lastAttackTime: 0,
    currentAttack: 10,
    currentSpecialAttack: 10,
    currentDefense: 10,
    currentSpecialDefense: 10,
    hp: 100,
    maxHp: 100,
    equippedAttacksRuntime: [{ definitionId: 'PINCH', lastFiredTime: 0 }],
    selectedAttackIndex: 0,
    facingDirection: 'down',
    targetingMode: mode,
  });

  it('should target the closest enemy in closest mode', () => {
    const engine = new TowerDefenseEngine(levelData, []);
    const tower = createMockTower(5, 0, 'closest');

    // Enemy 1: closer to tower (dist = 1)
    const enemy1 = createMockEnemy('enemy_1', 4, 0, 50, 100);
    // Enemy 2: further from tower (dist = 3)
    const enemy2 = createMockEnemy('enemy_2', 8, 0, 50, 100);

    engine.enemies = [enemy1, enemy2];

    const target = engine.getTargetForTower(tower, 10, 'closest');
    expect(target?.id).toBe('enemy_1');
  });

  it('uses a circular screen-space range on wide battlefields', () => {
    const engine = new TowerDefenseEngine(levelData, []);
    engine.setAspectRatio(2);
    const tower = createMockTower(50, 50, 'closest');
    const horizontallyOutside = createMockEnemy(
      'horizontal',
      56,
      50,
      50,
      100
    );
    const verticallyInside = createMockEnemy('vertical', 50, 60, 50, 100);
    engine.enemies = [horizontallyOutside, verticallyInside];

    expect(engine.getTargetForTower(tower, 10, 'closest')?.id).toBe(
      'vertical'
    );
  });

  it('keeps the same physical range on scaled level backgrounds', () => {
    const engine = new TowerDefenseEngine(
      { ...levelData, backgroundScale: 3 },
      []
    );
    const tower = createMockTower(50, 50, 'closest');
    const outsideScaledRange = createMockEnemy('outside', 54, 50, 50, 100);
    const insideScaledRange = createMockEnemy('inside', 53, 50, 50, 100);
    engine.enemies = [outsideScaledRange, insideScaledRange];

    expect(engine.getTargetForTower(tower, 10, 'closest')?.id).toBe('inside');
  });

  it('applies the level tower range multiplier to targeting', () => {
    const engine = new TowerDefenseEngine(
      { ...levelData, towerRangeMultiplier: 0.5 },
      []
    );
    const tower = createMockTower(0, 0, 'closest');
    const outsideScaledRange = createMockEnemy('outside', 6, 0, 50, 100);
    const insideScaledRange = createMockEnemy('inside', 4, 0, 50, 100);
    engine.enemies = [outsideScaledRange, insideScaledRange];

    expect(engine.getTowerAttackRange(10)).toBe(5);
    expect(engine.getTargetForTower(tower, 10, 'closest')?.id).toBe('inside');
    expect(
      engine.isPositionInTowerRange(tower.position, { x: 6, y: 0 }, 10)
    ).toBe(false);
  });

  it('should target the furthest enemy along path in first mode', () => {
    const engine = new TowerDefenseEngine(levelData, []);
    const tower = createMockTower(5, 0, 'first');

    // Enemy 1: progress = 2 (closer to start)
    const enemy1 = createMockEnemy('enemy_1', 2, 0, 50, 100, 1);
    // Enemy 2: progress = 8 (further along path)
    const enemy2 = createMockEnemy('enemy_2', 8, 0, 50, 100, 1);

    engine.enemies = [enemy1, enemy2];

    const target = engine.getTargetForTower(tower, 10, 'first');
    expect(target?.id).toBe('enemy_2');
  });

  it('should target the least progress enemy in last mode', () => {
    const engine = new TowerDefenseEngine(levelData, []);
    const tower = createMockTower(5, 0, 'last');

    // Enemy 1: progress = 2 (closer to start)
    const enemy1 = createMockEnemy('enemy_1', 2, 0, 50, 100, 1);
    // Enemy 2: progress = 8 (further along path)
    const enemy2 = createMockEnemy('enemy_2', 8, 0, 50, 100, 1);

    engine.enemies = [enemy1, enemy2];

    const target = engine.getTargetForTower(tower, 10, 'last');
    expect(target?.id).toBe('enemy_1');
  });

  it('should target enemy with highest current HP in strongest mode', () => {
    const engine = new TowerDefenseEngine(levelData, []);
    const tower = createMockTower(5, 0, 'strongest');

    const enemy1 = createMockEnemy('enemy_1', 4, 0, 30, 100);
    const enemy2 = createMockEnemy('enemy_2', 6, 0, 90, 100);

    engine.enemies = [enemy1, enemy2];

    const target = engine.getTargetForTower(tower, 10, 'strongest');
    expect(target?.id).toBe('enemy_2');
  });

  it('should target enemy with lowest current HP in weakest mode', () => {
    const engine = new TowerDefenseEngine(levelData, []);
    const tower = createMockTower(5, 0, 'weakest');

    const enemy1 = createMockEnemy('enemy_1', 4, 0, 30, 100);
    const enemy2 = createMockEnemy('enemy_2', 6, 0, 90, 100);

    engine.enemies = [enemy1, enemy2];

    const target = engine.getTargetForTower(tower, 10, 'weakest');
    expect(target?.id).toBe('enemy_1');
  });

  it('should target enemy with lowest HP percentage in lowest-hp-percent mode', () => {
    const engine = new TowerDefenseEngine(levelData, []);
    const tower = createMockTower(5, 0, 'lowest-hp-percent');

    // enemy1: HP% = 10 / 100 = 10%
    const enemy1 = createMockEnemy('enemy_1', 4, 0, 10, 100);
    // enemy2: HP% = 40 / 50 = 80%
    const enemy2 = createMockEnemy('enemy_2', 6, 0, 40, 50);

    engine.enemies = [enemy1, enemy2];

    const target = engine.getTargetForTower(tower, 10, 'lowest-hp-percent');
    expect(target?.id).toBe('enemy_1');
  });

  it('should target enemy with highest HP percentage in highest-hp-percent mode', () => {
    const engine = new TowerDefenseEngine(levelData, []);
    const tower = createMockTower(5, 0, 'highest-hp-percent');

    // enemy1: HP% = 10 / 100 = 10%
    const enemy1 = createMockEnemy('enemy_1', 4, 0, 10, 100);
    // enemy2: HP% = 40 / 50 = 80%
    const enemy2 = createMockEnemy('enemy_2', 6, 0, 40, 50);

    engine.enemies = [enemy1, enemy2];

    const target = engine.getTargetForTower(tower, 10, 'highest-hp-percent');
    expect(target?.id).toBe('enemy_2');
  });

  it('should persist targetingMode to the roster creature and initialize correctly in the engine', () => {
    const initialRoster = [
      {
        id: 'c1',
        speciesId: 'starter_crab',
        level: 1,
        xp: 0,
        equippedAttacks: ['PINCH'],
        isShiny: false,
        targetingMode: 'strongest',
      },
    ];

    // 1. Initialized engine should load targetingMode from roster
    const engine = new TowerDefenseEngine(levelData, initialRoster);
    expect(engine.playerSelectedTargetingModes['c1']).toBe('strongest');

    // 2. Placing a tower should inherit that targetingMode
    engine.placeTower('c1', 5, 5);
    const placedTower = engine.towers[0];
    expect(placedTower.targetingMode).toBe('strongest');

    // 3. Changing targetingMode should update both active tower and roster creature
    engine.setTowerTargetingMode('c1', 'weakest');
    expect(engine.playerSelectedTargetingModes['c1']).toBe('weakest');
    expect(placedTower.targetingMode).toBe('weakest');
    expect(engine.roster[0].targetingMode).toBe('weakest');
  });
});
