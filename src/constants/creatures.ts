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
  learnableAttacks: [{ level: 1, attackId: 'TACKLE' }],
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
  id: 'harlequill',
  name: 'Harlequill',
  type: ElementType.FLYING,
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
    { level: 3, attackId: 'PECK' },
    { level: 6, attackId: 'STRING_SHOT' },
  ],
};

export const MOPUP: CosmoidTemplate = {
  id: 'mopup',
  name: 'Mopup',
  type: ElementType.WATER,
  baseStats: {
    hp: 55,
    attack: 40,
    defense: 60,
    specialAttack: 55,
    specialDefense: 60,
    speed: 40,
  },
  baseExperience: 62,
  iconImg: '/UI/Icons/mopup_icon.png',
  spriteUrl: '/battles/cosmoids/mopup_down.png',
  battleSpriteUrl: '/battles/cosmoids/mopup_left.png',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'TACKLE' },
    { level: 3, attackId: 'BUBBLE_BEAM' },
    { level: 6, attackId: 'STRING_SHOT' },
  ],
};

export const CAFFIQUI: CosmoidTemplate = {
  id: 'caffiqui',
  name: 'Caffiqui',
  type: ElementType.GRASS,
  baseStats: {
    hp: 44,
    attack: 60,
    defense: 42,
    specialAttack: 38,
    specialDefense: 50,
    speed: 72,
  },
  baseExperience: 64,
  iconImg: '/UI/Icons/caffiqui_icon.png',
  spriteUrl: '/battles/cosmoids/caffiqui_down.png',
  battleSpriteUrl: '/battles/cosmoids/caffiqui_left.png',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'TACKLE' },
    { level: 3, attackId: 'VINE_WHIP' },
    { level: 6, attackId: 'STRING_SHOT' },
  ],
};

export const SNOUTASCO: CosmoidTemplate = {
  id: 'snoutasco',
  name: 'Snoutasco',
  type: ElementType.POISON,
  baseStats: {
    hp: 48,
    attack: 62,
    defense: 44,
    specialAttack: 35,
    specialDefense: 50,
    speed: 58,
  },
  baseExperience: 63,
  iconImg: '/UI/Icons/snoutasco_icon.png',
  spriteUrl: '/battles/cosmoids/snoutasco_down.png',
  battleSpriteUrl: '/battles/cosmoids/snoutasco_left.png',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'NIBBLE' },
    { level: 3, attackId: 'VINE_WHIP' },
    { level: 6, attackId: 'STRING_SHOT' },
  ],
};

export const ZAPYBARA: CosmoidTemplate = {
  id: 'zapybara',
  name: 'Zapybara',
  type: ElementType.ELECTRIC,
  baseStats: {
    hp: 65,
    attack: 68,
    defense: 72,
    specialAttack: 36,
    specialDefense: 58,
    speed: 45,
  },
  baseExperience: 65,
  iconImg: '/UI/Icons/zapybara_icon.png',
  spriteUrl: '/battles/cosmoids/zapybara_down.png',
  battleSpriteUrl: '/battles/cosmoids/zapybara_left.png',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'NIBBLE' },
    { level: 3, attackId: 'TACKLE' },
    { level: 6, attackId: 'STRING_SHOT' },
  ],
};

export const BETTLE: CosmoidTemplate = {
  id: 'bettle',
  name: 'Bettle',
  type: ElementType.BUG,
  secondaryType: ElementType.STEEL,
  baseStats: {
    hp: 72,
    attack: 70,
    defense: 88,
    specialAttack: 28,
    specialDefense: 72,
    speed: 24,
  },
  baseExperience: 68,
  iconImg: '/UI/Icons/bettle_icon.png',
  spriteUrl: '/battles/cosmoids/bettle_down.png',
  battleSpriteUrl: '/battles/cosmoids/bettle_left.png',
  movementId: 'lizard',
  learnableAttacks: [
    { level: 1, attackId: 'PINCH' },
    { level: 3, attackId: 'TACKLE' },
    { level: 6, attackId: 'STRING_SHOT' },
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
    { level: 9, attackId: 'EMBER' },
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
    { level: 8, attackId: 'WATER_GUN' },
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
  [MOPUP.id]: MOPUP,
  [CAFFIQUI.id]: CAFFIQUI,
  [SNOUTASCO.id]: SNOUTASCO,
  [ZAPYBARA.id]: ZAPYBARA,
  [BETTLE.id]: BETTLE,
};
