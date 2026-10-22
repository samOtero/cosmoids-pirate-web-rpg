import { CURRENT_PROFILE_VERSION } from '@/constants/game';
import {
  StoryProgression,
  type PlayerCreature,
  type Profile,
} from '@/types/baseGame';
import { GUEST_OWNER_ID } from '@/utils/creatureOwnership';
import type { CloudProfile, CloudProfileSummary } from '@/types/cloudProfile';

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

/** Server response fixture, independent of the production upload serializer. */
export function makeCloudProfile(options: {
  id: string;
  slot: number;
  boxId: string;
  revision?: number;
  profile?: Partial<Profile>;
}): CloudProfile {
  const {
    id: slot,
    ownerId,
    version,
    creatures,
    storageCreatures,
    ...profileData
  } = makeProfile({ ...options.profile, id: options.slot });
  void ownerId; // Account identity is deliberately absent from the envelope.
  return {
    id: options.id,
    slot,
    revision: options.revision ?? 1,
    profileVersion: version!,
    createdAt: new Date(0).toISOString(),
    savedAt: new Date(0).toISOString(),
    profileData,
    creatures,
    storageCreatures,
    storageBoxes: [
      {
        id: options.boxId,
        name: 'Test box',
        position: 0,
        creatureIds: storageCreatures.map((c) => c.id),
      },
    ],
  };
}

export function makeCloudSummary(saved: CloudProfile): CloudProfileSummary {
  return {
    id: saved.id,
    slot: saved.slot,
    revision: saved.revision,
    profileVersion: saved.profileVersion,
    name: saved.profileData.name,
    lastPlayed: saved.profileData.lastPlayed,
    storyProgression: saved.profileData.storyProgression,
    partyCount: saved.creatures.length,
    storageCount: saved.storageCreatures.length,
    savedAt: saved.savedAt,
  };
}
