import { ElementType } from '@/types/baseGame';
import { TowerDefenseEngine } from '../TowerDefenseEngine';
import { Tower, Enemy } from '../types';

export interface AttackEffect {
  type: 'BURN' | 'POISON' | 'STUN' | 'MULTI_HIT' | 'KNOCKBACK';
  chance: number; // 0 to 1
  value?: number; // e.g., how many times to multi-hit, or duration of stun
}

export interface AttackDefinition {
  id: string; // e.g., 'BUBBLE_BEAM'
  name: string;
  type: ElementType; // Water
  power: number; // Base damage multiplier
  cooldownMs: number;
  rangeIndex: number; // 30 means 30% of screen distance
  projectileSpeed?: number;
  spriteUrl?: string; // e.g., a bubble texture
  behaviorType:
    | 'PROJECTILE'
    | 'INSTANT_AOE'
    | 'BEAM'
    | 'SUPPORT_AURA'
    | 'INSTANT_MELEE';
  effects?: AttackEffect[];
}

export interface AttackInstance {
  definitionId: string;
  lastFiredTime: number;
}

export interface AttackBehavior {
  canExecute(
    engine: TowerDefenseEngine,
    source: Tower,
    attackDef: AttackDefinition
  ): boolean;
  execute(
    engine: TowerDefenseEngine,
    source: Tower,
    attackDef: AttackDefinition
  ): void;
}
