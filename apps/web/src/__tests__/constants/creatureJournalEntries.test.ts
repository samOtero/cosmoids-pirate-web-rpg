import { describe, expect, it } from 'vitest';
import { COSMOID_TEMPLATES } from '@/constants/creatures';
import { TD_LEVELS } from '@/constants/tdLevels';

describe.each(Object.entries(COSMOID_TEMPLATES))(
  '%s journal note',
  (id, species) => {
    it('keeps an authored field note nonempty when supplied', () => {
      // The journal UI supports species whose notes are still being developed.
      if (species.journalEntry === undefined) return;
      expect(species.journalEntry.trim(), id).not.toBe('');
    });
  }
);

describe.each(Object.entries(TD_LEVELS))(
  '%s journal sightings',
  (id, config) => {
    it('reveals only registered species', () => {
      for (const speciesId of config.journalCompletion?.seenSpeciesIds ?? []) {
        expect(
          COSMOID_TEMPLATES[speciesId],
          `${id}: unknown sighting ${speciesId}`
        ).toBeDefined();
      }
    });
  }
);
