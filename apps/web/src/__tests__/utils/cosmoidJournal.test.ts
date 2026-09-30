import { describe, expect, it, vi } from 'vitest';
import {
  getCapturedSpeciesIds,
  getJournalSeenSpeciesIds,
} from '@/utils/cosmoidJournal';
import { type Profile, StoryProgression } from '@/types/baseGame';

vi.mock('@/constants/tdLevels', async () => {
  const { StoryProgression: milestones } = await import('@/types/baseGame');
  return {
    TD_LEVELS: {
      first: {
        journalCompletion: {
          progression: milestones.DEFEAT_FIRST_BATTLE,
          seenSpeciesIds: ['test_seen_first', 'test_shared'],
        },
      },
      second: {
        journalCompletion: {
          progression: milestones.DEFEAT_BUG_STAGE_1,
          seenSpeciesIds: ['test_shared', 'test_seen_second'],
        },
      },
      unfinished: {},
    },
  };
});

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 0,
    name: 'Test player',
    lastPlayed: 0,
    creatures: [],
    storageCreatures: [],
    inventory: [],
    gameFlags: [],
    storyProgression: StoryProgression.NEW_GAME,
    ...overrides,
  };
}

function owned(speciesId: string) {
  return {
    id: speciesId,
    speciesId,
    level: 5,
    xp: 0,
    equippedAttacks: [],
    isShiny: false,
  };
}

describe('journal derivation', () => {
  it('reveals completed milestones, deduplicates sightings, and ignores unfinished levels', () => {
    expect([
      ...getJournalSeenSpeciesIds(
        profile({ storyProgression: StoryProgression.PICK_STARTER })
      ),
    ]).toEqual([]);
    expect([
      ...getJournalSeenSpeciesIds(
        profile({ storyProgression: StoryProgression.DEFEAT_FIRST_BATTLE })
      ),
    ]).toEqual(['test_seen_first', 'test_shared']);
    expect([
      ...getJournalSeenSpeciesIds(
        profile({ storyProgression: StoryProgression.DEFEAT_BUG_STAGE_1 })
      ),
    ]).toEqual(['test_seen_first', 'test_shared', 'test_seen_second']);
    expect([
      ...getJournalSeenSpeciesIds(
        profile({ storyProgression: StoryProgression.COMPLETE_LEVEL_7 })
      ),
    ]).toEqual(['test_seen_first', 'test_shared', 'test_seen_second']);
  });

  it('includes party and storage species without inventing past evolutionary forms', () => {
    const legacy = profile({
      creatures: [owned('test_evolved')],
      storageCreatures: [owned('test_stored')],
    });
    expect([...getCapturedSpeciesIds(legacy)]).toEqual([
      'test_evolved',
      'test_stored',
    ]);
    expect(getJournalSeenSpeciesIds(legacy).has('test_pre_evolution')).toBe(
      false
    );
  });

  it('retains capture history alongside current ownership and story sightings', () => {
    const saved = profile({
      creatures: [owned('test_current')],
      capturedSpeciesIds: ['test_released', 'test_current'],
      storyProgression: StoryProgression.DEFEAT_FIRST_BATTLE,
    });
    expect([...getCapturedSpeciesIds(saved)]).toEqual([
      'test_released',
      'test_current',
    ]);
    expect(getJournalSeenSpeciesIds(saved)).toEqual(
      new Set([
        'test_released',
        'test_current',
        'test_seen_first',
        'test_shared',
      ])
    );
  });
});
