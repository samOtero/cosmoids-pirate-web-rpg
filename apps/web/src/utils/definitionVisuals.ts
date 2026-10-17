import { COSMOID_TEMPLATES } from '@/constants/creatures';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
import type { SpeciesId } from '@/types/definitionIds';

/** Numeric creature definitions and string artwork keys are separate identities. */
export function getDefinitionVisuals(id: SpeciesId | string) {
  const key =
    typeof id === 'number' ? COSMOID_TEMPLATES[id]?.visualConfigId : id;
  return key === undefined ? undefined : CREATURE_TD_CONFIGS[key];
}
