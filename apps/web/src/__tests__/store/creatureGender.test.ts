import { makePlayerCreature } from '@/__tests__/utils/dataBuilders';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createJSONStorage } from 'zustand/middleware';
import { useGameStore } from '@/store/gameStore';
import { CURRENT_PROFILE_VERSION, MAX_PARTY_SIZE } from '@/constants/game';
import { COSMOID_TEMPLATES } from '@/constants/creatures';
import type { PlayerCreature } from '@/types/baseGame';
import { resetStore } from '@/__tests__/utils/test-utils';

const storage = useGameStore.persist.getOptions().storage;
const speciesId = Object.values(COSMOID_TEMPLATES).find(
  (t) => t.genderRatio !== 'genderless'
)!.id;
const creature: PlayerCreature = makePlayerCreature({
  id: 'gender-test-owned',
  speciesId,
  gender: 'female',
  level: 3,
  equippedAttacks: [],
});

beforeEach(() => {
  useGameStore.persist.setOptions({
    storage: createJSONStorage(() => window.localStorage),
  });
  resetStore();
});
afterEach(() => useGameStore.persist.setOptions({ storage }));

describe('saved creature gender', () => {
  it('preserves identity in party/storage updates and a persisted reload', async () => {
    const store = useGameStore.getState();
    store.createProfile(0);
    store.addCreatureToProfile(0, creature);
    store.addCreatureToProfile(
      0,
      { ...creature, id: 'stored', gender: 'male' },
      true
    );
    store.updateCreatures([{ ...creature, level: 4, xp: 2 }]);
    await useGameStore.persist.rehydrate();
    const profile = useGameStore.getState().profiles[0]!;
    expect(profile.creatures[0]).toMatchObject({
      id: creature.id,
      gender: 'female',
      level: 4,
    });
    expect(profile.storageCreatures[0]).toMatchObject({
      id: 'stored',
      gender: 'male',
    });
    store.reorderCreatures(0, MAX_PARTY_SIZE);
    const swapped = useGameStore.getState().profiles[0]!;
    expect(swapped.creatures[0].gender).toBe('male');
    expect(swapped.storageCreatures[0].gender).toBe('female');
  });

  it('resets every outdated slot on hydration while retaining current saves', async () => {
    const store = useGameStore.getState();
    store.createProfile(0);
    const profile = useGameStore.getState().profiles[0]!;
    const profiles = [
      {
        ...profile,
        id: 0,
        name: 'Old named slot',
        version: CURRENT_PROFILE_VERSION - 1,
        creatures: [creature],
        storageCreatures: [creature],
        storyProgression: 10,
      },
      {
        ...profile,
        id: 1,
        name: 'Unversioned slot',
        version: undefined,
        creatures: [creature],
      },
      { ...profile, id: 2, creatures: [creature] },
    ];
    window.localStorage.setItem(
      'cosmoids-game-state',
      JSON.stringify({ state: { profiles }, version: 0 })
    );
    await useGameStore.persist.rehydrate();
    const saved = useGameStore.getState().profiles;
    for (const index of [0, 1]) {
      expect(saved[index]).toMatchObject({
        name: profiles[index].name,
        version: CURRENT_PROFILE_VERSION,
        creatures: [],
        storageCreatures: [],
        inventory: [],
        gameFlags: [],
        storyProgression: 0,
        capturedSpeciesIds: [],
      });
    }
    expect(saved[2]?.creatures[0].gender).toBe(creature.gender);
  });

  it('also resets an outdated profile when selected directly', () => {
    const store = useGameStore.getState();
    store.createProfile(0);
    const profile = useGameStore.getState().profiles[0]!;
    useGameStore.setState({
      profiles: [
        {
          ...profile,
          version: CURRENT_PROFILE_VERSION - 1,
          creatures: [creature],
        },
        null,
        null,
      ],
    });
    store.selectProfile(0);
    expect(useGameStore.getState().profiles[0]).toMatchObject({
      version: CURRENT_PROFILE_VERSION,
      creatures: [],
      storageCreatures: [],
      storyProgression: 0,
    });
  });
});
