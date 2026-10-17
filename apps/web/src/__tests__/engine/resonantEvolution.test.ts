import { SpeciesId } from '@/types/definitionIds';
import { describe, expect, it } from 'vitest';

import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { TDLevelData } from '@/engine/tower-defense/types';

const createLevel = (): TDLevelData => ({
  paths: [
    [
      { x: 0, y: 50 },
      { x: 100, y: 50 },
    ],
  ],
  placementSpots: [],
  captureUnits: [
    {
      tdConfigId: 'maribel_capture',
      position: { x: 50, y: 50 },
    },
  ],
  resonantEvolution: {
    sourceCreatureId: SpeciesId.RAZCALL,
    evolvedEnemyDefinitionId: 'evolved',
    requiredCount: 3,
    radius: 10,
    linkRadius: 9,
    minimumSpacing: 4,
    maxDistanceFromCaptureUnit: 20,
    gatherWaitDurationMs: 1500,
    channelDurationMs: 1000,
    recoveryDurationMs: 500,
  },
  waveEnemyDefinitions: [
    {
      id: 'small',
      creatureId: SpeciesId.RAZCALL,
      level: 5,
      canCarryCaptureUnits: false,
    },
    {
      id: 'evolved',
      creatureId: SpeciesId.RAZOUND,
      level: 8,
      hpMultiplier: 2,
    },
  ],
  waves: [],
});

function addSonarion(
  engine: TowerDefenseEngine,
  id: string,
  position: { x: number; y: number }
) {
  const enemy = engine.spawnPreviewEnemy({
    id,
    creatureId: SpeciesId.RAZCALL,
    level: 5,
    position,
  });
  if (!enemy) throw new Error('Expected Sonarion preview enemy to spawn');
  enemy.waveEnemyDefinitionId = 'small';
  enemy.speed = 0;
  return enemy;
}

