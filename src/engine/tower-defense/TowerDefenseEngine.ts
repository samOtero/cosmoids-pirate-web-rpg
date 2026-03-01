import {
  BUG_STAGE_1,
  BUG_STAGE_2,
  BUG_STAGE_3,
  SENTICLE,
  STARTER_CRAB,
  STARTER_IGUANA,
  STARTER_MONKEY,
} from '@/constants/creatures';
import { Creature } from '@/types/baseGame';
import { Tower, Enemy, Projectile, CaptureUnit } from './types';
import { ATTACK_DEFS } from './attacks/definitions';
import { AttackBehaviorRegistry } from './attacks/behaviors';
import { EffectProcessor } from './attacks/EffectProcessor';
import { TDWave, TDWaveGroup, TDCreatureMetadata } from './types';
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

export class TowerDefenseEngine {
  public towers: Tower[] = [];
  public enemies: Enemy[] = [];
  public projectiles: Projectile[] = [];

  public money: number = 100;
  public lives: number = 3;

  public events = new TDEventBus();
  private progression = new TDProgressionManager(this, this.events);

  // Wave Management State
  public waves: TDWave[] = [];
  public currentWaveIndex: number = 0;
  public currentGroupIndex: number = 0;
  public spawnsRemainingInGroup: number = 0;
  private lastSpawnTime: number = 0;
  private waveDelayTimer: number = 0;
  private isWaitingForDelay: boolean = false;
  public hasFinishedAllWaves: boolean = false;

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

