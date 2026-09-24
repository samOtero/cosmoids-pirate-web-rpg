import { ElementType } from '@/types/baseGame';
import { TowerDefenseEngine } from '../TowerDefenseEngine';
import { Tower } from '../types';

export interface AttackEffect {
  type:
    | 'BURN'
    | 'POISON'
    | 'STACKING_POISON'
    | 'STUN'
    | 'DRENCHED'
    | 'SPEED_SLOW'
    | 'DRAIN'
    | 'MULTI_HIT'
    | 'KNOCKBACK';
  chance: number; // 0 to 1
  value?: number; // e.g., how many times to multi-hit, or duration of stun
  /** Maximum number of stacks for effects that accumulate. */
  maxStacks?: number;
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
      type: 'STATIC_YIP' | 'SPARK';
      outerColor: number;
      innerColor: number;
      highlightColor: number;
    }
  | {
      type: 'FLAME';
      outerColor: number;
      innerColor: number;
    }
  | {
      type: 'WATER_STREAM' | 'VENOM_STREAM';
      outerColor: number;
      innerColor: number;
      highlightColor: number;
    }
  | {
      type: 'COIR_BOLA';
      shadowColor: number;
      fiberColor: number;
      highlightColor: number;
      sparkColor: number;
    }
  | {
      type: 'STRING_COIL';
      shadowColor: number;
      fiberColor: number;
      highlightColor: number;
      sparkColor: number;
    }
  | {
      type: 'SAILCUTTER';
      shadowColor: number;
      windColor: number;
      highlightColor: number;
    }
  | {
      type: 'NECTAR_TONGUE';
      spriteUrl: string;
    };

export interface AdaptiveTargetedAoeConfig {
  /** Splash radius measured with the battlefield's normalized range scale. */
  radiusIndex: number;
  /** Replaces the attack's normal power when only one enemy is in the splash. */
  singleTargetPower: number;
  /** Replaces the attack's normal effects when only one enemy is in the splash. */
  singleTargetEffects?: AttackEffect[];
}

export interface AttackDefinition {
  id: string; // e.g., 'BUBBLE_BEAM'
  name: string;
  description?: string;
  type: ElementType; // Water
  category: 'physical' | 'special';
  power: number; // Base damage multiplier
  cooldownMs: number;
  rangeIndex: number; // 30 means 30% of screen distance
  projectileSpeed?: number;
  spriteUrl?: string; // e.g., a bubble texture
  projectilePattern?: ProjectilePattern;
  projectileVisual?: ProjectileVisual;
  /** How long a successfully disarmed enemy cannot pick up another item. */
  itemPickupLockMs?: number;
  supportBuff?: {
    attackSpeedMultiplier: number;
    durationMs: number;
  };
  adaptiveTargetedAoe?: AdaptiveTargetedAoeConfig;
  repairSupport?: {
    healFraction: number;
    defenseMultiplier: number;
  };
  /** Shared, non-expiring marks on each enemy; only this move advances them. */
  fuseRushCombo?: {
    hitsToTrigger: number;
    damageMultiplier: number;
  };
  rollingBarrel?: {
    lobDurationMs: number;
    rollDistance: number;
    rollSpeed: number;
    hitRadius: number;
  };
  constriction?: {
    durationMs: number;
    pulseIntervalMs: number;
    resistanceMs: number;
  };
  behaviorType:
    | 'PROJECTILE'
    | 'INSTANT_AOE'
    | 'ADAPTIVE_TARGETED_AOE'
    | 'POISON_AOE'
    | 'BEAM'
    | 'SUPPORT_AURA'
    | 'REPAIR_SUPPORT'
    | 'SHARED_SLUMBER'
    | 'SHIKO_QUAKE'
    | 'ROLLING_BARREL'
    | 'CONSTRICTION'
    | 'INSTANT_MELEE';
  effects?: AttackEffect[];
  visualEffectConfigId?: string; // which tdConfig to use for a visual effect
  /** A short, cosmetic effect attached to the caster when a projectile fires. */
  launchVisualEffectConfigId?: string;
  isDashAttack?: boolean; // whether the base unit itself behaves as the projectile visually
  /** Keeps a dash attacker at the impact point while its hit animation plays. */
  dashImpactHoldMs?: number;
  /** Gap from the target in viewport-height range units. */
  dashStopRange?: number;
  dashTrailType?: 'WATER' | 'FIRE';
}

export interface AttackInstance {
  definitionId: string;
  lastFiredTime: number;
  /** Simulation-clock cooldown for support moves; undefined means ready. */
  readyAtMs?: number;
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
