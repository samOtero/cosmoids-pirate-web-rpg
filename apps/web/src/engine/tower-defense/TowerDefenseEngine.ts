import {
  BUG_STAGE_1,
  BUG_STAGE_2,
  BUG_STAGE_3,
  COSMOID_TEMPLATES,
} from '@/constants/creatures';
import { ElementType, PlayerCreature } from '@/types/baseGame';
import {
  calculateMaxHp,
  calculateStat,
  createWildCreature,
} from '@/utils/resolvePlayerCreature';
import {
  Tower,
  Enemy,
  Projectile,
  CaptureUnit,
  VisualEffect,
  FloatingText,
  TDCreatureMetadata,
  TowerTargetingMode,
  TDLevelData,
  TDObjectiveAllyDefinition,
  TDResonantEvolutionConfig,
  TDWaveEnemyDefinition,
  ObjectiveAlly,
  ObjectiveAllyShadow,
  ObjectiveAllyCurrent,
  ObjectiveAllyAcidShot,
  DestroyedStructureVisual,
} from './types';
import { ATTACK_DEFS } from './attacks/definitions';
import { startDamageFlash } from './damageFlash';
import {
  AttackBehaviorRegistry,
  resolveAdaptiveTargetedAoeImpact,
} from './attacks/behaviors';
import { EffectProcessor } from './attacks/EffectProcessor';
import { updateRollingBarrel } from './attacks/rollingBarrel';
import { releaseDeepwaterGrip, updateDeepwaterGrips } from './attacks/deepwaterGrip';
import { getAttackSpeedMultiplier } from './attackSpeedModifiers';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
import { TDWave, TDWaveGroup, Point } from './types';
import { TDEventBus } from './events/TDEventBus';
import { TDProgressionManager } from './progression/TDProgressionManager';
import { ENEMY_ABILITY_DEFS } from './enemyAbilities';
import {
  applyStackingPersistentSpeedBoost,
  applyTimedSpeedBoost,
  getActiveSpeedMultiplier,
} from './speedModifiers';

interface PathProjection {
  progress: number;
  distanceSq: number;
}

export interface WaypointStepResult {
  reachedWaypoint: boolean;
  facingDirection: 'up' | 'down' | 'left' | 'right';
}

export function stepUnitTowardsWaypoint(
  position: Point,
  targetPoint: Point,
  frameDistance: number,
  aspectRatio: number,
  previousPoint?: Point,
  currentFacingDirection: 'up' | 'down' | 'left' | 'right' = 'down'
): WaypointStepResult {
  const safeAspectRatio = Math.max(aspectRatio, Number.EPSILON);
  const dx = targetPoint.x - position.x;
  const dy = targetPoint.y - position.y;
  const visualDx = dx * safeAspectRatio;
  const visualDy = dy;
  const visualDistance = Math.hypot(visualDx, visualDy);
  const maxStepVisual = frameDistance * safeAspectRatio;

  // Determine facing direction from segment vector (or current delta if previousPoint is unavailable)
  let refDx = dx;
  let refDy = dy;
  if (previousPoint) {
    const segDx = targetPoint.x - previousPoint.x;
    const segDy = targetPoint.y - previousPoint.y;
    if (segDx !== 0 || segDy !== 0) {
      refDx = segDx;
      refDy = segDy;
    }
  }

  let facingDirection = currentFacingDirection;
  const refVisualDx = refDx * safeAspectRatio;
  const refVisualDy = refDy;
  if (refDx !== 0 || refDy !== 0) {
    if (Math.abs(refVisualDx) >= Math.abs(refVisualDy)) {
      facingDirection = refDx >= 0 ? 'right' : 'left';
    } else {
      facingDirection = refDy > 0 ? 'down' : 'up';
    }
  }

  if (visualDistance <= maxStepVisual || visualDistance === 0) {
    position.x = targetPoint.x;
    position.y = targetPoint.y;
    return { reachedWaypoint: true, facingDirection };
  }

  const stepRatio = maxStepVisual / visualDistance;
  position.x += dx * stepRatio;
  position.y += dy * stepRatio;
  return { reachedWaypoint: false, facingDirection };
}

function getPathSegmentLength(
  start: Point,
  end: Point,
  aspectRatio: number
): number {
  const safeAspectRatio = Math.max(aspectRatio, Number.EPSILON);
  return Math.hypot(end.x - start.x, (end.y - start.y) / safeAspectRatio);
}

function projectPointOntoPath(
  point: Point,
  path: Point[],
  aspectRatio: number
): PathProjection | undefined {
  if (path.length < 2) return undefined;

  const safeAspectRatio = Math.max(aspectRatio, Number.EPSILON);
  const scaledPoint = { x: point.x, y: point.y / safeAspectRatio };
  let cumulativeProgress = 0;
  let closest: PathProjection | undefined;

  for (let index = 1; index < path.length; index++) {
    const start = {
      x: path[index - 1].x,
      y: path[index - 1].y / safeAspectRatio,
    };
    const end = {
      x: path[index].x,
      y: path[index].y / safeAspectRatio,
    };
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const segmentLengthSq = dx * dx + dy * dy;
    const segmentLength = Math.sqrt(segmentLengthSq);

    if (segmentLengthSq === 0) continue;

    const projectionAmount = Math.max(
      0,
      Math.min(
        1,
        ((scaledPoint.x - start.x) * dx + (scaledPoint.y - start.y) * dy) /
          segmentLengthSq
      )
    );
    const projectedX = start.x + dx * projectionAmount;
    const projectedY = start.y + dy * projectionAmount;
    const distanceSq =
      (scaledPoint.x - projectedX) ** 2 + (scaledPoint.y - projectedY) ** 2;

    if (!closest || distanceSq < closest.distanceSq) {
      closest = {
        progress: cumulativeProgress + segmentLength * projectionAmount,
        distanceSq,
      };
    }

    cumulativeProgress += segmentLength;
  }

  return closest;
}

function getPointAtPathProgress(
  path: Point[],
  progress: number,
  aspectRatio: number
): Point {
  let remainingProgress = Math.max(0, progress);

  for (let index = 1; index < path.length; index++) {
    const start = path[index - 1];
    const end = path[index];
    const segmentLength = getPathSegmentLength(start, end, aspectRatio);

    if (segmentLength === 0) continue;
    if (remainingProgress <= segmentLength) {
      const amount = remainingProgress / segmentLength;
      return {
        x: start.x + (end.x - start.x) * amount,
        y: start.y + (end.y - start.y) * amount,
      };
    }

    remainingProgress -= segmentLength;
  }

  return { ...path[path.length - 1] };
}

const defaultLevels: Record<string, number> = {
  senticle: 15,
  mouse_1: 3,
  harlequill: 5,
  mopup: 5,
  bug_stage_1: 3,
  bug_stage_2: 8,
  bug_stage_3: 8,
  starter_crab: 5,
  starter_iguana: 5,
  starter_monkey: 5,
};

export const TD_CREATURE_DEFS: Record<string, TDCreatureMetadata> = {};

// Populate TD_CREATURE_DEFS dynamically from COSMOID_TEMPLATES for compatibility
Object.keys(COSMOID_TEMPLATES).forEach((id) => {
  const template = COSMOID_TEMPLATES[id];
  const defaultLevel = defaultLevels[id] ?? 1;
  TD_CREATURE_DEFS[id] = {
    baseCreature: createWildCreature(id, defaultLevel),
    evolutionNodes: template.evolutionNodes,
    attackUnlocks: template.learnableAttacks.map((a) => ({
      level: a.level,
      attackDefId: a.attackId,
    })),
  };
});

const ENEMY_TYPES = [BUG_STAGE_1, BUG_STAGE_2, BUG_STAGE_3];

interface ActiveSpawnerState {
  group: TDWaveGroup;
  spawnsRemaining: number;
  lastSpawnTime: number;
  delayTimer: number;
  isWaitingForDelay: boolean;
}

export interface PreviewEnemyConfig {
  id?: string;
  creatureId: string;
  level: number;
  position: Point;
  abilityId?: string;
  isInvulnerable?: boolean;
  manualAbilityOnly?: boolean;
}

export class TowerDefenseEngine {
  public static forceShinySpawns: boolean = false;
  public towers: Tower[] = [];
  public enemies: Enemy[] = [];
  public projectiles: Projectile[] = [];
  public visualEffects: VisualEffect[] = [];
  public floatingTexts: FloatingText[] = [];
  public objectiveAllies: ObjectiveAlly[] = [];
  public objectiveAllyShadows: ObjectiveAllyShadow[] = [];
  public objectiveAllyCurrents: ObjectiveAllyCurrent[] = [];
  public objectiveAllyAcidShots: ObjectiveAllyAcidShot[] = [];
  public destroyedStructureVisuals: DestroyedStructureVisual[] = [];
  public focusedStructureId: string | null = null;

  public money: number = 100;
  public lives: number = 3;

  public static getDefaultAttacks(speciesId: string): string[] {
    const defaultAttacks: string[] = [];
    if (speciesId === 'starter_crab') defaultAttacks.push('PINCH');
    else if (speciesId === 'starter_iguana') defaultAttacks.push('SCRATCH');
    else if (speciesId === 'starter_monkey') defaultAttacks.push('TACKLE');
    else if (speciesId === 'mouse_1') defaultAttacks.push('NIBBLE');
    else if (speciesId === 'harlequill') defaultAttacks.push('PECK');
    else if (speciesId === 'bettle') defaultAttacks.push('PINCH');
    else if (speciesId === 'bug_stage_1')
      defaultAttacks.push('TACKLE', 'STRING_SHOT');
    else defaultAttacks.push('TACKLE'); // Fallback
    return defaultAttacks;
  }

  public static getEquippedAttacks(
    creature: Pick<PlayerCreature, 'speciesId' | 'equippedAttacks'>
  ): string[] {
    return creature.equippedAttacks.length > 0
      ? creature.equippedAttacks
      : TowerDefenseEngine.getDefaultAttacks(creature.speciesId);
  }

  public events = new TDEventBus();
  private progression = new TDProgressionManager(this, this.events);

  public roster: PlayerCreature[] = [];

  // Wave Management State
  public waves: TDWave[] = [];
  public waveEnemyDefinitions: Record<string, TDWaveEnemyDefinition> = {};
  public currentWaveIndex: number = 0;
  private activeSpawners: ActiveSpawnerState[] = [];
  private nextGroupIndexToStart: number = 0;
  private startedRelocationWaveIndexes = new Set<number>();
  private completedRelocationWaveIndexes = new Set<number>();
  public hasFinishedAllWaves: boolean = false;
  public hasDestroyedVictoryStructure: boolean = false;
  private lastSpawnTime: number = 0;

  public playerSelectedAttacks: Record<string, number> = {};
  public playerSelectedTargetingModes: Record<string, TowerTargetingMode> = {};

  public surviveUntil?: number;
  public elapsedTimeMs: number = 0;
  public enemyHpMultiplier: number = 1;
  public disableCapture: boolean = false;
  public resonantEvolution?: TDResonantEvolutionConfig;

  public aspectRatio: number = 1;
  public backgroundScale: number = 1;

  public setAspectRatio(ratio: number) {
    this.aspectRatio = Math.max(ratio, Number.EPSILON);
  }

  // Loaded at initialization
  public paths: { x: number; y: number }[][] = [];
  public authoredPaths: { x: number; y: number }[][] = [];
  public placementSpots: { x: number; y: number }[] = [];
  public environmentUnits: import('./types').EnvironmentUnit[] = [];
  public captureUnits: CaptureUnit[] = [];
  public hasCaptureUnitsGoal: boolean = false;

  constructor(
    levelData: Pick<TDLevelData, 'paths' | 'placementSpots'> &
      Partial<TDLevelData>,
    initialRoster: PlayerCreature[] = []
  ) {
    this.roster = JSON.parse(JSON.stringify(initialRoster));

    this.playerSelectedAttacks = {};
    this.playerSelectedTargetingModes = {};
    this.roster.forEach((c) => {
      if (c.activeAttackIndex !== undefined) {
        this.playerSelectedAttacks[c.id] = c.activeAttackIndex;
      }
      if (c.targetingMode !== undefined) {
        this.playerSelectedTargetingModes[c.id] =
          c.targetingMode as TowerTargetingMode;
      }
    });

    const rawPaths: { x: number; y: number }[][] = levelData.paths || [];
    this.authoredPaths = rawPaths.map((path) =>
      path.map((point) => ({ ...point }))
    );
    this.paths = rawPaths.map((path) =>
      path.map((point) => ({ ...point }))
    );
    this.placementSpots = levelData.placementSpots || [];
    this.waveEnemyDefinitions = Object.fromEntries(
      (levelData.waveEnemyDefinitions ?? []).map((definition) => [
        definition.id,
        definition,
      ])
    );
    this.waves = levelData.waves || [];
    this.surviveUntil = levelData.surviveUntil;
    this.enemyHpMultiplier = levelData.enemyHpMultiplier ?? 1;
    this.disableCapture = levelData.disableCapture ?? false;
    this.resonantEvolution = levelData.resonantEvolution;
    this.backgroundScale = Math.max(1, levelData.backgroundScale ?? 1);

    this.objectiveAllies = (levelData.objectiveAllies ?? []).map(
      (ally: TDObjectiveAllyDefinition) => ({
        id: `objective_ally_${ally.id}`,
        definitionId: ally.creatureId,
        tdConfigId: ally.creatureId,
        displayName: ally.displayName,
        gateDefinitionId: ally.gateDefinitionId,
        targetStructureDefinitionId: ally.targetStructureDefinitionId,
        position: { ...ally.lockedPosition },
        facingDirection: 'down',
        hp: 1,
        maxHp: 1,
        phase: 'locked',
        path: ally.releasePath.map((point) => ({ ...point })),
        currentWaypointIndex: 0,
        moveSpeed: ally.moveSpeed,
        behavior: structuredClone(ally.behavior),
        phaseStartedAtMs: 0,
        impactCount: 0,
      })
    );

    if (levelData.environmentUnits) {
      this.environmentUnits = levelData.environmentUnits.map((eu, index) => ({
        id: `env_unit_${index}_${Math.random().toString(36).substring(7)}`,
        tdConfigId: eu.tdConfigId,
        position: { x: eu.position.x, y: eu.position.y },
        facingDirection: eu.facingDirection || 'down',
        hp: 1,
        maxHp: 1,
      }));
    }

    if (levelData.captureUnits && levelData.captureUnits.length > 0) {
      this.hasCaptureUnitsGoal = true;
      this.captureUnits = levelData.captureUnits.map((cu, index) => ({
        id: `cap_unit_${index}_${Math.random().toString(36).substring(7)}`,
        tdConfigId: cu.tdConfigId,
        position: { x: cu.position.x, y: cu.position.y },
        homePosition: { x: cu.position.x, y: cu.position.y },
        carrierSpeedMultiplier: cu.carrierSpeedMultiplier,
        returnHome: cu.returnHome ? { ...cu.returnHome } : undefined,
        waveRelocations: cu.waveRelocations?.map((relocation) => ({
          ...relocation,
          path: relocation.path.map((point) => ({ ...point })),
        })),
        facingDirection: 'down',
        hp: 1,
        maxHp: 1,
      }));
      this.lives = this.captureUnits.length;
    } else {
      this.lives = levelData.lives !== undefined ? levelData.lives : 3;
    }

    if (levelData.startingTowers) {
      for (const startingTower of levelData.startingTowers) {
        const tower = this.createTower(
          structuredClone(startingTower.creature),
          startingTower.position.x,
          startingTower.position.y,
          startingTower.facingDirection ?? 'down',
          startingTower.isFixed ?? false,
          startingTower.receivesExperience ?? false
        );
        if (tower) this.towers.push(tower);
      }
    }

    // Initialize first wave group if available
    if (this.waves.length > 0 && this.waves[0].groups.length > 0) {
      this.currentWaveIndex = 0;
      this.nextGroupIndexToStart = 0;
      this.loadNextSpawners();
    } else {
      this.hasFinishedAllWaves = true; // Fallback to random or nothing
    }
  }

