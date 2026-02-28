import { Creature } from '@/types/baseGame';

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
}

export interface TDWave {
  id: string; // e.g. "wave_1"
  groups: TDWaveGroup[];
}

export interface TDLevelData {
  paths: Point[][];
  placementSpots: Point[];
  waves?: TDWave[]; // Optional for backwards compatibility
}

export interface Tower {
  id: string; // Unique tower map instance ID
  creatureId: string; // Reference to the Creature instance ID in the player's party
  speciesId: string; // The base species ID for rendering
  position: Point;
  lastAttackTime: number; // Deprecate or keep for generic attacks
  level: number;
  xp: number;
  currentAttack: number;
  equippedAttacks: Array<{ definitionId: string; lastFiredTime: number }>;
  selectedAttackIndex: number;
  facingDirection: 'up' | 'down' | 'left' | 'right';
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
  currentWaypointIndex: number;
  pathIndex: number; // Index into the level's `paths` array
  facingDirection: 'up' | 'down' | 'left' | 'right';
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
