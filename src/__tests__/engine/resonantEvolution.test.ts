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
    sourceCreatureId: 'sonarion',
    evolvedEnemyDefinitionId: 'evolved',
    requiredCount: 3,
    radius: 10,
    gatherWaitDurationMs: 1500,
    channelDurationMs: 1000,
    recoveryDurationMs: 500,
  },
  waveEnemyDefinitions: [
    {
      id: 'small',
      creatureId: 'sonarion',
      level: 5,
      canCarryCaptureUnits: false,
    },
    {
      id: 'evolved',
      creatureId: 'resonarion',
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
    creatureId: 'sonarion',
    level: 5,
    position,
  });
  if (!enemy) throw new Error('Expected Sonarion preview enemy to spawn');
  enemy.waveEnemyDefinitionId = 'small';
  return enemy;
}

describe('resonant evolution', () => {
  it('holds a lesser creature near the objective, then releases it after the gathering window', () => {
    const engine = new TowerDefenseEngine(createLevel());
    const sonarion = addSonarion(engine, 'small_1', { x: 48, y: 50 });
    sonarion.speed = 1;
    sonarion.turnAroundAtEnd = true;

    engine.tick(0, 16);
    const waitingPosition = { ...sonarion.position };
    expect(sonarion.resonantEvolutionWaitingUntilMs).toBe(1516);

    engine.tick(500, 500);
    expect(sonarion.position).toEqual(waitingPosition);

    engine.tick(1600, 1100);
    expect(sonarion.resonantEvolutionWaitingUntilMs).toBeUndefined();
    expect(sonarion.resonantEvolutionSpent).toBe(true);
    expect(sonarion.position).not.toEqual(waitingPosition);

    engine.destroy();
  });

  it('channels three nearby lesser creatures into one evolved carrier', () => {
    const engine = new TowerDefenseEngine(createLevel());
    addSonarion(engine, 'small_1', { x: 48, y: 50 });
    addSonarion(engine, 'small_2', { x: 50, y: 48 });
    addSonarion(engine, 'small_3', { x: 52, y: 50 });

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

    engine.tick(1000, 1000);

    const evolved = engine.enemies.find(
      (enemy) => enemy.definitionId === 'resonarion'
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

  it('interrupts the channel when any participant is defeated', () => {
    const engine = new TowerDefenseEngine(createLevel());
    addSonarion(engine, 'small_1', { x: 48, y: 50 });
    addSonarion(engine, 'small_2', { x: 50, y: 48 });
    addSonarion(engine, 'small_3', { x: 52, y: 50 });

    engine.tick(0, 16);
    const helper = engine.enemies.find(
      (enemy) => enemy.resonantEvolutionState?.role === 'helper'
    );
    expect(helper).toBeDefined();
    if (helper) helper.hp = 0;

    engine.tick(100, 100);
    expect(engine.enemies).toHaveLength(2);
    expect(engine.enemies.some((enemy) => enemy.resonantEvolutionState)).toBe(
      false
    );

    engine.tick(1500, 1400);
    expect(
      engine.enemies.some((enemy) => enemy.definitionId === 'resonarion')
    ).toBe(false);

    engine.destroy();
  });
});
