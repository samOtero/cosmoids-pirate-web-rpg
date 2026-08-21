import { BaseTDUnit } from './types';

export function getActiveSpeedMultiplier(
  unit: BaseTDUnit,
  currentTimeMs: number
): number {
  const persistentBoost = Math.max(1, unit.persistentSpeedBoostMultiplier ?? 1);
  if ((unit.speedBoostUntilMs ?? 0) > currentTimeMs) {
    return persistentBoost * Math.max(1, unit.speedBoostMultiplier ?? 1);
  }

  return (
    persistentBoost * Math.min(1, Math.max(0.01, unit.speedSlowMultiplier ?? 1))
  );
}

/** Adds percentage points to a unit-owned speed multiplier and returns it. */
export function applyStackingPersistentSpeedBoost(
  unit: BaseTDUnit,
  increase: number,
  maxMultiplier: number
): number {
  const previousMultiplier = Math.max(
    1,
    unit.persistentSpeedBoostMultiplier ?? 1
  );
  unit.persistentSpeedBoostMultiplier = Math.min(
    Math.max(1, maxMultiplier),
    previousMultiplier + Math.max(0, increase)
  );
  return unit.persistentSpeedBoostMultiplier;
}

export function hasActiveSpeedBoost(
  unit: BaseTDUnit,
  currentTimeMs: number
): boolean {
  return getActiveSpeedMultiplier(unit, currentTimeMs) > 1;
}

export function hasActiveSpeedSlow(
  unit: BaseTDUnit,
  currentTimeMs: number
): boolean {
  return getActiveSpeedMultiplier(unit, currentTimeMs) < 1;
}

/**
 * Applies a movement penalty with no timer. Repeated slows keep the stronger
 * penalty, while an active timed boost prevents the slow from landing. Unit-
 * owned stacking boosts remain independently counterable by slows.
 */
export function applyPersistentSpeedSlow(
  unit: BaseTDUnit,
  multiplier: number,
  currentTimeMs: number
): boolean {
  const hasActiveTimedBoost =
    (unit.speedBoostUntilMs ?? 0) > currentTimeMs &&
    (unit.speedBoostMultiplier ?? 1) > 1;
  if (hasActiveTimedBoost) return false;

  const nextMultiplier = Math.min(1, Math.max(0.01, multiplier));
  const previousMultiplier = unit.speedSlowMultiplier ?? 1;
  unit.speedSlowMultiplier = Math.min(previousMultiplier, nextMultiplier);
  return unit.speedSlowMultiplier !== previousMultiplier;
}

/**
 * Applies or refreshes a unit-level movement boost. Any ability or attack can
 * use this helper and automatically receive the shared battlefield indicator.
 */
export function applyTimedSpeedBoost(
  unit: BaseTDUnit,
  multiplier: number,
  durationMs: number,
  currentTimeMs: number
) {
  const hasActiveBoost = hasActiveSpeedBoost(unit, currentTimeMs);
  // A positive speed effect clears persistent movement penalties such as
  // String Shot. The slow does not return when this timed boost expires.
  unit.speedSlowMultiplier = undefined;
  unit.speedBoostMultiplier = hasActiveBoost
    ? Math.max(unit.speedBoostMultiplier ?? 1, multiplier)
    : Math.max(1, multiplier);
  unit.speedBoostUntilMs = hasActiveBoost
    ? Math.max(unit.speedBoostUntilMs ?? 0, currentTimeMs + durationMs)
    : currentTimeMs + durationMs;
}