  public isSpotOccupied(x: number, y: number): boolean {
    // Check if any tower is at these exact coordinates
    return this.towers.some((t) => t.position.x === x && t.position.y === y);
  }

  public destroy() {
    this.progression.destroy();
  }

  public tick(time: number, deltaMs: number) {
    this.elapsedTimeMs += deltaMs;

    let newEnemies = [...this.enemies];
    // Notice: we do NOT clone projectiles here anymore, we filter them at the end.
    // Behaviors push directly to engine.projectiles during the tick.
    const newTowers = [...this.towers];

    // Spawn enemies
    if (this.waves.length > 0) {
      if (!this.hasFinishedAllWaves) {
        this.processWaveSpawns(time, deltaMs, newEnemies);
      }
    } else {
      // Fallback: MVP random spawning if no waves defined
      if (time - this.lastSpawnTime > 500) {
        if (time - this.lastSpawnTime > 5000) {
          this.lastSpawnTime = time - 500; // soft clamp if tab was backgrounded
        }

        const randomEnemyDef =
          ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
        const pathIndex =
          this.paths.length > 0
            ? Math.floor(Math.random() * this.paths.length)
            : 0;
        const startPath = this.paths[pathIndex] || [{ x: 0, y: 0 }];
        const enemyLevel = defaultLevels[randomEnemyDef.id] ?? 3;
        const newEnemyHp =
          calculateMaxHp(randomEnemyDef.baseStats.hp, enemyLevel) *
          this.enemyHpMultiplier;
        const newEnemyAttack = calculateStat(
          randomEnemyDef.baseStats.attack,
          enemyLevel
        );
        const newEnemySpecialAttack = calculateStat(
          randomEnemyDef.baseStats.specialAttack,
          enemyLevel
        );
        const newEnemyDefense = calculateStat(
          randomEnemyDef.baseStats.defense,
          enemyLevel
        );
        const newEnemySpecialDefense = calculateStat(
          randomEnemyDef.baseStats.specialDefense,
          enemyLevel
        );
        const isShiny = false; //TowerDefenseEngine.forceShinySpawns || (Math.random() < 0.5);
        const newEnemy: Enemy = {
          id: `enemy_${time}`,
          definitionId: randomEnemyDef.id,
          level: enemyLevel,
          position: { x: startPath[0].x, y: startPath[0].y },
          hp: newEnemyHp,
          maxHp: newEnemyHp,
          speed: randomEnemyDef.baseStats.speed / 100,
          currentAttack: newEnemyAttack,
          currentSpecialAttack: newEnemySpecialAttack,
          currentDefense: newEnemyDefense,
          currentSpecialDefense: newEnemySpecialDefense,
          statusConditions: [],
          currentWaypointIndex: 1,
          pathIndex: pathIndex,
          facingDirection: 'down',
          damagedByTowerIds: new Set<string>(),
          isShiny,
        };
        newEnemies.push(newEnemy);

        if (isShiny && !this.disableCapture) {
          this.events.emit({
            type: 'SHINY_ENEMY_SPAWNED',
            enemyId: newEnemy.id,
            enemyDefinitionId: newEnemy.definitionId,
            level: newEnemy.level,
          });
        }
        this.lastSpawnTime = time;
      }
    }

    // Update environment units (moving ones)
    this.environmentUnits.forEach((unit) => {
      if (unit.speed && unit.path && unit.path.length > 0) {
        if (unit.currentWaypointIndex === undefined) {
          unit.currentWaypointIndex = 0;
        }

        if (unit.currentWaypointIndex < unit.path.length) {
          const targetPoint = unit.path[unit.currentWaypointIndex];
          const previousPoint =
            unit.currentWaypointIndex > 0
              ? unit.path[unit.currentWaypointIndex - 1]
              : undefined;
          const moveSpeed = unit.speed;
          // speed is in % per second, so distance = speed * (deltaMs / 1000)
          const frameDistance = moveSpeed * (deltaMs / 1000);

          const { reachedWaypoint, facingDirection } = stepUnitTowardsWaypoint(
            unit.position,
            targetPoint,
            frameDistance,
            this.aspectRatio,
            previousPoint,
            unit.facingDirection
          );
          unit.facingDirection = facingDirection;

          if (reachedWaypoint) {
            unit.currentWaypointIndex++;
          }
        } else {
          // Reached end of path, clear path to prevent redundant calculation
          unit.path = undefined;
          unit.speed = undefined;
          unit.currentWaypointIndex = undefined;
        }
      }
    });

    this.processEnemyAbilities(newEnemies);
    const constrictedMs = updateDeepwaterGrips(this, newEnemies, deltaMs);

    // Update enemies
    newEnemies.forEach((enemy) => {
      if (enemy.damageFlashTimerMs) {
        enemy.damageFlashTimerMs -= deltaMs;
        if (enemy.damageFlashTimerMs < 0) enemy.damageFlashTimerMs = 0;
      }
      if (enemy.kind === 'structure') return;
      // the map dev uses speed relative to arbitrary frame timing, with a delta based loop we should scale it,
      // but to keep logic equivalent for now we'll just replicate it roughly
      // if 1 frame was originally ~16.6ms, we can normalize deltaMs / 16.6 to apply speed
      const timeScale = (deltaMs - (constrictedMs.get(enemy.id) ?? 0)) / 16.666;
      let moveSpeed =
        enemy.speed *
        getActiveSpeedMultiplier(enemy, this.elapsedTimeMs) *
        this.getObjectiveCurrentSpeedMultiplier(enemy);
      const activeAbility = enemy.abilityRuntime
        ? ENEMY_ABILITY_DEFS[enemy.abilityRuntime.definitionId]
        : undefined;
      if (
        activeAbility?.type === 'PROXIMITY_HOWL_SPEED_STACK' &&
        (enemy.abilityRuntime?.activationCount ?? 0) > 0
      ) {
        moveSpeed *= activeAbility.retreatSpeedMultiplier;
      }
      const heldCaptureUnit = enemy.heldCaptureUnitId
        ? this.captureUnits.find(
            (captureUnit) => captureUnit.id === enemy.heldCaptureUnitId
          )
        : undefined;
      moveSpeed *= heldCaptureUnit?.carrierSpeedMultiplier ?? 1;
      const resonantTarget = enemy.resonantEvolutionTargetCaptureUnitId
        ? this.captureUnits.find(
            (captureUnit) =>
              captureUnit.id === enemy.resonantEvolutionTargetCaptureUnitId
          )
        : undefined;
      if (
        resonantTarget?.heldByEnemyId &&
        resonantTarget.heldByEnemyId !== enemy.id
      ) {
        enemy.resonantEvolutionTargetCaptureUnitId = undefined;
      }
      const isAwaitingResonantPickup = Boolean(
        enemy.resonantEvolutionTargetCaptureUnitId &&
        resonantTarget &&
        !resonantTarget.heldByEnemyId
      );

      if (
        enemy.resonantEvolutionState ||
        (enemy.resonantEvolutionRecoveryUntilMs ?? 0) > this.elapsedTimeMs ||
        isAwaitingResonantPickup
      ) {
        moveSpeed = 0;
      }

      // Handle status conditions
      if (enemy.statusConditions.length > 0) {
        enemy.statusConditions.forEach((status) => {
          if (status.type === 'STUN') {
            moveSpeed = 0; // cannot move while stunned
          } else if (status.type === 'BURN' || status.type === 'POISON') {
            if (status.tickDamage && time - (status.lastTickTime || 0) > 1000) {
              if (!enemy.isInvulnerable) {
                enemy.hp -= status.tickDamage;
              }
              startDamageFlash(
                enemy,
                status.type === 'BURN' ? ElementType.FIRE : ElementType.POISON
              );
              status.lastTickTime = time;

              this.floatingTexts.push({
                id: `ft_tick_${time}_${Math.random().toString(36).substring(7)}`,
                text: Math.ceil(status.tickDamage).toString(),
                position: { ...enemy.position },
                color: status.type === 'BURN' ? 0xffaaaa : 0xccffcc,
                durationMs: 1000,
                elapsedMs: 0,
              });
            }
          }
          status.durationMs -= deltaMs;
        });

        // Clean up expired
        enemy.statusConditions = enemy.statusConditions.filter(
          (s) => s.durationMs > 0
        );
      }

        const activePath = this.paths[enemy.pathIndex] || [];
        if (
          (!enemy.isMovingBackward &&
            enemy.currentWaypointIndex < activePath.length) ||
          (enemy.isMovingBackward && enemy.currentWaypointIndex >= 0)
        ) {
          const targetPoint = activePath[enemy.currentWaypointIndex];
          const previousPoint = enemy.isMovingBackward
            ? activePath[enemy.currentWaypointIndex + 1]
            : activePath[enemy.currentWaypointIndex - 1];
          const frameDistance = moveSpeed * timeScale;

          const { reachedWaypoint, facingDirection } = stepUnitTowardsWaypoint(
            enemy.position,
            targetPoint,
            frameDistance,
            this.aspectRatio,
            previousPoint,
            enemy.facingDirection
          );
          enemy.facingDirection = facingDirection;

          if (reachedWaypoint) {
            // Advance/regress waypoint
            if (enemy.isMovingBackward) {
              enemy.currentWaypointIndex--;
            } else {
              enemy.currentWaypointIndex++;
            }
          }
        }

      // Check if enemy reached the forward end, and should turnaround instead of despawning
      if (
        !enemy.isMovingBackward &&
        enemy.turnAroundAtEnd &&
        enemy.currentWaypointIndex >= activePath.length
      ) {
        enemy.isMovingBackward = true;
        // Start heading back to the previous node (the second to last node, since it's already AT the last node)
        // activePath.length - 1 is the last node, activePath.length - 2 is the one before it.
        // It might be possible path is shorter than 2 nodes.
        enemy.currentWaypointIndex = Math.max(0, activePath.length - 2);
        const nextTarget = activePath[enemy.currentWaypointIndex];
        if (nextTarget) {
          const segDx = nextTarget.x - enemy.position.x;
          const segDy = nextTarget.y - enemy.position.y;
          const visualDx = segDx * this.aspectRatio;
          const visualDy = segDy;
          if (Math.abs(visualDx) >= Math.abs(visualDy)) {
            enemy.facingDirection = segDx >= 0 ? 'right' : 'left';
          } else {
            enemy.facingDirection = segDy > 0 ? 'down' : 'up';
          }
        }
      }
    });

    this.processResonantEvolution(newEnemies);

    const abilityDespawnedEnemies = newEnemies.filter(
      (enemy) => enemy.abilityRuntime?.despawnRequested
    );
    abilityDespawnedEnemies.forEach((enemy) => this.dropCaptureUnit(enemy));
    newEnemies = newEnemies.filter(
      (enemy) => !enemy.abilityRuntime?.despawnRequested
    );

    // Enemy reached end
    const reachedEnd = newEnemies.filter((e) => {
      const activePath = this.paths[e.pathIndex] || [];
      if (!e.isMovingBackward && e.currentWaypointIndex >= activePath.length) {
        return !e.turnAroundAtEnd;
      } else if (e.isMovingBackward && e.currentWaypointIndex < 0) {
        return true;
      }
      return false;
    });

    if (reachedEnd.length > 0) {
      let livesToLose = 0;
      reachedEnd.forEach((e) => {
        if (this.hasCaptureUnitsGoal) {
          if (e.heldCaptureUnitId) {
            livesToLose++;
          }
        } else {
          livesToLose +=
            (e.waveEnemyDefinitionId
              ? this.waveEnemyDefinitions[e.waveEnemyDefinitionId]?.goalDamage
              : undefined) ?? 1;
        }
      });

      this.lives -= livesToLose;
      if (this.lives <= 0 && this.lives !== -1) {
        // We'll let the UI handle game over messaging by watching the lives count
        this.lives = 0;
      }

      // Enemies that reached the end take their held unit with them.
      reachedEnd.forEach((e) => {
        if (e.heldCaptureUnitId) {
          // Remove the unit from the map entirely
          this.captureUnits = this.captureUnits.filter(
            (cu) => cu.id !== e.heldCaptureUnitId
          );
        }
      });
    }

    newEnemies = newEnemies.filter((e) => {
      const activePath = this.paths[e.pathIndex] || [];
      const reachedForwardEnd = e.currentWaypointIndex >= activePath.length;
      const reachedBackwardEnd = e.currentWaypointIndex < 0;

      // Keep if it hasn't reached either end
      if (!reachedForwardEnd && !reachedBackwardEnd) return true;

      // Keep if it reached forward end but is turning around (it will soon be marked as backward)
      if (reachedForwardEnd && e.turnAroundAtEnd && !e.isMovingBackward)
        return true;

      // Otherwise remove
      return false;
    });

    // CaptureUnit Interaction Logic
    // 1. Pick up unheld items
    for (const cu of this.captureUnits) {
      if (!cu.heldByEnemyId) {
        if (cu.activeRelocation) {
          this.updateCaptureUnitRelocation(cu, deltaMs);
        } else {
          this.updateCaptureUnitReturnHome(cu, deltaMs);
        }

        if (cu.activeRelocation) continue;

        // Find closest enemy that isn't holding anything
        for (const enemy of newEnemies) {
          if (enemy.kind === 'structure') continue;
          if (enemy.heldCaptureUnitId) continue;
          const enemyDefinition = enemy.waveEnemyDefinitionId
            ? this.waveEnemyDefinitions[enemy.waveEnemyDefinitionId]
            : undefined;
          if (enemyDefinition?.canCarryCaptureUnits === false) continue;
          if ((enemy.itemPickupBlockedUntilMs ?? 0) > this.elapsedTimeMs) {
            continue;
          }

          const dx = enemy.position.x - cu.position.x;
          // Apply aspect ratio properly to dy since screen isn't perfectly square
          const dy = (enemy.position.y - cu.position.y) * this.aspectRatio;
          const distSq = dx * dx + dy * dy;

          // Expand pickup radius generously because the new snapped orthogonal paths
          // might push the enemy's line of movement slightly further from the
          // original visually-intended path line.
          if (distSq < 125) {
            // within ~20 units
            cu.heldByEnemyId = enemy.id;
            enemy.heldCaptureUnitId = cu.id;
            enemy.resonantEvolutionTargetCaptureUnitId = undefined;
            cu.returnHomeAvailableAtMs = undefined;

            if (enemy.turnAroundAtEnd && !enemy.isMovingBackward) {
              enemy.isMovingBackward = true;
              enemy.currentWaypointIndex = Math.max(
                0,
                enemy.currentWaypointIndex - 1
              );
            }

            break; // only one enemy picks it up
          }
        }
      } else {
        // 2. Update position of held items to match their carrier
        const carrier = newEnemies.find((e) => e.id === cu.heldByEnemyId);
        if (carrier) {
          cu.position.x = carrier.position.x;
          cu.position.y = carrier.position.y;
          cu.returnHomeAvailableAtMs = undefined;
        }
      }
    }

    // Towers attack
    // Target selection must see captures/despawns from this frame.
    this.enemies = newEnemies;
    newTowers.forEach((tower) => {
      if (tower.damageFlashTimerMs) {
        tower.damageFlashTimerMs -= deltaMs;
        if (tower.damageFlashTimerMs < 0) tower.damageFlashTimerMs = 0;
      }
      if (tower.deepwaterGrip || tower.hp <= 0) return;
      const attackInstance =
        tower.equippedAttacksRuntime[tower.selectedAttackIndex];
      if (!attackInstance) return;

      const attackDef = ATTACK_DEFS[attackInstance.definitionId];
      if (!attackDef) return;

      const usesSimulationCooldown =
        attackDef.behaviorType === 'SUPPORT_AURA' ||
        attackDef.behaviorType === 'REPAIR_SUPPORT' ||
        attackDef.behaviorType === 'CONSTRICTION';
      const isReady = usesSimulationCooldown
        ? this.elapsedTimeMs >= (attackInstance.readyAtMs ?? 0)
        : time - attackInstance.lastFiredTime >
          attackDef.cooldownMs /
            getAttackSpeedMultiplier(tower, this.elapsedTimeMs);

      if (isReady) {
        const targetEnemy = this.getTargetForTower(
          tower,
          attackDef.rangeIndex,
          tower.targetingMode || 'first'
        );

        if (targetEnemy) {
          const dx = targetEnemy.position.x - tower.position.x;
          const dy = targetEnemy.position.y - tower.position.y;
          if (Math.abs(dx) > Math.abs(dy)) {
            tower.facingDirection = dx > 0 ? 'right' : 'left';
          } else {
            tower.facingDirection = dy > 0 ? 'down' : 'up';
          }
        }

        const behavior = AttackBehaviorRegistry[attackDef.behaviorType];

        if (behavior && behavior.canExecute(this, tower, attackDef)) {
          behavior.execute(this, tower, attackDef);
          attackInstance.lastFiredTime = time;
          if (usesSimulationCooldown) {
            // Stored on the move, not the selected slot or buff: swapping cannot reset it.
            attackInstance.readyAtMs =
              this.elapsedTimeMs + attackDef.cooldownMs;
          }
        }
      }
    });

    // Update projectiles
    const timeScale = deltaMs / 16.666;
    this.projectiles.forEach((p) => {
      if (p.rollingBarrel && p.attackDefinitionId) {
        updateRollingBarrel(
          this,
          p,
          newEnemies,
          ATTACK_DEFS[p.attackDefinitionId],
          deltaMs
        );
        return;
      }
      const target = newEnemies.find((e) => e.id === p.targetId);
      if (target) {
        p.target = { ...target.position };
      }

      const dashDef = p.attackDefinitionId
        ? ATTACK_DEFS[p.attackDefinitionId]
        : undefined;
      const dashVisual = dashDef?.visualEffectConfigId
        ? CREATURE_TD_CONFIGS[dashDef.visualEffectConfigId]?.default?.vfxAnimation
        : undefined;
      if (
        dashDef?.isDashAttack &&
        dashDef.dashImpactHoldMs &&
        dashVisual?.impactProgress !== undefined
      ) {
        const source = newTowers.find((tower) => tower.id === p.sourceId);
        if (!p.hasImpacted) {
          if (!target || target.hp <= 0 || !source) {
            p.speed = 0;
            return;
          }

          // Approach from the caster's side, stopping short even on wide maps.
          const origin = p.origin ?? source.position;
          const distance = this.getAttackDistance(origin, target.position);
          const backoff = distance > 0
            ? Math.min(1, (dashDef.dashStopRange ?? 0) / distance)
            : 0;
          const stopOffset = {
            x: (origin.x - target.position.x) * backoff,
            y: (origin.y - target.position.y) * backoff,
          };
          const stopPoint = {
            x: target.position.x + stopOffset.x,
            y: target.position.y + stopOffset.y,
          };
          const dx = stopPoint.x - p.position.x;
          const dy = stopPoint.y - p.position.y;
          const travelDistance = Math.hypot(dx, dy);
          const frameSpeed = p.speed * timeScale;
          if (travelDistance > frameSpeed) {
            p.position.x += (dx / travelDistance) * frameSpeed;
            p.position.y += (dy / travelDistance) * frameSpeed;
            return;
          }

          const travelMs = p.speed > 0 ? (travelDistance / p.speed) * 16.666 : 0;
          p.position = stopPoint;
          p.dashTargetOffset = stopOffset;
          p.hasImpacted = true;
          p.impactElapsedMs = Math.max(0, deltaMs - travelMs);
          p.impactHoldDurationMs = dashVisual.durationMs ?? dashDef.dashImpactHoldMs;
          p.speed = 0;
          this.visualEffects.push({
            id: `vfx_dash_${p.id}`,
            configId: dashDef.visualEffectConfigId!,
            position: { ...target.position },
            durationMs: p.impactHoldDurationMs,
            elapsedMs: p.impactElapsedMs,
            dashProjectileId: p.id,
            targetId: target.id,
            facingDirection: p.facingDirection,
            rangeIndex: dashDef.adaptiveTargetedAoe?.radiusIndex,
          });
        } else {
          p.impactElapsedMs = (p.impactElapsedMs ?? 0) + deltaMs;
          if (target && p.dashTargetOffset) {
            p.position = {
              x: target.position.x + p.dashTargetOffset.x,
              y: target.position.y + p.dashTargetOffset.y,
            };
          }
        }

        const contactMs = dashVisual.impactProgress * p.impactHoldDurationMs!;
        if (!p.impactDamageApplied && (p.impactElapsedMs ?? 0) >= contactMs) {
          p.impactDamageApplied = true;
          if (source && target && target.hp > 0 && p.dealsDamage !== false) {
            if (dashDef.adaptiveTargetedAoe) {
              resolveAdaptiveTargetedAoeImpact(this, source, dashDef, target, false);
            } else {
              EffectProcessor.applyDamageAndEffects(this, source, target, dashDef);
              if (target.hp <= 0) this.emitEnemyDefeated(target, source);
            }
          }
        }
        return;
      }

      if (p.hasImpacted) {
        if (target) p.position = { ...target.position };
        p.impactElapsedMs = (p.impactElapsedMs ?? 0) + deltaMs;
        return;
      }

      const dx = p.target.x - p.position.x;
      const dy = p.target.y - p.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const frameSpeed = p.speed * timeScale;

      if (dist < frameSpeed) {
        if (target && p.dealsDamage !== false) {
          const sourceTower = newTowers.find((t) => t.id === p.sourceId);
          if (p.attackDefinitionId && sourceTower) {
            const attackDef = ATTACK_DEFS[p.attackDefinitionId];
            if (attackDef) {
              if (attackDef.adaptiveTargetedAoe) {
                resolveAdaptiveTargetedAoeImpact(
                  this,
                  sourceTower,
                  attackDef,
                  target
                );
              } else {
                EffectProcessor.applyDamageAndEffects(
                  this,
                  sourceTower,
                  target,
                  attackDef
                );
              }

              if (
                !attackDef.adaptiveTargetedAoe &&
                attackDef.visualEffectConfigId
              ) {
                const configMap =
                  CREATURE_TD_CONFIGS[attackDef.visualEffectConfigId];
                const vfxConfig = configMap?.default?.vfxAnimation;
                const durationMs = vfxConfig?.durationMs ?? 500;
                this.visualEffects.push({
                  id: `vfx_${Date.now()}_${Math.random()}`,
                  configId: attackDef.visualEffectConfigId,
                  position: { ...target.position },
                  durationMs,
                  elapsedMs: 0,
                  targetId: target.id,
                });
              }
            } else {
              target.hp -= p.damage; // Fallback
              startDamageFlash(target, ATTACK_DEFS[p.attackDefinitionId]?.type);
              this.floatingTexts.push({
                id: `ft_dmg_${time}_${Math.random().toString(36).substring(7)}`,
                text: Math.ceil(p.damage).toString(),
                position: { ...target.position },
                color: 0xffffff,
                durationMs: 1000,
                elapsedMs: 0,
              });
            }
          } else {
            target.hp -= p.damage;
            startDamageFlash(
              target,
              p.attackDefinitionId
                ? ATTACK_DEFS[p.attackDefinitionId]?.type
                : undefined
            );
            this.floatingTexts.push({
              id: `ft_dmg_${time}_${Math.random().toString(36).substring(7)}`,
              text: Math.ceil(p.damage).toString(),
              position: { ...target.position },
              color: 0xffffff,
              durationMs: 1000,
              elapsedMs: 0,
            });
          }

          const impactAttackDef = p.attackDefinitionId
            ? ATTACK_DEFS[p.attackDefinitionId]
            : undefined;
          if (
            target.hp <= 0 &&
            sourceTower &&
            !impactAttackDef?.adaptiveTargetedAoe
          ) {
            this.emitEnemyDefeated(target, sourceTower);
          }
        }

        const impactDef = p.attackDefinitionId
          ? ATTACK_DEFS[p.attackDefinitionId]
          : undefined;
        if (target && impactDef?.isDashAttack && impactDef.dashImpactHoldMs) {
          p.position = { ...p.target };
          p.hasImpacted = true;
          p.impactElapsedMs = 0;
          p.impactHoldDurationMs = impactDef.dashImpactHoldMs;
          p.speed = 0;
        } else {
          p.speed = 0; // mark for deletion
        }
      } else {
        p.position.x += (dx / dist) * frameSpeed;
        p.position.y += (dy / dist) * frameSpeed;
        if (Math.abs(dx) > Math.abs(dy)) {
          p.facingDirection = dx > 0 ? 'right' : 'left';
        } else {
          p.facingDirection = dy > 0 ? 'down' : 'up';
        }
      }
    });

    this.processObjectiveAllies(newEnemies, deltaMs);
    this.processObjectiveAllyShadows(newEnemies);
    this.processObjectiveAllyCurrents(newEnemies);
    this.processObjectiveAllyAcidShots(newEnemies);
    this.processScouredEffects(newEnemies);

    // Filter dead enemies and collect money
    const deadEnemies = newEnemies.filter((e) => e.hp <= 0);
    if (deadEnemies.length > 0) {
      this.money += deadEnemies.reduce(
        (total, enemy) =>
          total + (enemy.moneyReward ?? (enemy.kind === 'structure' ? 0 : 10)),
        0
      );

      // Drop capture units when an enemy dies
      deadEnemies.forEach((e) => {
        this.dropCaptureUnit(e);
      });
    }
    newEnemies = newEnemies.filter((e) => e.hp > 0);

    // Keep projectiles that are traveling or holding a dash attacker at impact.
    const activeProjectiles = this.projectiles.filter(
      (p) =>
        p.speed > 0 ||
        (p.hasImpacted &&
          (p.impactElapsedMs ?? 0) < (p.impactHoldDurationMs ?? 0))
    );

    // Update Visual Effects
    this.visualEffects.forEach((effect) => {
      const dash = effect.dashProjectileId
        ? this.projectiles.find((p) => p.id === effect.dashProjectileId)
        : undefined;
      effect.elapsedMs = dash
        ? (dash.impactElapsedMs ?? 0)
        : effect.elapsedMs + deltaMs;
      if (dash) effect.position = { ...dash.target };
      // If attached to a target, update position
      if (effect.targetId) {
        const target =
          newEnemies.find((e) => e.id === effect.targetId) ||
          this.towers.find((t) => t.id === effect.targetId);
        if (target) {
          effect.position.x = target.position.x;
          effect.position.y = target.position.y;
        }
      }
    });
    this.visualEffects = this.visualEffects.filter(
      (e) => e.elapsedMs < e.durationMs
    );

    // Update Floating Texts
    this.floatingTexts.forEach((ft) => {
      ft.elapsedMs += deltaMs;
    });
    this.floatingTexts = this.floatingTexts.filter(
      (ft) => ft.elapsedMs < ft.durationMs
    );

    this.enemies = newEnemies;
    this.projectiles = activeProjectiles;
    this.towers = newTowers;
    updateDeepwaterGrips(this, newEnemies, 0);
  }

