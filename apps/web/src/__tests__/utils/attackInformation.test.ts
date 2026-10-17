import { describe, expect, it } from 'vitest';
import { makeAttack } from '../engine/attacks/helpers';
import {
  compareAttacks,
  getAttackInformation,
} from '@/utils/attackInformation';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';

describe('attack information', () => {
  it('presents support benefits without claiming zero-power damage', () => {
    const info = getAttackInformation(
      makeAttack({
        power: 0,
        behaviorType: 'SUPPORT_AURA',
        supportBuff: {
          global: true,
          attackSpeedMultiplier: 1.35,
          durationMs: 7500,
        },
      })
    );
    expect(info.power).toBeUndefined();
    expect(info.category).toBe('Support');
    expect(info.reach).toBe('Whole battlefield');
    expect(info.effects.join(' ')).toContain('35% for 7.5s');
  });
  it('distinguishes poison-only power from a direct hit', () => {
    const info = getAttackInformation(
      makeAttack({
        power: 0,
        behaviorType: 'POISON_AOE',
        effects: [
          {
            type: 'POISON',
            chance: 1,
            totalPower: 72,
            durationMs: 9000,
            tickCount: 6,
          },
        ],
      })
    );
    expect(info.power).toEqual({ label: 'Poison power', value: 72 });
    expect(info.hasDamage).toBe(true);
    expect(info.effects.join(' ')).toContain('9s across 6 pulses');
  });
  it('shows effect chance, strength, duration and stacking from controlled inputs', () => {
    const info = getAttackInformation(
      makeAttack({
        effects: [
          { type: 'STUN', chance: 0.4, value: 1250 },
          {
            type: 'STACKING_POISON',
            chance: 0.6,
            maxStacks: 7,
            durationMs: 8500,
            damagePerTickRatio: 0.08,
          },
        ],
      })
    );
    expect(info.effects[0]).toBe('40% chance: stuns the target for 1.25s.');
    expect(info.effects[1]).toContain('60% chance');
    expect(info.effects[1]).toContain('8.5s, up to 7 stacks');
    expect(info.effects[1]).toContain('8% of its triggering hit');
  });
  it('labels pulse and summon power and exposes hold limitations', () => {
    const hold = getAttackInformation(
      makeAttack({
        constriction: {
          durationMs: 5500,
          pulseIntervalMs: 1100,
          resistanceMs: 8000,
        },
      })
    );
    expect(hold.power?.label).toBe('Power per pulse');
    expect(hold.effects.join(' ')).toContain(
      'user cannot attack during the hold'
    );
    expect(hold.effects.join(' ')).toContain('resists holds for 8s');
  });
  it('does not mistake decorative stream projectiles for multiple damaging hits', () => {
    const attack = makeAttack({
      projectilePattern: {
        count: 7,
        spacing: 2,
        scales: [1],
        damageMode: 'FIRST_ONLY',
      },
    });
    expect(getAttackInformation(attack).effects.join(' ')).not.toContain('7');
  });
  it('compares tradeoffs without scoring support as an inferior attack', () => {
    const previous = makeAttack({ power: 95, cooldownMs: 850, rangeIndex: 25 });
    const next = makeAttack({
      power: 0,
      cooldownMs: 4000,
      behaviorType: 'SUPPORT_AURA',
      supportBuff: {
        attackSpeedMultiplier: 1.1,
        durationMs: 2000,
        global: true,
      },
    });
    const comparison = compareAttacks(previous, next).join(' ');
    expect(comparison).toContain('Whole battlefield');
    expect(comparison).toContain('0.85s → 4s');
    expect(comparison).not.toContain('95 → 0');
  });
  it('provides usable information for every registered move without freezing authored values', () => {
    for (const attack of Object.values(ATTACK_DEFS)) {
      const info = getAttackInformation(attack);
      expect(info.summary.trim().length, attack.name).toBeGreaterThan(0);
      expect(info.targeting.trim().length, attack.name).toBeGreaterThan(0);
      expect(info.reach.length, attack.name).toBeGreaterThan(0);
      expect(
        info.effects.every((effect) => !/NaN|undefined|Infinity/.test(effect)),
        attack.name
      ).toBe(true);
    }
  });
});
