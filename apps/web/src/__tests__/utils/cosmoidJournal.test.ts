import type { SpeciesId } from '@/types/definitionIds';
import {
  makeProfile,
  makePlayerCreature,
  testDefinitionId,
} from '@/__tests__/utils/dataBuilders';
import { describe, expect, it, vi } from 'vitest';
import {
  getCapturedSpeciesIds,
  getJournalSeenSpeciesIds,
} from '@/utils/cosmoidJournal';
import { StoryProgression } from '@/types/baseGame';

vi.mock('@/constants/tdLevels', async () => {
  const { StoryProgression: milestones } = await import('@/types/baseGame');
  return {
    TD_LEVELS: {
      first: {
        journalCompletion: {
          progression: milestones.DEFEAT_FIRST_BATTLE,
          seenSpeciesIds: [
            testDefinitionId('test_seen_first'),
            testDefinitionId('test_shared'),
          ],
        },
      },
      second: {
        journalCompletion: {
          progression: milestones.DEFEAT_BUG_STAGE_1,
          seenSpeciesIds: [
            testDefinitionId('test_shared'),
            testDefinitionId('test_seen_second'),
          ],
        },
      },
      unfinished: {},
    },
  };
});

function owned(speciesId: SpeciesId) {
  return makePlayerCreature({
    id: `owned-${speciesId}`,
    speciesId,
    level: 5,
    equippedAttacks: [],
  });
}

describe('journal derivation', () => {
  it('reveals completed milestones, deduplicates sightings, and ignores unfinished levels', () => {
    expect([
      ...getJournalSeenSpeciesIds(
        makeProfile({ storyProgression: StoryProgression.PICK_STARTER })
      ),
    ]).toEqual([]);
    expect([
      ...getJournalSeenSpeciesIds(
        makeProfile({ storyProgression: StoryProgression.DEFEAT_FIRST_BATTLE })
      ),
    ]).toEqual([
      testDefinitionId('test_seen_first'),
      testDefinitionId('test_shared'),
    ]);
    expect([
      ...getJournalSeenSpeciesIds(
        makeProfile({ storyProgression: StoryProgression.DEFEAT_BUG_STAGE_1 })
      ),
    ]).toEqual([
      testDefinitionId('test_seen_first'),
      testDefinitionId('test_shared'),
      testDefinitionId('test_seen_second'),
    ]);
    expect([
      ...getJournalSeenSpeciesIds(
        makeProfile({ storyProgression: StoryProgression.COMPLETE_LEVEL_7 })
      ),
    ]).toEqual([
      testDefinitionId('test_seen_first'),
      testDefinitionId('test_shared'),
      testDefinitionId('test_seen_second'),
    ]);
  });

  it('includes party and storage species without inventing past evolutionary forms', () => {
    const legacy = makeProfile({
      creatures: [owned(testDefinitionId('test_evolved'))],
      storageCreatures: [owned(testDefinitionId('test_stored'))],
    });
    expect([...getCapturedSpeciesIds(legacy)]).toEqual([
      testDefinitionId('test_evolved'),
      testDefinitionId('test_stored'),
    ]);
    expect(
      getJournalSeenSpeciesIds(legacy).has(
        testDefinitionId('test_pre_evolution')
      )
    ).toBe(false);
  });

  it('retains capture history alongside current ownership and story sightings', () => {
    const saved = makeProfile({
      creatures: [owned(testDefinitionId('test_current'))],
      capturedSpeciesIds: [
        testDefinitionId('test_released'),
        testDefinitionId('test_current'),
      ],
      storyProgression: StoryProgression.DEFEAT_FIRST_BATTLE,
    });
    expect([...getCapturedSpeciesIds(saved)]).toEqual([
      testDefinitionId('test_released'),
      testDefinitionId('test_current'),
    ]);
    expect(getJournalSeenSpeciesIds(saved)).toEqual(
      new Set([
        testDefinitionId('test_released'),
        testDefinitionId('test_current'),
        testDefinitionId('test_seen_first'),
        testDefinitionId('test_shared'),
      ])
    );
  });
});
