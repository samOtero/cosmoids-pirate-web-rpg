import { Creature, PlayerCreature } from '@/types/baseGame';
import {
  STARTER_CRAB,
  STARTER_IGUANA,
  STARTER_MONKEY,
  BUG_STAGE_1,
  BUG_STAGE_2,
  BUG_STAGE_3,
  SENTICLE,
} from '@/constants/creatures';

/** All known species definitions, keyed by species ID. */
const SPECIES_DEFS: Record<string, Creature> = {
  [STARTER_CRAB.id]: STARTER_CRAB,
  [STARTER_IGUANA.id]: STARTER_IGUANA,
  [STARTER_MONKEY.id]: STARTER_MONKEY,
  [BUG_STAGE_1.id]: BUG_STAGE_1,
  [BUG_STAGE_2.id]: BUG_STAGE_2,
  [BUG_STAGE_3.id]: BUG_STAGE_3,
  [SENTICLE.id]: SENTICLE,
};

/**
 * Resolves a slim PlayerCreature into a full Creature by merging base species
 * stats with the instance's runtime fields (level, xp, moves from equippedAttacks).
 * Used when the battle system or UI components need the full Creature shape.
 */
export function resolvePlayerCreature(pc: PlayerCreature): Creature {
  const baseDef = SPECIES_DEFS[pc.speciesId] ?? STARTER_CRAB;
  return {
    ...baseDef,
    id: pc.id,
    speciesId: pc.speciesId,
    level: pc.level,
    xp: pc.xp,
    moves: pc.equippedAttacks.length > 0 ? pc.equippedAttacks : baseDef.moves,
    currentHp: baseDef.maxHp, // PlayerCreature doesn't track HP — default to full
    currentEnergy: baseDef.startingEnergy,
  };
}

/**
 * Resolves an array of PlayerCreatures.
 */
export function resolvePlayerCreatures(pcs: PlayerCreature[]): Creature[] {
  return pcs.map(resolvePlayerCreature);
}
