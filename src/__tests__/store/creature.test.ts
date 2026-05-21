import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@/store/gameStore';
import { STARTER_CRAB, STARTER_IGUANA } from '@/constants/creatures';

describe('Creature Store Logic', () => {
  beforeEach(() => {
    useGameStore.getState().deleteProfile(0);
    useGameStore.getState().createProfile(0);
    useGameStore.getState().selectProfile(0);
  });

  it('should update creature level and xp when updateCreatures is called', () => {
    const store = useGameStore.getState();
    const profileId = 0;

    // Setup: Add PlayerCreature
    store.addCreatureToProfile(profileId, {
      id: STARTER_CRAB.id,
      speciesId: STARTER_CRAB.id,
      level: 1,
      xp: 0,
      equippedAttacks: STARTER_CRAB.moves,
    });

    // Verify initial state
    let profile = useGameStore.getState().profiles[0]!;
    expect(profile.creatures[0].level).toBe(1);
    expect(profile.creatures[0].xp).toBe(0);
    const addedCreature = profile.creatures[0];

    // Act: Update Creature xp/level via updateCreatures
    const updatedCreature = { ...addedCreature, level: 5, xp: 500 };
    store.updateCreatures([updatedCreature]);

    // Assert
    profile = useGameStore.getState().profiles[0]!;
    expect(profile.creatures[0].level).toBe(5);
    expect(profile.creatures[0].xp).toBe(500);
  });

  it('should update multiple creatures', () => {
    const store = useGameStore.getState();
    const profileId = 0;

    // Setup: Add two PlayerCreatures
    store.addCreatureToProfile(profileId, {
      id: STARTER_CRAB.id,
      speciesId: STARTER_CRAB.id,
      level: 1,
      xp: 0,
      equippedAttacks: STARTER_CRAB.moves,
    });
    store.addCreatureToProfile(profileId, {
      id: STARTER_IGUANA.id,
      speciesId: STARTER_IGUANA.id,
      level: 1,
      xp: 0,
      equippedAttacks: STARTER_IGUANA.moves,
    });

    let profileBefore = useGameStore.getState().profiles[0]!;
    const added1 = profileBefore.creatures.find(
      (c) => c.speciesId === STARTER_CRAB.id
    )!;
    const added2 = profileBefore.creatures.find(
      (c) => c.speciesId === STARTER_IGUANA.id
    )!;

    // Act: Update both levels
    const updated1 = { ...added1, level: 10, xp: 1000 };
    const updated2 = { ...added2, level: 8, xp: 800 };
    store.updateCreatures([updated1, updated2]);

    // Assert
    const profile = useGameStore.getState().profiles[0]!;
    const c1 = profile.creatures.find((c) => c.speciesId === STARTER_CRAB.id);
    const c2 = profile.creatures.find((c) => c.speciesId === STARTER_IGUANA.id);

    expect(c1?.level).toBe(10);
    expect(c2?.level).toBe(8);
  });

  it('should reorder creatures and clamp out-of-bounds target index', () => {
    const store = useGameStore.getState();
    const profileId = 0;

    // Add three creatures
    store.addCreatureToProfile(profileId, {
      id: 'c1',
      speciesId: STARTER_CRAB.id,
      level: 1,
      xp: 0,
      equippedAttacks: STARTER_CRAB.moves,
    });
    store.addCreatureToProfile(profileId, {
      id: 'c2',
      speciesId: STARTER_IGUANA.id,
      level: 1,
      xp: 0,
      equippedAttacks: STARTER_IGUANA.moves,
    });
    store.addCreatureToProfile(profileId, {
      id: 'c3',
      speciesId: 'starter_monkey',
      level: 1,
      xp: 0,
      equippedAttacks: [],
    });

    let profile = useGameStore.getState().profiles[0]!;
    expect(profile.creatures.length).toBe(3);
    const initialIds = profile.creatures.map((c) => c.speciesId);

    // 1. Reorder within bounds (move index 0 to 1)
    store.reorderCreatures(0, 1);
    profile = useGameStore.getState().profiles[0]!;
    expect(profile.creatures.map((c) => c.speciesId)).toEqual([
      initialIds[1],
      initialIds[0],
      initialIds[2],
    ]);

    // Reset and test cross-array move (party to storage)
    // Currently order: [iguana, crab, monkey]
    // Move index 0 (iguana) to index 10 (storage index 4, clamped to storage end)
    store.reorderCreatures(0, 10);
    profile = useGameStore.getState().profiles[0]!;
    // Iguana should be removed from party and placed into storage
    expect(profile.creatures.map((c) => c.speciesId)).toEqual([
      initialIds[0],
      initialIds[2],
    ]);
    expect(profile.storageCreatures.map((c) => c.speciesId)).toEqual([
      initialIds[1],
    ]);
  });
});
