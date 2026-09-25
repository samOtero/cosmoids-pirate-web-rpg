import { Tower } from '../types';
import { AttackDefinition } from './types';

export function getFireClawDamageMultiplier(
  tower: Tower,
  attackDef: AttackDefinition
): number {
  const config = attackDef.fireClawHeat;
  if (!config) return 1;
  const stacks = Math.min(
    config.maxStacks,
    Math.max(0, tower.fireClawHeat?.stacks ?? 0)
  );
  return 1 + stacks * config.damageBonusPerStack;
}

export function registerSuccessfulFireClawHit(
  tower: Tower,
  attackDef: AttackDefinition,
  elapsedTimeMs: number
): void {
  const config = attackDef.fireClawHeat;
  if (!config) return;
  tower.fireClawHeat = {
    stacks: Math.min(
      config.maxStacks,
      (tower.fireClawHeat?.stacks ?? 0) + 1
    ),
    nextDecayAtMs: elapsedTimeMs + config.lullBeforeDecayMs,
  };
}

export function updateFireClawHeat(
  tower: Tower,
  attackDef: AttackDefinition,
  elapsedTimeMs: number
): void {
  const config = attackDef.fireClawHeat;
  const heat = tower.fireClawHeat;
  if (!config || !heat || heat.stacks <= 0 || elapsedTimeMs < heat.nextDecayAtMs)
    return;

  const elapsedDecayIntervals =
    Math.floor((elapsedTimeMs - heat.nextDecayAtMs) / config.decayIntervalMs) +
    1;
  heat.stacks = Math.max(0, heat.stacks - elapsedDecayIntervals);
  heat.nextDecayAtMs += elapsedDecayIntervals * config.decayIntervalMs;
  if (heat.stacks === 0) tower.fireClawHeat = undefined;
}

export function resetFireClawHeat(tower: Tower): void {
  tower.fireClawHeat = undefined;
}
