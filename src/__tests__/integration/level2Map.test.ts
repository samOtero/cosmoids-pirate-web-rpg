import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
import { FOREST_LEVEL } from '@/constants/tdLevels/forestLevel';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';

describe('Coconut Grove map integration', () => {
  it('shows the rebuilt boat, Caleb, and Kip alongside the supplies objective', () => {
    expect(FOREST_LEVEL.environmentUnits).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tdConfigId: 'rebuilt_boat' }),
        expect.objectContaining({ tdConfigId: 'caleb_battle' }),
        expect.objectContaining({ tdConfigId: 'kip_battle' }),
      ])
    );
    expect(FOREST_LEVEL.captureUnits).toHaveLength(10);
    expect(
      FOREST_LEVEL.captureUnits?.every(
        ({ tdConfigId }) => tdConfigId === 'food_supplies'
      )
    ).toBe(true);
  });

  it('derives one life from each food bag', () => {
    const engine = new TowerDefenseEngine(FOREST_LEVEL);

    expect(engine.hasCaptureUnitsGoal).toBe(true);
    expect(engine.captureUnits).toHaveLength(10);
    expect(engine.lives).toBe(10);

    engine.destroy();
  });

  it('marks every Senticle group as cursed and uncapturable', () => {
    const senticleGroups = FOREST_LEVEL.waves.flatMap(({ groups }) =>
      groups.filter(({ definitionId }) => definitionId === 'senticle')
    );

    expect(senticleGroups.length).toBeGreaterThan(0);
    expect(
      senticleGroups.every(
        ({ isCursed, uncapturable }) => isCursed && uncapturable
      )
    ).toBe(true);
  });

  it('automatically prevents cursed enemies from being captured', () => {
    const engine = new TowerDefenseEngine({
      paths: [
        [
          { x: 0, y: 50 },
          { x: 100, y: 50 },
        ],
      ],
      placementSpots: [],
      waves: [
        {
          id: 'cursed_test',
          groups: [
            {
              definitionId: 'senticle',
              count: 1,
              spawnIntervalMs: 0,
              delayBeforeGroupMs: 0,
              pathIndex: 0,
              isCursed: true,
            },
          ],
        },
      ],
    });

    engine.tick(0, 16);

    expect(engine.enemies).toHaveLength(1);
    expect(engine.enemies[0]).toMatchObject({
      isCursed: true,
      uncapturable: true,
    });
    expect(engine.captureEnemy(engine.enemies[0].id)).toBeNull();

    engine.destroy();
  });

  it('ships the referenced painted assets', () => {
    for (const configId of [
      'rebuilt_boat',
      'food_supplies',
      'caleb_battle',
      'kip_battle',
    ]) {
      const url = CREATURE_TD_CONFIGS[configId].default?.url;

      expect(url).toBeTruthy();
      expect(
        existsSync(join(process.cwd(), 'public', url!.replace(/^\/+/, '')))
      ).toBe(true);
    }
  });
});
