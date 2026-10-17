import { SpeciesId } from '@/types/definitionIds';
import { ElementType } from '@/types/baseGame';
import type { AttackDefinition } from './attacks/types';
import type { Tower, TowerWarmthState } from './types';

export const WARMTH_MAX = 100;
export const WARMTH_PASSIVE_INTERVAL_MS = 1000;
export const WARMTH_PASSIVE_GAIN = 10;
export const WARMTH_WATER_DAMAGE_MULTIPLIER = 1.4;
export const WARMTH_DRAIN_PER_WATER_ACTIVATION = 10;

const WARMTH_FAMILY_IDS = new Set<SpeciesId>([
  SpeciesId.AGUANA,
  SpeciesId.NAUTIGUAN,
]);

export function isWarmthFamilyTower(tower: Tower): boolean {
  return WARMTH_FAMILY_IDS.has(tower.creature.speciesId);
}

export function createWarmthState(): TowerWarmthState {
  return { value: 0, sunSoaked: false, nonWaterActiveMs: 0 };
}

export function ensureWarmthState(tower: Tower): TowerWarmthState | undefined {
  if (!isWarmthFamilyTower(tower)) return undefined;
  tower.warmth ??= createWarmthState();
  return tower.warmth;
}

export function updatePassiveWarmth(
  tower: Tower,
  selectedAttack: AttackDefinition | undefined,
  deltaMs: number
): void {
  const warmth = ensureWarmthState(tower);
  if (
    !warmth ||
    tower.hp <= 0 ||
    !selectedAttack ||
    selectedAttack.type === ElementType.WATER
  ) {
    if (warmth) warmth.nonWaterActiveMs = 0;
    return;
  }

  if (deltaMs <= 0 || warmth.value >= WARMTH_MAX) return;

  warmth.nonWaterActiveMs += deltaMs;
  const passiveTicks = Math.floor(
    warmth.nonWaterActiveMs / WARMTH_PASSIVE_INTERVAL_MS
  );
  if (passiveTicks <= 0) return;

  warmth.nonWaterActiveMs -= passiveTicks * WARMTH_PASSIVE_INTERVAL_MS;
  warmth.value = Math.min(
    WARMTH_MAX,
    warmth.value + passiveTicks * WARMTH_PASSIVE_GAIN
  );
}

export function getWarmthWaterDamageMultiplier(
  tower: Tower,
  attack: AttackDefinition
): number {
  if (attack.type !== ElementType.WATER || !isWarmthFamilyTower(tower)) {
    return 1;
  }
  return (tower.warmth?.value ?? 0) > 0 ? WARMTH_WATER_DAMAGE_MULTIPLIER : 1;
}

export interface SunbatheResult {
  warmthGained: number;
  grantedSunSoaked: boolean;
}

export function canSunbathe(tower: Tower): boolean {
  const warmth = ensureWarmthState(tower);
  return Boolean(warmth && (warmth.value < WARMTH_MAX || !warmth.sunSoaked));
}

export function applySunbathe(tower: Tower): SunbatheResult {
  const warmth = ensureWarmthState(tower);
  if (!warmth) return { warmthGained: 0, grantedSunSoaked: false };
  const previousValue = warmth.value;
  const grantedSunSoaked = !warmth.sunSoaked;
  warmth.value = WARMTH_MAX;
  warmth.sunSoaked = true;
  return {
    warmthGained: warmth.value - previousValue,
    grantedSunSoaked,
  };
}

export function consumeWaterActivationWarmth(tower: Tower): {
  consumedAmount: number;
  usedSunSoaked: boolean;
} {
  const warmth = ensureWarmthState(tower);
  if (!warmth || warmth.value <= 0) {
    return { consumedAmount: 0, usedSunSoaked: false };
  }
  if (warmth.sunSoaked) {
    warmth.sunSoaked = false;
    return { consumedAmount: 0, usedSunSoaked: true };
  }
  const previousValue = warmth.value;
  warmth.value = Math.max(0, warmth.value - WARMTH_DRAIN_PER_WATER_ACTIVATION);
  return {
    consumedAmount: previousValue - warmth.value,
    usedSunSoaked: false,
  };
}
