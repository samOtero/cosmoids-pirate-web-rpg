import type { Tower } from './types';

export function getAttackSpeedMultiplier(
  tower: Tower,
  currentTimeMs: number
): number {
  const buff = tower.attackSpeedBuff;
  return buff && buff.expiresAtMs > currentTimeMs
    ? Math.max(1, buff.multiplier)
    : 1;
}

/** Refresh a recipient-owned buff; repeated howls never multiply its strength. */
export function applyAttackSpeedBuff(
  tower: Tower,
  multiplier: number,
  durationMs: number,
  currentTimeMs: number
) {
  const previous = tower.attackSpeedBuff;
  const active = previous && previous.expiresAtMs > currentTimeMs;
  tower.attackSpeedBuff = {
    multiplier: Math.max(1, multiplier, active ? previous.multiplier : 1),
    appliedAtMs: currentTimeMs,
    expiresAtMs: Math.max(
      currentTimeMs + durationMs,
      active ? previous.expiresAtMs : 0
    ),
  };
}
