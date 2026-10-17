import { SpeciesId, AttackId } from '@/types/definitionIds';
import { makePlayerCreature } from '@/__tests__/utils/dataBuilders';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { installAttackFixtures } from './fixtures';
import { updateWakeWhips } from '@/engine/tower-defense/attacks/wakeWhip';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';

installAttackFixtures();

const engines: TowerDefenseEngine[] = [];

afterEach(() => {
  engines.splice(0).forEach((engine) => engine.destroy());
  vi.restoreAllMocks();
});

function createBattle() {
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
    [
      makePlayerCreature({
        id: 'aguana',
        speciesId: SpeciesId.AGUANA,
        level: 8,
        equippedAttacks: [AttackId.WAKE_WHIP],
      }),
    ]
  );
  engines.push(engine);
  engine.placeTower('aguana', 40, 50);
  const target = engine.spawnPreviewEnemy({
    id: 'wake-target',
    creatureId: SpeciesId.KNOTIA,
    level: 8,
    position: { x: 70, y: 50 },
  })!;
  target.speed = 0;
  return { engine, tower: engine.towers[0], target };
}

describe('Committed projectile push', () => {
  it.each([false, true])(
    'damages its committed target while respecting displacement immunity=%s',
    (immuneToDisplacement) => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const { engine, tower, target } = createBattle();
      target.immuneToDisplacement = immuneToDisplacement;
      tower.warmth!.value = 10;
      tower.equippedAttacksRuntime[0].lastFiredTime = -1000;

      engine.tick(1, 1);

      expect(tower.facingDirection).toBe('right');
      expect(tower.wakeWhip).toMatchObject({
        targetId: target.id,
        attackFacingDirection: 'right',
        warmthDamageMultiplier: 1.4,
        launched: false,
      });
      expect(tower.warmth?.value).toBe(0);
      expect(engine.projectiles).toHaveLength(0);

      engine.elapsedTimeMs = tower.wakeWhip!.launchAtMs;
      updateWakeWhips(engine);

      expect(tower.facingDirection).toBe('right');
      expect(tower.wakeWhip?.launched).toBe(true);
      expect(engine.projectiles).toHaveLength(1);
      expect(engine.projectiles[0]).toMatchObject({
        attackDefinitionId: AttackId.WAKE_WHIP,
        targetId: target.id,
        warmthDamageMultiplier: 1.4,
        facingDirection: 'right',
      });

      const positionBeforeImpact = target.position.x;
      engine.tick(200, 500);

      expect(target.hp).toBeLessThan(target.maxHp);
      if (immuneToDisplacement) {
        expect(target.position.x).toBe(positionBeforeImpact);
      } else {
        expect(target.position.x).toBeLessThan(positionBeforeImpact);
      }
      expect(tower.wakeWhip).toBeUndefined();
      expect(tower.facingDirection).toBe('right');
    }
  );

  it('cancels the committed windup when the tower is moved', () => {
    const { engine, tower } = createBattle();
    tower.equippedAttacksRuntime[0].lastFiredTime = -1000;
    engine.tick(1, 1);
    expect(tower.wakeWhip).toBeDefined();

    engine.placeTower('aguana', 30, 50);

    expect(tower.wakeWhip).toBeUndefined();
    engine.tick(1000, 1000);
    expect(engine.projectiles).toHaveLength(0);
  });
});
