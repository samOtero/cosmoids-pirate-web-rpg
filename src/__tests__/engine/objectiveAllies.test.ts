import { describe, expect, it } from 'vitest';
import { ElementType } from '@/types/baseGame';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import type { TDLevelData, Tower } from '@/engine/tower-defense/types';
import { LEVEL_5 } from '@/constants/tdLevels/level5';

function createBramfritRescueLevel(): TDLevelData {
  return {
    paths: [
      [
        { x: 10, y: 0 },
        { x: 1000, y: 0 },
      ],
      [
        { x: 0, y: 0 },
        { x: -1000, y: 0 },
      ],
    ],
    placementSpots: [],
    waveEnemyDefinitions: [
      {
        id: 'main_gate',
        level: 1,
        structure: {
          tdConfigId: 'main_gate',
          displayName: 'MAIN GATE',
          elementTypes: [ElementType.STEEL],
          maxHp: 76,
          defense: 10,
          specialDefense: 10,
          winsLevelOnDestroy: true,
          role: 'victory-gate',
        },
      },
      {
        id: 'bramfrit_gate',
        level: 1,
        structure: {
          tdConfigId: 'bramfrit_gate',
          displayName: 'BRAMFRIT CELL',
          elementTypes: [ElementType.STEEL],
          maxHp: 20,
          defense: 5,
          specialDefense: 5,
          role: 'prisoner-gate',
          visualStyle: 'prison-gate',
          position: { x: 4, y: 6 },
          visualLayout: {
            standing: { offsetX: 1, offsetY: -2, width: 120, height: 200 },
            rubble: { offsetX: 3, offsetY: -4, width: 100, height: 80 },
            labelOffsetY: -210,
            healthBarOffsetY: -195,
          },
        },
      },
    ],
    waves: [
      {
        id: 'test_wave',
        groups: [
          {
            enemyDefinitionId: 'main_gate',
            count: 1,
            spawnIntervalMs: 0,
            delayBeforeGroupMs: 0,
            pathIndex: 0,
          },
          {
            enemyDefinitionId: 'bramfrit_gate',
            count: 1,
            spawnIntervalMs: 0,
            delayBeforeGroupMs: 0,
            pathIndex: 1,
            concurrentWithPrevious: true,
          },
        ],
      },
    ],
    objectiveAllies: [
      {
        id: 'bramfrit',
        creatureId: 'bramfrit',
        displayName: 'Bramfrit',
        gateDefinitionId: 'bramfrit_gate',
        lockedPosition: { x: 0, y: 0 },
        releasePath: [{ x: 1, y: 0 }],
        moveSpeed: 1000,
        targetStructureDefinitionId: 'main_gate',
        behavior: {
          type: 'BRAMFRIT_CHARGE',
          chargeStart: { x: 0, y: 0 },
          strikePosition: { x: 1, y: 0 },
          damage: 38,
          bowDurationMs: 0,
          windupDurationMs: 0,
          recoveryDurationMs: 0,
          chargeSpeed: 1000,
        },
      },
    ],
  };
}

