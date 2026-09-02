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

  it('places a Level 5 rescue position within normal attack range of Bramfrit’s gate', () => {
    const engine = new TowerDefenseEngine(LEVEL_5);
    engine.setAspectRatio(16 / 9);

    expect(
      engine.getAttackDistance({ x: 11, y: 72 }, { x: 5.6, y: 65 })
    ).toBeLessThanOrEqual(40);
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
});
