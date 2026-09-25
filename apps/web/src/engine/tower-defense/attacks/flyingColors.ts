import type { TowerDefenseEngine } from '../TowerDefenseEngine';
import type { Enemy, Point, Projectile, Tower } from '../types';
import type { AttackDefinition } from './types';

function separationScore(
  engine: TowerDefenseEngine,
  candidate: Enemy,
  visitedPositions: Point[]
): number {
  return Math.min(
    ...visitedPositions.map((position) =>
      engine.getAttackDistance(candidate.position, position)
    )
  );
}

/** Picks a spread-out route without choosing a second target that blocks a third hit. */
function chooseNextTarget(
  engine: TowerDefenseEngine,
  current: Enemy,
  visitedIds: string[],
  visitedPositions: Point[],
  remainingHops: number,
  hopRange: number
): Enemy | undefined {
  const candidates = engine.enemies.filter(
    (enemy) =>
      !visitedIds.includes(enemy.id) &&
      engine.isEnemyTargetable(enemy) &&
      engine.isPositionInAttackRange(current.position, enemy.position, hopRange)
  );

  const routes = candidates.flatMap((next) => {
    if (remainingHops < 2) return [];
    return engine.enemies
      .filter(
        (third) =>
          third.id !== next.id &&
          !visitedIds.includes(third.id) &&
          engine.isEnemyTargetable(third) &&
          engine.isPositionInAttackRange(
            next.position,
            third.position,
            hopRange
          )
      )
      .map((third) => ({
        next,
        spread: Math.min(
          separationScore(engine, next, visitedPositions),
          separationScore(engine, third, [...visitedPositions, next.position])
        ),
        total:
          engine.getAttackDistance(current.position, next.position) +
          engine.getAttackDistance(next.position, third.position) +
          engine.getAttackDistance(current.position, third.position),
      }));
  });
  routes.sort(
    (a, b) =>
      b.spread - a.spread ||
      b.total - a.total ||
      a.next.id.localeCompare(b.next.id)
  );
  if (routes[0]) return routes[0].next;

  return candidates.sort(
    (a, b) =>
      separationScore(engine, b, visitedPositions) -
        separationScore(engine, a, visitedPositions) ||
      a.id.localeCompare(b.id)
  )[0];
}

/** Sends the same quill to the next distinct enemy after every successful hit. */
export function launchFlyingColorsFollowUp(
  engine: TowerDefenseEngine,
  source: Tower,
  hitTarget: Enemy,
  projectile: Projectile,
  attackDef: AttackDefinition
): void {
  const config = attackDef.flyingColors;
  if (!config) return;

  const visitedIds = [...(projectile.flyingColorsHitIds ?? []), hitTarget.id];
  const visitedPositions = [
    ...(projectile.flyingColorsHitPositions ?? []),
    { ...hitTarget.position },
  ];
  const remainingHops = config.maxTargets - visitedIds.length;
  if (remainingHops <= 0) return;

  const next = chooseNextTarget(
    engine,
    hitTarget,
    visitedIds,
    visitedPositions,
    remainingHops,
    config.hopRange
  );
  if (!next) return;

  const dx = next.position.x - hitTarget.position.x;
  const dy = next.position.y - hitTarget.position.y;
  const facingDirection =
    Math.abs(dx) > Math.abs(dy)
      ? dx > 0
        ? 'right'
        : 'left'
      : dy > 0
        ? 'down'
        : 'up';

  engine.projectiles.push({
    id: `proj_flying_colors_${source.id}_${engine.elapsedTimeMs}_${Math.random()}`,
    attackDefinitionId: attackDef.id,
    sourceId: source.id,
    targetId: next.id,
    position: { ...hitTarget.position },
    origin: { ...hitTarget.position },
    launchFacingDirection: facingDirection,
    speed: attackDef.projectileSpeed ?? 1,
    damage: attackDef.power,
    flyingColorsHitIds: visitedIds,
    flyingColorsHitPositions: visitedPositions,
    target: { ...next.position },
    facingDirection,
  });
}
