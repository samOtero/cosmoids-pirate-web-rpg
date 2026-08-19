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

export interface TDInitialView {
  /** Horizontal position within the pannable overflow: 0 = left, 100 = right. */
  offsetX: number;
  /** Vertical position within the pannable overflow: 0 = top, 100 = bottom. */
  offsetY: number;
  /** Battlefield zoom-button value: 1 = maximum, minimum = 1 / backgroundScale. */
  zoom: number;
}

export interface TDOpeningPan {
  /** Horizontal starting position within the pannable overflow. Defaults to the normal initial view. */
  fromOffsetX?: number;
  /** Vertical starting position within the pannable overflow. Defaults to the normal initial view. */
  fromOffsetY?: number;
  /** Length of the camera movement before the Ready/Go countdown begins. */
  durationMs: number;
}

export interface TDWaveGroup {
  /** References a level-scoped TDWaveEnemyDefinition. */
  enemyDefinitionId: string;
  count: number; // How many to spawn
  spawnIntervalMs: number; // Time between each spawn in this group
  delayBeforeGroupMs: number; // Delay before this group starts (after wave start or previous group ends)
  pathIndex: number; // Which path enemies in this group should take
  turnAroundAtEnd?: boolean; // Whether the enemy should return to the start instead of despawning
  concurrentWithPrevious?: boolean; // Whether this group should start its initial delay timer at the same time as the group before it
  uncapturable?: boolean;
  /** Gives spawned enemies the cursed aura and makes them uncapturable. */
  isCursed?: boolean;
}

/** A uniquely configurable enemy variant that wave groups can reuse. */
export interface TDWaveEnemyDefinition {
  id: string;
  creatureId: string;
  level: number;
  speedMultiplier?: number;
  /** Lives removed when this enemy reaches a non-capture goal. Defaults to 1. */
  goalDamage?: number;
  /** Multiplies battlefield stats without changing captured creature stats. */
  hpMultiplier?: number;
  defenseMultiplier?: number;
  specialDefenseMultiplier?: number;
  /** References an enemy-only ability definition. */
  abilityId?: string;
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
  /** RGB color used by the current hit flash. Defaults to white. */
  damageFlashColor?: number;
  isShiny?: boolean;
  isCursed?: boolean;
  /** Shared timed movement boost state used by abilities, attacks, and UI. */
  speedBoostMultiplier?: number;
  speedBoostUntilMs?: number;
  /** Persistent movement penalty; cleared when the unit receives a speed boost. */
  speedSlowMultiplier?: number;
  /** Persistent positive defense modifiers shown by the battlefield UI. */
  defenseBoostMultiplier?: number;
  specialDefenseBoostMultiplier?: number;
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
  waveEnemyDefinitions: TDWaveEnemyDefinition[];
  waves: TDWave[];
  surviveUntil?: number; // Win after surviving for this many seconds
  lives?: number; // Default is 3 if not provided, or overridden by captureUnits length
  enemyHpMultiplier?: number; // Defaults to 1 if not provided
  disableCapture?: boolean;
  backgroundUrl?: string;
  backgroundScale?: number; // If > 1, background is taller than viewport and can be scrolled
  initialView?: TDInitialView;
  openingPan?: TDOpeningPan;
  environmentUnits?: {
    tdConfigId: string;
    position: Point;
    facingDirection?: 'up' | 'down' | 'left' | 'right';
  }[];
  captureUnits?: { tdConfigId: string; position: Point }[];
  /** Allied towers that begin on the battlefield without joining the player's roster. */
  startingTowers?: {
    creature: PlayerCreature;
    position: Point;
    facingDirection?: 'up' | 'down' | 'left' | 'right';
    /** Prevents the tower from being moved, removed, or replaced. */
    isFixed?: boolean;
    /** Guest allies normally do not gain persistent creature experience. */
    receivesExperience?: boolean;
  }[];
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
  isFixed?: boolean;
  receivesExperience?: boolean;
}

export interface StatusCondition {
  type: 'BURN' | 'POISON' | 'STUN' | 'DRENCHED';
  durationMs: number;
  tickDamage?: number;
  lastTickTime?: number;
}

export interface Enemy extends BaseTDUnit {
  definitionId: string;
  /** The unique level-scoped enemy variant that produced this unit. */
  waveEnemyDefinitionId?: string;
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
  /** Permanent guard: Wind Gust can force this enemy to drop an item only once. */
  hasBeenWindDisarmed?: boolean;
  /** While active, this enemy cannot pick up capture units; other enemies still can. */
  itemPickupBlockedUntilMs?: number;
  turnAroundAtEnd?: boolean;
  isMovingBackward?: boolean;
  uncapturable?: boolean;
  // Tracks towers that participated with a successful enemy-targeting attack.
  // The legacy field name is retained because it is part of the runtime model.
  damagedByTowerIds: Set<string>;
  /** Dev-sandbox guard: hits and status effects render normally without reducing HP. */
  isInvulnerable?: boolean;
  /** Enemy-only ability state; player attacks use Tower.equippedAttacksRuntime. */
  abilityRuntime?: {
    definitionId: string;
    nextReadyTimeMs: number;
    hasActivated?: boolean;
    /** When true, only an explicit trigger can activate this ability. */
    manualOnly?: boolean;
  };
}

export interface Projectile {
  id: string;
  attackDefinitionId?: string; // Used to know what sprite to render and what effects to apply
  sourceId: string;
  targetId: string;
  position: Point;
  speed: number;
  damage: number;
  /** Defaults to true. False marks a follow-up projectile as visual-only. */
  dealsDamage?: boolean;
  visualScale?: number;
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
  rangeIndex?: number; // Optional battlefield radius for area effects
}
