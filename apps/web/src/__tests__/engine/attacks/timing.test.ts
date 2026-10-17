import { describe, expect, it } from 'vitest';
import { makeAttack, makeBattle } from './helpers';
import {
  getAttackIntervalMs,
  getAttackRemainingMs,
} from '@/engine/tower-defense/attacks/timing';

describe('move timing inspection', () => {
  it('reads the combat clock and current modifiers without resetting cooldowns', () => {
    const attack = makeAttack({ cooldownMs: 1800 });
    const { source } = makeBattle(attack);
    source.attackSpeedBuff = {
      multiplier: 1.5,
      appliedAtMs: 0,
      expiresAtMs: 9000,
    };
    source.paralysis = {
      attackSpeedMultiplier: 0.8,
      appliedAtMs: 0,
      expiresAtMs: 9000,
    };
    const runtime = { definitionId: attack.id, lastFiredTime: 5000 };
    expect(getAttackIntervalMs(attack, source, 1000)).toBeCloseTo(1500);
    expect(
      getAttackRemainingMs(attack, runtime, source, 1000, 5500)
    ).toBeCloseTo(1000);
    expect(runtime.lastFiredTime).toBe(5000);
    expect(getAttackIntervalMs(attack, source, 10000)).toBe(1800);
  });
  it('reads stored simulation deadlines for support moves regardless of speed buffs', () => {
    const attack = makeAttack({
      cooldownMs: 7000,
      behaviorType: 'SUPPORT_AURA',
    });
    const { source } = makeBattle(attack);
    source.attackSpeedBuff = {
      multiplier: 2,
      appliedAtMs: 0,
      expiresAtMs: 9000,
    };
    const runtime = {
      definitionId: attack.id,
      lastFiredTime: 0,
      readyAtMs: 8000,
    };
    expect(getAttackIntervalMs(attack, source, 2000)).toBe(7000);
    expect(getAttackRemainingMs(attack, runtime, source, 2000, 100000)).toBe(
      6000
    );
    expect(getAttackRemainingMs(attack, runtime, source, 8000, 100000)).toBe(0);
    expect(runtime.readyAtMs).toBe(8000);
  });
});
