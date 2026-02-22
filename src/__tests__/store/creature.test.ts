import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@/store/gameStore';
import { STARTER_CRAB, STARTER_IGUANA } from '@/constants/creatures';
import { Screens } from '@/types/baseGame';

describe('Creature Store Logic', () => {
  beforeEach(() => {
    useGameStore.getState().deleteProfile(0);
    useGameStore.getState().createProfile(0);
    useGameStore.getState().selectProfile(0);
  });

  it('should update creature stats when updateCreatures is called', () => {
    const store = useGameStore.getState();
    const profileId = 0;

    // Setup: Add creature
    const creature = { ...STARTER_CRAB, currentHp: 50, maxHp: 50 };
    store.addCreatureToProfile(profileId, creature);

    // Verify initial state
    let profile = useGameStore.getState().profiles[0]!;
    expect(profile.creatures[0].currentHp).toBe(50);
    const addedCreature = profile.creatures[0];

    // Act: Update Creature
    const updatedCreature = { ...addedCreature, currentHp: 20 };
    store.updateCreatures([updatedCreature]);

    // Assert
    profile = useGameStore.getState().profiles[0]!;
    expect(profile.creatures[0].currentHp).toBe(20);
  });

  it('should update multiple creatures', () => {
    const store = useGameStore.getState();
    const profileId = 0;

    // Setup: Add two creatures
    const creature1 = { ...STARTER_CRAB, currentHp: 50, maxHp: 50 };
    const creature2 = { ...STARTER_IGUANA, currentHp: 40, maxHp: 40 };
    store.addCreatureToProfile(profileId, creature1);
    store.addCreatureToProfile(profileId, creature2);

    let profileBefore = useGameStore.getState().profiles[0]!;
    const added1 = profileBefore.creatures.find(
      (c) => c.speciesId === STARTER_CRAB.id
    )!;
    const added2 = profileBefore.creatures.find(
      (c) => c.speciesId === STARTER_IGUANA.id
    )!;

    // Act: Update both
    const updated1 = { ...added1, currentHp: 10 };
    const updated2 = { ...added2, currentHp: 5 };
    store.updateCreatures([updated1, updated2]);

    // Assert
    const profile = useGameStore.getState().profiles[0]!;
    const c1 = profile.creatures.find((c) => c.speciesId === STARTER_CRAB.id);
    const c2 = profile.creatures.find((c) => c.speciesId === STARTER_IGUANA.id);

    expect(c1?.currentHp).toBe(10);
    expect(c2?.currentHp).toBe(5);
  });
});
