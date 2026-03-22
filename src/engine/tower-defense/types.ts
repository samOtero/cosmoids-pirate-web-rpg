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
  xpYield: number;
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
  turnAroundAtEnd?: boolean; // Whether the enemy should return to the start instead of despawning
  concurrentWithPrevious?: boolean; // Whether this group should start its initial delay timer at the same time as the group before it
  uncapturable?: boolean;
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
  waves?: TDWave[]; // Optional for backwards compatibility
  surviveUntil?: number; // Win after surviving for this many seconds
  lives?: number; // Default is 3 if not provided, or overridden by captureUnits length
  enemyHpMultiplier?: number; // Defaults to 1 if not provided
  disableCapture?: boolean;
  environmentUnits?: {
    tdConfigId: string;
    position: Point;
    facingDirection?: 'up' | 'down' | 'left' | 'right';
  }[];
  captureUnits?: { tdConfigId: string; position: Point }[];
}

export interface Tower extends BaseTDUnit {
  creature: PlayerCreature; // The singular source of truth for level, xp, and attacks
  lastAttackTime: number; // Deprecate or keep for generic attacks
  currentAttack: number;
  equippedAttacksRuntime: Array<{
    definitionId: string;
    lastFiredTime: number;
  }>;
  selectedAttackIndex: number;
}

export interface StatusCondition {
  type: 'BURN' | 'POISON' | 'STUN';
  durationMs: number;
  tickDamage?: number;
  lastTickTime?: number;
}

export interface Enemy extends BaseTDUnit {
  definitionId: string;
  speed: number;
  currentAttack: number;
  statusConditions: StatusCondition[];
  currentWaypointIndex: number;
  pathIndex: number; // Index into the level's `paths` array
  heldCaptureUnitId?: string; // ID of the CaptureUnit they are holding
  turnAroundAtEnd?: boolean;
  isMovingBackward?: boolean;
  uncapturable?: boolean;
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
