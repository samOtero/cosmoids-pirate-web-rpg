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
 * Calculates max HP using the standard formula without IVs/EVs.
 * HP = floor((2 * Base * Level) / 100) + Level + 10
 */
export function calculateMaxHp(baseHp: number, level: number): number {
  return Math.floor((2 * baseHp * level) / 100) + level + 10;
}

/**
 * Calculates a non-HP stat using the standard formula without IVs/EVs/Nature.
 * Stat = floor((2 * Base * Level) / 100) + 5
 */
export function calculateStat(baseStat: number, level: number): number {
  return Math.floor((2 * baseStat * level) / 100) + 5;
}

/**
 * Resolves a slim PlayerCreature into a full Creature by merging base species
 * stats with the instance's runtime fields (level, xp, moves from equippedAttacks).
 * Used when the battle system or UI components need the full Creature shape.
 */
export function resolvePlayerCreature(pc: PlayerCreature): Creature {
  const baseDef = SPECIES_DEFS[pc.speciesId] ?? STARTER_CRAB;
  
  const maxHp = calculateMaxHp(baseDef.maxHp, pc.level);
  const attack = calculateStat(baseDef.attack, pc.level);
  const defense = calculateStat(baseDef.defense, pc.level);
  const specialAttack = calculateStat(baseDef.specialAttack, pc.level);
  const specialDefense = calculateStat(baseDef.specialDefense, pc.level);
  const speed = calculateStat(baseDef.speed, pc.level);

  return {
    ...baseDef,
    id: pc.id,
    speciesId: pc.speciesId,
    level: pc.level,
    xp: pc.xp,
    moves: pc.equippedAttacks.length > 0 ? pc.equippedAttacks : baseDef.moves,
    maxHp,
    attack,
    defense,
    specialAttack,
    specialDefense,
    speed,
    currentHp: maxHp, // PlayerCreature doesn't track HP — default to full
    currentEnergy: baseDef.startingEnergy,
  };
}

/**
 * Resolves an array of PlayerCreatures.
 */
export function resolvePlayerCreatures(pcs: PlayerCreature[]): Creature[] {
  return pcs.map(resolvePlayerCreature);
}
