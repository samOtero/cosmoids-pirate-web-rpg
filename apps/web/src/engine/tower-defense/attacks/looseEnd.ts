import type { TowerDefenseEngine } from '../TowerDefenseEngine';
import type { Enemy, Projectile, Tower } from '../types';
import type { AttackDefinition } from './types';

function getFacingDirection(
  from: Enemy['position'],
  to: Enemy['position']
): NonNullable<Projectile['facingDirection']> {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

/** Launches Loose End's single permitted follow-up after its primary knockout. */
export function launchLooseEndFollowUp(
  engine: TowerDefenseEngine,
  source: Tower,
  defeatedTarget: Enemy,
  attackDef: AttackDefinition
): void {
  const config = attackDef.looseEnd;
  if (!config) return;

  const followUpTarget = engine.enemies
    .filter(
      (enemy) =>
        enemy.id !== defeatedTarget.id &&
        engine.isEnemyTargetable(enemy) &&
        engine.isPositionInAttackRange(
          defeatedTarget.position,
          enemy.position,
          config.followUpRadius
        )
    )
    .sort(
      (a, b) =>
        engine.getAttackDistance(defeatedTarget.position, a.position) -
        engine.getAttackDistance(defeatedTarget.position, b.position)
    )[0];
  if (!followUpTarget) return;

  const facingDirection = getFacingDirection(
    defeatedTarget.position,
    followUpTarget.position
  );
  engine.projectiles.push({
    id: `proj_loose_end_${source.id}_${engine.elapsedTimeMs}_${Math.random()}`,
    attackDefinitionId: attackDef.id,
    sourceId: source.id,
    targetId: followUpTarget.id,
    position: { ...defeatedTarget.position },
    origin: { ...defeatedTarget.position },
    launchFacingDirection: facingDirection,
    speed: attackDef.projectileSpeed ?? 1,
    damage: attackDef.power,
    looseEndFollowUp: true,
    target: { ...followUpTarget.position },
    facingDirection,
  });
}
