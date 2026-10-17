import { CURRENT_PROFILE_VERSION } from '@/constants/game';
import {
  StoryProgression,
  type PlayerCreature,
  type Profile,
} from '@/types/baseGame';
import { GUEST_OWNER_ID } from '@/utils/creatureOwnership';

type CreatureOverrides = Pick<PlayerCreature, 'id' | 'speciesId'> &
  Partial<PlayerCreature>;

/** Stable numeric identities for controlled fixtures, outside shipped ID ranges. */
export function testDefinitionId(label: string): number {
  let hash = 2166136261;
  for (const character of label) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  }
  return 1_000_000 + (hash >>> 0);
}

/** Controlled test data; select registry references explicitly when needed. */
export function makePlayerCreature(
  overrides: CreatureOverrides
): PlayerCreature {
  return {
    originalOwnerId: GUEST_OWNER_ID,
    gender: 'female',
    level: 1,
    xp: 0,
    isShiny: false,
    ...overrides,
    equippedAttacks: [...(overrides.equippedAttacks ?? [])],
  };
}

/** Fresh save data independent of the store's profile-creation behavior. */
export function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 0,
    ownerId: GUEST_OWNER_ID,
    name: 'Test player',
    lastPlayed: 0,
    storyProgression: StoryProgression.NEW_GAME,
    version: CURRENT_PROFILE_VERSION,
    journalUnlockShown: false,
    journalOpened: false,
    ...overrides,
    creatures: (overrides.creatures ?? []).map(makePlayerCreature),
    storageCreatures: (overrides.storageCreatures ?? []).map(
      makePlayerCreature
    ),
    inventory: (overrides.inventory ?? []).map((item) => ({ ...item })),
    gameFlags: [...(overrides.gameFlags ?? [])],
    capturedSpeciesIds: [...(overrides.capturedSpeciesIds ?? [])],
  };
}
