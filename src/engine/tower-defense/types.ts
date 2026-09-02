import { Creature, ElementType, PlayerCreature } from '@/types/baseGame';
import type { AttackInstance } from './attacks/types';

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
  /** Creature-backed enemies use a registered Cosmoid definition. */
  creatureId?: string;
  level: number;
  speedMultiplier?: number;
  /** Whether this enemy can pick up a capture objective. Defaults to true. */
  canCarryCaptureUnits?: boolean;
  /** Lives removed when this enemy reaches a non-capture goal. Defaults to 1. */
  goalDamage?: number;
  /** Multiplies battlefield stats without changing captured creature stats. */
  hpMultiplier?: number;
  defenseMultiplier?: number;
  specialDefenseMultiplier?: number;
  /** References an enemy-only ability definition. */
  abilityId?: string;
  /** HP ratio (0 to 1) at or below which this enemy is considered weakened for capture. Defaults to 0.9. */
  weakenedThreshold?: number;
  /**
   * Optional stationary structure that participates in the normal enemy
   * targeting pipeline without masquerading as a capturable Cosmoid.
   */
  structure?: TDStructureDefinition;
}

export interface TDStructureSpriteLayout {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  rotationDegrees?: number;
  skewXDegrees?: number;
  skewYDegrees?: number;
}

export interface TDStructureVisualLayout {
  standing: TDStructureSpriteLayout;
  rubble: TDStructureSpriteLayout;
  labelOffsetY: number;
  healthBarOffsetY: number;
}

export interface TDStructureDefinition {
  tdConfigId: string;
  displayName: string;
  elementTypes: ElementType[];
  maxHp: number;
  defense: number;
  specialDefense: number;
  /** Structures are status-immune by default. */
  immuneToStatusEffects?: boolean;
  /** Structures award no money by default. */
  moneyReward?: number;
  /** Immediately wins the battle when this structure is destroyed. */
  winsLevelOnDestroy?: boolean;
  /** Semantic role used by objective UI and destruction hooks. */
  role?: 'victory-gate' | 'prisoner-gate';
  /** Optional renderer for a structure that is not painted into the map. */
  visualStyle?: 'prison-gate';
  /** Optional fixed map position. Falls back to the wave group's path start. */
  position?: Point;
  /** Per-level visual registration used by runtime and the TD level editor. */
  visualLayout?: TDStructureVisualLayout;
}

export interface TDObjectiveAllyDefinition {
  id: string;
  creatureId: string;
  displayName: string;
  /** Destroying this structure releases the ally. */
  gateDefinitionId: string;
  lockedPosition: Point;
  releasePath: Point[];
  moveSpeed: number;
  targetStructureDefinitionId: string;
  behavior: {
    type: 'BRAMFRIT_CHARGE';
    chargeStart: Point;
    strikePosition: Point;
    damage: number;
    bowDurationMs: number;
    windupDurationMs: number;
    recoveryDurationMs: number;
    chargeSpeed: number;
  };
}

export interface TDWave {
  id: string; // e.g. "wave_1"
  groups: TDWaveGroup[];
}

/**
 * Allows a group of lesser enemies near a capture objective to channel one
 * member into a configured evolved enemy variant.
 */
