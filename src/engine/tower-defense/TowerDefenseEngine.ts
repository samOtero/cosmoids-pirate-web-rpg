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
  TDResonantEvolutionConfig,
  TDWaveEnemyDefinition,
} from './types';
import { ATTACK_DEFS } from './attacks/definitions';
import { startDamageFlash } from './damageFlash';
import { AttackBehaviorRegistry } from './attacks/behaviors';
import { EffectProcessor } from './attacks/EffectProcessor';
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
    this.paths = rawPaths.map((path) => {
      if (path.length <= 1) return path;
      const snappedPath = [{ ...path[0] }];
      for (let i = 1; i < path.length; i++) {
        const prev = snappedPath[i - 1];
        const curr = path[i];
        const dx = Math.abs(curr.x - prev.x);
        // Normalize aspect ratio for coordinate comparison if needed?
        // Actually, we'll just snap to whichever delta is larger purely in percentage coordinates.
        const dy = Math.abs(curr.y - prev.y);

        if (dx > dy) {
          // Horizontal
          snappedPath.push({ x: curr.x, y: prev.y });
        } else {
          // Vertical
          snappedPath.push({ x: prev.x, y: curr.y });
        }
      }
      return snappedPath;
    });
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
          const dx = targetPoint.x - unit.position.x;
          const dy = targetPoint.y - unit.position.y;
          const moveSpeed = unit.speed;
          // speed is in % per second, so distance = speed * (deltaMs / 1000)
          const frameDistance = moveSpeed * (deltaMs / 1000);

          const isHorizontal = Math.abs(dx) > Math.abs(dy);

          if (isHorizontal) {
            const dir = Math.sign(dx);
            const moveDist = dir * frameDistance;

            if (Math.abs(dx) <= frameDistance) {
              unit.position.x = targetPoint.x;
              unit.position.y = targetPoint.y;
              unit.currentWaypointIndex++;
            } else {
              unit.position.x += moveDist;
              unit.facingDirection = dx > 0 ? 'right' : 'left';
            }
          } else {
            const dir = Math.sign(dy);
            const moveDist = dir * frameDistance * this.aspectRatio;

            if (Math.abs(dy) <= Math.abs(moveDist)) {
              unit.position.x = targetPoint.x;
              unit.position.y = targetPoint.y;
              unit.currentWaypointIndex++;
            } else {
              unit.position.y += moveDist;
              unit.facingDirection = dy > 0 ? 'down' : 'up';
            }
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
      const timeScale = deltaMs / 16.666;
      let moveSpeed =
        enemy.speed * getActiveSpeedMultiplier(enemy, this.elapsedTimeMs);
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
        const dx = targetPoint.x - enemy.position.x;
        const dy = targetPoint.y - enemy.position.y;

        const frameDistance = moveSpeed * timeScale;

        // Since paths are strictly horizontal or vertical, only one of dx or dy is non-zero (or both are close to zero)
        const isHorizontal = Math.abs(dx) > Math.abs(dy);

        if (isHorizontal) {
          // Horizontal movement
          const dir = Math.sign(dx);
          const moveDist = dir * frameDistance;

          if (Math.abs(dx) <= frameDistance) {
            // Reached waypoint
            enemy.position.x = targetPoint.x;
            enemy.position.y = targetPoint.y;

            // Advance/regress waypoint
            if (enemy.isMovingBackward) {
              enemy.currentWaypointIndex--;
            } else {
              enemy.currentWaypointIndex++;
            }
          } else {
            enemy.position.x += moveDist;
            enemy.facingDirection = dx > 0 ? 'right' : 'left';
          }
        } else {
          // Vertical movement
          const dir = Math.sign(dy);
          // Apply aspect ratio scale directly to vertical speed to keep movement visually consistent
          const moveDist = dir * frameDistance * this.aspectRatio;

          if (Math.abs(dy) <= Math.abs(moveDist)) {
            // Reached waypoint
            enemy.position.x = targetPoint.x;
            enemy.position.y = targetPoint.y;

            // Advance/regress waypoint
            if (enemy.isMovingBackward) {
              enemy.currentWaypointIndex--;
            } else {
              enemy.currentWaypointIndex++;
            }
          } else {
            enemy.position.y += moveDist;
            enemy.facingDirection = dy > 0 ? 'down' : 'up';
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
    newTowers.forEach((tower) => {
      if (tower.damageFlashTimerMs) {
        tower.damageFlashTimerMs -= deltaMs;
        if (tower.damageFlashTimerMs < 0) tower.damageFlashTimerMs = 0;
      }
      const attackInstance =
        tower.equippedAttacksRuntime[tower.selectedAttackIndex];
      if (!attackInstance) return;

      const attackDef = ATTACK_DEFS[attackInstance.definitionId];
      if (!attackDef) return;

      const isSupport = attackDef.behaviorType === 'SUPPORT_AURA';
      const isReady = isSupport
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
          if (isSupport) {
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
      const target = newEnemies.find((e) => e.id === p.targetId);
      if (target) {
        p.target = { ...target.position };
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
              EffectProcessor.applyDamageAndEffects(
                this,
                sourceTower,
                target,
                attackDef
              );

              if (attackDef.visualEffectConfigId) {
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

          if (target.hp <= 0 && sourceTower) {
            this.emitEnemyDefeated(target, sourceTower);
          }
        }
        p.speed = 0; // mark for deletion
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

    // Keep projectiles that haven't hit yet (speed > 0)
    const activeProjectiles = this.projectiles.filter((p) => p.speed > 0);

    // Update Visual Effects
    this.visualEffects.forEach((effect) => {
      effect.elapsedMs += deltaMs;
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
      waveEnemyDefinitionId,
      level: enemyLevel,
      position: { x: startPath[0].x, y: startPath[0].y },
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
    if (Math.abs(dx) > Math.abs(dy)) {
      captureUnit.facingDirection = dx > 0 ? 'right' : 'left';
    } else if (Math.abs(dy) > 0.0001) {
      captureUnit.facingDirection = dy > 0 ? 'down' : 'up';
    }
  }

  public removeTower(creatureId: string) {
    const tower = this.towers.find((t) => t.creature.id === creatureId);
    if (tower?.isFixed) return false;
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
      return true;
    }

    // New tower from the deck
    if (targetTower) {
      if (targetTower.isFixed) return false;
      // Remove whatever tower was there previously, taking its spot
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
      const winsLevel = target.winsLevelOnDestroy === true;
      if (winsLevel) this.hasDestroyedVictoryStructure = true;
      this.events.emit({
        type: 'STRUCTURE_DESTROYED',
        structureId: target.definitionId,
        participantTowerIds,
        winsLevel,
      });
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