function createSepippetRescueLevel(): TDLevelData {
  return {
    paths: [
      [
        { x: 50, y: 0 },
        { x: 50, y: -1000 },
      ],
      [
        { x: 0, y: 0 },
        { x: -1000, y: 0 },
      ],
      [
        { x: 50, y: 50 },
        { x: 50, y: 1000 },
      ],
    ],
    placementSpots: [],
    waveEnemyDefinitions: [
      {
        id: 'main_gate',
        level: 1,
        structure: {
          tdConfigId: 'main_gate',
          displayName: 'MAIN GATE',
          elementTypes: [ElementType.STEEL],
          maxHp: 1000,
          defense: 10,
          specialDefense: 10,
          winsLevelOnDestroy: true,
          role: 'victory-gate',
        },
      },
      {
        id: 'sepippet_gate',
        level: 1,
        structure: {
          tdConfigId: 'sepippet_gate',
          displayName: 'SEPIPPET CELL',
          elementTypes: [ElementType.STEEL],
          maxHp: 20,
          defense: 5,
          specialDefense: 5,
          role: 'prisoner-gate',
          visualStyle: 'prison-gate',
        },
      },
      {
        id: 'shadow_target',
        creatureId: 'sonarion',
        level: 8,
      },
    ],
    waves: [
      {
        id: 'test_wave',
        groups: [
          {
            enemyDefinitionId: 'main_gate',
            count: 1,
            spawnIntervalMs: 0,
            delayBeforeGroupMs: 0,
            pathIndex: 0,
          },
          {
            enemyDefinitionId: 'sepippet_gate',
            count: 1,
            spawnIntervalMs: 0,
            delayBeforeGroupMs: 0,
            pathIndex: 1,
            concurrentWithPrevious: true,
          },
          {
            enemyDefinitionId: 'shadow_target',
            count: 1,
            spawnIntervalMs: 0,
            delayBeforeGroupMs: 0,
            pathIndex: 2,
            concurrentWithPrevious: true,
          },
        ],
      },
    ],
    objectiveAllies: [
      {
        id: 'sepippet',
        creatureId: 'sepippet',
        displayName: 'Sepippet',
        gateDefinitionId: 'sepippet_gate',
        lockedPosition: { x: 0, y: 0 },
        releasePath: [],
        moveSpeed: 1000,
        targetStructureDefinitionId: 'main_gate',
        behavior: {
          type: 'SEPIPPET_SHADOW_ASSAULT',
          durationMs: 100,
          gateDamage: 5,
          gateAttackIntervalMs: 20,
          shadowPositions: [
            { x: 25, y: 50 },
            { x: 50, y: 50 },
            { x: 75, y: 50 },
          ],
          shadowDamage: 7,
          shadowAttackIntervalMs: 20,
          shadowAttackRange: 1000,
        },
      },
    ],
  };
}

