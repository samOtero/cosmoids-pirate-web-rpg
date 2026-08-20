import {
  getCapturedSpeciesIds,
  getJournalSeenSpeciesIds,
} from '@/utils/cosmoidJournal';
import { Profile, StoryProgression } from '@/types/baseGame';

function createProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 0,
    name: 'Caleb',
    lastPlayed: 0,
    creatures: [],
    storageCreatures: [],
    inventory: [],
    gameFlags: [],
    storyProgression: StoryProgression.NEW_GAME,
    ...overrides,
  };
}

describe("Kip's Journal derivation", () => {
  it('uses each completed level to derive sightings', () => {
    expect(
      Array.from(
        getJournalSeenSpeciesIds(
          createProfile({
            storyProgression: StoryProgression.DEFEAT_FIRST_BATTLE,
          })
        )
      )
    ).toEqual([]);

    expect(
      Array.from(
        getJournalSeenSpeciesIds(
          createProfile({
            storyProgression: StoryProgression.DEFEAT_BUG_STAGE_1,
          })
        )
      )
    ).toEqual(['mouse_1', 'harlequill', 'mopup']);

    expect(
      Array.from(
        getJournalSeenSpeciesIds(
          createProfile({
            storyProgression: StoryProgression.DEFEAT_BUG_STAGE_2,
          })
        )
      )
    ).toEqual(['mouse_1', 'harlequill', 'mopup', 'bug_stage_1', 'bettle']);
  });

  it('does not invent evolution history for a legacy profile', () => {
    const profile = createProfile({
      creatures: [
        {
          id: 'captured-bugitor',
          speciesId: 'bug_stage_2',
          level: 8,
          xp: 0,
          equippedAttacks: ['TACKLE'],
          isShiny: false,
        },
      ],
    });

    expect(Array.from(getCapturedSpeciesIds(profile))).toEqual(['bug_stage_2']);
    expect(getJournalSeenSpeciesIds(profile).has('bug_stage_1')).toBe(false);
  });

  it('retains captured forms that are no longer currently owned', () => {
    const profile = createProfile({
      creatures: [
        {
          id: 'evolved-bug',
          speciesId: 'bug_stage_3',
          level: 10,
          xp: 0,
          equippedAttacks: ['TACKLE'],
          isShiny: false,
        },
      ],
      capturedSpeciesIds: ['bug_stage_1', 'bug_stage_2', 'bug_stage_3'],
    });

    expect(Array.from(getCapturedSpeciesIds(profile))).toEqual([
      'bug_stage_1',
      'bug_stage_2',
      'bug_stage_3',
    ]);
  });
});
