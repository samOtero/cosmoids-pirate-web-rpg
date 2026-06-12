import { Creature, PlayerCreature } from '@/types/baseGame';

export interface TDEvolutionNode {
  level: number;
  evolutionDefId: string;
}

export interface TDAttackUnlockNode {
  level: number;
  attackDefId: string;
}

export interface TDCreatureMetadata {
  baseCreature: Creature;
  evolutionNodes?: TDEvolutionNode[];
  attackUnlocks?: TDAttackUnlockNode[];
}

export interface Point {
  x: number;
  y: number;
}

export interface TDWaveGroup {
  definitionId: string; // The enemy ID to spawn
  count: number; // How many to spawn
  spawnIntervalMs: number; // Time between each spawn in this group
  delayBeforeGroupMs: number; // Delay before this group starts (after wave start or previous group ends)
  pathIndex: number; // Which path enemies in this group should take
  level?: number; // Custom level for enemies in this group
  turnAroundAtEnd?: boolean; // Whether the enemy should return to the start instead of despawning
  concurrentWithPrevious?: boolean; // Whether this group should start its initial delay timer at the same time as the group before it
  uncapturable?: boolean;
  speedMultiplier?: number; // Multiplies the base speed of enemies in this group
}

export interface TDWave {
  id: string; // e.g. "wave_1"
  groups: TDWaveGroup[];
}

export interface BaseTDUnit {
  id: string;
  position: Point;
  facingDirection: 'up' | 'down' | 'left' | 'right';
  hp: number;
  maxHp: number;
  damageFlashTimerMs?: number;
  isShiny?: boolean;
}

export interface EnvironmentUnit extends BaseTDUnit {
  tdConfigId: string;
  speed?: number; // In world units per second, if moving
  path?: Point[]; // Ordered list of waypoints to follow
  currentWaypointIndex?: number;
}

export type TDAction =
  | {
      type: 'SPAWN_ENVIRONMENT_UNIT';
      unitId: string;
      tdConfigId: string;
      position: Point;
      facingDirection?: 'up' | 'down' | 'left' | 'right';
      speed?: number;
    }
  | {
      type: 'MOVE_ENVIRONMENT_UNIT';
      unitId: string;
      path: Point[];
      speed?: number;
    }
  | {
      type: 'REMOVE_ENVIRONMENT_UNIT';
      unitId: string;
    };

export interface CaptureUnit extends BaseTDUnit {
  tdConfigId: string;
  heldByEnemyId?: string;
}

export interface TDLevelData {
  paths: Point[][];
  placementSpots: Point[];
  waves: TDWave[];
  surviveUntil?: number; // Win after surviving for this many seconds
  lives?: number; // Default is 3 if not provided, or overridden by captureUnits length
  enemyHpMultiplier?: number; // Defaults to 1 if not provided
  disableCapture?: boolean;
  backgroundUrl?: string;
  backgroundScale?: number; // If > 1, background is taller than viewport and can be scrolled
  environmentUnits?: {
    tdConfigId: string;
    position: Point;
    facingDirection?: 'up' | 'down' | 'left' | 'right';
  }[];
  captureUnits?: { tdConfigId: string; position: Point }[];
  /** When set, the player uses this fixed roster instead of their profile creatures. */
  premadeRoster?: PlayerCreature[];
  /** Marks this level as a challenge level (affects routing and progress saving). */
  isChallengeLevel?: boolean;
}

export type TowerTargetingMode =
  | 'first'
  | 'last'
  | 'closest'
  | 'strongest'
  | 'weakest'
  | 'lowest-hp-percent'
  | 'highest-hp-percent';

export interface Tower extends BaseTDUnit {
  creature: PlayerCreature; // The singular source of truth for level, xp, and attacks
  lastAttackTime: number; // Deprecate or keep for generic attacks
  currentAttack: number;
  currentSpecialAttack: number;
  currentDefense: number;
  currentSpecialDefense: number;
  equippedAttacksRuntime: Array<{
    definitionId: string;
    lastFiredTime: number;
  }>;
  selectedAttackIndex: number;
  targetingMode?: TowerTargetingMode;
}

export interface StatusCondition {
  type: 'BURN' | 'POISON' | 'STUN';
  durationMs: number;
  tickDamage?: number;
  lastTickTime?: number;
}

export interface Enemy extends BaseTDUnit {
  definitionId: string;
  level: number; // The level of this specific enemy instance
  speed: number;
  currentAttack: number;
  currentSpecialAttack: number;
  currentDefense: number;
  currentSpecialDefense: number;
  statusConditions: StatusCondition[];
  currentWaypointIndex: number;
  pathIndex: number; // Index into the level's `paths` array
  heldCaptureUnitId?: string; // ID of the CaptureUnit they are holding
  turnAroundAtEnd?: boolean;
  isMovingBackward?: boolean;
  uncapturable?: boolean;
  damagedByTowerIds: Set<string>; // Tracks which towers dealt damage for EXP distribution
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
  facingDirection?: 'up' | 'down' | 'left' | 'right';
}

export interface FloatingText {
  id: string;
  text: string;
  position: Point;
  color?: number;
  scale?: number;
  durationMs: number;
  elapsedMs: number;
}

export interface VisualEffect {
  id: string;
  configId: string; // references tdConfig key (e.g., 'attack_scratch_1')
  position: Point;
  durationMs: number;
  elapsedMs: number;
  facingDirection?: 'up' | 'down' | 'left' | 'right';
  targetId?: string; // If attached to moving unit
}
