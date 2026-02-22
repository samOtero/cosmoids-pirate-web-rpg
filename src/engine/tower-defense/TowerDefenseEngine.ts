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

export const TD_CREATURE_DEFS: Record<string, Creature> = {
  [BUG_STAGE_1.id]: BUG_STAGE_1,
  [BUG_STAGE_2.id]: BUG_STAGE_2,
  [BUG_STAGE_3.id]: BUG_STAGE_3,
  [STARTER_CRAB.id]: STARTER_CRAB,
  [STARTER_IGUANA.id]: STARTER_IGUANA,
  [STARTER_MONKEY.id]: STARTER_MONKEY,
};

const ENEMY_TYPES = [BUG_STAGE_1, BUG_STAGE_2, BUG_STAGE_3];

export class TowerDefenseEngine {
  public towers: Tower[] = [];
  public enemies: Enemy[] = [];
  public projectiles: Projectile[] = [];

  public money: number = 100;
  public lives: number = 2000;

  private lastSpawnTime: number = 0;

  public tick(time: number, deltaMs: number) {
    let newEnemies = [...this.enemies];
    let newProjectiles = [...this.projectiles];
    let newTowers = [...this.towers];

    // Spawn enemies
    if (time - this.lastSpawnTime > 50) {
      const randomEnemyDef =
        ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
      newEnemies.push({
        id: `enemy_${time}`,
        definitionId: randomEnemyDef.id,
        position: { x: 100, y: 20 + Math.random() * 60 },
        hp: randomEnemyDef.maxHp,
        maxHp: randomEnemyDef.maxHp,
        speed: 0.1 + Math.random() * 0.1,
        currentAttack: randomEnemyDef.attack,
      });
      this.lastSpawnTime = time;
    }

    // Update enemies
    newEnemies.forEach((enemy) => {
      // the map dev uses speed relative to arbitrary frame timing, with a delta based loop we should scale it,
      // but to keep logic equivalent for now we'll just replicate it roughly
      // if 1 frame was originally ~16.6ms, we can normalize deltaMs / 16.6 to apply speed
      const timeScale = deltaMs / 16.666;
      enemy.position.x -= enemy.speed * timeScale;
    });

    // Enemy reached end
    const reachedEnd = newEnemies.filter((e) => e.position.x <= 0);
    if (reachedEnd.length > 0) {
      this.lives -= reachedEnd.length;
      if (this.lives <= 0) {
        // We'll let the UI handle game over messaging by watching the lives count
        this.lives = 0;
      }
    }
    newEnemies = newEnemies.filter((e) => e.position.x > 0);

    // Towers attack
    newTowers.forEach((tower) => {
      if (time - tower.lastAttackTime > 1000) {
        let nearestEnemy: Enemy | null = null;
        let minDist = 30; // 30% range

        newEnemies.forEach((enemy) => {
          const dx = enemy.position.x - tower.position.x;
          const dy = enemy.position.y - tower.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDist) {
            minDist = dist;
            nearestEnemy = enemy;
          }
        });

        if (nearestEnemy) {
          const enemyTarget = nearestEnemy as Enemy;
          newProjectiles.push({
            id: `proj_${time}_${tower.id}`,
            sourceId: tower.id,
            targetId: enemyTarget.id,
            position: { ...tower.position },
            speed: 1, // Will apply timescale to this as well
            damage: tower.currentAttack,
            target: { ...enemyTarget.position },
          });
          tower.lastAttackTime = time;
        }
      }
    });

    // Update projectiles
    const timeScale = deltaMs / 16.666;
    newProjectiles.forEach((p) => {
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
          target.hp -= p.damage;
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

    newProjectiles = newProjectiles.filter((p) => p.speed > 0);

    this.enemies = newEnemies;
    this.projectiles = newProjectiles;
    this.towers = newTowers;
  }

  public addTower(definitionId: string, x: number, y: number) {
    if (this.money >= 50) {
      const def = TD_CREATURE_DEFS[definitionId];
      if (!def) return false;

      this.towers.push({
        id: `tower_${Date.now()}`,
        definitionId,
        position: { x, y },
        lastAttackTime: 0,
        level: 1,
        xp: 0,
        currentAttack: def.attack,
      });
      this.money -= 50;
      return true;
    }
    return false;
  }
}
