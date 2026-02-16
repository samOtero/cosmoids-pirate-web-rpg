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
  spriteUrl: '/bug-2-basic-normal-neutral-skin-1.png',
  battleSpriteUrl: '/battles/cosmoids/bug-1-basic-normal-neutral-skin-1.png',
  startingEnergy: 50,
  currentEnergy: 50,
  movementId: 'lizard',
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
};