  constructor(levelData: import('./types').TDLevelData | any) {
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
      this.currentGroupIndex = 0;
      this.spawnsRemainingInGroup = this.waves[0].groups[0].count;
      this.isWaitingForDelay = true;
      this.waveDelayTimer = this.waves[0].groups[0].delayBeforeGroupMs || 0;
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

    // Update enemies
    newEnemies.forEach((enemy) => {
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
              status.lastTickTime = time;
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
      const attackInstance = tower.equippedAttacks[tower.selectedAttackIndex];
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
            } else {
              target.hp -= p.damage; // Fallback
            }
          } else {
            target.hp -= p.damage;
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

    this.enemies = newEnemies;
    this.projectiles = activeProjectiles;
    this.towers = newTowers;
  }

  private processWaveSpawns(
    time: number,
    deltaMs: number,
    newEnemies: Enemy[]
  ) {
    if (this.hasFinishedAllWaves) return;

    const currentWave = this.waves[this.currentWaveIndex];
    if (!currentWave || currentWave.groups.length === 0) {
      this.hasFinishedAllWaves = true;
      return;
    }

    const currentGroup = currentWave.groups[this.currentGroupIndex];
    if (!currentGroup) {
      // Move to next wave
      this.advanceToNextWave();
      return;
    }

    if (this.isWaitingForDelay) {
      this.waveDelayTimer -= deltaMs;
      if (this.waveDelayTimer <= 0) {
        this.isWaitingForDelay = false;
        this.lastSpawnTime = time - currentGroup.spawnIntervalMs; // Force immediate spawn
      } else {
        return; // Still waiting on delay
      }
    }

    // Checking if it's time to spawn
    const timeSinceLastSpawn = time - this.lastSpawnTime;
    if (timeSinceLastSpawn >= currentGroup.spawnIntervalMs) {
      this.spawnEnemyFromDef(
        currentGroup.definitionId,
        time,
        newEnemies,
        currentGroup.pathIndex,
        currentGroup.turnAroundAtEnd
      );
      this.spawnsRemainingInGroup--;
      this.lastSpawnTime = time;

      if (this.spawnsRemainingInGroup <= 0) {
        this.advanceToNextGroup();
      }
    }
  }

  private advanceToNextGroup() {
    this.currentGroupIndex++;
    const currentWave = this.waves[this.currentWaveIndex];

    if (this.currentGroupIndex >= currentWave.groups.length) {
      this.advanceToNextWave();
    } else {
      // Setup next group in current wave
      const nextGroup = currentWave.groups[this.currentGroupIndex];
      this.spawnsRemainingInGroup = nextGroup.count;
      if (nextGroup.delayBeforeGroupMs > 0) {
        this.isWaitingForDelay = true;
        this.waveDelayTimer = nextGroup.delayBeforeGroupMs;
      }
    }
  }

  private advanceToNextWave() {
    this.currentWaveIndex++;
    this.currentGroupIndex = 0;

    if (this.currentWaveIndex >= this.waves.length) {
      this.hasFinishedAllWaves = true;
    } else {
      const nextWave = this.waves[this.currentWaveIndex];
      // Skip empty waves
      if (nextWave.groups.length === 0) {
        this.advanceToNextWave();
        return;
      }

      const firstGroup = nextWave.groups[0];
      this.spawnsRemainingInGroup = firstGroup.count;
      if (firstGroup.delayBeforeGroupMs > 0) {
        this.isWaitingForDelay = true;
        this.waveDelayTimer = firstGroup.delayBeforeGroupMs;
      } else {
        this.isWaitingForDelay = false;
      }
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

  public removeTower(creatureId: string) {
    this.towers = this.towers.filter((t) => t.creatureId !== creatureId);
  }

  public captureEnemy(
    enemyId: string
  ): import('@/types/baseGame').Creature | null {
    const enemyIndex = this.enemies.findIndex((e) => e.id === enemyId);
    if (enemyIndex === -1) return null;

    const enemy = this.enemies[enemyIndex];

    // Remove the enemy without triggering 'ENEMY_DIED' drops or lives reduction
    this.enemies.splice(enemyIndex, 1);

    const baseCreature = TD_CREATURE_DEFS[enemy.definitionId]?.baseCreature;
    if (!baseCreature) return null;

    // Return a base Creature object suitable for adding to the profile
    return {
      ...baseCreature,
      currentHp: baseCreature.maxHp, // Heal them upon capture
      level: 1, // Base level for captured creatures
      xp: 0,
    };
  }

  public placeTower(
    creature: import('@/types/baseGame').Creature,
    x: number,
    y: number
  ) {
    const existingTower = this.towers.find((t) => t.creatureId === creature.id);
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

    const defaultAttacks = TowerDefenseEngine.getDefaultAttacks(
      creature.speciesId
    );

    this.towers.push({
      id: `tower_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      creatureId: creature.id,
      speciesId: creature.speciesId,
      position: { x, y },
      lastAttackTime: 0,
      level: creature.level,
      xp: creature.xp,
      currentAttack: creature.attack,
      hp: creature.currentHp,
      maxHp: creature.maxHp,
      equippedAttacks: defaultAttacks.map((atkId) => ({
        definitionId: atkId,
        lastFiredTime: 0,
      })),
      selectedAttackIndex: this.playerSelectedAttacks[creature.id] || 0,
      facingDirection: 'down',
    });
    return true;
  }

  public static getDefaultAttacks(speciesId: string): string[] {
    const defaultAttacks: string[] = [];
    if (speciesId === 'starter_crab')
      defaultAttacks.push('VINE_WHIP', 'SCRATCH');
    else if (speciesId === 'starter_iguana')
      defaultAttacks.push('EMBER', 'SCRATCH');
    else if (speciesId === 'starter_monkey')
      defaultAttacks.push('BUBBLE_BEAM', 'SCRATCH');
    else defaultAttacks.push('TACKLE'); // Fallback
    return defaultAttacks;
  }

  public setTowerAttack(creatureId: string, attackIndex: number) {
    this.playerSelectedAttacks[creatureId] = attackIndex;
    const tower = this.towers.find((t) => t.creatureId === creatureId);
    if (
      tower &&
      attackIndex >= 0 &&
      attackIndex < tower.equippedAttacks.length
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
    if (replaceIndex >= 0 && replaceIndex < tower.equippedAttacks.length) {
      tower.equippedAttacks[replaceIndex] = {
        definitionId: newAttackDefId,
        lastFiredTime: 0,
      };

      // Emit event so the UI can show the success modal if desired, or just to update state
      this.events.emit({
        type: 'TOWER_LEARNED_ATTACK',
        towerId: tower.id,
        attackDefId: newAttackDefId,
      });
    }
  }
}