export interface TDResonantEvolutionConfig {
  sourceCreatureId: string;
  evolvedEnemyDefinitionId: string;
  requiredCount: number;
  /** Distance from the capture unit at which the first chain member can anchor. */
  radius: number;
  /** Distance at which later members can link to an existing chain member. */
  linkRadius?: number;
  /** Minimum distance between participants so their sprites remain readable. */
  minimumSpacing?: number;
  /** Prevents a linked chain from extending too far from its capture unit. */
  maxDistanceFromCaptureUnit?: number;
  gatherWaitDurationMs: number;
  channelDurationMs: number;
  recoveryDurationMs: number;
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
  /** HP ratio (0 to 1) at or below which this unit is considered weakened. Defaults to 0.9. */
  weakenedThreshold?: number;
  /** Shared timed movement boost state used by abilities, attacks, and UI. */
  speedBoostMultiplier?: number;
  speedBoostUntilMs?: number;
  /** Additively stacked, untimed movement boost owned by this unit instance. */
  persistentSpeedBoostMultiplier?: number;
  /** Number of visible stacks contributing to the persistent speed boost. */
  persistentSpeedBoostStackCount?: number;
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

export interface CaptureUnitReturnHomeConfig {
  /** Enemy path the unattended objective follows back to its starting spot. */
  pathIndex: number;
  /** Movement speed in battlefield percentage units per second. */
  speed: number;
  /** Optional pause after being dropped before the objective starts returning. */
  delayMs?: number;
}

export interface CaptureUnitWaveRelocation {
  /** Zero-based wave index that must be cleared before this movement begins. */
  afterWaveIndex: number;
  /** Orthogonal route followed from the current defense point to the next one. */
  path: Point[];
  /** Movement speed in battlefield percentage units per second. */
  speed: number;
}

export interface CaptureUnitRelocationState extends CaptureUnitWaveRelocation {
  currentWaypointIndex: number;
}

export interface CaptureUnitDefinition {
  tdConfigId: string;
  position: Point;
  /** Multiplies an enemy's final movement speed while it carries this unit. */
  carrierSpeedMultiplier?: number;
  returnHome?: CaptureUnitReturnHomeConfig;
  waveRelocations?: CaptureUnitWaveRelocation[];
}

export interface CaptureUnit extends BaseTDUnit {
  tdConfigId: string;
  heldByEnemyId?: string;
  homePosition: Point;
  carrierSpeedMultiplier?: number;
  returnHome?: CaptureUnitReturnHomeConfig;
  returnHomeAvailableAtMs?: number;
  waveRelocations?: CaptureUnitWaveRelocation[];
  activeRelocation?: CaptureUnitRelocationState;
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
  /** Optional message shown once before the Ready/Go countdown. */
  introMessage?: string;
  environmentUnits?: {
    tdConfigId: string;
    position: Point;
    facingDirection?: 'up' | 'down' | 'left' | 'right';
  }[];
  captureUnits?: CaptureUnitDefinition[];
  resonantEvolution?: TDResonantEvolutionConfig;
  /** Captives that become autonomous objective allies when their gate breaks. */
  objectiveAllies?: TDObjectiveAllyDefinition[];
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
  equippedAttacksRuntime: AttackInstance[];
  /** Attack cadence only; deliberately independent of movement speed effects. */
  attackSpeedBuff?: {
    multiplier: number;
    appliedAtMs: number;
    expiresAtMs: number;
  };
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
  kind?: 'creature' | 'structure';
  /** Visual configuration used by structure enemies. */
  tdConfigId?: string;
  displayName?: string;
  /** Overrides creature metadata when resolving defensive typing. */
  elementTypes?: ElementType[];
  immuneToStatusEffects?: boolean;
  moneyReward?: number;
  winsLevelOnDestroy?: boolean;
  structureRole?: 'victory-gate' | 'prisoner-gate';
  structureVisualStyle?: 'prison-gate';
  structureVisualLayout?: TDStructureVisualLayout;
  /** Guards death/reward events when several attacks land in the same tick. */
  defeatEventEmitted?: boolean;
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
  /** Runtime state for an interruptible group evolution channel. */
  resonantEvolutionState?: {
    groupId: string;
    captureUnitId: string;
    role: 'evolving' | 'helper';
    phase: 'forming' | 'channeling';
    /** Omitted when this member is linked directly to the capture unit. */
    linkTargetEnemyId?: string;
    startedAtMs: number;
    durationMs: number;
  };
  /** Spent helpers may retreat but cannot contribute to another channel. */
  resonantEvolutionSpent?: boolean;
  /** Newly evolved enemies pause briefly before moving or taking the objective. */
  resonantEvolutionRecoveryUntilMs?: number;
  /** Keeps the evolved enemy beside its intended objective until pickup is resolved. */
  resonantEvolutionTargetCaptureUnitId?: string;
  /** Enemy-only ability state; player attacks use Tower.equippedAttacksRuntime. */
  abilityRuntime?: {
    definitionId: string;
    nextReadyTimeMs: number;
    hasActivated?: boolean;
    activationCount?: number;
    despawnRequested?: boolean;
    /** When true, only an explicit trigger can activate this ability. */
    manualOnly?: boolean;
  };
}

export interface ObjectiveAlly extends BaseTDUnit {
  definitionId: string;
  tdConfigId: string;
  displayName: string;
  gateDefinitionId: string;
  targetStructureDefinitionId: string;
  phase:
    | 'locked'
    | 'traveling'
    | 'bowing'
    | 'retreating'
    | 'windup'
    | 'charging'
    | 'recovering';
  path: Point[];
  currentWaypointIndex: number;
  moveSpeed: number;
  behavior: TDObjectiveAllyDefinition['behavior'];
  phaseStartedAtMs: number;
  impactCount: number;
}

export interface DestroyedStructureVisual {
  id: string;
  tdConfigId?: string;
  position: Point;
  visualStyle?: 'prison-gate';
  visualLayout?: TDStructureVisualLayout;
  destroyedAtMs: number;
}

export interface Projectile {
  id: string;
  attackDefinitionId?: string; // Used to know what sprite to render and what effects to apply
  sourceId: string;
  targetId: string;
  position: Point;
  /** Original caster position and direction, used by mouth-anchored visuals. */
  origin?: Point;
  launchFacingDirection?: 'up' | 'down' | 'left' | 'right';
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
