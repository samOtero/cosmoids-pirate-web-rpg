import { describe, expect, it } from 'vitest';
import { EffectProcessor } from '@/engine/tower-defense/attacks/EffectProcessor';
import { ElementType } from '@/types/baseGame';
import { battleSpecies } from '../behaviorFixtures';
import { makeAttack, makeBattle } from './helpers';

function damage(
  attackType: ElementType,
  defenders: ElementType[],
  attackerTypes: ElementType[] = [ElementType.NORMAL]
) {
  const attacker = battleSpecies('test_affinity', {
    type: attackerTypes[0],
    secondaryType: attackerTypes[1],
  });
  const { engine, source, target, attack } = makeBattle(
    makeAttack({ type: attackType }),
    {},
    { elementTypes: defenders }
  );
  source.creature.speciesId = attacker.id;
  EffectProcessor.applyDamageAndEffects(engine, source, target, attack);
  return target.maxHp - target.hp;
}

describe('elemental damage mechanics', () => {
  // Matchup relationships are deliberate mechanic expectations; no species
  // typing, move power, or exact damage total is copied from authored content.
  it.each([
    [
      ElementType.PSYCHIC,
      ElementType.POISON,
      ElementType.NORMAL,
      ElementType.STEEL,
    ],
    [
      ElementType.FIGHTING,
      ElementType.ROCK,
      ElementType.WATER,
      ElementType.PSYCHIC,
    ],
    [
      ElementType.GROUND,
      ElementType.STEEL,
      ElementType.NORMAL,
      ElementType.GRASS,
    ],
    [
      ElementType.WATER,
      ElementType.ROCK,
      ElementType.NORMAL,
      ElementType.GRASS,
    ],
    [ElementType.FIRE, ElementType.GRASS, ElementType.NORMAL, ElementType.ROCK],
    [ElementType.ROCK, ElementType.FIRE, ElementType.NORMAL, ElementType.STEEL],
  ])(
    '%s attacks distinguish weakness, neutrality, and resistance',
    (attack, weak, neutral, resistant) => {
      const baseline = damage(attack, [neutral]);
      expect(baseline).toBeGreaterThan(0);
      expect(damage(attack, [weak])).toBeGreaterThan(baseline);
      expect(damage(attack, [resistant])).toBeLessThan(baseline);
    }
  );

  it.each([
    [ElementType.PSYCHIC, ElementType.DARK, ElementType.POISON],
    [ElementType.ELECTRIC, ElementType.GROUND, ElementType.WATER],
    [ElementType.GROUND, ElementType.FLYING, ElementType.POISON],
    [ElementType.POISON, ElementType.STEEL, ElementType.NORMAL],
  ])(
    '%s immunity takes priority over the other defender type',
    (attack, immune, other) => {
      expect(damage(attack, [immune])).toBe(0);
      expect(damage(attack, [other, immune])).toBe(0);
    }
  );

  it('combines both defensive types independently of their order', () => {
    const singleWeakness = damage(ElementType.WATER, [ElementType.ROCK]);
    expect(
      damage(ElementType.WATER, [ElementType.ROCK, ElementType.GROUND])
    ).toBeGreaterThan(singleWeakness);
    const canceled = damage(ElementType.WATER, [
      ElementType.ROCK,
      ElementType.GRASS,
    ]);
    expect(canceled).toBe(damage(ElementType.WATER, [ElementType.NORMAL]));
    expect(canceled).toBe(
      damage(ElementType.WATER, [ElementType.GRASS, ElementType.ROCK])
    );
  });

  it('grants affinity for either attacker type once', () => {
    const neutral = damage(ElementType.POISON, [ElementType.NORMAL]);
    const primary = damage(
      ElementType.POISON,
      [ElementType.NORMAL],
      [ElementType.POISON]
    );
    const secondary = damage(
      ElementType.POISON,
      [ElementType.NORMAL],
      [ElementType.WATER, ElementType.POISON]
    );
    expect(primary).toBeGreaterThan(neutral);
    expect(secondary).toBe(primary);
    expect(
      damage(
        ElementType.POISON,
        [ElementType.NORMAL],
        [ElementType.POISON, ElementType.POISON]
      )
    ).toBe(primary);
  });

  it.each(Object.values(ElementType))(
    'resolves %s against every registered elemental type without invalid damage',
    (attackType) => {
      for (const defender of Object.values(ElementType)) {
        const dealt = damage(attackType, [defender]);
        expect(
          Number.isFinite(dealt),
          `${attackType} against ${defender}`
        ).toBe(true);
        expect(dealt).toBeGreaterThanOrEqual(0);
      }
    }
  );
});
