import { CosmoidTemplate, ElementType } from '@/types/baseGame';

export const SENTICLE: CosmoidTemplate = {
  id: 'senticle',
  name: 'Senticle',
  type: ElementType.WATER,
  baseStats: {
    hp: 20,
    attack: 10,
    defense: 5,
    specialAttack: 15,
    specialDefense: 10,
    speed: 30,
  },
  baseExperience: 62,
  iconImg: '/UI/Icons/senticle_icon.png',
  spriteUrl: '/eel-basic-normal-neutral-skin-1.png',
  battleSpriteUrl:
    '/battles/cosmoids/eel-basic-normal-neutral-skin-battle-ground-2.png',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'TACKLE' },
  ],
};

export const MOUSE_1: CosmoidTemplate = {
  id: 'mouse_1',
  name: 'Knotia',
  type: ElementType.NORMAL,
  baseStats: {
    hp: 30,
    attack: 56,
    defense: 35,
    specialAttack: 25,
    specialDefense: 35,
    speed: 30,
  },
  baseExperience: 51,
  iconImg: '/UI/Icons/mouse_1_icon.png',
  spriteUrl: '/battles/cosmoids/mouse_1_down_1_25.png',
  battleSpriteUrl: '/battles/cosmoids/mouse_1_down_1_25.png',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'NIBBLE' },
    { level: 3, attackId: 'STRING_SHOT' },
  ],
};

export const BIRD_1: CosmoidTemplate = {
  id: 'bird_1',
  name: 'Bird 1',
  type: ElementType.NORMAL,
  baseStats: {
    hp: 20,
    attack: 15,
    defense: 20,
    specialAttack: 10,
    specialDefense: 10,
    speed: 30,
  },
  baseExperience: 50,
  iconImg: '/UI/Icons/bird_1_icon.png',
  spriteUrl: '/battles/cosmoids/bird_1_down_1_25.png',
  battleSpriteUrl: '/battles/cosmoids/bird_1_down_1_25.png',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'TACKLE' },
    { level: 1, attackId: 'STRING_SHOT' },
  ],
};

export const BUG_STAGE_1: CosmoidTemplate = {
  id: 'bug_stage_1',
  name: 'Buglet',
  type: ElementType.GRASS,
  baseStats: {
    hp: 25,
    attack: 15,
    defense: 20,
    specialAttack: 10,
    specialDefense: 15,
    speed: 10,
  },
  baseExperience: 53,
  spriteUrl: '/battles/cosmoids/bug_1_left_1.png',
  battleSpriteUrl: '/battles/cosmoids/bug_1_left_1.png',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'TACKLE' },
    { level: 1, attackId: 'STRING_SHOT' },
  ],
};

export const BUG_STAGE_2: CosmoidTemplate = {
  id: 'bug_stage_2',
  name: 'Bugitor',
  type: ElementType.GRASS,
  baseStats: {
    hp: 25,
    attack: 15,
    defense: 20,
    specialAttack: 12,
    specialDefense: 18,
    speed: 10,
  },
  baseExperience: 85,
  spriteUrl: '/bug-2-basic-normal-neutral-skin-1.png',
  battleSpriteUrl: '/battles/cosmoids/bug-2-basic-normal-neutral-skin-1.png',
  battleScale: 1.25,
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'TACKLE' }, // Replace Bug Bite with TACKLE since BUG_BITE is not in ATTACK_DEFS
    { level: 1, attackId: 'STRING_SHOT' },
  ],
};

export const BUG_STAGE_3: CosmoidTemplate = {
  id: 'bug_stage_3',
  name: 'Moth',
  type: ElementType.GRASS,
  baseStats: {
    hp: 25,
    attack: 15,
    defense: 20,
    specialAttack: 20,
    specialDefense: 20,
    speed: 10,
  },
  baseExperience: 140,
  spriteUrl: '/bug-2-basic-normal-neutral-skin-1.png',
  battleSpriteUrl: '/battles/cosmoids/moth-basic-normal-neutral-skin-1.png',
  battleScale: 0.85,
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'TACKLE' },
    { level: 1, attackId: 'STRING_SHOT' },
  ],
};

// Starter Cosmoid Definitions
export const STARTER_CRAB: CosmoidTemplate = {
  id: 'starter_crab',
  name: 'Palmit',
  type: ElementType.GRASS,
  baseStats: {
    hp: 55,
    attack: 55,
    defense: 65,
    specialAttack: 45,
    specialDefense: 58,
    speed: 40,
  },
  baseExperience: 64,
  iconImg: '/UI/Icons/palmit_icon.png',
  spriteUrl: '/battles/cosmoids/palmit_down_1.png',
  battleSpriteUrl: '/battles/cosmoids/palmit_down_1.png',
  learnableAttacks: [
    { level: 1, attackId: 'PINCH' },
    { level: 2, attackId: 'VINE_WHIP' },
    { level: 2, attackId: 'EMBER' }, // push back attack unlocks for testing in level 1
    { level: 3, attackId: 'BUBBLE_BEAM' },
    { level: 4, attackId: 'STRING_SHOT' },
  ],
  evolutionNodes: [
    { level: 10, evolutionDefId: 'bug_stage_2' }, // push back evolution for testing
  ],
};

export const STARTER_IGUANA: CosmoidTemplate = {
  id: 'starter_iguana',
  name: 'Fueguana',
  type: ElementType.FIRE,
  baseStats: {
    hp: 38,
    attack: 70,
    defense: 35,
    specialAttack: 46,
    specialDefense: 44,
    speed: 75,
  },
  baseExperience: 62,
  spriteUrl: '/battles/cosmoids/fueguana_left_1_v3.png',
  iconImg: '/UI/Icons/fueguana_icon.png',
  battleSpriteUrl: '/battles/cosmoids/fueguana_left_1_v3.png',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'SCRATCH' },
    { level: 3, attackId: 'EMBER' },
  ],
};

export const STARTER_MONKEY: CosmoidTemplate = {
  id: 'starter_monkey',
  name: 'Monkeg',
  type: ElementType.WATER,
  baseStats: {
    hp: 62,
    attack: 65,
    defense: 58,
    specialAttack: 44,
    specialDefense: 55,
    speed: 30,
  },
  baseExperience: 63,
  iconImg: '/UI/Icons/monkeg_icon.png',
  spriteUrl: '/battles/cosmoids/monkeg_down_1_v2.png',
  battleSpriteUrl: '/battles/cosmoids/monkeg_down_1_v2.png',
  learnableAttacks: [
    { level: 1, attackId: 'TACKLE' },
    { level: 3, attackId: 'BUBBLE_BEAM' },
    { level: 5, attackId: 'SCRATCH' },
  ],
};

/** All known species definitions, keyed by species ID. */
export const COSMOID_TEMPLATES: Record<string, CosmoidTemplate> = {
  [STARTER_CRAB.id]: STARTER_CRAB,
  [STARTER_IGUANA.id]: STARTER_IGUANA,
  [STARTER_MONKEY.id]: STARTER_MONKEY,
  [BUG_STAGE_1.id]: BUG_STAGE_1,
  [BUG_STAGE_2.id]: BUG_STAGE_2,
  [BUG_STAGE_3.id]: BUG_STAGE_3,
  [SENTICLE.id]: SENTICLE,
  [MOUSE_1.id]: MOUSE_1,
  [BIRD_1.id]: BIRD_1,
};