describe('objective allies', () => {
  it('spawns a reusable prison gate for every established Level 5 prisoner', () => {
    const engine = new TowerDefenseEngine(LEVEL_5);
    engine.tick(0, 16);

    const prisonerGateIds = engine.enemies
      .filter((enemy) => enemy.structureRole === 'prisoner-gate')
      .map((enemy) => enemy.definitionId)
      .sort();

    expect(prisonerGateIds).toEqual([
      'bramfrit_cell_gate',
      'corrogoon_cell_gate',
      'parlet_cell_gate',
      'sepippet_cell_gate',
    ]);
    expect(
      engine.enemies
        .filter((enemy) => enemy.structureRole === 'prisoner-gate')
        .every((enemy) => enemy.structureVisualStyle === 'prison-gate')
    ).toBe(true);

    engine.destroy();
  });

  it('places every Level 5 prisoner gate within normal attack range', () => {
    const engine = new TowerDefenseEngine(LEVEL_5);
    engine.setAspectRatio(16 / 9);

    for (const [towerSpot, gatePosition] of [
      [
        { x: 11, y: 72 },
        { x: 6.23, y: 75.24 },
      ],
      [
        { x: 11, y: 48 },
        { x: 4.75, y: 48.5 },
      ],
      [
        { x: 89, y: 48 },
        { x: 95.25, y: 48.5 },
      ],
      [
        { x: 89, y: 72 },
        { x: 93.77, y: 75.24 },
      ],
    ]) {
      expect(
        engine.getAttackDistance(towerSpot, gatePosition)
      ).toBeLessThanOrEqual(40);
    }
    engine.destroy();
  });

  it('focuses a selected cell gate even while another target is available', () => {
    const engine = new TowerDefenseEngine(createBramfritRescueLevel());
    engine.tick(0, 16);

    const mainGate = engine.enemies.find(
      (enemy) => enemy.definitionId === 'main_gate'
    );
    const cellGate = engine.enemies.find(
      (enemy) => enemy.definitionId === 'bramfrit_gate'
    );
    const tower = { id: 'tower', position: { x: 0, y: 0 } } as Tower;

    expect(mainGate).toBeDefined();
    expect(cellGate).toBeDefined();
    engine.toggleFocusedStructure(cellGate!.id);
    expect(engine.getTargetForTower(tower, 1000)?.id).toBe(cellGate!.id);

    engine.destroy();
  });

  it('releases Bramfrit once and lets its ritual charges destroy the main gate', () => {
    const engine = new TowerDefenseEngine(createBramfritRescueLevel());
    const destroyed: { id: string; winsLevel: boolean }[] = [];
    engine.events.subscribe((event) => {
      if (event.type === 'STRUCTURE_DESTROYED') {
        destroyed.push({ id: event.structureId, winsLevel: event.winsLevel });
      }
    });
    engine.tick(0, 16);

    const cellGate = engine.enemies.find(
      (enemy) => enemy.definitionId === 'bramfrit_gate'
    )!;
    const tower = { id: 'tower', position: { x: 0, y: 0 } } as Tower;
    engine.toggleFocusedStructure(cellGate.id);
    expect(cellGate.position).toEqual({ x: 4, y: 6 });
    expect(cellGate.structureVisualLayout?.standing).toEqual({
      offsetX: 1,
      offsetY: -2,
      width: 120,
      height: 200,
    });
    cellGate.hp = 0;
    engine.emitEnemyDefeated(cellGate, tower);

    expect(engine.objectiveAllies[0].phase).toBe('traveling');
    expect(engine.focusedStructureId).toBeNull();
    expect(engine.destroyedStructureVisuals).toHaveLength(1);
    expect(engine.destroyedStructureVisuals[0].visualLayout?.rubble).toEqual({
      offsetX: 3,
      offsetY: -4,
      width: 100,
      height: 80,
    });
    expect(destroyed).toEqual([{ id: 'bramfrit_gate', winsLevel: false }]);

    for (let frame = 1; frame <= 20; frame++) {
      engine.tick(frame * 16, 16);
    }

    expect(engine.objectiveAllies[0].impactCount).toBeGreaterThanOrEqual(2);
    expect(engine.hasDestroyedVictoryStructure).toBe(true);
    expect(destroyed).toEqual([
      { id: 'bramfrit_gate', winsLevel: false },
      { id: 'main_gate', winsLevel: true },
    ]);

    engine.destroy();
  });

  it('lets Sepippet split into lane shadows while its real body attacks the gate', () => {
    const engine = new TowerDefenseEngine(createSepippetRescueLevel());
    engine.tick(0, 16);
    engine.tick(16, 16);
    engine.tick(32, 16);

    const cellGate = engine.enemies.find(
      (enemy) => enemy.definitionId === 'sepippet_gate'
    )!;
    const mainGate = engine.enemies.find(
      (enemy) => enemy.definitionId === 'main_gate'
    )!;
    const shadowTarget = engine.enemies.find(
      (enemy) => enemy.waveEnemyDefinitionId === 'shadow_target'
    )!;
    const initialTargetHp = shadowTarget.hp;
    const tower = { id: 'tower', position: { x: 0, y: 0 } } as Tower;

    cellGate.hp = 0;
    engine.emitEnemyDefeated(cellGate, tower);
    engine.tick(48, 16);

    expect(engine.objectiveAllies[0].phase).toBe('assaulting');
    expect(engine.objectiveAllyShadows).toHaveLength(3);
    engine.tick(64, 16);
    expect(mainGate.hp).toBe(995);
    expect(shadowTarget.hp).toBeLessThan(initialTargetHp);

    engine.tick(164, 100);

    expect(engine.objectiveAllies[0].phase).toBe('exhausted');
    expect(engine.objectiveAllyShadows).toHaveLength(0);

    engine.destroy();
  });
});
