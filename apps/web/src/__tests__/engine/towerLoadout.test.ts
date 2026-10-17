import { SpeciesId, AttackId } from '@/types/definitionIds';
import { describe, expect, it } from 'vitest';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';

describe('tower attack loadouts', () => {
  it("uses a roster creature's equipped attacks before it is placed", () => {
    const attacks = TowerDefenseEngine.getEquippedAttacks({
      speciesId: SpeciesId.FUEGUANA,
      equippedAttacks: [AttackId.EMBER, AttackId.SCRATCH],
    });

    expect(attacks).toEqual([AttackId.EMBER, AttackId.SCRATCH]);
  });

  it('uses the species default when a creature has no equipped attacks', () => {
    const attacks = TowerDefenseEngine.getEquippedAttacks({
      speciesId: SpeciesId.FUEGUANA,
      equippedAttacks: [],
    });

    expect(attacks).toEqual([AttackId.SCRATCH]);
  });
});
