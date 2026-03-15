import {
  BUG_STAGE_1,
  BUG_STAGE_2,
  BUG_STAGE_3,
  SENTICLE,
  STARTER_CRAB,
  STARTER_IGUANA,
  STARTER_MONKEY,
} from '@/constants/creatures';
import { Creature, PlayerCreature } from '@/types/baseGame';
import {
  Tower,
  Enemy,
  Projectile,
  CaptureUnit,
  VisualEffect,
  FloatingText,
} from './types';
import { ATTACK_DEFS } from './attacks/definitions';
import { AttackBehaviorRegistry } from './attacks/behaviors';
import { EffectProcessor } from './attacks/EffectProcessor';
import {
  TDWave,
  TDWaveGroup,
  TDCreatureMetadata,
  EnvironmentUnit,
  Point,
} from './types';
import { TDEventBus } from './events/TDEventBus';
import { TDProgressionManager } from './progression/TDProgressionManager';

export const TD_CREATURE_DEFS: Record<string, TDCreatureMetadata> = {
  [BUG_STAGE_1.id]: {
    baseCreature: BUG_STAGE_1,
    xpYield: 100, // TEMPORARY for testing: faster leveling
  },
  [BUG_STAGE_2.id]: {
    baseCreature: BUG_STAGE_2,
    xpYield: 30,
  },
  [BUG_STAGE_3.id]: {
    baseCreature: BUG_STAGE_3,
    xpYield: 50,
  },
  [STARTER_CRAB.id]: {
    baseCreature: STARTER_CRAB,
    xpYield: 0,
    evolutionNodes: [{ level: 10, evolutionDefId: BUG_STAGE_2.id }], // pushed back for testing
    attackUnlocks: [
      { level: 2, attackDefId: 'EMBER' },
      { level: 3, attackDefId: 'BUBBLE_BEAM' },
      { level: 4, attackDefId: 'STRING_SHOT' },
    ], // temporary testing progression
  },
  [STARTER_IGUANA.id]: {
    baseCreature: STARTER_IGUANA,
    xpYield: 0,
  },
  [STARTER_MONKEY.id]: {
    baseCreature: STARTER_MONKEY,
    xpYield: 0,
  },
  [SENTICLE.id]: {
    baseCreature: SENTICLE,
    xpYield: 20,
  },
};

const ENEMY_TYPES = [BUG_STAGE_1, BUG_STAGE_2, BUG_STAGE_3];

interface ActiveSpawnerState {
  group: TDWaveGroup;
  spawnsRemaining: number;
  lastSpawnTime: number;
  delayTimer: number;
  isWaitingForDelay: boolean;
}

export class TowerDefenseEngine {
  public towers: Tower[] = [];
  public enemies: Enemy[] = [];
  public projectiles: Projectile[] = [];
  public visualEffects: VisualEffect[] = [];
  public floatingTexts: FloatingText[] = [];

  public money: number = 100;
  public lives: number = 3;

  public static getDefaultAttacks(speciesId: string): string[] {
    const defaultAttacks: string[] = [];
    if (speciesId === 'starter_crab')
      defaultAttacks.push('TACKLE', 'VINE_WHIP');
    else if (speciesId === 'starter_iguana')
      defaultAttacks.push('EMBER', 'SCRATCH');
    else if (speciesId === 'starter_monkey')
      defaultAttacks.push('BUBBLE_BEAM', 'SCRATCH');
    else defaultAttacks.push('TACKLE'); // Fallback
    return defaultAttacks;
  }



  public events = new TDEventBus();
  private progression = new TDProgressionManager(this, this.events);

  public roster: PlayerCreature[] = [];

  // Wave Management State
  public waves: TDWave[] = [];
  public currentWaveIndex: number = 0;
  private activeSpawners: ActiveSpawnerState[] = [];
  private nextGroupIndexToStart: number = 0;
  public hasFinishedAllWaves: boolean = false;
  private lastSpawnTime: number = 0;

  public playerSelectedAttacks: Record<string, number> = {};

  public surviveUntil?: number;
  public elapsedTimeMs: number = 0;

  public aspectRatio: number = 1;

  public setAspectRatio(ratio: number) {
    this.aspectRatio = ratio;
  }

  // Loaded at initialization
  public paths: { x: number; y: number }[][] = [];
  public placementSpots: { x: number; y: number }[] = [];
  public environmentUnits: import('./types').EnvironmentUnit[] = [];
  public captureUnits: CaptureUnit[] = [];
  public hasCaptureUnitsGoal: boolean = false;

