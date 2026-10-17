import { AttackId, SpeciesId } from '@/types/definitionIds';
import { Creature, PlayerCreature, CosmoidTemplate } from '@/types/baseGame';
import { COSMOID_TEMPLATES } from '@/constants/creatures';
import { rollCreatureGender } from '@/utils/creatureGender';

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
 * Resolves default moves for a species at a given level.
 */
export function getDefaultAttacksForLevel(
  template: CosmoidTemplate,
  level: number
): AttackId[] {
  // Collect all learnable attacks up to the specified level
  const attacks = template.learnableAttacks
    .filter((a) => a.level <= level)
    .map((a) => a.attackId);

  // Return the last 4 unlocked, or tackle as standard fallback
  if (attacks.length === 0) return [AttackId.TACKLE];
  return attacks.slice(-4);
}

/**
 * Generates a fully-resolved runtime Creature instance for wild/enemy creatures.
 */
export function createWildCreature(
  speciesId: SpeciesId,
  level: number,
  isShiny: boolean = false
): Creature {
  const template = COSMOID_TEMPLATES[speciesId];
  if (!template) throw new Error(`Unknown creature definition: ${speciesId}`);
  const maxHp = calculateMaxHp(template.baseStats.hp, level);

  return {
    id: `wild_${speciesId}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    speciesId,
    gender: rollCreatureGender(template.genderRatio),
    name: template.name,
    type: template.type,
    secondaryType: template.secondaryType,
    maxHp,
    currentHp: maxHp,
    attack: calculateStat(template.baseStats.attack, level),
    defense: calculateStat(template.baseStats.defense, level),
    specialAttack: calculateStat(template.baseStats.specialAttack, level),
    specialDefense: calculateStat(template.baseStats.specialDefense, level),
    speed: calculateStat(template.baseStats.speed, level),
    baseExperience: template.baseExperience,
    level,
    xp: 0,
    moves: getDefaultAttacksForLevel(template, level),
    spriteUrl: template.spriteUrl,
    iconImg: template.iconImg,
    battleSpriteUrl: template.battleSpriteUrl,
    battlePosition: template.battlePosition,
    battleScale: template.battleScale,
    movementId: template.movementId,
    isShiny,
  };
}

/**
 * Resolves a slim PlayerCreature into a full Creature by merging base species
 * stats with the instance's runtime fields (level, xp, moves from equippedAttacks).
 */
export function resolvePlayerCreature(pc: PlayerCreature): Creature {
  const template = COSMOID_TEMPLATES[pc.speciesId];
  if (!template)
    throw new Error(`Unknown creature definition: ${pc.speciesId}`);
  const maxHp = calculateMaxHp(template.baseStats.hp, pc.level);

  return {
    id: pc.id,
    originalOwnerId: pc.originalOwnerId,
    speciesId: pc.speciesId,
    gender: pc.gender,
    name: template.name,
    type: template.type,
    secondaryType: template.secondaryType,
    maxHp,
    currentHp: maxHp,
    attack: calculateStat(template.baseStats.attack, pc.level),
    defense: calculateStat(template.baseStats.defense, pc.level),
    specialAttack: calculateStat(template.baseStats.specialAttack, pc.level),
    specialDefense: calculateStat(template.baseStats.specialDefense, pc.level),
    speed: calculateStat(template.baseStats.speed, pc.level),
    baseExperience: template.baseExperience,
    level: pc.level,
    xp: pc.xp,
    moves:
      pc.equippedAttacks.length > 0
        ? pc.equippedAttacks
        : getDefaultAttacksForLevel(template, pc.level),
    spriteUrl: template.spriteUrl,
    iconImg: template.iconImg,
    battleSpriteUrl: template.battleSpriteUrl,
    battlePosition: template.battlePosition,
    battleScale: template.battleScale,
    movementId: template.movementId,
    isShiny: pc.isShiny,
  };
}

/**
 * Resolves an array of PlayerCreatures.
 */
export function resolvePlayerCreatures(pcs: PlayerCreature[]): Creature[] {
  return pcs.map(resolvePlayerCreature);
}
