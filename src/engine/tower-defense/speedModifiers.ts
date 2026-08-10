import { BaseTDUnit } from './types';

export function getActiveSpeedMultiplier(
  unit: BaseTDUnit,
  currentTimeMs: number
): number {
  if ((unit.speedBoostUntilMs ?? 0) <= currentTimeMs) return 1;
  return Math.max(1, unit.speedBoostMultiplier ?? 1);
}

export function hasActiveSpeedBoost(
  unit: BaseTDUnit,
  currentTimeMs: number
): boolean {
  return getActiveSpeedMultiplier(unit, currentTimeMs) > 1;
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
  unit.speedBoostMultiplier = hasActiveBoost
    ? Math.max(unit.speedBoostMultiplier ?? 1, multiplier)
    : Math.max(1, multiplier);
  unit.speedBoostUntilMs = hasActiveBoost
    ? Math.max(unit.speedBoostUntilMs ?? 0, currentTimeMs + durationMs)
    : currentTimeMs + durationMs;
}
