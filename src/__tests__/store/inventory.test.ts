import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@/store/gameStore';
import { ITEMS } from '@/constants/items';
import { STARTER_CRAB } from '@/constants/creatures';

// Mock the store to avoid persistence issues in tests if needed,
// but usually zustand works fine in memory for tests.

describe('Inventory Logic', () => {
  beforeEach(() => {
    useGameStore.getState().deleteProfile(0);
    useGameStore.getState().createProfile(0);
    useGameStore.getState().selectProfile(0);
  });

  it('should use a healing item to restore HP', () => {
    const store = useGameStore.getState();
    const profileId = 0;

    // Setup: Add creature and damage it
    const creature = { ...STARTER_CRAB, currentHp: 10, maxHp: 50 };
    store.addCreatureToProfile(profileId, creature);

    // Setup: Add Potion (Berry)
    store.clearQueue();
    store.enqueueAndProcessEvents([
      {
        type: 'GAIN_ITEM',
        payload: { itemId: 'BERRY', count: 1 },
      },
    ]);

    let profile = useGameStore.getState().profiles[0]!;
    expect(profile.inventory).toHaveLength(1);
    expect(profile.inventory[0].count).toBe(1);
    expect(profile.creatures[0].currentHp).toBe(10);

    // Act: Use Item
    const storedCreatureId = profile.creatures[0].id;
    store.useItem('BERRY', storedCreatureId);

    // Assert
    profile = useGameStore.getState().profiles[0]!;
    expect(profile.creatures[0].currentHp).toBe(30); // 10 + 20
    expect(profile.inventory).toHaveLength(0); // Consumed
  });

  it('should not use item if creature is at full health', () => {
    const store = useGameStore.getState();
    const profileId = 0;

    // Setup: Add creature at full health
    const creature = { ...STARTER_CRAB, currentHp: 50, maxHp: 50 };
    store.addCreatureToProfile(profileId, creature);

    // Setup: Add Potion (Berry)
    store.clearQueue();
    store.enqueueAndProcessEvents([
      {
        type: 'GAIN_ITEM',
        payload: { itemId: 'BERRY', count: 1 },
      },
    ]);

    // Act: Use Item
    const profileBefore = useGameStore.getState().profiles[0]!;
    const storedCreatureId = profileBefore.creatures[0].id;
    store.useItem('BERRY', storedCreatureId);

    // Assert
    const profile = useGameStore.getState().profiles[0]!;
    expect(profile.creatures[0].currentHp).toBe(50);
    expect(profile.inventory).toHaveLength(1); // Not Consumed
    expect(profile.inventory[0].count).toBe(1);
  });

  it('should handle stack decrement correctly', () => {
    const store = useGameStore.getState();
    const profileId = 0;

    // Setup: Add creature damaged
    const creature = { ...STARTER_CRAB, currentHp: 10, maxHp: 50 };
    store.addCreatureToProfile(profileId, creature);

    // Setup: Add 2 Berries
    store.clearQueue();
    store.enqueueAndProcessEvents([
      {
        type: 'GAIN_ITEM',
        payload: { itemId: 'BERRY', count: 2 },
      },
    ]);

    // Act: Use Item
    const profileBefore = useGameStore.getState().profiles[0]!;
    const storedCreatureId = profileBefore.creatures[0].id;
    store.useItem('BERRY', storedCreatureId);

    // Assert
    const profile = useGameStore.getState().profiles[0]!;
    expect(profile.creatures[0].currentHp).toBe(30);
    expect(profile.inventory).toHaveLength(1);
    expect(profile.inventory[0].count).toBe(1);
  });
});