  private getCaptureDistanceSq(enemy: Enemy, captureUnit: CaptureUnit) {
    return this.getPositionDistanceSq(enemy.position, captureUnit.position);
  }

  private getPositionDistanceSq(a: Point, b: Point) {
    const dx = a.x - b.x;
    const dy = (a.y - b.y) * this.aspectRatio;
    return dx * dx + dy * dy;
  }

  private clearResonantEvolutionGroup(enemies: Enemy[], groupId: string) {
    enemies.forEach((enemy) => {
      if (enemy.resonantEvolutionState?.groupId === groupId) {
        enemy.resonantEvolutionState = undefined;
      }
    });
  }

  private applyEvolvedEnemyDefinition(
    enemy: Enemy,
    evolvedEnemyDefinitionId: string
  ): boolean {
    const definition = this.waveEnemyDefinitions[evolvedEnemyDefinitionId];
    if (!definition) return false;

    if (!definition.creatureId || definition.structure) return false;
    const meta = TD_CREATURE_DEFS[definition.creatureId];
    if (!meta) return false;

    const level = definition.level;
    const maxHp =
      calculateMaxHp(meta.baseCreature.maxHp, level) *
      this.enemyHpMultiplier *
      (definition.hpMultiplier ?? 1);
    const ability = definition.abilityId
      ? ENEMY_ABILITY_DEFS[definition.abilityId]
      : undefined;

    enemy.definitionId = definition.creatureId;
    enemy.waveEnemyDefinitionId = definition.id;
    enemy.weakenedThreshold = definition.weakenedThreshold;
    enemy.level = level;
    enemy.hp = maxHp;
    enemy.maxHp = maxHp;
    enemy.speed =
      (meta.baseCreature.speed / 100) * (definition.speedMultiplier ?? 1);
    enemy.currentAttack = calculateStat(meta.baseCreature.attack, level);
    enemy.currentSpecialAttack = calculateStat(
      meta.baseCreature.specialAttack,
      level
    );
    enemy.currentDefense =
      calculateStat(meta.baseCreature.defense, level) *
      (definition.defenseMultiplier ?? 1);
    enemy.currentSpecialDefense =
      calculateStat(meta.baseCreature.specialDefense, level) *
      (definition.specialDefenseMultiplier ?? 1);
    enemy.speedBoostMultiplier = undefined;
    enemy.speedBoostUntilMs = undefined;
    enemy.speedSlowMultiplier = undefined;
    enemy.defenseBoostMultiplier = undefined;
    enemy.specialDefenseBoostMultiplier = undefined;
    enemy.abilityRuntime = ability
      ? {
          definitionId: ability.id,
          nextReadyTimeMs: this.elapsedTimeMs + ability.initialCooldownMs,
        }
      : undefined;
    return true;
  }

