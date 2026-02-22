import { Creature } from '@/types/baseGame';

export interface Point {
  x: number;
  y: number;
}

export interface Tower {
  id: string;
  definitionId: string;
  position: Point;
  lastAttackTime: number;
  level: number;
  xp: number;
  currentAttack: number;
}

export interface Enemy {
  id: string;
  definitionId: string;
  position: Point;
  hp: number;
  maxHp: number;
  speed: number;
  currentAttack: number;
}

export interface Projectile {
  id: string;
  sourceId: string;
  targetId: string;
  position: Point;
  speed: number;
  damage: number;
  target: Point;
}
