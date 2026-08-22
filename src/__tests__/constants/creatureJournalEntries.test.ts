import { COSMOID_TEMPLATES } from '@/constants/creatures';

const CURRENT_JOURNAL_SPECIES_IDS = [
  'starter_crab',
  'starter_iguana',
  'starter_monkey',
  'mouse_1',
  'harlequill',
  'mopup',
  'bug_stage_1',
  'bug_stage_2',
  'bug_stage_3',
  'bettle',
  'sonarion',
  'resonarion',
] as const;

describe("Kip's journal entries", () => {
  it('has a short field note for every species currently shown in the journal', () => {
    CURRENT_JOURNAL_SPECIES_IDS.forEach((speciesId) => {
      const entry = COSMOID_TEMPLATES[speciesId].journalEntry;

      expect(entry, `${speciesId} should have a journal entry`).toBeTruthy();
      expect(entry!.length).toBeLessThanOrEqual(180);
    });
  });
});
