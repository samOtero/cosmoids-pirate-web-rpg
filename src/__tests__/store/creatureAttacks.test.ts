import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@/store/gameStore';
import { STARTER_CRAB, STARTER_IGUANA } from '@/constants/creatures';

describe('Creature Attacks Store Actions', () => {
  beforeEach(() => {
    useGameStore.getState().deleteProfile(0);
    useGameStore.getState().createProfile(0);
    useGameStore.getState().selectProfile(0);
  });

  it('should update equipped attacks and active attack index for an active party creature', () => {
    const store = useGameStore.getState();
    const profileId = 0;
    // Setup: Add PlayerCreature to active team
    store.addCreatureToProfile(profileId, {
      id: 'temp_id',
      speciesId: STARTER_CRAB.id,
      level: 5,
      xp: 0,
      equippedAttacks: ['PINCH'],
      activeAttackIndex: 0,
    });

    const profileSetup = useGameStore.getState().profiles[0]!;
    const creatureId = profileSetup.creatures[0].id;

    // Act: Update attacks and active index
    store.updateCreatureAttacks(creatureId, ['PINCH', 'VINE_WHIP', 'EMBER'], 2);

    // Assert: Check updates in profile active creatures
    const profile = useGameStore.getState().profiles[0]!;
    const updatedCreature = profile.creatures.find((c) => c.id === creatureId);

    expect(updatedCreature).toBeDefined();
    expect(updatedCreature?.equippedAttacks).toEqual(['PINCH', 'VINE_WHIP', 'EMBER']);
    expect(updatedCreature?.activeAttackIndex).toBe(2);
  });

  it('should update equipped attacks and active attack index for a storage creature', () => {
    const store = useGameStore.getState();
    const profileId = 0;
    // Setup: Add PlayerCreature to storage box
    store.addCreatureToProfile(
      profileId,
      {
        id: 'temp_id',
        speciesId: STARTER_IGUANA.id,
        level: 5,
        xp: 0,
        equippedAttacks: ['SCRATCH'],
        activeAttackIndex: 0,
      },
      true // forceStorage
    );

    const profileSetup = useGameStore.getState().profiles[0]!;
    const creatureId = profileSetup.storageCreatures[0].id;

    // Act: Update attacks and active index in storage
    store.updateCreatureAttacks(creatureId, ['SCRATCH', 'EMBER'], 1);

    // Assert: Check updates in storage box
    const profile = useGameStore.getState().profiles[0]!;
    const updatedCreature = profile.storageCreatures.find((c) => c.id === creatureId);

    expect(updatedCreature).toBeDefined();
    expect(updatedCreature?.equippedAttacks).toEqual(['SCRATCH', 'EMBER']);
    expect(updatedCreature?.activeAttackIndex).toBe(1);
  });

  it('should do nothing if updateCreatureAttacks is called with a non-existent creature ID', () => {
    const store = useGameStore.getState();
    const profileId = 0;
    const creatureId = 'party_creature_1';

    // Setup: Add PlayerCreature to active team
    store.addCreatureToProfile(profileId, {
      id: creatureId,
      speciesId: STARTER_CRAB.id,
      level: 5,
      xp: 0,
      equippedAttacks: ['PINCH'],
      activeAttackIndex: 0,
    });

    const originalProfile = JSON.parse(JSON.stringify(useGameStore.getState().profiles[0]!));

    // Act: Call with invalid ID
    store.updateCreatureAttacks('invalid_creature_id', ['PINCH', 'VINE_WHIP'], 1);

    // Assert: Profile state should be unchanged
    const currentProfile = useGameStore.getState().profiles[0]!;
    expect(currentProfile).toEqual(originalProfile);
  });
});
