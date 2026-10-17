import type { AttackDefinition, AttackInstance } from './types';
import type { Tower } from '../types';
import { getAttackSpeedMultiplier } from '../attackSpeedModifiers';

export function usesAttackSimulationCooldown(
  attack: AttackDefinition
): boolean {
  return [
    'SUPPORT_AURA',
    'WARMTH_SUPPORT',
    'REPAIR_SUPPORT',
    'CONSTRICTION',
    'SHARED_SLUMBER',
    'RIGGING_NEST',
  ].includes(attack.behaviorType);
}

export function getAttackIntervalMs(
  attack: AttackDefinition,
  tower: Tower,
  elapsedTimeMs: number
): number {
  return usesAttackSimulationCooldown(attack)
    ? attack.cooldownMs
    : attack.cooldownMs / getAttackSpeedMultiplier(tower, elapsedTimeMs);
}

/** Reads cooldowns without consuming a move, changing targets or resetting timers. */
export function getAttackRemainingMs(
  attack: AttackDefinition,
  instance: AttackInstance | undefined,
  tower: Tower,
  elapsedTimeMs: number,
  frameTimeMs: number
): number {
  if (!instance) return 0;
  return Math.max(
    0,
    usesAttackSimulationCooldown(attack)
      ? (instance.readyAtMs ?? 0) - elapsedTimeMs
      : getAttackIntervalMs(attack, tower, elapsedTimeMs) -
          (frameTimeMs - instance.lastFiredTime)
  );
}
