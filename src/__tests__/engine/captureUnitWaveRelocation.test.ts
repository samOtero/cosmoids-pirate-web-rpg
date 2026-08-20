import { describe, expect, it } from 'vitest';

import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { TDLevelData } from '@/engine/tower-defense/types';
import { getCaptureUnitVisualState } from '@/utils/captureUnitVisualState';

const createLevel = (): TDLevelData => ({
  paths: [
    [
      { x: 0, y: 0 },
      { x: 1000, y: 0 },
    ],
  ],
  placementSpots: [],
  captureUnits: [
    {
      tdConfigId: 'maribel_capture',
      position: { x: 0, y: 10 },
      waveRelocations: [
        {
          afterWaveIndex: 0,
          path: [
            { x: 0, y: 10 },
            { x: 10, y: 10 },
          ],
          speed: 10,
        },
      ],
    },
  ],
  waveEnemyDefinitions: [
    {
      id: 'non_carrier',
      creatureId: 'mouse_1',
      level: 3,
      canCarryCaptureUnits: false,
    },
  ],
  waves: [
    {
      id: 'first',
      groups: [
        {
          enemyDefinitionId: 'non_carrier',
          count: 1,
          spawnIntervalMs: 0,
          delayBeforeGroupMs: 0,
          pathIndex: 0,
        },
      ],
    },
    {
      id: 'second',
      groups: [
        {
          enemyDefinitionId: 'non_carrier',
          count: 1,
          spawnIntervalMs: 0,
          delayBeforeGroupMs: 0,
          pathIndex: 0,
        },
      ],
    },
  ],
});

describe('between-wave capture objective relocation', () => {
  it('waits for attackers to clear, walks home, then starts the next wave', () => {
    const engine = new TowerDefenseEngine(createLevel());

    engine.tick(0, 16);
    expect(engine.enemies).toHaveLength(1);
    expect(engine.currentWaveIndex).toBe(0);

    engine.enemies = [];
    engine.tick(16, 16);

    const mari = engine.captureUnits[0];
    expect(engine.currentWaveIndex).toBe(0);
    expect(mari.activeRelocation).toBeDefined();
    expect(mari.position.x).toBeGreaterThan(0);
    expect(getCaptureUnitVisualState(mari, engine.elapsedTimeMs)).toBe('right');

    engine.tick(1016, 1000);
    expect(mari.position).toEqual({ x: 10, y: 10 });
    expect(mari.homePosition).toEqual({ x: 10, y: 10 });
    expect(mari.activeRelocation).toBeUndefined();
    expect(engine.currentWaveIndex).toBe(0);

    engine.tick(1032, 16);
    expect(engine.currentWaveIndex).toBe(1);
    expect(engine.enemies).toHaveLength(0);

    engine.tick(1048, 16);
    expect(engine.enemies).toHaveLength(1);

    engine.destroy();
  });
});
