import { describe, expect, it } from 'vitest';

import { FOREST_LEVEL } from '@/constants/tdLevels/forestLevel';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';

describe('Tower defense rules', () => {
  it('always opens Level 2 with its full bottom-to-top camera tour', () => {
    expect(FOREST_LEVEL.openingPan).toEqual({
      fromOffsetY: 100,
      durationMs: 2000,
    });
  });

  it('derives one life from each capture objective', () => {
    const engine = new TowerDefenseEngine(FOREST_LEVEL);

    expect(engine.hasCaptureUnitsGoal).toBe(true);
    expect(engine.captureUnits.length).toBeGreaterThan(0);
    expect(engine.lives).toBe(engine.captureUnits.length);

    engine.destroy();
  });

  it("starts Level 2 with Kip's fixed Mopup beside him", () => {
    const engine = new TowerDefenseEngine(FOREST_LEVEL);
    const mopup = engine.towers.find(
      (tower) => tower.creature.id === 'kip_mopup'
    );

    expect(mopup).toMatchObject({
      position: { x: 45, y: 67 },
      isFixed: true,
      receivesExperience: false,
      creature: {
        speciesId: 'mopup',
        equippedAttacks: ['TACKLE', 'BUBBLE_BEAM'],
      },
      selectedAttackIndex: 1,
    });
    expect(engine.roster).not.toContainEqual(
      expect.objectContaining({ id: 'kip_mopup' })
    );

    expect(engine.removeTower('kip_mopup')).toBe(false);
    expect(engine.placeTower('kip_mopup', 52.12, 67.3)).toBe(false);
    expect(mopup?.position).toEqual({ x: 45, y: 67 });

    engine.destroy();
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
});
