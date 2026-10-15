import { describe, expect, it, vi } from 'vitest';
import {
  rollCreatureGender,
  isCreatureGenderAllowed,
  resolveEncounterGender,
} from '@/utils/creatureGender';
import { resolvePlayerCreature } from '@/utils/resolvePlayerCreature';
import { COSMOID_TEMPLATES } from '@/constants/creatures';
import type { PlayerCreature } from '@/types/baseGame';

describe('creature gender rules', () => {
  it.each([0.25, 0.5, 0.75])(
    'uses the female probability boundary %s',
    (female) => {
      expect(rollCreatureGender({ female }, () => female - 0.001)).toBe(
        'female'
      );
      expect(rollCreatureGender({ female }, () => female)).toBe('male');
    }
  );

  it('does not consume randomness for genderless or single-gender rules', () => {
    const random = vi.fn();
    expect(rollCreatureGender('genderless', random)).toBe('genderless');
    expect(rollCreatureGender({ female: 0 }, random)).toBe('male');
    expect(rollCreatureGender({ female: 1 }, random)).toBe('female');
    expect(random).not.toHaveBeenCalled();
  });

  it.each([-1, 2, NaN, Infinity])(
    'rejects invalid probabilities: %s',
    (female) => {
      expect(() => rollCreatureGender({ female })).toThrow('probability');
    }
  );

  it('validates fixed encounter identities against species rules', () => {
    expect(isCreatureGenderAllowed('genderless', 'male')).toBe(false);
    expect(isCreatureGenderAllowed('genderless', 'genderless')).toBe(true);
    expect(isCreatureGenderAllowed({ female: 0.75 }, 'male')).toBe(true);
    expect(isCreatureGenderAllowed({ female: 0.75 }, 'genderless')).toBe(false);
    expect(isCreatureGenderAllowed({ female: 0 }, 'female')).toBe(false);
    expect(isCreatureGenderAllowed({ female: 1 }, 'male')).toBe(false);
    expect(isCreatureGenderAllowed({ female: 0.5 }, 'invalid')).toBe(false);
  });

  it('copies saved identity on repeated resolution without random assignment', () => {
    const template = Object.values(COSMOID_TEMPLATES).find(
      (t) => t.genderRatio !== 'genderless'
    )!;
    const pc: PlayerCreature = {
      id: 'saved-individual',
      speciesId: template.id,
      gender: 'female',
      level: 3,
      xp: 1,
      equippedAttacks: [],
      isShiny: false,
    };
    const random = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Resolution must not reroll identity');
    });
    try {
      expect(resolvePlayerCreature(pc).gender).toBe(pc.gender);
      expect(resolvePlayerCreature(JSON.parse(JSON.stringify(pc))).gender).toBe(
        pc.gender
      );
      expect(resolveEncounterGender(template.id, 'male')).toBe('male');
    } finally {
      random.mockRestore();
    }
  });
});
