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
