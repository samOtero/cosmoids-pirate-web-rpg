import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '@/store/gameStore';
import { STARTER_CRAB } from '@/constants/creatures';

describe('Inventory & Profile Logic', () => {
  beforeEach(() => {
    useGameStore.getState().deleteProfile(0);
    useGameStore.getState().createProfile(0);
    useGameStore.getState().selectProfile(0);
  });

  it('should handle adding PlayerCreature to profile correctly', () => {
    const store = useGameStore.getState();
    const profileId = 0;

    store.addCreatureToProfile(profileId, {
      id: STARTER_CRAB.id,
      speciesId: STARTER_CRAB.id,
      level: 5,
      xp: 200,
      equippedAttacks: ['TACKLE', 'EMBER'],
      gender: 'female' as const,
      isShiny: false,
    });

    const profile = useGameStore.getState().profiles[0]!;
    expect(profile.creatures).toHaveLength(1);
    expect(profile.creatures[0].speciesId).toBe(STARTER_CRAB.id);
    expect(profile.creatures[0].level).toBe(5);
    expect(profile.creatures[0].xp).toBe(200);
    expect(profile.creatures[0].equippedAttacks).toEqual(['TACKLE', 'EMBER']);
  });

  it('should handle GAIN_ITEM event correctly', () => {
    const store = useGameStore.getState();
    store.clearQueue();
    store.enqueueAndProcessEvents([
      {
        type: 'GAIN_ITEM',
        payload: { itemId: 'BERRY', count: 2 },
      },
    ]);

    const profile = useGameStore.getState().profiles[0]!;
    expect(profile.inventory).toHaveLength(1);
    expect(profile.inventory[0].id).toBe('BERRY');
    expect(profile.inventory[0].count).toBe(2);
  });
});
