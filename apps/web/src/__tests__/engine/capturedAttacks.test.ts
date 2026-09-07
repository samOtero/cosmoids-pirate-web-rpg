import { describe, expect, it } from 'vitest';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';

describe('captured creature attacks', () => {
  it.each([
    { level: 3, attacks: ['NIBBLE'] },
    { level: 4, attacks: ['NIBBLE', 'QUICK_ATTACK'] },
    { level: 14, attacks: ['NIBBLE', 'QUICK_ATTACK', 'CHOMP'] },
  ])('equips attacks unlocked at level $level', ({ level, attacks }) => {
    const engine = new TowerDefenseEngine({
      paths: [
        [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
        ],
      ],
      placementSpots: [],
      waveEnemyDefinitions: [
        { id: 'mouse_to_catch', creatureId: 'mouse_1', level },
      ],
      waves: [
        {
          id: 'capture_test',
          groups: [
            {
              enemyDefinitionId: 'mouse_to_catch',
              count: 1,
              spawnIntervalMs: 0,
              delayBeforeGroupMs: 0,
              pathIndex: 0,
            },
          ],
        },
      ],
    });

    engine.tick(0, 16);
    const captured = engine.captureEnemy(engine.enemies[0].id);

    expect(captured).toMatchObject({
      speciesId: 'mouse_1',
      level,
      equippedAttacks: attacks,
    });
    expect(engine.roster).toContain(captured);
    engine.destroy();
  });
});
