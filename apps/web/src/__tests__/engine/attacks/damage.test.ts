import { describe, expect, it } from 'vitest';
import {
  ProjectileBehavior,
  InstantMeleeBehavior,
} from '@/engine/tower-defense/attacks/behaviors';
import { ElementType } from '@/types/baseGame';
import { makeAttack, makeBattle } from './helpers';

describe('Shared damage categories', () => {
  it.each(['physical', 'special'] as const)(
    '%s damage uses its own attack and defense stats',
    (category) => {
      const damageWith = (
        attack: number,
        specialAttack: number,
        defense: number,
        specialDefense: number
      ) => {
        const move = makeAttack({ category });
        const { engine, source, target } = makeBattle(
          move,
          {
            currentAttack: attack,
            currentSpecialAttack: specialAttack,
          },
          { currentDefense: defense, currentSpecialDefense: specialDefense }
        );
        ProjectileBehavior.execute(engine, source, move);
        engine.tick(1000, 1000);
        return target.maxHp - target.hp;
      };
      const baseline = damageWith(60, 60, 40, 40);
      expect(baseline).toBeGreaterThan(0);
      if (category === 'special') {
        expect(damageWith(600, 60, 400, 40)).toBe(baseline);
        expect(damageWith(60, 120, 40, 40)).toBeGreaterThan(baseline);
        expect(damageWith(60, 60, 40, 80)).toBeLessThan(baseline);
      } else {
        expect(damageWith(60, 600, 40, 400)).toBe(baseline);
        expect(damageWith(120, 60, 40, 40)).toBeGreaterThan(baseline);
        expect(damageWith(60, 60, 80, 40)).toBeLessThan(baseline);
      }
    }
  );

  it('increasing configured power increases damage', () => {
    const resolve = (power: number) => {
      const { engine, source, target, attack } = makeBattle(
        makeAttack({ power })
      );
      ProjectileBehavior.execute(engine, source, attack);
      engine.tick(1000, 1000);
      return target.maxHp - target.hp;
    };
    expect(resolve(80)).toBeGreaterThan(resolve(40));
  });

  it('an invulnerable target receives hit feedback without losing HP', () => {
    const { engine, source, target, attack } = makeBattle(
      makeAttack(),
      {},
      { isInvulnerable: true }
    );
    ProjectileBehavior.execute(engine, source, attack);
    engine.tick(200, 200);
    expect(target.hp).toBe(target.maxHp);
    expect(engine.floatingTexts.length).toBeGreaterThan(0);
    expect(target.damageFlashTimerMs).toBeGreaterThan(0);
  });

  it('a type-immune defender receives no damage', () => {
    const { engine, source, target, attack } = makeBattle(
      makeAttack({ type: ElementType.PSYCHIC }),
      {},
      { elementTypes: [ElementType.DARK] }
    );
    ProjectileBehavior.execute(engine, source, attack);
    engine.tick(1000, 1000);
    expect(target.hp).toBe(target.maxHp);
  });

  it('melee resolves immediately without creating a projectile or repeating damage on later ticks', () => {
    const attack = makeAttack({
      behaviorType: 'INSTANT_MELEE',
      category: 'physical',
    });
    const { engine, source, target } = makeBattle(attack);
    InstantMeleeBehavior.execute(engine, source, attack);
    expect(target.hp).toBeLessThan(target.maxHp);
    expect(engine.projectiles).toHaveLength(0);
    const hpAfterHit = target.hp;
    engine.tick(1000, 1000);
    expect(target.hp).toBe(hpAfterHit);
  });
});
