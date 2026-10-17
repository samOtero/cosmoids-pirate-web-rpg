import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createJSONStorage } from 'zustand/middleware';
import { COSMOID_TEMPLATES } from '@/constants/creatures';
import { useGameStore } from '@/store/gameStore';
import { resolvePlayerCreature } from '@/utils/resolvePlayerCreature';
import {
  makePlayerCreature,
  testDefinitionId,
} from '@/__tests__/utils/dataBuilders';
import { resetStore } from '@/__tests__/utils/test-utils';

const storage = useGameStore.persist.getOptions().storage;
beforeEach(() => {
  useGameStore.persist.setOptions({
    storage: createJSONStorage(() => window.localStorage),
  });
  resetStore();
});
afterEach(() => useGameStore.persist.setOptions({ storage }));

describe('numeric definition persistence', () => {
  it('round-trips numeric species, moves and capture history with distinct string identities', async () => {
    const template = Object.values(COSMOID_TEMPLATES).find(
      (species) => species.learnableAttacks.length > 0
    )!;
    const moves = template.learnableAttacks.map((move) => move.attackId);
    const ownerId = 'test-account';
    const store = useGameStore.getState();
    store.createProfile(0, ownerId);
    for (const inStorage of [false, true]) {
      store.addCreatureToProfile(
        0,
        makePlayerCreature({
          id: inStorage ? 'stored-instance' : 'party-instance',
          speciesId: template.id,
          equippedAttacks: moves,
        }),
        inStorage
      );
    }
    const saved = JSON.parse(
      window.localStorage.getItem('cosmoids-game-state')!
    ).state.profiles[0];
    expect(saved.capturedSpeciesIds).toContain(template.id);
    expect(saved.creatures[0].speciesId).toBe(template.id);
    expect(saved.creatures[0].equippedAttacks).toEqual(moves);
    expect(typeof saved.creatures[0].speciesId).toBe('number');
    expect(
      saved.creatures[0].equippedAttacks.every(
        (id: unknown) => typeof id === 'number'
      )
    ).toBe(true);
    await useGameStore.persist.rehydrate();
    const profile = useGameStore.getState().profiles[0]!;
    expect(profile.ownerId).toBe(ownerId);
    for (const creature of [
      ...profile.creatures,
      ...profile.storageCreatures,
    ]) {
      expect(typeof creature.id).toBe('string');
      expect(creature.originalOwnerId).toBe(ownerId);
      expect(creature.speciesId).toBe(template.id);
      expect(creature.equippedAttacks).toEqual(moves);
      expect(resolvePlayerCreature(creature).speciesId).toBe(template.id);
    }
  });
  it('rejects unknown species instead of substituting a different creature', () => {
    const creature = makePlayerCreature({
      id: 'unknown-instance',
      speciesId: testDefinitionId('unknown-species'),
    });
    expect(() => resolvePlayerCreature(creature)).toThrow(
      'Unknown creature definition'
    );
  });
});
