import type { TowerDefenseEngine } from '../TowerDefenseEngine';
import type { Enemy, Point, Projectile } from '../types';
import type { AttackBehavior, AttackDefinition } from './types';
import { EffectProcessor } from './EffectProcessor';

function projectToSegment(
  point: Point,
  start: Point,
  end: Point,
  aspect: number
): Point {
  const dx = (end.x - start.x) * aspect;
  const dy = end.y - start.y;
  const lengthSq = dx * dx + dy * dy;
  const t =
    lengthSq > 0
      ? Math.max(
          0,
          Math.min(
            1,
            ((point.x - start.x) * aspect * dx + (point.y - start.y) * dy) /
              lengthSq
          )
        )
      : 0;
  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
  };
}

/** Follow the target's current path segment toward the entrance, including bends. */
export function getBarrelRoute(
  engine: TowerDefenseEngine,
  target: Enemy,
  distance: number
): Point[] {
  const route: Point[] = [{ ...target.position }];
  const path = engine.paths[target.pathIndex];
  if (target.kind === 'structure' || !path || path.length < 2) return route;
  const segment = Math.max(
    0,
    Math.min(
      path.length - 2,
      target.isMovingBackward
        ? target.currentWaypointIndex
        : target.currentWaypointIndex - 1
    )
  );
  const projected = projectToSegment(
    target.position,
    path[segment],
    path[segment + 1],
    engine.aspectRatio
  );
  const points = [projected, ...path.slice(0, segment + 1).reverse()];
  let remaining = distance;
  for (const point of points) {
    const from = route[route.length - 1];
    const length = engine.getAttackDistance(from, point);
    if (length < 0.000001) continue;
    const t = Math.min(1, remaining / length);
    route.push({
      x: from.x + (point.x - from.x) * t,
      y: from.y + (point.y - from.y) * t,
    });
    remaining -= length * t;
    if (remaining <= 0.000001) break;
  }
  return route;
}

function faceTravel(
  projectile: Projectile,
  from: Point,
  to: Point,
  aspect: number
) {
  const dx = (to.x - from.x) * aspect;
  const dy = to.y - from.y;
  if (dx === 0 && dy === 0) return;
  projectile.facingDirection =
    Math.abs(dx) >= Math.abs(dy)
      ? dx >= 0
        ? 'right'
        : 'left'
      : dy >= 0
        ? 'down'
        : 'up';
}

export const RollingBarrelBehavior: AttackBehavior = {
  canExecute(engine, source, attackDef) {
    return Boolean(
      engine.getTargetForTower(
        source,
        attackDef.rangeIndex,
        source.targetingMode
      )
    );
  },
  execute(engine, source, attackDef) {
    if (!attackDef.rollingBarrel) return;
    const target = engine.getTargetForTower(
      source,
      attackDef.rangeIndex,
      source.targetingMode
    );
    if (!target) return;
    const projectile: Projectile = {
      id: `barrel_${source.id}_${engine.elapsedTimeMs}_${Math.random()}`,
      attackDefinitionId: attackDef.id,
      sourceId: source.id,
      targetId: target.id,
      origin: { ...source.position },
      position: { ...source.position },
      target: { ...target.position },
      speed: 1,
      damage: attackDef.power,
      rollingBarrel: {
        phase: 'lob',
        elapsedMs: 0,
        route: getBarrelRoute(
          engine,
          target,
          attackDef.rollingBarrel.rollDistance
        ),
        routeIndex: 1,
        distanceRolled: 0,
        hitEnemyIds: new Set(),
        sourceSnapshot: { ...source, creature: { ...source.creature } },
      },
    };
    faceTravel(
      projectile,
      source.position,
      target.position,
      engine.aspectRatio
    );
    source.facingDirection = projectile.facingDirection!;
    engine.projectiles.push(projectile);
  },
};

function hitAlongSegment(
  engine: TowerDefenseEngine,
  projectile: Projectile,
  enemies: Enemy[],
  attackDef: AttackDefinition,
  from: Point,
  to: Point
) {
  const barrel = projectile.rollingBarrel!;
  const radius = attackDef.rollingBarrel!.hitRadius;
  for (const enemy of enemies) {
    if (enemy.hp <= 0 || barrel.hitEnemyIds.has(enemy.id)) continue;
    const closest = projectToSegment(
      enemy.position,
      from,
      to,
      engine.aspectRatio
    );
    if (engine.getAttackDistance(enemy.position, closest) > radius) continue;
    barrel.hitEnemyIds.add(enemy.id);
    EffectProcessor.applyDamageAndEffects(
      engine,
      barrel.sourceSnapshot,
      enemy,
      attackDef,
      1,
      1,
      projectile.warmthDamageMultiplier
    );
    if (enemy.hp <= 0) engine.emitEnemyDefeated(enemy, barrel.sourceSnapshot);
  }
}

/** Uses swept segments so a fast barrel cannot skip enemies or cut across corners. */
export function updateRollingBarrel(
  engine: TowerDefenseEngine,
  projectile: Projectile,
  enemies: Enemy[],
  attackDef: AttackDefinition,
  deltaMs: number
) {
  const barrel = projectile.rollingBarrel!;
  const config = attackDef.rollingBarrel!;
  let rollMs = deltaMs;
  if (barrel.phase === 'lob') {
    const target = enemies.find(
      (enemy) => enemy.id === projectile.targetId && enemy.hp > 0
    );
    if (target) {
      projectile.target = { ...target.position };
      barrel.route = getBarrelRoute(engine, target, config.rollDistance);
    }
    const previousElapsed = barrel.elapsedMs;
    barrel.elapsedMs += deltaMs;
    const t = Math.min(1, barrel.elapsedMs / config.lobDurationMs);
    const origin = projectile.origin!;
    faceTravel(projectile, origin, projectile.target, engine.aspectRatio);
    projectile.position = {
      x: origin.x + (projectile.target.x - origin.x) * t,
      y: origin.y + (projectile.target.y - origin.y) * t,
    };
    if (t < 1) return;
    barrel.phase = 'roll';
    rollMs = Math.max(0, deltaMs - (config.lobDurationMs - previousElapsed));
    hitAlongSegment(
      engine,
      projectile,
      enemies,
      attackDef,
      projectile.position,
      projectile.position
    );
  }
  let remaining = (config.rollSpeed * rollMs) / 1000;
  while (barrel.routeIndex < barrel.route.length) {
    const from = { ...projectile.position };
    const to = barrel.route[barrel.routeIndex];
    const distance = engine.getAttackDistance(from, to);
    if (distance < 0.000001) {
      barrel.routeIndex += 1;
      continue;
    }
    faceTravel(projectile, from, to, engine.aspectRatio);
    if (remaining <= 0) break;
    const step = Math.min(distance, remaining);
    const t = step / distance;
    projectile.position = {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
    };
    hitAlongSegment(
      engine,
      projectile,
      enemies,
      attackDef,
      from,
      projectile.position
    );
    barrel.distanceRolled += step;
    remaining -= step;
    if (step >= distance) barrel.routeIndex += 1;
    else break;
  }
  if (barrel.routeIndex >= barrel.route.length) {
    projectile.speed = 0;
    engine.visualEffects.push({
      id: `barrel_splash_${projectile.id}`,
      configId: 'attack_barrel_bowling_splash',
      position: { ...projectile.position },
      durationMs: 450,
      elapsedMs: 0,
    });
  }
}
