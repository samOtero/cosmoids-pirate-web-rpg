import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
import { FOREST_LEVEL } from '@/constants/tdLevels/forestLevel';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';

describe('Coconut Grove map integration', () => {
  it('shows the rebuilt boat and uses food bags as the supplies objective', () => {
    expect(FOREST_LEVEL.environmentUnits).toContainEqual(
      expect.objectContaining({ tdConfigId: 'rebuilt_boat' })
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

  it('ships the referenced painted assets', () => {
    for (const configId of ['rebuilt_boat', 'food_supplies']) {
      const url = CREATURE_TD_CONFIGS[configId].default?.url;

      expect(url).toBeTruthy();
      expect(
        existsSync(join(process.cwd(), 'public', url!.replace(/^\/+/, '')))
      ).toBe(true);
    }
  });
});
