import type { Tower } from './types';

export function getAttackSpeedMultiplier(
  tower: Tower,
  currentTimeMs: number
): number {
  const buff = tower.attackSpeedBuff;
  const boost =
    buff && buff.expiresAtMs > currentTimeMs
      ? Math.max(1, buff.multiplier)
      : 1;
  const paralysis = tower.paralysis;
  return boost *
    (paralysis && paralysis.expiresAtMs > currentTimeMs
      ? paralysis.attackSpeedMultiplier
      : 1);
}

/** Refreshes the timed effect without stacking its attack-rate penalty. */
export function applyTowerParalysis(
  tower: Tower,
  attackSpeedMultiplier: number,
  durationMs: number,
  currentTimeMs: number
) {
  tower.paralysis = {
    attackSpeedMultiplier: Math.min(1, Math.max(0.01, attackSpeedMultiplier)),
    appliedAtMs: currentTimeMs,
    expiresAtMs: currentTimeMs + durationMs,
  };
}

/** Amount of this simulation step spent under paralysis. */
export function getParalyzedStepMs(
  tower: Tower,
  stepStartMs: number,
  stepEndMs: number
): number {
  const paralysis = tower.paralysis;
  if (!paralysis) return 0;
  return Math.max(
    0,
    Math.min(stepEndMs, paralysis.expiresAtMs) -
      Math.max(stepStartMs, paralysis.appliedAtMs)
  );
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
