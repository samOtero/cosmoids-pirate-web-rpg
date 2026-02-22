import {
  BUG_STAGE_1,
  BUG_STAGE_2,
  BUG_STAGE_3,
  STARTER_CRAB,
  STARTER_IGUANA,
  STARTER_MONKEY,
} from '@/constants/creatures';
import { Creature } from '@/types/baseGame';
import { Tower, Enemy, Projectile } from './types';
import { ATTACK_DEFS } from './attacks/definitions';
import { AttackBehaviorRegistry } from './attacks/behaviors';
import { EffectProcessor } from './attacks/EffectProcessor';
import { TDCreatureMetadata } from './types';
import { TDEventBus } from './events/TDEventBus';
import { TDProgressionManager } from './progression/TDProgressionManager';

export const TD_CREATURE_DEFS: Record<string, TDCreatureMetadata> = {
  [BUG_STAGE_1.id]: {
    baseCreature: BUG_STAGE_1,
    xpYield: 15,
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
    evolutionNodes: [{ level: 5, evolutionDefId: BUG_STAGE_2.id }], // example evolution
    attackUnlocks: [{ level: 3, attackDefId: 'BUBBLE_BEAM' }], // example attack unlock
  },
  [STARTER_IGUANA.id]: {
    baseCreature: STARTER_IGUANA,
    xpYield: 0,
  },
  [STARTER_MONKEY.id]: {
    baseCreature: STARTER_MONKEY,
    xpYield: 0,
  },
};

const ENEMY_TYPES = [BUG_STAGE_1, BUG_STAGE_2, BUG_STAGE_3];

export class TowerDefenseEngine {
  public towers: Tower[] = [];
  public enemies: Enemy[] = [];
  public projectiles: Projectile[] = [];

  public money: number = 100;
  public lives: number = 2000;

  public events = new TDEventBus();
  private progression = new TDProgressionManager(this, this.events);
  private lastSpawnTime: number = 0;

  public aspectRatio: number = 1;

  public setAspectRatio(ratio: number) {
    this.aspectRatio = ratio;
  }

  // Loaded at initialization
  public path: { x: number; y: number }[] = [];
  public placementSpots: { x: number; y: number }[] = [];

  constructor(levelData: import('./types').TDLevelData) {
    this.path = levelData.path;
    this.placementSpots = levelData.placementSpots;
  }

  public isSpotOccupied(x: number, y: number): boolean {
    // Check if any tower is at these exact coordinates
    return this.towers.some((t) => t.position.x === x && t.position.y === y);
  }

  public destroy() {
    this.progression.destroy();
  }

  public tick(time: number, deltaMs: number) {
    let newEnemies = [...this.enemies];
    // Notice: we do NOT clone projectiles here anymore, we filter them at the end.
    // Behaviors push directly to engine.projectiles during the tick.
    let newTowers = [...this.towers];

    // Spawn enemies
    // we use > 500ms as a simple interval for MVP.
    // Ensure if time jumps massive (tab suspension), we don't spawn 100 enemies.
    if (time - this.lastSpawnTime > 500) {
      if (time - this.lastSpawnTime > 5000) {
        this.lastSpawnTime = time - 500; // soft clamp if tab was backgrounded
      }

      const randomEnemyDef =
        ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
      newEnemies.push({
        id: `enemy_${time}`,
        definitionId: randomEnemyDef.id,
        position: { x: this.path[0].x, y: this.path[0].y },
        hp: randomEnemyDef.maxHp,
        maxHp: randomEnemyDef.maxHp,
        speed: 0.1 + Math.random() * 0.1,
        currentAttack: randomEnemyDef.attack,
        statusConditions: [],
        currentWaypointIndex: 1,
      });
      this.lastSpawnTime = time;
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

      if (enemy.currentWaypointIndex < this.path.length) {
        const targetPoint = this.path[enemy.currentWaypointIndex];
        const dx = targetPoint.x - enemy.position.x;
        const dy = targetPoint.y - enemy.position.y;

        // Normalize distance by aspect ratio to make vertical movement feel proportional
        const effectiveDy = dy * this.aspectRatio;
        const distSq = dx * dx + effectiveDy * effectiveDy;

        const frameDistance = moveSpeed * timeScale;

        if (distSq <= frameDistance * frameDistance) {
          // Reached waypoint, move to target and increment
          enemy.position.x = targetPoint.x;
          enemy.position.y = targetPoint.y;
          enemy.currentWaypointIndex++;
        } else {
          // Move towards waypoint
          const dist = Math.sqrt(distSq);
          enemy.position.x += (dx / dist) * frameDistance;
          // Apply inverse normalization to the actual movement
          enemy.position.y += (dy / dist) * frameDistance * this.aspectRatio;
        }
      }
    });

    // Enemy reached end
    const reachedEnd = newEnemies.filter(
      (e) => e.currentWaypointIndex >= this.path.length
    );
    if (reachedEnd.length > 0) {
      this.lives -= reachedEnd.length;
      if (this.lives <= 0) {
        // We'll let the UI handle game over messaging by watching the lives count
        this.lives = 0;
      }
    }
    newEnemies = newEnemies.filter(
      (e) => e.currentWaypointIndex < this.path.length
    );

    // Towers attack
    newTowers.forEach((tower) => {
      tower.equippedAttacks.forEach((attackInstance) => {
        const attackDef = ATTACK_DEFS[attackInstance.definitionId];
        if (!attackDef) return;

        if (time - attackInstance.lastFiredTime > attackDef.cooldownMs) {
          const behavior = AttackBehaviorRegistry[attackDef.behaviorType];

          if (behavior && behavior.canExecute(this, tower, attackDef)) {
            behavior.execute(this, tower, attackDef);
            attackInstance.lastFiredTime = time;
          }
        }
      });
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
    }
    newEnemies = newEnemies.filter((e) => e.hp > 0);

    // Keep projectiles that haven't hit yet (speed > 0)
    let activeProjectiles = this.projectiles.filter((p) => p.speed > 0);

    this.enemies = newEnemies;
    this.projectiles = activeProjectiles;
    this.towers = newTowers;
  }

  public removeTower(creatureId: string) {
    this.towers = this.towers.filter((t) => t.creatureId !== creatureId);
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
        existingTower.position = { x, y };
      } else {
        // Move
        existingTower.position = { x, y };
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

    // Assign default attacks based on definition (hardcoded mapping for MVP)
    const defaultAttacks: string[] = [];
    if (creature.speciesId === 'starter_crab')
      defaultAttacks.push('VINE_WHIP', 'SCRATCH');
    else if (creature.speciesId === 'starter_iguana')
      defaultAttacks.push('EMBER', 'SCRATCH');
    else if (creature.speciesId === 'starter_monkey')
      defaultAttacks.push('BUBBLE_BEAM', 'SCRATCH');
    else defaultAttacks.push('TACKLE'); // Fallback

    this.towers.push({
      id: `tower_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      creatureId: creature.id,
      speciesId: creature.speciesId,
      position: { x, y },
      lastAttackTime: 0,
      level: creature.level,
      xp: creature.xp,
      currentAttack: creature.attack,
      equippedAttacks: defaultAttacks.map((atkId) => ({
        definitionId: atkId,
        lastFiredTime: 0,
      })),
    });
    return true;
  }
}
