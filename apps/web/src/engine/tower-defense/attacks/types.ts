import { ElementType } from '@/types/baseGame';
import { TowerDefenseEngine } from '../TowerDefenseEngine';
import { PoisonId, Tower } from '../types';

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
  /** Attack-specific poison identity; different IDs may coexist on one target. */
  poisonId?: PoisonId;
  /** Damage-formula power resolved into a poison budget instead of direct damage. */
  totalPower?: number;
  /** Authored poison lifetime and pulse count. */
  durationMs?: number;
  tickCount?: number;
  /** Fraction of the triggering direct hit dealt by each stack on every tick. */
  damagePerTickRatio?: number;
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
      type: 'GRUMBLE';
      outerColor: number;
      innerColor: number;
      highlightColor: number;
    }
  | {
      type: 'REVERIE_ORB';
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
      type: 'WAKE_WHIP';
      spriteUrl: string;
    }
  | {
      type: 'SALT_SPIT';
      spriteUrl: string;
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
    }
  | {
      type: 'FLYING_COLORS';
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
    global?: boolean;
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
  /** Per-caster hit cycle used by Palmit's deterministic coir bind. */
  coirSnapCombo?: {
    hitsToBind: number;
    bindDurationMs: number;
    bindVisualEffectConfigId: string;
    /** Projectile scale for each hit in the cycle, ordered from first to bind. */
    projectileScales: number[];
  };
  /** Persistent, per-caster Heat built by successful Kindle Claw hits. */
  fireClawHeat?: {
    maxStacks: number;
    damageBonusPerStack: number;
    lullBeforeDecayMs: number;
    decayIntervalMs: number;
  };
  /** Optional payoff for attacks that feed on, but do not alter, Poison conditions. */
  poisonPayoff?: {
    damageMultiplier: number;
    prioritizePoisonedTargets?: boolean;
  };
  /** Sparks copy a fraction of a hit on a burning target, then apply each recipient's matchup. */
  burningTargetSplash?: {
    radiusIndex: number;
    damageRatio: number;
    visualEffectConfigId?: string;
  };
  /** Pushes nearby secondary enemies against their movement when the primary hit lands. */
  secondaryImpactPush?: {
    radiusIndex: number;
    distance: number;
  };
  /** On a knockout, launches one full-power follow-up at a nearby enemy. */
  looseEnd?: {
    followUpRadius: number;
  };
  /** Unconditional, distinct-target hops from each impact. */
  flyingColors?: {
    maxTargets: number;
    hopRange: number;
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
  riggingNest?: {
    durationMs: number;
    firstSpawnDelayMs: number;
    spawnIntervalMs: number;
    maxSpawns: number;
    maxActiveThreadlings: number;
    threadlingLifetimeMs: number;
    threadlingMoveSpeed: number;
    threadlingAttackIntervalMs: number;
    threadlingMaxAttacks: number;
    threadlingBiteRange: number;
    offset: { x: number; y: number };
    nestSpriteUrl: string;
    threadlingSpriteUrls: Record<'up' | 'down' | 'left' | 'right', string>;
  };
  sailcutter?: {
    projectileCount: number;
    markDurationMs: number;
    threadlingMoveSpeedMultiplier: number;
    threadlingDamageMultiplier: number;
  };
  wakeWhip?: {
    windupMs: number;
    recoveryMs: number;
    pushDistance: number;
    warmPushDistance: number;
  };
  saltSpit?: {
    warmProjectileCount: number;
  };
  behaviorType:
    | 'PROJECTILE'
    | 'INSTANT_AOE'
    | 'FUNNY_DANCE'
    | 'ADAPTIVE_TARGETED_AOE'
    | 'POISON_AOE'
    | 'BEAM'
    | 'SUPPORT_AURA'
    | 'WARMTH_SUPPORT'
    | 'REPAIR_SUPPORT'
    | 'SHARED_SLUMBER'
    | 'SHIKO_QUAKE'
    | 'PALM_SLAM'
    | 'ROLLING_BARREL'
    | 'CONSTRICTION'
    | 'RIGGING_NEST'
    | 'SAILCUTTER'
    | 'WAKE_WHIP'
    | 'SALT_SPIT'
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
