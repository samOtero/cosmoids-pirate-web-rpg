import { TD_LEVELS } from '@/constants/tdLevels';
import { Profile } from '@/types/baseGame';

/** Exact species the player currently owns; evolutions do not imply earlier forms. */
export function getCapturedSpeciesIds(profile: Profile): Set<string> {
  return new Set(
    [...profile.creatures, ...profile.storageCreatures].map(
      (creature) => creature.speciesId
    )
  );
}

/** Species Kip has documented through completed levels, plus exact captures. */
export function getJournalSeenSpeciesIds(profile: Profile): Set<string> {
  const seenSpeciesIds = getCapturedSpeciesIds(profile);

  Object.values(TD_LEVELS).forEach((level) => {
    const journalCompletion = level.journalCompletion;
    if (
      journalCompletion &&
      profile.storyProgression >= journalCompletion.progression
    ) {
      journalCompletion.seenSpeciesIds.forEach((speciesId) =>
        seenSpeciesIds.add(speciesId)
      );
    }
  });

  return seenSpeciesIds;
}
