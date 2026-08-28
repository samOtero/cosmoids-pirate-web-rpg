import { describe, expect, it } from 'vitest';

import { LEVEL_4 } from '@/constants/tdLevels/level4';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';

describe('Level 4 market map', () => {
  it('moves Mari across the three staged market positions', () => {
    const mari = LEVEL_4.captureUnits?.[0];
    expect(mari).toBeDefined();

    const positions = [
      { x: 26.8, y: 50 },
      { x: 47, y: 50 },
      { x: 70.6, y: 50 },
    ];

    expect(mari?.position).toEqual(positions[0]);
    expect(
      mari?.waveRelocations?.map((relocation) => relocation.path.at(-1))
    ).toEqual(positions.slice(1));
    expect(
      mari?.waveRelocations?.map((relocation) => relocation.path.at(0))
    ).toEqual(positions.slice(0, -1));
  });

  it('starts Kip’s Mopup beside Mari as a fixed defender without Tigrevel', () => {
    const tigrevel = LEVEL_4.startingTowers?.find(
      (tower) => tower.creature.speciesId === 'tigrevel'
    );
    expect(tigrevel).toBeUndefined();

    const mopup = LEVEL_4.startingTowers?.find(
      (tower) => tower.creature.speciesId === 'mopup'
    );

    expect(mopup).toMatchObject({
      position: { x: 40, y: 55 },
      facingDirection: 'right',
      isFixed: true,
      receivesExperience: false,
      creature: {
        id: 'kip_mopup',
        level: 8,
        equippedAttacks: ['TACKLE'],
      },
    });

    const engine = new TowerDefenseEngine(LEVEL_4);
    const runtimeMopup = engine.towers.find(
      (tower) => tower.creature.id === 'kip_mopup'
    );

    expect(runtimeMopup).toMatchObject({
      position: { x: 40, y: 55 },
      facingDirection: 'right',
      isFixed: true,
      selectedAttackIndex: 0,
      creature: {
        speciesId: 'mopup',
        level: 8,
        equippedAttacks: ['TACKLE'],
      },
    });
    expect(engine.removeTower('kip_mopup')).toBe(false);
    engine.destroy();
  });
});
