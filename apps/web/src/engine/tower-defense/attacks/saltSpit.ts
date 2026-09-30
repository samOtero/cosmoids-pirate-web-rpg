import type { TowerDefenseEngine } from '../TowerDefenseEngine';
import type { Enemy, Tower } from '../types';
import { getWarmthWaterDamageMultiplier } from '../warmth';
import type { AttackBehavior, AttackDefinition } from './types';

function facingToward(
  source: Tower,
  target: Enemy
): 'up' | 'down' | 'left' | 'right' {
  const dx = target.position.x - source.position.x;
  const dy = target.position.y - source.position.y;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

export const SaltSpitBehavior: AttackBehavior = {
  canExecute(engine, source, attackDef): boolean {
    return Boolean(
      engine.getTargetForTower(
        source,
        attackDef.rangeIndex,
        source.targetingMode ?? 'first'
      )
    );
  },

  execute(engine, source, attackDef): void {
    const warmthDamageMultiplier = getWarmthWaterDamageMultiplier(
      source,
      attackDef
    );
    const projectileCount =
      warmthDamageMultiplier > 1
        ? Math.max(1, Math.floor(attackDef.saltSpit?.warmProjectileCount ?? 3))
        : 1;
    const selectedIds = new Set<string>();
    const targets: Enemy[] = [];

    while (targets.length < projectileCount) {
      const target = engine.getTargetForTower(
        source,
        attackDef.rangeIndex,
        source.targetingMode ?? 'first',
        (enemy) => !selectedIds.has(enemy.id)
      );
      if (!target) break;
      selectedIds.add(target.id);
      targets.push(target);
    }

    if (targets.length === 0) return;
    source.facingDirection = facingToward(source, targets[0]);
    targets.forEach((target, index) => {
      const dx = target.position.x - source.position.x;
      const dy = target.position.y - source.position.y;
      const distance = Math.hypot(dx, dy);
      const perpendicularX = distance > 0 ? -dy / distance : 0;
      const perpendicularY = distance > 0 ? dx / distance : 1;
      const fanOffset = (index - (targets.length - 1) / 2) * 0.8;
      const facingDirection = facingToward(source, target);
      engine.projectiles.push({
        id: `proj_salt_spit_${source.id}_${engine.elapsedTimeMs}_${index}_${Math.random()}`,
        attackDefinitionId: attackDef.id,
        sourceId: source.id,
        targetId: target.id,
        position: {
          x: source.position.x + perpendicularX * fanOffset,
          y: source.position.y + perpendicularY * fanOffset,
        },
        origin: { ...source.position },
        launchFacingDirection: facingDirection,
        speed: attackDef.projectileSpeed ?? 1,
        damage: attackDef.power,
        warmthDamageMultiplier,
        target: { ...target.position },
        facingDirection,
      });
    });
  },
};

/** Applies the shared one-time objective disarm only after a successful stun. */
export function disarmSaltSpitTarget(
  engine: TowerDefenseEngine,
  target: Enemy,
  attackDef: AttackDefinition
): void {
  if (
    target.hp <= 0 ||
    target.immuneToStatusEffects ||
    !target.statusConditions.some((status) => status.type === 'STUN') ||
    !target.heldCaptureUnitId ||
    target.hasBeenWindDisarmed
  ) {
    return;
  }

  const droppedUnit = engine.dropCaptureUnit(target);
  if (!droppedUnit) return;

  target.hasBeenWindDisarmed = true;
  target.itemPickupBlockedUntilMs = Math.max(
    target.itemPickupBlockedUntilMs ?? 0,
    engine.elapsedTimeMs + (attackDef.itemPickupLockMs ?? 2500)
  );
  engine.floatingTexts.push({
    id: `ft_salt_drop_${target.id}_${engine.elapsedTimeMs}_${Math.random()}`,
    text: 'Dropped!',
    position: { ...target.position },
    color: 0xf4c76b,
    scale: 0.85,
    durationMs: 900,
    elapsedMs: 0,
  });
}
