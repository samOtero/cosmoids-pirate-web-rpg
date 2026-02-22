import { Creature } from '@/types/baseGame';

export interface Point {
  x: number;
  y: number;
}

export interface Tower {
  id: string;
  definitionId: string;
  position: Point;
  lastAttackTime: number; // Deprecate or keep for generic attacks
  level: number;
  xp: number;
  currentAttack: number;
  equippedAttacks: Array<{ definitionId: string; lastFiredTime: number }>;
}

export interface StatusCondition {
  type: 'BURN' | 'POISON' | 'STUN';
  durationMs: number;
  tickDamage?: number;
  lastTickTime?: number;
}

export interface Enemy {
  id: string;
  definitionId: string;
  position: Point;
  hp: number;
  maxHp: number;
  speed: number;
  currentAttack: number;
  statusConditions: StatusCondition[];
}

export interface Projectile {
  id: string;
  attackDefinitionId?: string; // Used to know what sprite to render and what effects to apply
  sourceId: string;
  targetId: string;
  position: Point;
  speed: number;
  damage: number;
  target: Point;
}
