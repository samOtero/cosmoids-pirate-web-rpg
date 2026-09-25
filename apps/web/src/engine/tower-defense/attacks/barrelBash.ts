import type { TowerDefenseEngine } from '../TowerDefenseEngine';
import type { Enemy } from '../types';
import type { AttackDefinition } from './types';

/**
 * Barrel Bash damages only its primary target. Its impact repositions nearby
 * creatures along their own paths so intersecting lanes behave naturally.
 */
export function pushBarrelBashSecondaryTargets(
  engine: TowerDefenseEngine,
  primaryTarget: Enemy,
  attackDef: AttackDefinition
): void {
  const push = attackDef.secondaryImpactPush;
  if (!push) return;

  for (const enemy of engine.enemies) {
    if (
      enemy.id === primaryTarget.id ||
      enemy.kind === 'structure' ||
      !engine.isEnemyTargetable(enemy) ||
      !engine.isPositionInAttackRange(
        primaryTarget.position,
        enemy.position,
        push.radiusIndex
      )
    ) {
      continue;
    }

    engine.pushEnemyAgainstMovement(enemy, push.distance);
  }
}
