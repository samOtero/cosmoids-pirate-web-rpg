import { CURRENT_PROFILE_VERSION } from '@/constants/game';
import { StoryProgression, type Profile } from '@/types/baseGame';
import { GUEST_OWNER_ID } from './creatureOwnership';

/** Fresh game state shared by local creation and the initial cloud request. */
export function createNewProfile(
  slot: number,
  ownerId = GUEST_OWNER_ID
): Profile {
  return {
    id: slot,
    ownerId,
    name: 'Caleb',
    lastPlayed: Date.now(),
    creatures: [],
    storageCreatures: [],
    capturedSpeciesIds: [],
    inventory: [],
    gameFlags: [],
    storyProgression: StoryProgression.NEW_GAME,
    journalUnlockShown: false,
    journalOpened: false,
    version: CURRENT_PROFILE_VERSION,
  };
}