  private processResonantEvolution(enemies: Enemy[]) {
    const config = this.resonantEvolution;
    if (!config || config.requiredCount < 2) return;

    const linkRadius = config.linkRadius ?? config.radius;
    const minimumSpacing = config.minimumSpacing ?? 0;
    const maxDistanceFromCaptureUnit =
      config.maxDistanceFromCaptureUnit ??
      config.radius + linkRadius * (config.requiredCount - 1);
    const anchorRadiusSq = config.radius * config.radius;
    const linkRadiusSq = linkRadius * linkRadius;
    const minimumSpacingSq = minimumSpacing * minimumSpacing;
    const maxDistanceSq =
      maxDistanceFromCaptureUnit * maxDistanceFromCaptureUnit;

    const activeGroupIds = new Set(
      enemies
        .map((enemy) => enemy.resonantEvolutionState?.groupId)
        .filter((groupId): groupId is string => Boolean(groupId))
    );

    for (const groupId of activeGroupIds) {
      const participants = enemies.filter(
        (enemy) => enemy.resonantEvolutionState?.groupId === groupId
      );
      const state = participants[0]?.resonantEvolutionState;
      const captureUnit = state
        ? this.captureUnits.find(
            (candidate) => candidate.id === state.captureUnitId
          )
        : undefined;
      const participantById = new Map(
        participants.map((participant) => [participant.id, participant])
      );
      const hasInvalidLink = participants.some((participant) => {
        const participantState = participant.resonantEvolutionState;
        if (!participantState || !captureUnit) return true;
        if (
          this.getCaptureDistanceSq(participant, captureUnit) > maxDistanceSq
        ) {
          return true;
        }

        if (!participantState.linkTargetEnemyId) {
          return (
            this.getCaptureDistanceSq(participant, captureUnit) > anchorRadiusSq
          );
        }

        const linkTarget = participantById.get(
          participantState.linkTargetEnemyId
        );
        return (
          !linkTarget ||
          linkTarget.hp <= 0 ||
          this.getPositionDistanceSq(
            participant.position,
            linkTarget.position
          ) > linkRadiusSq
        );
      });
      const interrupted =
        !state ||
        participants.length > config.requiredCount ||
        !captureUnit ||
        Boolean(captureUnit.heldByEnemyId) ||
        participants.some((enemy) => enemy.hp <= 0) ||
        hasInvalidLink;

      if (interrupted) {
        this.clearResonantEvolutionGroup(enemies, groupId);
        continue;
      }

      if (state.phase === 'forming') {
        if (this.elapsedTimeMs - state.startedAtMs >= state.durationMs) {
          participants.forEach((participant) => {
            participant.resonantEvolutionSpent = true;
          });
          this.clearResonantEvolutionGroup(enemies, groupId);
        }
        continue;
      }

      if (participants.length !== config.requiredCount) {
        this.clearResonantEvolutionGroup(enemies, groupId);
        continue;
      }

      if (this.elapsedTimeMs - state.startedAtMs < state.durationMs) continue;

      const evolvingEnemy = participants.find(
        (enemy) => enemy.resonantEvolutionState?.role === 'evolving'
      );
      if (!evolvingEnemy) {
        this.clearResonantEvolutionGroup(enemies, groupId);
        continue;
      }

      for (const participant of participants) {
        participant.resonantEvolutionState = undefined;
        if (participant !== evolvingEnemy) {
          participant.resonantEvolutionSpent = true;
        }
      }

      if (
        !this.applyEvolvedEnemyDefinition(
          evolvingEnemy,
          config.evolvedEnemyDefinitionId
        )
      ) {
        continue;
      }

      evolvingEnemy.resonantEvolutionRecoveryUntilMs =
        this.elapsedTimeMs + config.recoveryDurationMs;
      evolvingEnemy.resonantEvolutionTargetCaptureUnitId = captureUnit.id;
      evolvingEnemy.itemPickupBlockedUntilMs =
        evolvingEnemy.resonantEvolutionRecoveryUntilMs;
      this.floatingTexts.push({
        id: `ft_resonant_evolution_${this.elapsedTimeMs}_${evolvingEnemy.id}`,
        text: 'Resonant Evolution!',
        position: { ...evolvingEnemy.position },
        color: 0x67e8f9,
        scale: 1,
        durationMs: 1300,
        elapsedMs: 0,
      });
    }

    for (const captureUnit of this.captureUnits) {
      if (captureUnit.heldByEnemyId || captureUnit.activeRelocation) continue;

      let participants = enemies.filter(
        (enemy) =>
          enemy.resonantEvolutionState?.captureUnitId === captureUnit.id
      );

      // A locked channel owns the objective until it resolves. Later arrivals
      // keep moving and cannot attach themselves to that completed chain.
      if (
        participants.some(
          (participant) =>
            participant.resonantEvolutionState?.phase === 'channeling'
        )
      ) {
        continue;
      }

      if (participants.length === 0) {
        const evolvingEnemy = enemies
          .filter(
            (enemy) =>
              enemy.hp > 0 &&
              enemy.definitionId === config.sourceCreatureId &&
              !enemy.resonantEvolutionState &&
              !enemy.resonantEvolutionSpent &&
              !enemy.heldCaptureUnitId &&
              this.getCaptureDistanceSq(enemy, captureUnit) <= anchorRadiusSq
          )
          .sort(
            (a, b) =>
              this.getCaptureDistanceSq(a, captureUnit) -
              this.getCaptureDistanceSq(b, captureUnit)
          )[0];

        if (!evolvingEnemy) continue;

        const groupId = `resonant_${this.elapsedTimeMs}_${Math.random()
          .toString(36)
          .substring(7)}`;
        evolvingEnemy.resonantEvolutionState = {
          groupId,
          captureUnitId: captureUnit.id,
          role: 'evolving',
          phase: 'forming',
          startedAtMs: this.elapsedTimeMs,
          durationMs: config.gatherWaitDurationMs,
        };
        participants = [evolvingEnemy];
      }

      while (participants.length < config.requiredCount) {
        const groupState = participants[0].resonantEvolutionState;
        if (!groupState) break;

        const attachments = enemies
          .filter(
            (enemy) =>
              enemy.hp > 0 &&
              enemy.definitionId === config.sourceCreatureId &&
              !enemy.resonantEvolutionState &&
              !enemy.resonantEvolutionSpent &&
              !enemy.heldCaptureUnitId &&
              this.getCaptureDistanceSq(enemy, captureUnit) <= maxDistanceSq &&
              participants.every(
                (participant) =>
                  this.getPositionDistanceSq(
                    enemy.position,
                    participant.position
                  ) >= minimumSpacingSq
              )
          )
          .flatMap((enemy) => {
            const possibleTargets: Array<{
              enemyId?: string;
              distanceSq: number;
            }> = [];
            const captureDistanceSq = this.getCaptureDistanceSq(
              enemy,
              captureUnit
            );
            if (captureDistanceSq <= anchorRadiusSq) {
              possibleTargets.push({ distanceSq: captureDistanceSq });
            }
            participants.forEach((participant) => {
              const distanceSq = this.getPositionDistanceSq(
                enemy.position,
                participant.position
              );
              if (distanceSq <= linkRadiusSq) {
                possibleTargets.push({ enemyId: participant.id, distanceSq });
              }
            });

            const target = possibleTargets.sort(
              (a, b) => a.distanceSq - b.distanceSq
            )[0];
            return target ? [{ enemy, target }] : [];
          })
          .sort((a, b) => a.target.distanceSq - b.target.distanceSq);

        const attachment = attachments[0];
        if (!attachment) break;

        attachment.enemy.resonantEvolutionState = {
          groupId: groupState.groupId,
          captureUnitId: captureUnit.id,
          role: 'helper',
          phase: 'forming',
          linkTargetEnemyId: attachment.target.enemyId,
          startedAtMs: groupState.startedAtMs,
          durationMs: groupState.durationMs,
        };
        participants.push(attachment.enemy);
      }

      if (participants.length === config.requiredCount) {
        const startedAtMs = this.elapsedTimeMs;
        participants.forEach((participant) => {
          if (!participant.resonantEvolutionState) return;
          participant.resonantEvolutionState.phase = 'channeling';
          participant.resonantEvolutionState.startedAtMs = startedAtMs;
          participant.resonantEvolutionState.durationMs =
            config.channelDurationMs;
        });
        const evolvingEnemy = participants.find(
          (participant) =>
            participant.resonantEvolutionState?.role === 'evolving'
        );
        if (evolvingEnemy) {
          this.floatingTexts.push({
            id: `ft_resonating_${this.elapsedTimeMs}_${evolvingEnemy.id}`,
            text: 'Resonating!',
            position: { ...evolvingEnemy.position },
            color: 0xfacc15,
            scale: 0.9,
            durationMs: 900,
            elapsedMs: 0,
          });
        }
      }
    }
  }

  private loadNextSpawners() {
    const currentWave = this.waves[this.currentWaveIndex];
    if (
      !currentWave ||
      this.nextGroupIndexToStart >= currentWave.groups.length
    ) {
      this.advanceToNextWave();
      return;
    }

    // Always load at least one group
    const groupToLoad = currentWave.groups[this.nextGroupIndexToStart];
    this.activeSpawners.push({
      group: groupToLoad,
      spawnsRemaining: groupToLoad.count,
      lastSpawnTime: 0,
      delayTimer: groupToLoad.delayBeforeGroupMs || 0,
      isWaitingForDelay: (groupToLoad.delayBeforeGroupMs || 0) > 0,
    });
    this.nextGroupIndexToStart++;

    // Load any subsequent concurrent groups
    while (this.nextGroupIndexToStart < currentWave.groups.length) {
      const nextGroup = currentWave.groups[this.nextGroupIndexToStart];
      if (nextGroup.concurrentWithPrevious) {
        this.activeSpawners.push({
          group: nextGroup,
          spawnsRemaining: nextGroup.count,
          lastSpawnTime: 0,
          delayTimer: nextGroup.delayBeforeGroupMs || 0,
          isWaitingForDelay: (nextGroup.delayBeforeGroupMs || 0) > 0,
        });
        this.nextGroupIndexToStart++;
      } else {
        break; // Stop when we hit a non-concurrent group
      }
    }
  }

