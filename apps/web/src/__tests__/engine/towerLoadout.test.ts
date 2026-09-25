import { describe, expect, it } from 'vitest';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';

describe('tower attack loadouts', () => {
  it("uses a roster creature's equipped attacks before it is placed", () => {
    const attacks = TowerDefenseEngine.getEquippedAttacks({
      speciesId: 'starter_iguana',
      equippedAttacks: ['EMBER', 'SCRATCH'],
    });

    expect(attacks).toEqual(['EMBER', 'SCRATCH']);
  });

  it('uses the species default when a creature has no equipped attacks', () => {
    const attacks = TowerDefenseEngine.getEquippedAttacks({
      speciesId: 'starter_iguana',
      equippedAttacks: [],
    });

    expect(attacks).toEqual(['FIRE_CLAW']);
  });
});
