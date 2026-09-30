import type { Enemy, PoisonId, StatusCondition } from './types';

export const TOXIC_POLLEN_POISON_ID: PoisonId = 'TOXIC_POLLEN';
export const VENOM_SPRAY_POISON_ID: PoisonId = 'VENOM_SPRAY';

export function getActivePoisons(enemy: Enemy): StatusCondition[] {
  return enemy.statusConditions.filter((status) => status.type === 'POISON');
}

export function hasAnyPoison(enemy: Enemy): boolean {
  return getActivePoisons(enemy).length > 0;
}

export function findPoison(
  enemy: Enemy,
  poisonId: PoisonId
): StatusCondition | undefined {
  return enemy.statusConditions.find(
    (status) => status.type === 'POISON' && status.poisonId === poisonId
  );
}

/**
 * Advances an authored poison schedule and returns every damage pulse due this
 * frame. Legacy poisons without an absolute schedule continue through the
 * engine's older duration/lastTickTime path.
 */
export function consumeScheduledPoisonTicks(
  status: StatusCondition,
  elapsedTimeMs: number
): number[] {
  if (
    status.type !== 'POISON' ||
    status.nextTickAtMs === undefined ||
    status.expiresAtMs === undefined ||
    status.tickIntervalMs === undefined
  ) {
    return [];
  }

  const damagePulses: number[] = [];
  while (
    status.nextTickAtMs <= elapsedTimeMs &&
    status.nextTickAtMs <= status.expiresAtMs &&
    (status.ticksRemaining === undefined || status.ticksRemaining > 0)
  ) {
    let damage = status.tickDamage ?? 0;
    if (
      status.remainingDamage !== undefined &&
      status.ticksRemaining !== undefined
    ) {
      damage = Math.ceil(status.remainingDamage / status.ticksRemaining);
      status.remainingDamage = Math.max(0, status.remainingDamage - damage);
      status.ticksRemaining -= 1;
    }

    if (damage > 0) damagePulses.push(damage);
    status.nextTickAtMs += status.tickIntervalMs;
  }

  status.durationMs = Math.max(0, status.expiresAtMs - elapsedTimeMs);
  return damagePulses;
}
