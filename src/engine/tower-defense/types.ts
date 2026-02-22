import { Creature } from '@/types/baseGame';

export interface Point {
  x: number;
  y: number;
}

export interface Tower {
  id: string;
  creature: Creature;
  position: Point;
  lastAttackTime: number;
}

export interface Enemy {
  id: string;
  creature: Creature;
  position: Point;
  hp: number;
  maxHp: number;
  speed: number;
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
