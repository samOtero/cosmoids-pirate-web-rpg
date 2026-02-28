import { Creature, ElementType } from '@/types/baseGame';

export const SENTICLE: Creature = {
  id: 'senticle',
  name: 'Senticle',
  type: ElementType.NORMAL,
  maxHp: 200,
  currentHp: 20,
  attack: 10,
  defense: 5,
  speed: 20,
  level: 15,
  xp: 0,
  moves: ['T Tackle', 'Leer'], // Placeholder moves
  spriteUrl: '/eel-basic-normal-neutral-skin-1.png',
  battleSpriteUrl:
    '/battles/cosmoids/eel-basic-normal-neutral-skin-battle-ground-2.png',
  movementId: 'lizard',
  startingEnergy: 0,
  currentEnergy: 0,

  speciesId: '',
};

export const BUG_STAGE_1: Creature = {
  id: 'bug_stage_1',
  name: 'Buglet',
  type: ElementType.GRASS,
  maxHp: 25,
  currentHp: 25,
  attack: 15,
  defense: 20,
  speed: 10,
  level: 3,
  xp: 0,
  moves: ['Tackle', 'String Shot'],
  spriteUrl: '/battles/cosmoids/bug_1_left_1.png',
  battleSpriteUrl: '/battles/cosmoids/bug_1_left_1.png',
  startingEnergy: 50,
  currentEnergy: 50,
  movementId: 'lizard',

  speciesId: '',
};

export const BUG_STAGE_2: Creature = {
  id: 'bug_stage_2',
  name: 'Bugitor',
  type: ElementType.GRASS,
  maxHp: 25,
  currentHp: 25,
  attack: 15,
  defense: 20,
  speed: 10,
  level: 8,
  xp: 0,
  moves: ['Bug Bite', 'String Shot'],
  spriteUrl: '/bug-2-basic-normal-neutral-skin-1.png',
  battleSpriteUrl: '/battles/cosmoids/bug-2-basic-normal-neutral-skin-1.png',
  startingEnergy: 75,
  currentEnergy: 75,
  movementId: 'lizard',

  battleScale: 1.25,
  speciesId: '',
};

export const BUG_STAGE_3: Creature = {
  id: 'bug_stage_3',
  name: 'Moth',
  type: ElementType.GRASS,
  maxHp: 25,
  currentHp: 25,
  attack: 15,
  defense: 20,
  speed: 10,
  level: 8,
  xp: 0,
  moves: ['Bug Bite', 'String Shot'],
  spriteUrl: '/bug-2-basic-normal-neutral-skin-1.png',
  battleSpriteUrl: '/battles/cosmoids/moth-basic-normal-neutral-skin-1.png',
  startingEnergy: 75,
  currentEnergy: 75,
  movementId: 'lizard',

  battleScale: 0.85,
  speciesId: '',
};

// Starter Cosmoid Definitions
export const STARTER_CRAB: Creature = {
  id: 'starter_crab',
  name: 'Crabby',
  type: ElementType.GRASS,
  maxHp: 35,
  currentHp: 35,
  attack: 40,
  defense: 45,
  speed: 35,
  level: 1,
  xp: 0,
  moves: ['Vine Whip', 'Scratch'],
  spriteUrl: '/battles/cosmoids/palmit_down_1.png',
  battleSpriteUrl: '/battles/cosmoids/palmit_down_1.png',
  startingEnergy: 100,
  currentEnergy: 100,
  speciesId: '',
};

export const STARTER_IGUANA: Creature = {
  id: 'starter_iguana',
  name: 'Blazy',
  type: ElementType.FIRE,
  maxHp: 35,
  currentHp: 35,
  attack: 45,
  defense: 40,
  speed: 40,
  level: 1,
  xp: 0,
  moves: ['Ember', 'Scratch'],
  spriteUrl: '/battles/cosmoids/fueguana_left_1_v3.png',
  battleSpriteUrl: '/battles/cosmoids/fueguana_left_1_v3.png',
  movementId: 'lizard',
  startingEnergy: 100,
  currentEnergy: 100,

  speciesId: '',
};

export const STARTER_MONKEY: Creature = {
  id: 'starter_monkey',
  name: 'Bubbles',
  type: ElementType.WATER,
  maxHp: 40,
  currentHp: 40,
  attack: 40,
  defense: 40,
  speed: 45,
  level: 1,
  xp: 0,
  moves: ['Bubble Beam', 'Scratch'],
  spriteUrl: '/battles/cosmoids/monkeg_down_1_v2.png',
  battleSpriteUrl: '/battles/cosmoids/monkeg_down_1_v2.png',
  startingEnergy: 100,
  currentEnergy: 100,
  speciesId: '',
};
