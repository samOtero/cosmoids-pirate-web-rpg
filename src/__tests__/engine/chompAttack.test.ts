import { afterEach, describe, expect, it, vi } from 'vitest';

import { ProjectileBehavior } from '@/engine/tower-defense/attacks/behaviors';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';

afterEach(() => vi.restoreAllMocks());

function createBattle() {
  const engine = new TowerDefenseEngine(
    {
      paths: [
        [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
        ],
      ],
      placementSpots: [],
      waves: [],
    },
    [
      {
        id: 'knotia',
        speciesId: 'mouse_1',
        level: 14,
        xp: 0,
        equippedAttacks: ['CHOMP'],
        isShiny: false,
      },
    ]
  );
  engine.placeTower('knotia', 0, 0);
  const target = engine.spawnPreviewEnemy({
    creatureId: 'senticle',
    level: 14,
    position: { x: 10, y: 0 },
  })!;
  target.hp = target.maxHp = 500;
  // Different physical/special stats make a category regression observable.
  const tower = engine.towers[0];
  tower.currentAttack = 50;
  tower.currentSpecialAttack = 10;
  target.currentDefense = 40;
  target.currentSpecialDefense = 80;
  return { engine, tower, target };
}

describe('Chomp', () => {
  it.each([
    { roll: 0.099, stuns: true },
    { roll: 0.101, stuns: false },
  ])(
    'deals one physical Normal hit and gates stun at 10% (roll $roll)',
    ({ roll, stuns }) => {
      vi.spyOn(Math, 'random').mockReturnValue(roll);
      const { engine, tower, target } = createBattle();
      try {
        ProjectileBehavior.execute(engine, tower, ATTACK_DEFS.CHOMP);
        expect(engine.projectiles).toHaveLength(1);
        engine.tick(100, 100);
        engine.tick(200, 100);

        // 60 power, physical stats, Normal STAB, and the 86% damage roll.
        expect(target.hp).toBe(500 - 15);
        expect(engine.projectiles).toHaveLength(0);
        expect(target.statusConditions).toEqual(
          stuns ? [{ type: 'STUN', durationMs: 1000 }] : []
        );
        expect(engine.visualEffects).toContainEqual(
          expect.objectContaining({
            configId: 'attack_chomp_1',
            targetId: target.id,
            durationMs: 600,
          })
        );

        // Prevent another attack while checking the full stun lifetime.
        engine.towers = [];
        target.speed = 1;
        engine.tick(1199, 999);
        if (stuns) {
          expect(target.position.x).toBe(10);
          expect(target.statusConditions).toEqual([
            { type: 'STUN', durationMs: 1 },
          ]);
          engine.tick(1200, 1);
          expect(target.position.x).toBe(10);
          expect(target.statusConditions).toEqual([]);
          engine.tick(1216, 16);
        }
        expect(target.position.x).toBeGreaterThan(10);
      } finally {
        engine.destroy();
      }
    }
  );
});
