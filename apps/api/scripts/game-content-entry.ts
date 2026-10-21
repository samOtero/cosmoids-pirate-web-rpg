import { COSMOID_TEMPLATES } from '../../web/src/constants/creatures';
import { ATTACK_DEFS } from '../../web/src/engine/tower-defense/attacks/definitions';
import {
  CURRENT_PROFILE_VERSION,
  MAX_COSMOID_LEVEL,
  MAX_PARTY_SIZE,
  MAX_PROFILES,
} from '../../web/src/constants/game';
import { GameFlag, StoryProgression } from '../../web/src/types/baseGame';

export const gameContent = {
  profileVersion: CURRENT_PROFILE_VERSION,
  maxLevel: MAX_COSMOID_LEVEL,
  maxPartySize: MAX_PARTY_SIZE,
  maxProfiles: MAX_PROFILES,
  gameFlags: Object.values(GameFlag),
  storyProgressions: Object.values(StoryProgression),
  attackIds: Object.values(ATTACK_DEFS).map((attack) => attack.id),
  species: Object.values(COSMOID_TEMPLATES).map((species) => ({
    id: species.id,
    genderRatio: species.genderRatio,
    learnableAttacks: species.learnableAttacks,
    evolutionNodes: species.evolutionNodes ?? [],
  })),
};