  constructor(
    levelData: import('./types').TDLevelData | any,
    initialRoster: PlayerCreature[] = []
  ) {
    this.roster = JSON.parse(JSON.stringify(initialRoster));

    this.playerSelectedAttacks = {};
    this.roster.forEach((c) => {
      if (c.activeAttackIndex !== undefined) {
        this.playerSelectedAttacks[c.id] = c.activeAttackIndex;
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
    this.waves = levelData.waves || [];
    this.surviveUntil = levelData.surviveUntil;

    if (levelData.environmentUnits) {
      this.environmentUnits = levelData.environmentUnits.map(
        (eu: any, index: number) => ({
          id: `env_unit_${index}_${Math.random().toString(36).substring(7)}`,
          tdConfigId: eu.tdConfigId,
          position: { x: eu.position.x, y: eu.position.y },
          facingDirection: eu.facingDirection || 'down',
          hp: 1,
          maxHp: 1,
        })
      );
    }

    if (levelData.captureUnits && levelData.captureUnits.length > 0) {
      this.hasCaptureUnitsGoal = true;
      this.captureUnits = levelData.captureUnits.map(
        (cu: any, index: number) => ({
          id: `cap_unit_${index}_${Math.random().toString(36).substring(7)}`,
          tdConfigId: cu.tdConfigId,
          position: { x: cu.position.x, y: cu.position.y },
          facingDirection: cu.facingDirection || 'down',
          hp: 1,
          maxHp: 1,
        })
      );
      this.lives = this.captureUnits.length;
    } else {
      this.lives = levelData.lives !== undefined ? levelData.lives : 3;
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
        newEnemies.push({
          id: `enemy_${time}`,
          definitionId: randomEnemyDef.id,
          position: { x: startPath[0].x, y: startPath[0].y },
          hp: randomEnemyDef.maxHp,
          maxHp: randomEnemyDef.maxHp,
          speed: randomEnemyDef.speed / 100,
          currentAttack: randomEnemyDef.attack,
          statusConditions: [],
          currentWaypointIndex: 1,
          pathIndex: pathIndex,
          facingDirection: 'down',
        });
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
          const timeScale = deltaMs / 16.666;
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

    // Update enemies
    newEnemies.forEach((enemy) => {
      if (enemy.damageFlashTimerMs) {
        enemy.damageFlashTimerMs -= deltaMs;
        if (enemy.damageFlashTimerMs < 0) enemy.damageFlashTimerMs = 0;
      }
      // the map dev uses speed relative to arbitrary frame timing, with a delta based loop we should scale it,
      // but to keep logic equivalent for now we'll just replicate it roughly
      // if 1 frame was originally ~16.6ms, we can normalize deltaMs / 16.6 to apply speed
      const timeScale = deltaMs / 16.666;
      let moveSpeed = enemy.speed;

      // Handle status conditions
      if (enemy.statusConditions.length > 0) {
        enemy.statusConditions.forEach((status) => {
          if (status.type === 'STUN') {
            moveSpeed = 0; // cannot move while stunned
          } else if (status.type === 'BURN' || status.type === 'POISON') {
            if (status.tickDamage && time - (status.lastTickTime || 0) > 1000) {
              enemy.hp -= status.tickDamage;
              enemy.damageFlashTimerMs = 150;
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
          livesToLose++;
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
        // Find closest enemy that isn't holding anything
        for (const enemy of newEnemies) {
          if (enemy.heldCaptureUnitId) continue;

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
        }
      }
    }

    // Towers attack
    newTowers.forEach((tower) => {
      if (tower.damageFlashTimerMs) {
        tower.damageFlashTimerMs -= deltaMs;
        if (tower.damageFlashTimerMs < 0) tower.damageFlashTimerMs = 0;
      }
      const attackInstance = tower.equippedAttacksRuntime[tower.selectedAttackIndex];
      if (!attackInstance) return;

      const attackDef = ATTACK_DEFS[attackInstance.definitionId];
      if (!attackDef) return;

      const isReady =
        time - attackInstance.lastFiredTime > attackDef.cooldownMs;

      if (isReady) {
        let nearestEnemy: Enemy | null = null;
        let minTargetDist = attackDef.rangeIndex;
        for (const enemy of newEnemies) {
          const dx = enemy.position.x - tower.position.x;
          const dy = enemy.position.y - tower.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= minTargetDist) {
            minTargetDist = dist;
            nearestEnemy = enemy;
          }
        }

        if (nearestEnemy) {
          const dx = nearestEnemy.position.x - tower.position.x;
          const dy = nearestEnemy.position.y - tower.position.y;
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
        if (target) {
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
                this.visualEffects.push({
                  id: `vfx_${Date.now()}_${Math.random()}`,
                  configId: attackDef.visualEffectConfigId,
                  position: { ...target.position },
                  durationMs: 500, // Duration of the visual effect
                  elapsedMs: 0,
                  targetId: target.id,
                });
              }
            } else {
              target.hp -= p.damage; // Fallback
              target.damageFlashTimerMs = 150;
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
            target.damageFlashTimerMs = 150;
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
            const meta = TD_CREATURE_DEFS[target.definitionId];
            this.events.emit({
              type: 'ENEMY_DIED',
              enemyId: target.id,
              killerTowerId: sourceTower.id,
              xpValue: meta ? meta.xpYield : 10,
            });
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
      this.money += deadEnemies.length * 10;

      // Drop capture units when an enemy dies
      deadEnemies.forEach((e) => {
        if (e.heldCaptureUnitId) {
          const droppedUnit = this.captureUnits.find(
            (cu) => cu.id === e.heldCaptureUnitId
          );
          if (droppedUnit) {
            droppedUnit.heldByEnemyId = undefined;
            // The unit drops exactly where the enemy died (which was already set in the update loop)
          }
        }
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
    let groupToLoad = currentWave.groups[this.nextGroupIndexToStart];
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
      let nextGroup = currentWave.groups[this.nextGroupIndexToStart];
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
          spawner.group.definitionId,
          time,
          newEnemies,
          spawner.group.pathIndex,
          spawner.group.turnAroundAtEnd
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
    definitionId: string,
    time: number,
    newEnemies: Enemy[],
    groupPathIndex: number,
    turnAroundAtEnd?: boolean
  ) {
    const meta = TD_CREATURE_DEFS[definitionId];
    if (!meta) return;

    const pathIndex = groupPathIndex;
    const startPath = this.paths[pathIndex] || [{ x: 0, y: 0 }];

    newEnemies.push({
      id: `enemy_${time}_${Math.random().toString(36).substring(7)}`,
      definitionId: definitionId,
      position: { x: startPath[0].x, y: startPath[0].y },
      hp: meta.baseCreature.maxHp,
      maxHp: meta.baseCreature.maxHp,
      speed: meta.baseCreature.speed / 100,
      currentAttack: meta.baseCreature.attack,
      statusConditions: [],
      currentWaypointIndex: 1,
      pathIndex: pathIndex,
      facingDirection: 'down',
      turnAroundAtEnd,
    });
  }

  public captureEnemy(enemyId: string): PlayerCreature | null {
    const enemy = this.enemies.find((e) => e.id === enemyId);
    if (!enemy) return null;

    // Optional: add RNG for capture success here! Currently 100% success.
    const captured: PlayerCreature = {
      id: enemy.definitionId, // will be replaced with UUID when added to profile
      speciesId: enemy.definitionId,
      level: 1,
      xp: 0,
      equippedAttacks: TowerDefenseEngine.getDefaultAttacks(enemy.definitionId),
    };
    this.roster.push(captured);
    return captured;
  }

  public removeTower(creatureId: string) {
    this.towers = this.towers.filter((t) => t.creature.id !== creatureId);
  }

  public placeTower(creatureId: string, x: number, y: number) {
    const creature = this.roster.find((c) => c.id === creatureId);
    if (!creature) return false;

    const existingTower = this.towers.find((t) => t.creature.id === creature.id);
    const targetTower = this.towers.find(
      (t) => t.position.x === x && t.position.y === y
    );

    if (existingTower) {
      if (existingTower.position.x === x && existingTower.position.y === y) {
        return true; // Dropped on itself
      }

      if (targetTower) {
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
      // Remove whatever tower was there previously, taking its spot
      this.towers = this.towers.filter((t) => t.id !== targetTower.id);
    }

    const defMeta = TD_CREATURE_DEFS[creature.speciesId];
    if (!defMeta) return false;

    const baseDef = defMeta.baseCreature;

    // Derive base stats from the species definition
    const statGrowth = 2;
    const derivedAttack = baseDef.attack + creature.level * statGrowth;
    const derivedMaxHp = baseDef.maxHp;

    const attacks =
      creature.equippedAttacks.length > 0
        ? creature.equippedAttacks
        : TowerDefenseEngine.getDefaultAttacks(creature.speciesId);

    this.towers.push({
      id: `tower_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      creature: creature,
      position: { x, y },
      lastAttackTime: 0,
      currentAttack: derivedAttack,
      hp: derivedMaxHp,
      maxHp: derivedMaxHp,
      equippedAttacksRuntime: attacks.map((atkId) => ({
        definitionId: atkId,
        lastFiredTime: 0,
      })),
      selectedAttackIndex: this.playerSelectedAttacks[creature.id] || 0,
      facingDirection: 'down',
    });
    return true;
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

  public replaceTowerAttack(
    towerId: string,
    replaceIndex: number,
    newAttackDefId: string
  ) {
    const tower = this.towers.find((t) => t.id === towerId);
    if (!tower) return;
    if (replaceIndex >= 0 && replaceIndex < tower.creature.equippedAttacks.length) {
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
