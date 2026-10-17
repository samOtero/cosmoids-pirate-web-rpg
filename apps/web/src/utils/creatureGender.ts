import type { SpeciesId } from '@/types/definitionIds';
import { COSMOID_TEMPLATES } from '@/constants/creatures';
import type { CreatureGender, CreatureGenderRatio } from '@/types/baseGame';

/** Called only when creating an individual; resolution and capture copy its gender. */
export function rollCreatureGender(
  ratio: CreatureGenderRatio,
  random: () => number = Math.random
): CreatureGender {
  if (ratio === 'genderless') return 'genderless';
  if (!Number.isFinite(ratio.female) || ratio.female < 0 || ratio.female > 1) {
    throw new Error('Female gender probability must be between 0 and 1.');
  }
  if (ratio.female === 0) return 'male';
  if (ratio.female === 1) return 'female';
  return random() < ratio.female ? 'female' : 'male';
}

export function generateCreatureGender(
  speciesId: SpeciesId,
  random: () => number = Math.random
): CreatureGender {
  const template = COSMOID_TEMPLATES[speciesId];
  if (!template) throw new Error(`Unknown creature species: ${speciesId}`);
  return rollCreatureGender(template.genderRatio, random);
}

export function isCreatureGenderAllowed(
  ratio: CreatureGenderRatio,
  gender: unknown
): gender is CreatureGender {
  if (ratio === 'genderless') return gender === 'genderless';
  return (
    (gender === 'female' && ratio.female > 0) ||
    (gender === 'male' && ratio.female < 1)
  );
}

export function resolveEncounterGender(
  speciesId: SpeciesId,
  override?: CreatureGender
): CreatureGender {
  if (override === undefined) return generateCreatureGender(speciesId);
  const template = COSMOID_TEMPLATES[speciesId];
  if (!template || !isCreatureGenderAllowed(template.genderRatio, override)) {
    throw new Error(
      `Invalid gender override for creature species: ${speciesId}`
    );
  }
  return override;
}

export const CREATURE_GENDER_LABELS: Record<CreatureGender, string> = {
  male: 'Male',
  female: 'Female',
  genderless: 'Genderless',
};
