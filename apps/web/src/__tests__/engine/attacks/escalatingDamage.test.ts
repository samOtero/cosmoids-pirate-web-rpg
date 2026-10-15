import { afterEach, describe, expect, it, vi } from 'vitest';

import { ProjectileBehavior } from '@/engine/tower-defense/attacks/behaviors';
import { ATTACK_FIXTURES, installAttackFixtures } from './fixtures';
import { EffectProcessor } from '@/engine/tower-defense/attacks/EffectProcessor';
import { updateFireClawHeat } from '@/engine/tower-defense/attacks/fireClaw';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';

installAttackFixtures();

const engines: TowerDefenseEngine[] = [];
const move = ATTACK_FIXTURES.FIRE_CLAW;

afterEach(() => {
  engines.splice(0).forEach((engine) => engine.destroy());
  vi.restoreAllMocks();
});

function battle() {
  vi.spyOn(Math, 'random').mockReturnValue(0.99);
  const creature = {
    id: 'fueguana',
    speciesId: 'starter_iguana',
    level: 16,
    xp: 0,
    equippedAttacks: ['FIRE_CLAW'],
    gender: 'female' as const,
    isShiny: false,
  };
  const engine = new TowerDefenseEngine(
    {
      paths: [
        [
          { x: 0, y: 50 },
          { x: 100, y: 50 },
        ],
      ],
      placementSpots: [],
      waves: [],
    },
    [creature]
  );
  engines.push(engine);
  engine.placeTower(creature.id, 40, 50);
  const tower = engine.towers[0];
  tower.currentAttack = 50;
  tower.currentSpecialAttack = 5;
  tower.equippedAttacksRuntime[0].lastFiredTime = 1e12;
  const target = engine.spawnPreviewEnemy({
    id: 'target',
    creatureId: 'mouse_1',
    level: 16,
    position: { x: 45, y: 50 },
  })!;
  target.hp = target.maxHp = 5000;
  target.currentDefense = 40;
  target.currentSpecialDefense = 200;
  target.speed = 0;
  return { engine, tower, target };
}

describe('Escalating damage and decay', () => {
  it('warms across targets, caps at three stacks, and applies Heat to later hits', () => {
    const { engine, tower, target } = battle();
    const secondTarget = engine.spawnPreviewEnemy({
      id: 'second_target',
      creatureId: 'mouse_1',
      level: 16,
      position: { x: 46, y: 50 },
    })!;
    secondTarget.hp = secondTarget.maxHp = 5000;
    secondTarget.currentDefense = 40;
    const damages: number[] = [];

    for (const currentTarget of [
      target,
      secondTarget,
      target,
      secondTarget,
      target,
    ]) {
      const hp = currentTarget.hp;
      EffectProcessor.applyDamageAndEffects(engine, tower, currentTarget, move);
      damages.push(hp - currentTarget.hp);
    }

    expect(damages).toEqual([9, 10, 12, 14, 14]);
    expect(tower.fireClawHeat?.stacks).toBe(3);
    expect(target.damagedByTowerIds).toContain(tower.id);
    expect(secondTarget.damagedByTowerIds).toContain(tower.id);
  });

  it('shows the launch Heat on its dash projectile', () => {
    const { engine, tower } = battle();
    tower.fireClawHeat = { stacks: 2, nextDecayAtMs: 3000 };
    ProjectileBehavior.execute(engine, tower, move);
    expect(engine.projectiles.at(-1)?.fireClawHeatStacks).toBe(2);
  });

  it('waits three seconds, then cools one stack every two seconds', () => {
    const { tower } = battle();
    tower.fireClawHeat = { stacks: 3, nextDecayAtMs: 3000 };

    updateFireClawHeat(tower, move, 2999);
    expect(tower.fireClawHeat?.stacks).toBe(3);
    updateFireClawHeat(tower, move, 3000);
    expect(tower.fireClawHeat?.stacks).toBe(2);
    updateFireClawHeat(tower, move, 4999);
    expect(tower.fireClawHeat?.stacks).toBe(2);
    updateFireClawHeat(tower, move, 5000);
    expect(tower.fireClawHeat?.stacks).toBe(1);
    updateFireClawHeat(tower, move, 7000);
    expect(tower.fireClawHeat).toBeUndefined();
  });

  it('loses all Heat when Fueguana moves to another spot', () => {
    const { engine, tower } = battle();
    tower.fireClawHeat = { stacks: 3, nextDecayAtMs: 3000 };
    expect(engine.placeTower(tower.creature.id, 60, 50)).toBe(true);
    expect(tower.fireClawHeat).toBeUndefined();
  });
});
