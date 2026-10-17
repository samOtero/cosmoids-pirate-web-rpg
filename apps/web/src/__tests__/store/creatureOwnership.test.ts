import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createJSONStorage } from 'zustand/middleware';
import { useGameStore } from '@/store/gameStore';
import {
  CURRENT_PROFILE_VERSION,
  MAX_PARTY_SIZE,
  MAX_PROFILES,
} from '@/constants/game';
import { COSMOID_TEMPLATES } from '@/constants/creatures';
import { GameFlag, type PlayerCreature } from '@/types/baseGame';
import { resolvePlayerCreature } from '@/utils/resolvePlayerCreature';
import {
  GUEST_OWNER_ID,
  type AcquiredCreature,
} from '@/utils/creatureOwnership';
import { resetStore } from '@/__tests__/utils/test-utils';

const storage = useGameStore.persist.getOptions().storage;
const speciesId = Object.values(COSMOID_TEMPLATES)[0].id;
const accountId = 'account-owner-a';
const firstOwnerId = 'account-original-b';

// Explicit boundary input: these cases exercise an absent originalOwnerId.
function acquisition(id = 'owned-instance'): AcquiredCreature {
  return {
    id,
    speciesId,
    gender: 'female',
    level: 3,
    xp: 0,
    equippedAttacks: [],
    isShiny: false,
  };
}

beforeEach(() => {
  useGameStore.persist.setOptions({
    storage: createJSONStorage(() => window.localStorage),
  });
  resetStore();
});
afterEach(() => useGameStore.persist.setOptions({ storage }));

describe('creature original ownership', () => {
  it('records guest ownership in both party and storage', () => {
    const store = useGameStore.getState();
    store.createProfile(0);
    store.addCreatureToProfile(0, acquisition());
    store.addCreatureToProfile(0, acquisition('stored-instance'), true);
    const profile = useGameStore.getState().profiles[0]!;
    expect(profile.ownerId).toBe(GUEST_OWNER_ID);
    for (const creature of [
      ...profile.creatures,
      ...profile.storageCreatures,
    ]) {
      expect(creature.originalOwnerId).toBe(GUEST_OWNER_ID);
    }
  });

  it('shares an account identity across save slots and assigns it on acquisition', () => {
    const store = useGameStore.getState();
    for (let slot = 0; slot < MAX_PROFILES; slot++) {
      store.createProfile(slot, accountId);
      store.addCreatureToProfile(slot, acquisition(`party-${slot}`));
      store.addCreatureToProfile(
        slot,
        {
          ...acquisition(`storage-${slot}`),
          originalOwnerId: GUEST_OWNER_ID,
        },
        true
      );
    }
    for (const profile of useGameStore.getState().profiles) {
      expect(profile?.ownerId).toBe(accountId);
      for (const creature of [
        ...profile!.creatures,
        ...profile!.storageCreatures,
      ]) {
        expect(creature.originalOwnerId).toBe(accountId);
      }
    }
  });

  it('uses the destination save owner and covers automatic storage overflow', () => {
    const store = useGameStore.getState();
    store.createProfile(0, accountId);
    store.createProfile(1, 'another-account');
    for (let index = 0; index <= MAX_PARTY_SIZE; index++) {
      store.addCreatureToProfile(0, acquisition(`captured-${index}`));
    }
    expect(
      useGameStore.getState().profiles[0]?.storageCreatures[0].originalOwnerId
    ).toBe(accountId);
  });

  it('covers starters and story grants without replacing an established owner', () => {
    const store = useGameStore.getState();
    store.createProfile(0, accountId);
    store.clearQueue();
    store.enqueueAndProcessEvents([
      {
        type: 'PICK_STARTER',
        payload: { flag: GameFlag.STARTER_PALMIT },
      },
    ]);
    expect(
      useGameStore.getState().profiles[0]?.storageCreatures[0].originalOwnerId
    ).toBe(accountId);

    const gift: PlayerCreature = {
      ...acquisition('gift'),
      originalOwnerId: firstOwnerId,
    };
    store.enqueueAndProcessEvents([
      {
        type: 'ADD_CREATURE_TO_PROFILE',
        payload: { profileId: 0, creature: resolvePlayerCreature(gift) },
      },
    ]);
    expect(
      useGameStore.getState().profiles[0]?.creatures[0].originalOwnerId
    ).toBe(firstOwnerId);
  });

  it('preserves provenance through battle updates, move changes, storage moves, and reload', async () => {
    const store = useGameStore.getState();
    store.createProfile(0, accountId);
    store.addCreatureToProfile(0, {
      ...acquisition(),
      originalOwnerId: firstOwnerId,
    });
    const creature = useGameStore.getState().profiles[0]!.creatures[0];
    store.updateCreatures([
      {
        ...creature,
        level: creature.level + 1,
        originalOwnerId: 'incorrect-battle-owner',
      },
    ]);
    store.updateCreatureAttacks(creature.id, [], 0);
    store.reorderCreatures(0, MAX_PARTY_SIZE);
    await useGameStore.persist.rehydrate();
    const reloaded = useGameStore.getState().profiles[0]!.storageCreatures[0];
    expect(reloaded).toMatchObject({
      id: creature.id,
      originalOwnerId: firstOwnerId,
      level: creature.level + 1,
    });
    expect(resolvePlayerCreature(reloaded).originalOwnerId).toBe(firstOwnerId);
  });

  it('assigns ownership to development roster replacements including overflow', () => {
    const store = useGameStore.getState();
    store.createProfile(0, accountId);
    store.overwriteProfileCreatures(
      Array.from({ length: MAX_PARTY_SIZE + 1 }, (_, index) =>
        acquisition(`replacement-${index}`)
      )
    );
    const profile = useGameStore.getState().profiles[0]!;
    expect(profile.storageCreatures).toHaveLength(1);
    expect(
      [...profile.creatures, ...profile.storageCreatures].every(
        (creature) => creature.originalOwnerId === accountId
      )
    ).toBe(true);
  });

  it('does not claim a guest save when another save is created for an account', () => {
    const store = useGameStore.getState();
    store.createProfile(0);
    store.addCreatureToProfile(0, acquisition());
    store.createProfile(1, accountId);
    store.selectProfile(0);
    expect(useGameStore.getState().profiles[0]).toMatchObject({
      ownerId: GUEST_OWNER_ID,
      creatures: [expect.objectContaining({ originalOwnerId: GUEST_OWNER_ID })],
    });
  });

  it('resets pre-ownership saves on reload with the bumped profile version', async () => {
    const store = useGameStore.getState();
    store.createProfile(0);
    const profile = useGameStore.getState().profiles[0]!;
    const oldProfile = { ...profile, ownerId: undefined };
    const legacyCreature = acquisition();
    window.localStorage.setItem(
      'cosmoids-game-state',
      JSON.stringify({
        state: {
          profiles: [
            {
              ...oldProfile,
              version: CURRENT_PROFILE_VERSION - 1,
              creatures: [legacyCreature],
              storageCreatures: [legacyCreature],
            },
            null,
            null,
          ],
        },
        version: 0,
      })
    );
    await useGameStore.persist.rehydrate();
    expect(useGameStore.getState().profiles[0]).toMatchObject({
      ownerId: GUEST_OWNER_ID,
      version: CURRENT_PROFILE_VERSION,
      creatures: [],
      storageCreatures: [],
    });
  });
});
