import { describe, expect, it } from 'vitest';

import {
  applyPersistentSpeedSlow,
  applyStackingPersistentSpeedBoost,
  applyTimedSpeedBoost,
  getActiveSpeedMultiplier,
  hasActiveSpeedBoost,
  hasActiveSpeedSlow,
} from '@/engine/tower-defense/speedModifiers';
import { BaseTDUnit } from '@/engine/tower-defense/types';

const createUnit = (): BaseTDUnit => ({
  id: 'unit',
  position: { x: 0, y: 0 },
  facingDirection: 'right',
  hp: 10,
  maxHp: 10,
});

describe('shared speed modifiers', () => {
  it('exposes active boosts to movement logic and the generic indicator', () => {
    const unit = createUnit();

    applyTimedSpeedBoost(unit, 1.6, 4000, 1000);

    expect(getActiveSpeedMultiplier(unit, 4999)).toBe(1.6);
    expect(hasActiveSpeedBoost(unit, 4999)).toBe(true);
    expect(getActiveSpeedMultiplier(unit, 5000)).toBe(1);
    expect(hasActiveSpeedBoost(unit, 5000)).toBe(false);
  });

  it('can replace an expired boost and safely combine overlapping boosts', () => {
    const unit = createUnit();

    applyTimedSpeedBoost(unit, 2, 1000, 0);
    applyTimedSpeedBoost(unit, 1.5, 3000, 1000);
    expect(getActiveSpeedMultiplier(unit, 2000)).toBe(1.5);

    applyTimedSpeedBoost(unit, 1.8, 2000, 2000);
    applyTimedSpeedBoost(unit, 1.4, 4000, 2000);
    expect(getActiveSpeedMultiplier(unit, 3999)).toBe(1.8);
    expect(getActiveSpeedMultiplier(unit, 6000)).toBe(1);
  });

  it('keeps slows indefinitely until a speed boost clears them', () => {
    const unit = createUnit();

    expect(applyPersistentSpeedSlow(unit, 2 / 3, 1000)).toBe(true);
    expect(getActiveSpeedMultiplier(unit, 1_000_000)).toBeCloseTo(2 / 3);
    expect(hasActiveSpeedSlow(unit, 1_000_000)).toBe(true);

    applyTimedSpeedBoost(unit, 1.6, 4000, 1_000_000);

    expect(unit.speedSlowMultiplier).toBeUndefined();
    expect(getActiveSpeedMultiplier(unit, 1_003_999)).toBe(1.6);
    expect(getActiveSpeedMultiplier(unit, 1_004_000)).toBe(1);
    expect(hasActiveSpeedSlow(unit, 1_004_000)).toBe(false);
  });

  it('does not apply a slow while a speed boost is active', () => {
    const unit = createUnit();

    applyTimedSpeedBoost(unit, 1.6, 4000, 1000);

    expect(applyPersistentSpeedSlow(unit, 2 / 3, 2000)).toBe(false);
    expect(unit.speedSlowMultiplier).toBeUndefined();
  });

  it('stacks an untimed unit-owned boost without exceeding its cap', () => {
    const unit = createUnit();

    expect(applyStackingPersistentSpeedBoost(unit, 0.05, 5)).toBe(1.05);
    expect(unit.persistentSpeedBoostStackCount).toBe(1);
    expect(applyStackingPersistentSpeedBoost(unit, 0.05, 5)).toBe(1.1);
    expect(unit.persistentSpeedBoostStackCount).toBe(2);
    unit.persistentSpeedBoostMultiplier = 4.98;
    expect(applyStackingPersistentSpeedBoost(unit, 0.05, 5)).toBe(5);
    expect(unit.persistentSpeedBoostStackCount).toBe(3);
    expect(applyStackingPersistentSpeedBoost(unit, 0.05, 5)).toBe(5);
    expect(unit.persistentSpeedBoostStackCount).toBe(3);
    expect(getActiveSpeedMultiplier(unit, 1_000_000)).toBe(5);

    expect(applyPersistentSpeedSlow(unit, 0.5, 1_000_000)).toBe(true);
    expect(getActiveSpeedMultiplier(unit, 1_000_000)).toBe(2.5);
  });
});