  private processWaveSpawns(
    time: number,
    deltaMs: number,
    newEnemies: Enemy[]
  ) {
    if (this.hasFinishedAllWaves) return;

    if (this.activeSpawners.length === 0) {
      this.loadNextSpawners();
      return;
    }

    // Process all active spawners backwards so we can safely remove from array
    for (let i = this.activeSpawners.length - 1; i >= 0; i--) {
      const spawner = this.activeSpawners[i];

      if (spawner.isWaitingForDelay) {
        spawner.delayTimer -= deltaMs;
        if (spawner.delayTimer <= 0) {
          spawner.isWaitingForDelay = false;
          spawner.lastSpawnTime = time - spawner.group.spawnIntervalMs; // Force immediate spawn
        } else {
          continue; // Still waiting on delay for this spawner
        }
      }

      // Checking if it's time to spawn
      const timeSinceLastSpawn = time - spawner.lastSpawnTime;
      if (timeSinceLastSpawn >= spawner.group.spawnIntervalMs) {
        this.spawnEnemyFromDef(
          spawner.group.enemyDefinitionId,
          time,
          newEnemies,
          spawner.group.pathIndex,
          spawner.group.turnAroundAtEnd,
          spawner.group.uncapturable,
          spawner.group.isCursed
        );
        spawner.spawnsRemaining--;
        spawner.lastSpawnTime = time;

        if (spawner.spawnsRemaining <= 0) {
          this.activeSpawners.splice(i, 1);
        }
      }
    }
  }

  private advanceToNextWave() {
    if (this.shouldWaitForCaptureUnitRelocation()) return;

    this.currentWaveIndex++;
    this.nextGroupIndexToStart = 0;
    this.activeSpawners = [];

    if (this.currentWaveIndex >= this.waves.length) {
      this.hasFinishedAllWaves = true;
    } else {
      const nextWave = this.waves[this.currentWaveIndex];
      // Skip empty waves
      if (nextWave.groups.length === 0) {
        this.advanceToNextWave();
        return;
      }
      this.loadNextSpawners();
    }
  }

  private spawnEnemyFromDef(
    waveEnemyDefinitionId: string,
    time: number,
    newEnemies: Enemy[],
    groupPathIndex: number,
    turnAroundAtEnd?: boolean,
    uncapturable?: boolean,
    isCursed?: boolean
  ) {
    const waveEnemyDefinition =
      this.waveEnemyDefinitions[waveEnemyDefinitionId];
    if (!waveEnemyDefinition) return;

    const structure = waveEnemyDefinition.structure;
    const creatureId = waveEnemyDefinition.creatureId;
    const meta = creatureId ? TD_CREATURE_DEFS[creatureId] : undefined;
    if (!structure && !meta) return;

    const definitionId = structure ? waveEnemyDefinition.id : creatureId!;

    const pathIndex = groupPathIndex;
    const startPath = this.paths[pathIndex] || [{ x: 0, y: 0 }];

    const enemyLevel = waveEnemyDefinition.level;
    const enemyHp = structure
      ? structure.maxHp * this.enemyHpMultiplier
      : calculateMaxHp(meta!.baseCreature.maxHp, enemyLevel) *
        this.enemyHpMultiplier *
        (waveEnemyDefinition.hpMultiplier ?? 1);
    const enemyAttack = structure
      ? 0
      : calculateStat(meta!.baseCreature.attack, enemyLevel);
    const enemySpecialAttack = structure
      ? 0
      : calculateStat(meta!.baseCreature.specialAttack, enemyLevel);
    const enemyDefense = structure
      ? structure.defense
      : calculateStat(meta!.baseCreature.defense, enemyLevel) *
        (waveEnemyDefinition.defenseMultiplier ?? 1);
    const enemySpecialDefense = structure
      ? structure.specialDefense
      : calculateStat(meta!.baseCreature.specialDefense, enemyLevel) *
        (waveEnemyDefinition.specialDefenseMultiplier ?? 1);

    const isShiny = false; //TowerDefenseEngine.forceShinySpawns || (Math.random() < 0.5);
    const abilityDefinitionId = structure
      ? undefined
      : waveEnemyDefinition.abilityId;
    const abilityDefinition = abilityDefinitionId
      ? ENEMY_ABILITY_DEFS[abilityDefinitionId]
      : undefined;
    const newEnemy: Enemy = {
      id: `enemy_${time}_${Math.random().toString(36).substring(7)}`,
      definitionId: definitionId,
      kind: structure ? 'structure' : 'creature',
      tdConfigId: structure?.tdConfigId,
      displayName: structure?.displayName,
      elementTypes: structure?.elementTypes,
      immuneToStatusEffects:
        structure?.immuneToStatusEffects ?? Boolean(structure),
      moneyReward: structure?.moneyReward,
      winsLevelOnDestroy: structure?.winsLevelOnDestroy,
      structureRole: structure?.role,
      structureVisualStyle: structure?.visualStyle,
      structureVisualLayout: structure?.visualLayout
        ? structuredClone(structure.visualLayout)
        : undefined,
      waveEnemyDefinitionId,
      level: enemyLevel,
      position: structure?.position
        ? { ...structure.position }
        : { x: startPath[0].x, y: startPath[0].y },
      hp: enemyHp,
      maxHp: enemyHp,
      speed: structure
        ? 0
        : (meta!.baseCreature.speed / 100) *
          (waveEnemyDefinition.speedMultiplier ?? 1),
      currentAttack: enemyAttack,
      currentSpecialAttack: enemySpecialAttack,
      currentDefense: enemyDefense,
      currentSpecialDefense: enemySpecialDefense,
      statusConditions: [],
      currentWaypointIndex: 1,
      pathIndex: pathIndex,
      facingDirection: 'down',
      turnAroundAtEnd,
      uncapturable: Boolean(structure) || uncapturable || isCursed,
      damagedByTowerIds: new Set<string>(),
      isShiny,
      isCursed,
      weakenedThreshold: waveEnemyDefinition.weakenedThreshold,
      abilityRuntime: abilityDefinition
        ? {
            definitionId: abilityDefinition.id,
            nextReadyTimeMs:
              this.elapsedTimeMs + abilityDefinition.initialCooldownMs,
          }
        : undefined,
    };
    newEnemies.push(newEnemy);

    if (isShiny && !newEnemy.uncapturable && !this.disableCapture) {
      this.events.emit({
        type: 'SHINY_ENEMY_SPAWNED',
        enemyId: newEnemy.id,
        enemyDefinitionId: newEnemy.definitionId,
        level: newEnemy.level,
      });
    }
  }

  private processEnemyAbilities(enemies: Enemy[]) {
    for (const enemy of enemies) {
      const runtime = enemy.abilityRuntime;
      if (
        !runtime ||
        runtime.manualOnly ||
        this.elapsedTimeMs < runtime.nextReadyTimeMs
      ) {
        continue;
      }

      this.activateEnemyAbility(enemy, enemies, false);
    }
  }