describe('resonant evolution', () => {
  it('anchors the first member at the objective, then releases it after the gathering window', () => {
    const engine = new TowerDefenseEngine(createLevel());
    const sonarion = addSonarion(engine, 'small_1', { x: 48, y: 50 });
    sonarion.speed = 1;
    sonarion.turnAroundAtEnd = true;

    engine.tick(0, 16);
    const waitingPosition = { ...sonarion.position };
    expect(sonarion.resonantEvolutionState).toMatchObject({
      captureUnitId: engine.captureUnits[0].id,
      role: 'evolving',
      phase: 'forming',
      startedAtMs: 16,
      durationMs: 1500,
    });
    expect(sonarion.resonantEvolutionState?.linkTargetEnemyId).toBeUndefined();

    engine.tick(500, 500);
    expect(sonarion.position).toEqual(waitingPosition);

    engine.tick(1600, 1100);
    expect(sonarion.resonantEvolutionState).toBeUndefined();
    expect(sonarion.resonantEvolutionSpent).toBe(true);

    engine.tick(1616, 16);
    expect(sonarion.position).not.toEqual(waitingPosition);

    engine.destroy();
  });

  it('channels three nearby lesser creatures into one evolved carrier', () => {
    const engine = new TowerDefenseEngine(createLevel());
    const first = addSonarion(engine, 'small_1', { x: 48, y: 50 });
    const second = addSonarion(engine, 'small_2', { x: 42, y: 50 });
    const third = addSonarion(engine, 'small_3', { x: 34, y: 50 });

    engine.tick(0, 16);

    const channeling = engine.enemies.filter(
      (enemy) => enemy.resonantEvolutionState
    );
    expect(channeling).toHaveLength(3);
    expect(
      channeling.filter(
        (enemy) => enemy.resonantEvolutionState?.role === 'evolving'
      )
    ).toHaveLength(1);
    expect(first.resonantEvolutionState).toMatchObject({
      phase: 'channeling',
    });
    expect(first.resonantEvolutionState?.linkTargetEnemyId).toBeUndefined();
    expect(second.resonantEvolutionState?.linkTargetEnemyId).toBe(first.id);
    expect(third.resonantEvolutionState?.linkTargetEnemyId).toBe(second.id);

    engine.tick(1000, 1000);

    const evolved = engine.enemies.find(
      (enemy) => enemy.definitionId === SpeciesId.RAZOUND
    );
    expect(evolved).toMatchObject({
      waveEnemyDefinitionId: 'evolved',
      level: 8,
    });
    expect(evolved?.hp).toBe(evolved?.maxHp);
    expect(
      engine.enemies.filter((enemy) => enemy.resonantEvolutionSpent)
    ).toHaveLength(2);
    expect(engine.captureUnits[0].heldByEnemyId).toBeUndefined();

    engine.tick(1499, 499);
    expect(engine.captureUnits[0].heldByEnemyId).toBeUndefined();

    engine.tick(1501, 2);
    expect(engine.captureUnits[0].heldByEnemyId).toBe(evolved?.id);

    engine.destroy();
  });

  it('breaks a defeated middle link and lets the surviving root form a new chain', () => {
    const engine = new TowerDefenseEngine(createLevel());
    addSonarion(engine, 'small_1', { x: 48, y: 50 });
    addSonarion(engine, 'small_2', { x: 42, y: 50 });
    addSonarion(engine, 'small_3', { x: 34, y: 50 });

    engine.tick(0, 16);
    const helper = engine.enemies.find(
      (enemy) => enemy.resonantEvolutionState?.role === 'helper'
    );
    expect(helper).toBeDefined();
    if (helper) helper.hp = 0;

    engine.tick(100, 100);
    expect(engine.enemies).toHaveLength(2);
    const rebuilding = engine.enemies.filter(
      (enemy) => enemy.resonantEvolutionState
    );
    expect(rebuilding).toHaveLength(1);
    expect(rebuilding[0].resonantEvolutionState?.phase).toBe('forming');

    engine.tick(1500, 1400);
    expect(
      engine.enemies.some((enemy) => enemy.definitionId === SpeciesId.RAZOUND)
    ).toBe(false);

    engine.destroy();
  });

  it('keeps overlapping and excess Sonarions moving once a spaced chain locks', () => {
    const engine = new TowerDefenseEngine(createLevel());
    addSonarion(engine, 'small_1', { x: 48, y: 50 });
    const overlapping = addSonarion(engine, 'overlapping', { x: 46, y: 50 });
    addSonarion(engine, 'small_2', { x: 42, y: 50 });
    addSonarion(engine, 'small_3', { x: 34, y: 50 });
    overlapping.speed = 1;

    engine.tick(0, 16);

    expect(
      engine.enemies.filter(
        (enemy) => enemy.resonantEvolutionState?.phase === 'channeling'
      )
    ).toHaveLength(3);
    expect(overlapping.resonantEvolutionState).toBeUndefined();
    const unlockedPosition = { ...overlapping.position };

    engine.tick(16, 16);
    expect(overlapping.position).not.toEqual(unlockedPosition);

    engine.destroy();
  });

  it('requires a fresh Mari anchor instead of extending a locked chain', () => {
    const engine = new TowerDefenseEngine(createLevel());
    const first = addSonarion(engine, 'small_1', { x: 49, y: 50 });
    addSonarion(engine, 'small_2', { x: 43, y: 50 });
    const third = addSonarion(engine, 'small_3', { x: 37, y: 50 });
    const nearLockedChain = addSonarion(engine, 'small_4', { x: 31, y: 50 });
    const nextAnchor = addSonarion(engine, 'small_5', { x: 47, y: 50 });

    engine.tick(0, 16);
    const lockedGroupId = first.resonantEvolutionState?.groupId;
    expect(third.resonantEvolutionState?.phase).toBe('channeling');
    expect(nearLockedChain.resonantEvolutionState).toBeUndefined();
    expect(nextAnchor.resonantEvolutionState).toBeUndefined();

    engine.tick(1000, 1000);

    expect(nearLockedChain.resonantEvolutionState).toBeUndefined();
    expect(nextAnchor.resonantEvolutionState).toMatchObject({
      phase: 'forming',
      role: 'evolving',
    });
    expect(nextAnchor.resonantEvolutionState?.groupId).not.toBe(lockedGroupId);

    engine.destroy();
  });
});
