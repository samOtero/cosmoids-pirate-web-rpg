import { ElementType } from '@/types/baseGame';
import { TowerDefenseEngine } from '../TowerDefenseEngine';
import { Tower } from '../types';

export interface AttackEffect {
  type: 'BURN' | 'POISON' | 'STUN' | 'MULTI_HIT' | 'KNOCKBACK';
  chance: number; // 0 to 1
  value?: number; // e.g., how many times to multi-hit, or duration of stun
}

export interface ProjectilePattern {
  /** Number of projectiles to show. Runtime behavior applies a safety cap. */
  count: number;
  /** Distance in battlefield units between each projectile. */
  spacing: number;
  /** Per-projectile visual scales, ordered from front to back. */
  scales: number[];
  damageMode: 'EACH' | 'FIRST_ONLY';
}

export type ProjectileVisual =
  | {
      type: 'FLAME';
      outerColor: number;
      innerColor: number;
    }
  | {
      type: 'WATER_STREAM';
      outerColor: number;
      innerColor: number;
      highlightColor: number;
    };

export interface AttackDefinition {
  id: string; // e.g., 'BUBBLE_BEAM'
  name: string;
  type: ElementType; // Water
  category: 'physical' | 'special';
  power: number; // Base damage multiplier
  cooldownMs: number;
  rangeIndex: number; // 30 means 30% of screen distance
  projectileSpeed?: number;
  spriteUrl?: string; // e.g., a bubble texture
  projectilePattern?: ProjectilePattern;
  projectileVisual?: ProjectileVisual;
  behaviorType:
    | 'PROJECTILE'
    | 'INSTANT_AOE'
    | 'BEAM'
    | 'SUPPORT_AURA'
    | 'INSTANT_MELEE';
  effects?: AttackEffect[];
  visualEffectConfigId?: string; // which tdConfig to use for a visual effect
  isDashAttack?: boolean; // whether the base unit itself behaves as the projectile visually
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