  private activateEnemyAbility(
    enemy: Enemy,
    enemies: Enemy[],
    isManual: boolean
  ): boolean {
    const runtime = enemy.abilityRuntime;
    if (!runtime) return false;

    const ability = ENEMY_ABILITY_DEFS[runtime.definitionId];
    if (!ability) return false;

    if (ability.type === 'PROXIMITY_HOWL_SPEED_STACK') {
      if ((runtime.activationCount ?? 0) === 0) {
        const triggerCaptureUnit = this.captureUnits.find(
          (captureUnit) =>
            captureUnit.tdConfigId === ability.triggerCaptureUnitTdConfigId &&
            this.getCaptureDistanceSq(enemy, captureUnit) <=
              ability.triggerRadius * ability.triggerRadius
        );
        if (!triggerCaptureUnit) return false;
      }

      const activationCount = (runtime.activationCount ?? 0) + 1;
      runtime.activationCount = activationCount;
      runtime.nextReadyTimeMs = this.elapsedTimeMs + ability.cooldownMs;

      if (activationCount === 1 && !enemy.isMovingBackward) {
        enemy.isMovingBackward = true;
        enemy.currentWaypointIndex = Math.max(
          0,
          enemy.currentWaypointIndex - 1
        );
      }

      const targets = enemies.filter(
        (target) =>
          target.hp > 0 && target.definitionId === ability.targetCreatureId
      );
      targets.forEach((target) => {
        applyStackingPersistentSpeedBoost(
          target,
          ability.speedIncreasePerActivation,
          ability.maxSpeedMultiplier
        );
      });

      this.visualEffects.push({
        id: `vfx_enemy_howl_${this.elapsedTimeMs}_${enemy.id}`,
        configId: ability.visualEffectConfigId,
        position: { ...enemy.position },
        durationMs: 700,
        elapsedMs: 0,
        targetId: enemy.id,
        facingDirection: enemy.facingDirection,
        rangeIndex: ability.triggerRadius,
      });

      if (activationCount >= ability.maxActivations) {
        runtime.despawnRequested = true;
      }
      return true;
    }

    if (ability.type === 'ALLY_SPEED_BOOST') {
      // Tailwind snapshots allies that exist when it is cast. The caster and
      // enemies that spawn later never inherit this activation's speed boost.
      const targets = enemies.filter(
        (target) => target.id !== enemy.id && target.hp > 0
      );
      if (targets.length === 0) return false;

      targets.forEach((target) => {
        applyTimedSpeedBoost(
          target,
          ability.speedMultiplier,
          ability.durationMs,
          this.elapsedTimeMs
        );
      });
      runtime.nextReadyTimeMs = this.elapsedTimeMs + ability.cooldownMs;

      this.visualEffects.push({
        id: `vfx_enemy_wind_${Date.now()}_${Math.random()}`,
        configId: ability.visualEffectConfigId,
        position: { ...enemy.position },
        durationMs: 750,
        elapsedMs: 0,
        targetId: enemy.id,
        facingDirection: enemy.facingDirection,
        rangeIndex: 100,
      });
      this.floatingTexts.push({
        id: `ft_tailwind_${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}`,
        text: 'Tailwind!',
        position: { ...enemy.position },
        color: 0xa7f3d0,
        scale: 0.9,
        durationMs: 1000,
        elapsedMs: 0,
      });
      return true;
    }

    if (runtime.hasActivated && !isManual) return false;

    if (!runtime.hasActivated) {
      enemy.currentDefense *= ability.defenseMultiplier;
      enemy.currentSpecialDefense *= ability.specialDefenseMultiplier;
      enemy.defenseBoostMultiplier =
        (enemy.defenseBoostMultiplier ?? 1) * ability.defenseMultiplier;
      enemy.specialDefenseBoostMultiplier =
        (enemy.specialDefenseBoostMultiplier ?? 1) *
        ability.specialDefenseMultiplier;
      runtime.hasActivated = true;
    }

    this.visualEffects.push({
      id: `vfx_enemy_harden_${Date.now()}_${Math.random()}`,
      configId: ability.visualEffectConfigId,
      position: { ...enemy.position },
      durationMs: 900,
      elapsedMs: 0,
      targetId: enemy.id,
      facingDirection: enemy.facingDirection,
    });
    this.floatingTexts.push({
      id: `ft_harden_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      text: 'Harden!',
      position: { ...enemy.position },
      color: 0xe2e8f0,
      scale: 0.9,
      durationMs: 1000,
      elapsedMs: 0,
    });
    return true;
  }

  /** Activates an enemy's configured ability immediately, ignoring cooldowns. */
  public triggerEnemyAbility(enemyId: string): boolean {
    const enemy = this.enemies.find((candidate) => candidate.id === enemyId);
    if (!enemy) return false;
    return this.activateEnemyAbility(enemy, this.enemies, true);
  }

  /** Adds a stationary, directly configured actor for the attack preview tool. */
  public spawnPreviewEnemy(config: PreviewEnemyConfig): Enemy | null {
    const template = COSMOID_TEMPLATES[config.creatureId];
    if (!template) return null;

    const ability = config.abilityId
      ? ENEMY_ABILITY_DEFS[config.abilityId]
      : undefined;
    const maxHp = calculateMaxHp(template.baseStats.hp, config.level);
    const enemy: Enemy = {
      id:
        config.id ??
        `preview_enemy_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      definitionId: config.creatureId,
      level: config.level,
      position: { ...config.position },
      hp: maxHp,
      maxHp,
      speed: 0,
      currentAttack: calculateStat(template.baseStats.attack, config.level),
      currentSpecialAttack: calculateStat(
        template.baseStats.specialAttack,
        config.level
      ),
      currentDefense: calculateStat(template.baseStats.defense, config.level),
      currentSpecialDefense: calculateStat(
        template.baseStats.specialDefense,
        config.level
      ),
      statusConditions: [],
      currentWaypointIndex: 1,
      pathIndex: 0,
      facingDirection: 'left',
      uncapturable: true,
      damagedByTowerIds: new Set<string>(),
      isInvulnerable: config.isInvulnerable,
      abilityRuntime: ability
        ? {
            definitionId: ability.id,
            nextReadyTimeMs: this.elapsedTimeMs + ability.initialCooldownMs,
            manualOnly: config.manualAbilityOnly ?? true,
          }
        : undefined,
    };

    this.enemies.push(enemy);
    return enemy;
  }

  public removePreviewEnemy(enemyId: string): boolean {
    const previousCount = this.enemies.length;
    this.enemies = this.enemies.filter((enemy) => enemy.id !== enemyId);
    return this.enemies.length !== previousCount;
  }

  public captureEnemy(enemyId: string): PlayerCreature | null {
    const enemyIndex = this.enemies.findIndex((e) => e.id === enemyId);
    if (enemyIndex === -1 || this.enemies[enemyIndex].uncapturable) return null;

    const enemy = this.enemies[enemyIndex];

    // Remove the enemy from the battlefield
    this.enemies.splice(enemyIndex, 1);

    // Drop any held capture unit
    this.dropCaptureUnit(enemy);

    const capturedLevel = enemy.level;

    const captured: PlayerCreature = {
      id: crypto.randomUUID(),
      speciesId: enemy.definitionId,
      level: capturedLevel,
      xp: 0,
      equippedAttacks: TowerDefenseEngine.getDefaultAttacks(enemy.definitionId),
      isShiny: enemy.isShiny ?? false,
    };

    if (this.roster.length < 6) {
      this.roster.push(captured);
    }

    // Distribute EXP to participants as if the enemy was defeated
    if (enemy.damagedByTowerIds.size > 0) {
      this.events.emit({
        type: 'ENEMY_CAPTURED',
        enemyId: enemy.id,
        enemyDefinitionId: enemy.definitionId,
        enemyLevel: capturedLevel,
        participantTowerIds: Array.from(enemy.damagedByTowerIds),
      });
    }

    return captured;
  }

  public dropCaptureUnit(enemy: Enemy): CaptureUnit | undefined {
    if (!enemy.heldCaptureUnitId) return undefined;

    const droppedUnit = this.captureUnits.find(
      (cu) => cu.id === enemy.heldCaptureUnitId
    );
    if (!droppedUnit || droppedUnit.heldByEnemyId !== enemy.id) {
      return undefined;
    }

    droppedUnit.heldByEnemyId = undefined;
    if (droppedUnit.returnHome) {
      droppedUnit.returnHome.pathIndex = enemy.pathIndex;
    }
    droppedUnit.returnHomeAvailableAtMs =
      this.elapsedTimeMs + (droppedUnit.returnHome?.delayMs ?? 0);
    enemy.heldCaptureUnitId = undefined;
    return droppedUnit;
  }

  private shouldWaitForCaptureUnitRelocation(): boolean {
    const waveIndex = this.currentWaveIndex;
    const relocations = this.captureUnits.flatMap((captureUnit) =>
      (captureUnit.waveRelocations ?? [])
        .filter((relocation) => relocation.afterWaveIndex === waveIndex)
        .map((relocation) => ({ captureUnit, relocation }))
    );

    if (relocations.length === 0) return false;
    if (this.completedRelocationWaveIndexes.has(waveIndex)) return false;

    // A staged objective only moves after the current attackers are gone.
    if (this.enemies.length > 0) return true;

    if (!this.startedRelocationWaveIndexes.has(waveIndex)) {
      for (const { captureUnit, relocation } of relocations) {
        const path = relocation.path.map((point) => ({ ...point }));
        const firstWaypoint = path[0];
        const isAtFirstWaypoint =
          firstWaypoint !== undefined &&
          Math.abs(captureUnit.position.x - firstWaypoint.x) < 0.0001 &&
          Math.abs(captureUnit.position.y - firstWaypoint.y) < 0.0001;
        captureUnit.activeRelocation = {
          ...relocation,
          path,
          currentWaypointIndex: isAtFirstWaypoint ? 1 : 0,
        };
        captureUnit.returnHomeAvailableAtMs = undefined;
      }
      this.startedRelocationWaveIndexes.add(waveIndex);
      return true;
    }

    if (relocations.some(({ captureUnit }) => captureUnit.activeRelocation)) {
      return true;
    }

    this.completedRelocationWaveIndexes.add(waveIndex);
    return false;
  }

  private updateCaptureUnitRelocation(
    captureUnit: CaptureUnit,
    deltaMs: number
  ): void {
    const relocation = captureUnit.activeRelocation;
    if (!relocation) return;

    const targetPoint = relocation.path[relocation.currentWaypointIndex];
    if (!targetPoint) {
      const destination = relocation.path[relocation.path.length - 1];
      captureUnit.position = { ...destination };
      captureUnit.homePosition = { ...destination };
      captureUnit.activeRelocation = undefined;
      captureUnit.returnHomeAvailableAtMs = undefined;
      return;
    }

    const dx = targetPoint.x - captureUnit.position.x;
    const dy = targetPoint.y - captureUnit.position.y;
    const frameDistance = relocation.speed * (deltaMs / 1000);
    const isHorizontal = Math.abs(dx) > Math.abs(dy);

    if (isHorizontal) {
      if (Math.abs(dx) <= frameDistance) {
        captureUnit.position = { ...targetPoint };
        relocation.currentWaypointIndex++;
      } else {
        captureUnit.position.x += Math.sign(dx) * frameDistance;
        captureUnit.facingDirection = dx > 0 ? 'right' : 'left';
      }
    } else {
      const moveDistance = frameDistance * this.aspectRatio;
      if (Math.abs(dy) <= moveDistance) {
        captureUnit.position = { ...targetPoint };
        relocation.currentWaypointIndex++;
      } else {
        captureUnit.position.y += Math.sign(dy) * moveDistance;
        captureUnit.facingDirection = dy > 0 ? 'down' : 'up';
      }
    }

    if (relocation.currentWaypointIndex >= relocation.path.length) {
      const destination = relocation.path[relocation.path.length - 1];
      captureUnit.position = { ...destination };
      captureUnit.homePosition = { ...destination };
      captureUnit.activeRelocation = undefined;
      captureUnit.returnHomeAvailableAtMs = undefined;
    }
  }

  private updateCaptureUnitReturnHome(
    captureUnit: CaptureUnit,
    deltaMs: number
  ): void {
    const returnHome = captureUnit.returnHome;
    if (!returnHome) return;

    const homeDx = captureUnit.homePosition.x - captureUnit.position.x;
    const homeDy = captureUnit.homePosition.y - captureUnit.position.y;
    if (Math.abs(homeDx) < 0.0001 && Math.abs(homeDy) < 0.0001) {
      captureUnit.position = { ...captureUnit.homePosition };
      captureUnit.returnHomeAvailableAtMs = undefined;
      return;
    }

    if (captureUnit.returnHomeAvailableAtMs === undefined) {
      captureUnit.returnHomeAvailableAtMs =
        this.elapsedTimeMs + (returnHome.delayMs ?? 0);
    }
    if (this.elapsedTimeMs < captureUnit.returnHomeAvailableAtMs) return;

    const path = this.paths[returnHome.pathIndex];
    if (!path || path.length < 2) return;

    const currentProjection = projectPointOntoPath(
      captureUnit.position,
      path,
      this.aspectRatio
    );
    const homeProjection = projectPointOntoPath(
      captureUnit.homePosition,
      path,
      this.aspectRatio
    );
    if (!currentProjection || !homeProjection) return;

    const remainingProgress =
      homeProjection.progress - currentProjection.progress;
    const frameDistance = returnHome.speed * (deltaMs / 1000);
    const movementDirection = Math.sign(remainingProgress);
    let targetProgress: number;

    if (Math.abs(remainingProgress) <= frameDistance) {
      targetProgress = homeProjection.progress;
      captureUnit.position = { ...captureUnit.homePosition };
      captureUnit.returnHomeAvailableAtMs = undefined;
    } else {
      targetProgress =
        currentProjection.progress + movementDirection * frameDistance;
      captureUnit.position = getPointAtPathProgress(
        path,
        targetProgress,
        this.aspectRatio
      );
    }

    const facingSample = getPointAtPathProgress(
      path,
      targetProgress - movementDirection * Math.min(frameDistance, 0.001),
      this.aspectRatio
    );
    const dx = captureUnit.position.x - facingSample.x;
    const dy = captureUnit.position.y - facingSample.y;
    const visualDx = dx * this.aspectRatio;
    const visualDy = dy;
    if (Math.abs(visualDx) >= Math.abs(visualDy)) {
      if (Math.abs(dx) > 0.0001) {
        captureUnit.facingDirection = dx > 0 ? 'right' : 'left';
      }
    } else if (Math.abs(dy) > 0.0001) {
      captureUnit.facingDirection = dy > 0 ? 'down' : 'up';
    }
  }

  public removeTower(creatureId: string) {
    const tower = this.towers.find((t) => t.creature.id === creatureId);
    if (tower?.isFixed) return false;
    if (tower) releaseDeepwaterGrip(this, tower);
    this.towers = this.towers.filter((t) => t.creature.id !== creatureId);
    return true;
  }

  public placeTower(creatureId: string, x: number, y: number) {
    const creature = this.roster.find((c) => c.id === creatureId);
    if (!creature) return false;

    const existingTower = this.towers.find(
      (t) => t.creature.id === creature.id
    );
    const targetTower = this.towers.find(
      (t) => t.position.x === x && t.position.y === y
    );

    if (existingTower) {
      if (existingTower.isFixed) return false;

      if (existingTower.position.x === x && existingTower.position.y === y) {
        return true; // Dropped on itself
      }

      if (targetTower) {
        if (targetTower.isFixed) return false;
        releaseDeepwaterGrip(this, targetTower);
        // Swap positions
        targetTower.position = {
          x: existingTower.position.x,
          y: existingTower.position.y,
        };
        targetTower.facingDirection = 'down';
        existingTower.position = { x, y };
        existingTower.facingDirection = 'down';
      } else {
        // Move
        existingTower.position = { x, y };
        existingTower.facingDirection = 'down';
      }
      releaseDeepwaterGrip(this, existingTower);
      return true;
    }

    // New tower from the deck
    if (targetTower) {
      if (targetTower.isFixed) return false;
      // Remove whatever tower was there previously, taking its spot
      releaseDeepwaterGrip(this, targetTower);
      this.towers = this.towers.filter((t) => t.id !== targetTower.id);
    }

    const tower = this.createTower(creature, x, y);
    if (!tower) return false;
    this.towers.push(tower);
    return true;
  }

  private createTower(
    creature: PlayerCreature,
    x: number,
    y: number,
    facingDirection: Tower['facingDirection'] = 'down',
    isFixed: boolean = false,
    receivesExperience: boolean = true
  ): Tower | null {
    const template = COSMOID_TEMPLATES[creature.speciesId];
    if (!template) return null;

    // Derive stats
    const derivedAttack = calculateStat(
      template.baseStats.attack,
      creature.level
    );
    const derivedSpecialAttack = calculateStat(
      template.baseStats.specialAttack,
      creature.level
    );
    const derivedDefense = calculateStat(
      template.baseStats.defense,
      creature.level
    );
    const derivedSpecialDefense = calculateStat(
      template.baseStats.specialDefense,
      creature.level
    );
    const derivedMaxHp = calculateMaxHp(template.baseStats.hp, creature.level);

    const attacks = TowerDefenseEngine.getEquippedAttacks(creature);

    return {
      id: `tower_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      creature: creature,
      position: { x, y },
      lastAttackTime: 0,
      currentAttack: derivedAttack,
      currentSpecialAttack: derivedSpecialAttack,
      currentDefense: derivedDefense,
      currentSpecialDefense: derivedSpecialDefense,
      hp: derivedMaxHp,
      maxHp: derivedMaxHp,
      equippedAttacksRuntime: attacks.map((atkId) => ({
        definitionId: atkId,
        lastFiredTime: 0,
      })),
      selectedAttackIndex:
        this.playerSelectedAttacks[creature.id] ??
        creature.activeAttackIndex ??
        0,
      targetingMode:
        this.playerSelectedTargetingModes[creature.id] ??
        (creature.targetingMode as TowerTargetingMode | undefined) ??
        'first',
      facingDirection,
      isShiny: creature.isShiny,
      isFixed,
      receivesExperience,
    };
  }

  public setTowerAttack(creatureId: string, attackIndex: number) {
    this.playerSelectedAttacks[creatureId] = attackIndex;
    const rosterCreature = this.roster.find((c) => c.id === creatureId);
    if (rosterCreature) {
      rosterCreature.activeAttackIndex = attackIndex;
    }
    const tower = this.towers.find((t) => t.creature.id === creatureId);
    if (
      tower &&
      attackIndex >= 0 &&
      attackIndex < tower.creature.equippedAttacks.length
    ) {
      tower.selectedAttackIndex = attackIndex;
    }
  }

  public getEnemyProgress(enemy: Enemy): number {
    const path = this.paths[enemy.pathIndex];
    if (!path || path.length === 0) return 0;

    const nextIndex = enemy.currentWaypointIndex;
    const prevIndex = enemy.isMovingBackward ? nextIndex + 1 : nextIndex - 1;

    const clampedPrev = Math.max(0, Math.min(path.length - 1, prevIndex));

    let progress = 0;
    for (let i = 0; i < clampedPrev; i++) {
      const p1 = path[i];
      const p2 = path[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      progress += Math.sqrt(dx * dx + dy * dy);
    }

    const prevWaypoint = path[clampedPrev];
    if (prevWaypoint) {
      const dx = enemy.position.x - prevWaypoint.x;
      const dy = enemy.position.y - prevWaypoint.y;
      progress += Math.sqrt(dx * dx + dy * dy);
    }

    return progress;
  }

  public getTargetForTower(
    tower: Tower,
    range: number,
    mode: TowerTargetingMode = 'first',
    enemyFilter?: (enemy: Enemy) => boolean
  ): Enemy | null {
    const enemiesInRange: { enemy: Enemy; dist: number }[] = [];
    for (const enemy of this.enemies) {
      if (enemy.hp <= 0 || (enemyFilter && !enemyFilter(enemy))) continue;
      const dist = this.getAttackDistance(tower.position, enemy.position);
      if (dist <= range) {
        enemiesInRange.push({ enemy, dist });
      }
    }

    if (enemiesInRange.length === 0) return null;

    const focusedStructure = this.focusedStructureId
      ? enemiesInRange.find(
          ({ enemy }) =>
            enemy.id === this.focusedStructureId && enemy.kind === 'structure'
        )?.enemy
      : undefined;
    if (focusedStructure) return focusedStructure;

    // Active creature threats take precedence. The stationary objective is a
    // fallback target whenever no moving enemy is in this tower's range.
    const creatureTargets = enemiesInRange.filter(
      ({ enemy }) => enemy.kind !== 'structure'
    );
    const eligibleTargets =
      creatureTargets.length > 0 ? creatureTargets : enemiesInRange;

    if (mode === 'closest') {
      let minDist = Infinity;
      let target: Enemy | null = null;
      for (const item of eligibleTargets) {
        if (item.dist < minDist) {
          minDist = item.dist;
          target = item.enemy;
        }
      }
      return target;
    }

    if (mode === 'lowest-hp-percent') {
      let minHpPercent = Infinity;
      let target: Enemy | null = null;
      for (const item of eligibleTargets) {
        const hpPercent = item.enemy.hp / item.enemy.maxHp;
        if (hpPercent < minHpPercent) {
          minHpPercent = hpPercent;
          target = item.enemy;
        }
      }
      return target;
    }

    if (mode === 'highest-hp-percent') {
      let maxHpPercent = -Infinity;
      let target: Enemy | null = null;
      for (const item of eligibleTargets) {
        const hpPercent = item.enemy.hp / item.enemy.maxHp;
        if (hpPercent > maxHpPercent) {
          maxHpPercent = hpPercent;
          target = item.enemy;
        }
      }
      return target;
    }

    if (mode === 'strongest') {
      let maxHp = -Infinity;
      let target: Enemy | null = null;
      for (const item of eligibleTargets) {
        if (item.enemy.hp > maxHp) {
          maxHp = item.enemy.hp;
          target = item.enemy;
        }
      }
      return target;
    }

    if (mode === 'weakest') {
      let minHp = Infinity;
      let target: Enemy | null = null;
      for (const item of eligibleTargets) {
        if (item.enemy.hp < minHp) {
          minHp = item.enemy.hp;
          target = item.enemy;
        }
      }
      return target;
    }

    if (mode === 'last') {
      let minProgress = Infinity;
      let target: Enemy | null = null;
      for (const item of eligibleTargets) {
        const progress = this.getEnemyProgress(item.enemy);
        if (progress < minProgress) {
          minProgress = progress;
          target = item.enemy;
        }
      }
      return target;
    }

    // Default 'first'
    let maxProgress = -Infinity;
    let target: Enemy | null = null;
    for (const item of eligibleTargets) {
      const progress = this.getEnemyProgress(item.enemy);
      if (progress > maxProgress) {
        maxProgress = progress;
        target = item.enemy;
      }
    }
    return target;
  }

  public emitEnemyDefeated(target: Enemy, sourceTower: Tower): void {
    if (target.defeatEventEmitted) return;

    target.defeatEventEmitted = true;
    target.damagedByTowerIds.add(sourceTower.id);
    const participantTowerIds = Array.from(target.damagedByTowerIds);

    if (target.kind === 'structure') {
      this.handleStructureDestroyed(target, participantTowerIds);
      return;
    }

    this.events.emit({
      type: 'ENEMY_DIED',
      enemyId: target.id,
      enemyDefinitionId: target.definitionId,
      enemyLevel: target.level,
      participantTowerIds,
    });
  }

  public toggleFocusedStructure(structureId: string): void {
    const target = this.enemies.find(
      (enemy) =>
        enemy.id === structureId && enemy.kind === 'structure' && enemy.hp > 0
    );
    if (!target) return;
    this.focusedStructureId =
      this.focusedStructureId === structureId ? null : structureId;
  }

  private handleStructureDestroyed(
    target: Enemy,
    participantTowerIds: string[]
  ): void {
    const winsLevel = target.winsLevelOnDestroy === true;
    if (winsLevel) this.hasDestroyedVictoryStructure = true;
    if (this.focusedStructureId === target.id) this.focusedStructureId = null;

    this.destroyedStructureVisuals.push({
      id: `destroyed_${target.id}`,
      tdConfigId: target.tdConfigId,
      position: { ...target.position },
      visualStyle: target.structureVisualStyle,
      visualLayout: target.structureVisualLayout
        ? structuredClone(target.structureVisualLayout)
        : undefined,
      destroyedAtMs: this.elapsedTimeMs,
    });

    const releasedAlly = this.objectiveAllies.find(
      (ally) =>
        ally.gateDefinitionId === target.definitionId && ally.phase === 'locked'
    );
    if (releasedAlly) {
      releasedAlly.phase = 'traveling';
      releasedAlly.phaseStartedAtMs = this.elapsedTimeMs;
      releasedAlly.currentWaypointIndex = 0;
      this.floatingTexts.push({
        id: `ft_freed_${releasedAlly.id}`,
        text: `${releasedAlly.displayName.toUpperCase()} FREED!`,
        position: { ...releasedAlly.position },
        color: 0x5eead4,
        scale: 1.25,
        durationMs: 1800,
        elapsedMs: 0,
      });
    }

    this.events.emit({
      type: 'STRUCTURE_DESTROYED',
      structureId: target.definitionId,
      participantTowerIds,
      winsLevel,
    });
  }

  private moveObjectiveAllyTowards(
    ally: ObjectiveAlly,
    target: Point,
    speed: number,
    deltaMs: number,
    previousPoint?: Point
  ): boolean {
    const frameDistance = speed * (deltaMs / 1000);
    const { reachedWaypoint, facingDirection } = stepUnitTowardsWaypoint(
      ally.position,
      target,
      frameDistance,
      this.aspectRatio,
      previousPoint,
      ally.facingDirection
    );
    ally.facingDirection = facingDirection;
    return reachedWaypoint;
  }

  private processObjectiveAllies(enemies: Enemy[], deltaMs: number): void {
    for (const ally of this.objectiveAllies) {
      if (ally.phase === 'locked' || ally.phase === 'exhausted') continue;

      if (ally.phase === 'traveling') {
        const waypoint = ally.path[ally.currentWaypointIndex];
        if (!waypoint) {
          if (ally.behavior.type === 'SEPIPPET_SHADOW_ASSAULT') {
            this.startSepippetShadowAssault(ally);
          } else if (ally.behavior.type === 'PARLET_MOSAIC_CURRENTS') {
            this.startParletMosaicCurrents(ally);
          } else if (ally.behavior.type === 'CORROGOON_SCOURING_VOLLEY') {
            this.startCorrogoonScouringVolley(ally);
          } else {
            ally.phase = 'bowing';
            ally.phaseStartedAtMs = this.elapsedTimeMs;
          }
          continue;
        }
        const previousWaypoint =
          ally.currentWaypointIndex > 0
            ? ally.path[ally.currentWaypointIndex - 1]
            : undefined;
        if (
          this.moveObjectiveAllyTowards(
            ally,
            waypoint,
            ally.moveSpeed,
            deltaMs,
            previousWaypoint
          )
        ) {
          ally.currentWaypointIndex++;
        }
        continue;
      }

      const targetStructure = enemies.find(
        (enemy) =>
          enemy.definitionId === ally.targetStructureDefinitionId &&
          enemy.kind === 'structure' &&
          enemy.hp > 0
      );
      if (!targetStructure) continue;

      const elapsedInPhase = this.elapsedTimeMs - ally.phaseStartedAtMs;
      if (ally.behavior.type === 'SEPIPPET_SHADOW_ASSAULT') {
        if (
          ally.phase === 'assaulting' &&
          this.elapsedTimeMs >= (ally.assaultEndsAtMs ?? 0)
        ) {
          ally.phase = 'exhausted';
          ally.phaseStartedAtMs = this.elapsedTimeMs;
          this.objectiveAllyShadows = this.objectiveAllyShadows.filter(
            (shadow) => shadow.ownerAllyId !== ally.id
          );
          continue;
        }

        if (
          ally.phase === 'assaulting' &&
          this.elapsedTimeMs >= (ally.nextActionAtMs ?? 0)
        ) {
          const damage = Math.min(ally.behavior.gateDamage, targetStructure.hp);
          targetStructure.hp -= damage;
          startDamageFlash(targetStructure, ElementType.DARK);
          ally.impactCount++;
          ally.nextActionAtMs =
            this.elapsedTimeMs + ally.behavior.gateAttackIntervalMs;
          this.floatingTexts.push({
            id: `ft_sepippet_gate_${this.elapsedTimeMs}_${ally.impactCount}`,
            text: Math.ceil(damage).toString(),
            position: { ...targetStructure.position },
            color: 0xa78bfa,
            scale: 1.2,
            durationMs: 900,
            elapsedMs: 0,
          });
          if (targetStructure.hp <= 0 && !targetStructure.defeatEventEmitted) {
            targetStructure.defeatEventEmitted = true;
            this.handleStructureDestroyed(
              targetStructure,
              Array.from(targetStructure.damagedByTowerIds)
            );
          }
        }
        continue;
      }

      if (ally.behavior.type === 'PARLET_MOSAIC_CURRENTS') continue;

      if (ally.behavior.type === 'CORROGOON_SCOURING_VOLLEY') {
        if (
          ally.phase === 'volleying' &&
          this.elapsedTimeMs >= (ally.nextActionAtMs ?? 0)
        ) {
          this.launchCorrogoonScouringVolley(ally, enemies);
        }
        continue;
      }

      if (ally.phase === 'bowing') {
        ally.facingDirection = 'right';
        if (elapsedInPhase >= ally.behavior.bowDurationMs) {
          ally.phase = 'retreating';
          ally.phaseStartedAtMs = this.elapsedTimeMs;
        }
      } else if (ally.phase === 'retreating') {
        if (
          this.moveObjectiveAllyTowards(
            ally,
            ally.behavior.chargeStart,
            ally.moveSpeed,
            deltaMs
          )
        ) {
          ally.phase = 'windup';
          ally.phaseStartedAtMs = this.elapsedTimeMs;
          ally.facingDirection = 'right';
        }
      } else if (ally.phase === 'windup') {
        ally.facingDirection = 'right';
        if (elapsedInPhase >= ally.behavior.windupDurationMs) {
          ally.phase = 'charging';
          ally.phaseStartedAtMs = this.elapsedTimeMs;
        }
      } else if (ally.phase === 'charging') {
        if (
          this.moveObjectiveAllyTowards(
            ally,
            ally.behavior.strikePosition,
            ally.behavior.chargeSpeed,
            deltaMs
          )
        ) {
          const damage = Math.min(ally.behavior.damage, targetStructure.hp);
          targetStructure.hp -= damage;
          startDamageFlash(targetStructure, ElementType.FIRE);
          ally.impactCount++;
          this.floatingTexts.push({
            id: `ft_bramfrit_${this.elapsedTimeMs}_${ally.impactCount}`,
            text: Math.ceil(damage).toString(),
            position: { ...targetStructure.position },
            color: 0xfb923c,
            scale: 1.35,
            durationMs: 1000,
            elapsedMs: 0,
          });
          if (targetStructure.hp <= 0 && !targetStructure.defeatEventEmitted) {
            targetStructure.defeatEventEmitted = true;
            this.handleStructureDestroyed(
              targetStructure,
              Array.from(targetStructure.damagedByTowerIds)
            );
          }
          ally.phase = 'recovering';
          ally.phaseStartedAtMs = this.elapsedTimeMs;
        }
      } else if (
        ally.phase === 'recovering' &&
        elapsedInPhase >= ally.behavior.recoveryDurationMs
      ) {
        ally.phase = 'bowing';
        ally.phaseStartedAtMs = this.elapsedTimeMs;
      }
    }
  }

  private startSepippetShadowAssault(ally: ObjectiveAlly): void {
    if (ally.behavior.type !== 'SEPIPPET_SHADOW_ASSAULT') return;
    const behavior = ally.behavior;

    ally.phase = 'assaulting';
    ally.phaseStartedAtMs = this.elapsedTimeMs;
    ally.assaultEndsAtMs = this.elapsedTimeMs + behavior.durationMs;
    ally.nextActionAtMs = this.elapsedTimeMs;
    ally.facingDirection = 'up';

    this.objectiveAllyShadows = this.objectiveAllyShadows.filter(
      (shadow) => shadow.ownerAllyId !== ally.id
    );
    this.objectiveAllyShadows.push(
      ...behavior.shadowPositions.map((position, index) => ({
        id: `${ally.id}_shadow_${index}`,
        ownerAllyId: ally.id,
        tdConfigId: ally.tdConfigId,
        position: { ...position },
        facingDirection: 'up' as const,
        hp: 1,
        maxHp: 1,
        expiresAtMs: ally.assaultEndsAtMs!,
        damage: behavior.shadowDamage,
        attackIntervalMs: behavior.shadowAttackIntervalMs,
        attackRange: behavior.shadowAttackRange,
        nextAttackAtMs: this.elapsedTimeMs,
      }))
    );
  }

  private processObjectiveAllyShadows(enemies: Enemy[]): void {
    this.objectiveAllyShadows = this.objectiveAllyShadows.filter(
      (shadow) => shadow.expiresAtMs > this.elapsedTimeMs
    );

    for (const shadow of this.objectiveAllyShadows) {
      if (this.elapsedTimeMs < shadow.nextAttackAtMs) continue;

      const target = enemies
        .filter(
          (enemy) =>
            enemy.kind === 'creature' &&
            enemy.hp > 0 &&
            this.getAttackDistance(shadow.position, enemy.position) <=
              shadow.attackRange
        )
        .sort((a, b) => {
          const carrierPriority =
            Number(Boolean(b.heldCaptureUnitId)) -
            Number(Boolean(a.heldCaptureUnitId));
          if (carrierPriority !== 0) return carrierPriority;
          return (
            this.getAttackDistance(shadow.position, a.position) -
            this.getAttackDistance(shadow.position, b.position)
          );
        })[0];

      shadow.nextAttackAtMs = this.elapsedTimeMs + shadow.attackIntervalMs;
      if (!target) continue;

      const dx = target.position.x - shadow.position.x;
      const dy = target.position.y - shadow.position.y;
      shadow.facingDirection =
        Math.abs(dx) > Math.abs(dy)
          ? dx > 0
            ? 'right'
            : 'left'
          : dy > 0
            ? 'down'
            : 'up';
      shadow.attackTargetPosition = { ...target.position };
      shadow.attackVisualUntilMs = this.elapsedTimeMs + 260;

      const damage = Math.min(shadow.damage, target.hp);
      target.hp -= damage;
      startDamageFlash(target, ElementType.DARK);
      this.floatingTexts.push({
        id: `ft_sepippet_shadow_${shadow.id}_${this.elapsedTimeMs}`,
        text: Math.ceil(damage).toString(),
        position: { ...target.position },
        color: 0xc4b5fd,
        durationMs: 750,
        elapsedMs: 0,
      });
      if (target.hp <= 0 && !target.defeatEventEmitted) {
        target.defeatEventEmitted = true;
        this.events.emit({
          type: 'ENEMY_DIED',
          enemyId: target.id,
          enemyDefinitionId: target.definitionId,
          enemyLevel: target.level,
          participantTowerIds: [],
        });
      }
    }
  }

  private startParletMosaicCurrents(ally: ObjectiveAlly): void {
    if (ally.behavior.type !== 'PARLET_MOSAIC_CURRENTS') return;
    const behavior = ally.behavior;

    ally.phase = 'channeling';
    ally.phaseStartedAtMs = this.elapsedTimeMs;
    ally.facingDirection = 'up';

    this.objectiveAllyCurrents = this.objectiveAllyCurrents.filter(
      (current) => current.ownerAllyId !== ally.id
    );
    this.objectiveAllyCurrents.push(
      ...behavior.currentPathIndices.flatMap((pathIndex, index) => {
        const path = this.paths[pathIndex];
        if (!path || path.length < 2) return [];
        return [
          {
            id: `${ally.id}_current_${index}`,
            ownerAllyId: ally.id,
            pathIndex,
            path: path.map((point) => ({ ...point })),
            visualPath: (this.authoredPaths[pathIndex] ?? path).map(
              (point) => ({
                ...point,
              })
            ),
            width: behavior.currentWidth,
            slowMultiplier: behavior.slowMultiplier,
            surgeIntervalMs: behavior.surgeIntervalMs,
            surgeVisualDurationMs: behavior.surgeVisualDurationMs,
            pushDistance: behavior.pushDistance,
            gateDamage: behavior.gateDamagePerCurrent,
            nextSurgeAtMs: this.elapsedTimeMs + behavior.surgeIntervalMs,
          },
        ];
      })
    );
  }

  private isEnemyInsideObjectiveCurrent(
    enemy: Enemy,
    current: ObjectiveAllyCurrent
  ): boolean {
    if (enemy.kind === 'structure' || enemy.pathIndex !== current.pathIndex) {
      return false;
    }
    const projection = projectPointOntoPath(
      enemy.position,
      current.path,
      this.aspectRatio
    );
    if (!projection) return false;
    const distance =
      Math.sqrt(projection.distanceSq) *
      this.aspectRatio *
      this.backgroundScale;
    return distance <= current.width;
  }

  private getObjectiveCurrentSpeedMultiplier(enemy: Enemy): number {
    let multiplier = 1;
    for (const current of this.objectiveAllyCurrents) {
      if (this.isEnemyInsideObjectiveCurrent(enemy, current)) {
        multiplier = Math.min(multiplier, current.slowMultiplier);
      }
    }
    return multiplier;
  }

  private pushEnemyAgainstMovement(
    enemy: Enemy,
    current: ObjectiveAllyCurrent
  ): void {
    const projection = projectPointOntoPath(
      enemy.position,
      current.path,
      this.aspectRatio
    );
    if (!projection) return;

    const totalProgress = current.path
      .slice(1)
      .reduce(
        (total, point, index) =>
          total +
          getPathSegmentLength(current.path[index], point, this.aspectRatio),
        0
      );
    const normalizedPush =
      current.pushDistance /
      (Math.max(this.aspectRatio, Number.EPSILON) * this.backgroundScale);
    const pushedProgress = Math.max(
      0,
      Math.min(
        totalProgress,
        projection.progress + (enemy.isMovingBackward ? 1 : -1) * normalizedPush
      )
    );
    enemy.position = getPointAtPathProgress(
      current.path,
      pushedProgress,
      this.aspectRatio
    );

    let cumulativeProgress = 0;
    let segmentEndIndex = current.path.length - 1;
    for (let index = 1; index < current.path.length; index++) {
      cumulativeProgress += getPathSegmentLength(
        current.path[index - 1],
        current.path[index],
        this.aspectRatio
      );
      if (pushedProgress <= cumulativeProgress) {
        segmentEndIndex = index;
        break;
      }
    }
    enemy.currentWaypointIndex = enemy.isMovingBackward
      ? Math.max(0, segmentEndIndex - 1)
      : segmentEndIndex;
  }

  private processObjectiveAllyCurrents(enemies: Enemy[]): void {
    const surgingCurrents = this.objectiveAllyCurrents.filter(
      (current) => this.elapsedTimeMs >= current.nextSurgeAtMs
    );
    if (surgingCurrents.length === 0) return;

    const pushedEnemyIds = new Set<string>();
    for (const current of surgingCurrents) {
      current.lastSurgeAtMs = this.elapsedTimeMs;
      current.nextSurgeAtMs = this.elapsedTimeMs + current.surgeIntervalMs;
      for (const enemy of enemies) {
        if (
          enemy.hp > 0 &&
          !pushedEnemyIds.has(enemy.id) &&
          this.isEnemyInsideObjectiveCurrent(enemy, current)
        ) {
          this.pushEnemyAgainstMovement(enemy, current);
          pushedEnemyIds.add(enemy.id);
        }
      }
    }

    const owner = this.objectiveAllies.find(
      (ally) => ally.id === surgingCurrents[0].ownerAllyId
    );
    if (!owner) return;
    const targetStructure = enemies.find(
      (enemy) =>
        enemy.definitionId === owner.targetStructureDefinitionId &&
        enemy.kind === 'structure' &&
        enemy.hp > 0
    );
    if (!targetStructure) return;

    const requestedDamage = surgingCurrents.reduce(
      (total, current) => total + current.gateDamage,
      0
    );
    const damage = Math.min(requestedDamage, targetStructure.hp);
    targetStructure.hp -= damage;
    startDamageFlash(targetStructure, ElementType.WATER);
    owner.impactCount++;
    this.floatingTexts.push({
      id: `ft_parlet_gate_${this.elapsedTimeMs}_${owner.impactCount}`,
      text: Math.ceil(damage).toString(),
      position: { ...targetStructure.position },
      color: 0x22d3ee,
      scale: 1.3,
      durationMs: 950,
      elapsedMs: 0,
    });
    if (targetStructure.hp <= 0 && !targetStructure.defeatEventEmitted) {
      targetStructure.defeatEventEmitted = true;
      this.handleStructureDestroyed(
        targetStructure,
        Array.from(targetStructure.damagedByTowerIds)
      );
    }
  }

  private startCorrogoonScouringVolley(ally: ObjectiveAlly): void {
    if (ally.behavior.type !== 'CORROGOON_SCOURING_VOLLEY') return;
    ally.phase = 'volleying';
    ally.phaseStartedAtMs = this.elapsedTimeMs;
    ally.nextActionAtMs = this.elapsedTimeMs;
    ally.facingDirection = 'up';
  }

  private launchCorrogoonScouringVolley(
    ally: ObjectiveAlly,
    enemies: Enemy[]
  ): void {
    if (ally.behavior.type !== 'CORROGOON_SCOURING_VOLLEY') return;
    const behavior = ally.behavior;
    const targets = enemies.filter((enemy) => enemy.hp > 0);

    ally.impactCount++;
    ally.phaseStartedAtMs = this.elapsedTimeMs;
    ally.nextActionAtMs = this.elapsedTimeMs + behavior.volleyIntervalMs;
    this.objectiveAllyAcidShots.push(
      ...targets.map((target, index) => {
        const launchedAtMs =
          this.elapsedTimeMs + index * behavior.projectileStaggerMs;
        const impactAtMs = launchedAtMs + behavior.projectileTravelMs;
        return {
          id: `${ally.id}_acid_${ally.impactCount}_${target.id}`,
          ownerAllyId: ally.id,
          targetId: target.id,
          sourcePosition: { ...ally.position },
          targetPosition: { ...target.position },
          launchedAtMs,
          impactAtMs,
          expiresAtMs: impactAtMs + 360,
        };
      })
    );
  }

  private processObjectiveAllyAcidShots(enemies: Enemy[]): void {
    for (const shot of this.objectiveAllyAcidShots) {
      const target = enemies.find((enemy) => enemy.id === shot.targetId);
      if (target?.hp && shot.impactedAtMs === undefined) {
        shot.targetPosition = { ...target.position };
      }
      if (
        shot.impactedAtMs !== undefined ||
        this.elapsedTimeMs < shot.impactAtMs
      ) {
        continue;
      }

      shot.impactedAtMs = this.elapsedTimeMs;
      if (!target || target.hp <= 0) continue;
      const owner = this.objectiveAllies.find(
        (ally) => ally.id === shot.ownerAllyId
      );
      if (!owner || owner.behavior.type !== 'CORROGOON_SCOURING_VOLLEY')
        continue;
      const behavior = owner.behavior;
      const activeEffect =
        target.scouredEffect &&
        target.scouredEffect.expiresAtMs > this.elapsedTimeMs
          ? target.scouredEffect
          : undefined;
      target.scouredEffect = {
        sourceAllyId: owner.id,
        expiresAtMs: this.elapsedTimeMs + behavior.scouredDurationMs,
        nextTickAtMs:
          activeEffect?.nextTickAtMs ??
          this.elapsedTimeMs + behavior.tickIntervalMs,
        tickDamage: behavior.tickDamage,
        tickIntervalMs: behavior.tickIntervalMs,
        defenseMultiplier: behavior.defenseMultiplier,
        specialDefenseMultiplier: behavior.specialDefenseMultiplier,
      };
      startDamageFlash(target, ElementType.POISON);
      if (!activeEffect) {
        this.floatingTexts.push({
          id: `ft_scoured_${target.id}_${this.elapsedTimeMs}`,
          text: 'SCOURED',
          position: { ...target.position },
          color: 0xa3e635,
          scale: 0.9,
          durationMs: 900,
          elapsedMs: 0,
        });
      }
    }

    this.objectiveAllyAcidShots = this.objectiveAllyAcidShots.filter(
      (shot) => shot.expiresAtMs > this.elapsedTimeMs
    );
  }

  private processScouredEffects(enemies: Enemy[]): void {
    for (const enemy of enemies) {
      const effect = enemy.scouredEffect;
      if (!effect || enemy.hp <= 0) continue;

      while (
        enemy.hp > 0 &&
        effect.nextTickAtMs <= this.elapsedTimeMs &&
        effect.nextTickAtMs <= effect.expiresAtMs
      ) {
        const damage = Math.min(effect.tickDamage, enemy.hp);
        enemy.hp -= damage;
        effect.nextTickAtMs += effect.tickIntervalMs;
        startDamageFlash(enemy, ElementType.POISON);
        this.floatingTexts.push({
          id: `ft_scoured_tick_${enemy.id}_${effect.nextTickAtMs}`,
          text: Math.ceil(damage).toString(),
          position: { ...enemy.position },
          color: 0xd946ef,
          durationMs: 750,
          elapsedMs: 0,
        });
      }

      if (enemy.hp <= 0 && !enemy.defeatEventEmitted) {
        enemy.defeatEventEmitted = true;
        if (enemy.kind === 'structure') {
          this.handleStructureDestroyed(
            enemy,
            Array.from(enemy.damagedByTowerIds)
          );
        } else {
          this.events.emit({
            type: 'ENEMY_DIED',
            enemyId: enemy.id,
            enemyDefinitionId: enemy.definitionId,
            enemyLevel: enemy.level,
            participantTowerIds: [],
          });
        }
      }

      if (effect.expiresAtMs <= this.elapsedTimeMs) {
        enemy.scouredEffect = undefined;
      }
    }
  }

  /**
   * Distance in attack-range units, normalized to viewport height. This makes
   * the boundary circular on screen and independent of the level map size.
   */
  public getAttackDistance(a: Point, b: Point): number {
    const dx = (a.x - b.x) * this.aspectRatio * this.backgroundScale;
    const dy = (a.y - b.y) * this.backgroundScale;
    return Math.hypot(dx, dy);
  }

  public isPositionInAttackRange(
    source: Point,
    target: Point,
    range: number
  ): boolean {
    return this.getAttackDistance(source, target) <= range;
  }

  public setTowerTargetingMode(creatureId: string, mode: TowerTargetingMode) {
    this.playerSelectedTargetingModes[creatureId] = mode;
    const rosterCreature = this.roster.find((c) => c.id === creatureId);
    if (rosterCreature) {
      rosterCreature.targetingMode = mode;
    }
    const tower = this.towers.find((t) => t.creature.id === creatureId);
    if (tower) {
      tower.targetingMode = mode;
    }
  }

  public replaceTowerAttack(
    towerId: string,
    replaceIndex: number,
    newAttackDefId: string
  ) {
    const tower = this.towers.find((t) => t.id === towerId);
    if (!tower) return;
    if (
      replaceIndex >= 0 &&
      replaceIndex < tower.creature.equippedAttacks.length
    ) {
      tower.creature.equippedAttacks[replaceIndex] = newAttackDefId;
      tower.equippedAttacksRuntime[replaceIndex] = {
        definitionId: newAttackDefId,
        lastFiredTime: 0,
      };

      this.events.emit({
        type: 'TOWER_LEARNED_ATTACK',
        towerId: tower.id,
        attackDefId: newAttackDefId,
      });
    }
  }

  public evolveTower(towerId: string, evolutionDefId: string): boolean {
    return this.progression.evolveTower(towerId, evolutionDefId);
  }

  public cancelTowerEvolution(towerId: string): boolean {
    return this.progression.cancelEvolution(towerId);
  }

  // Scripted Event Architecture
  public spawnEnvironmentUnit(
    unitId: string,
    tdConfigId: string,
    position: Point,
    facingDirection: 'up' | 'down' | 'left' | 'right' = 'down',
    speed?: number
  ) {
    // Avoid duplicates
    if (this.environmentUnits.some((eu) => eu.id === unitId)) return;

    this.environmentUnits.push({
      id: unitId,
      tdConfigId: tdConfigId,
      position: { x: position.x, y: position.y },
      facingDirection,
      hp: 1,
      maxHp: 1,
      speed,
    });
  }

  public moveEnvironmentUnit(unitId: string, path: Point[], speed?: number) {
    const unit = this.environmentUnits.find((eu) => eu.id === unitId);
    if (!unit) return;

    unit.path = path.map((p) => ({ ...p }));
    unit.currentWaypointIndex = 0;
    if (speed !== undefined) {
      unit.speed = speed;
    }
  }

  public removeEnvironmentUnit(unitId: string) {
    this.environmentUnits = this.environmentUnits.filter(
      (eu) => eu.id !== unitId
    );
  }
}
