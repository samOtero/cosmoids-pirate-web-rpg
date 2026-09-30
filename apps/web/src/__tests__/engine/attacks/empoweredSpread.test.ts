import { afterEach, describe, expect, it, vi } from 'vitest';

import { ATTACK_FIXTURES, installAttackFixtures } from './fixtures';
import { disarmSaltSpitTarget } from '@/engine/tower-defense/attacks/saltSpit';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import type { CaptureUnit, Enemy } from '@/engine/tower-defense/types';

installAttackFixtures();

const engines: TowerDefenseEngine[] = [];

afterEach(() => {
  engines.splice(0).forEach((engine) => engine.destroy());
  vi.restoreAllMocks();
});

function createBattle(targetCount = 3) {
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
      {
        id: 'nautiguan',
        speciesId: 'nautiguan',
        level: 16,
        xp: 0,
        equippedAttacks: ['SALT_SPIT'],
        isShiny: false,
      },
    ]
  );
  engines.push(engine);
  engine.placeTower('nautiguan', 40, 50);
  const targets = Array.from({ length: targetCount }, (_, index) => {
    const enemy = engine.spawnPreviewEnemy({
      id: `salt-target-${index}`,
      creatureId: 'mouse_1',
      level: 16,
      position: { x: 58 + index * 5, y: 50 },
    })!;
    enemy.hp = enemy.maxHp = 500;
    enemy.speed = 0;
    return enemy;
  });
  const tower = engine.towers[0];
  tower.equippedAttacksRuntime[0].lastFiredTime = -3000;
  return { engine, tower, targets };
}

function giveObjective(engine: TowerDefenseEngine, enemy: Enemy): CaptureUnit {
  const objective: CaptureUnit = {
    id: `objective-${enemy.id}`,
    tdConfigId: 'coin_1',
    position: { ...enemy.position },
    homePosition: { ...enemy.position },
    facingDirection: 'down',
    hp: 1,
    maxHp: 1,
    heldByEnemyId: enemy.id,
  };
  enemy.heldCaptureUnitId = objective.id;
  engine.captureUnits.push(objective);
  return objective;
}

describe('Empowered projectile spreads', () => {
  it('fires one projectile cold and up to three full-strength projectiles at unique targets while warm', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const cold = createBattle();
    cold.engine.tick(1, 1);
    expect(cold.engine.projectiles).toHaveLength(1);
    expect(cold.engine.projectiles[0].warmthDamageMultiplier).toBe(1);

    const warm = createBattle();
    warm.tower.warmth!.value = 10;
    warm.engine.tick(1, 1);
    expect(warm.engine.projectiles).toHaveLength(3);
    expect(new Set(warm.engine.projectiles.map((p) => p.targetId)).size).toBe(
      3
    );
    expect(warm.engine.projectiles.every((p) => p.damage === 30)).toBe(true);
    expect(
      warm.engine.projectiles.every((p) => p.warmthDamageMultiplier === 1.4)
    ).toBe(true);
    expect(warm.tower.warmth!.value).toBe(0);

    const sunSoaked = createBattle(2);
    sunSoaked.tower.warmth!.value = 10;
    sunSoaked.tower.warmth!.sunSoaked = true;
    sunSoaked.engine.tick(1, 1);
    expect(sunSoaked.engine.projectiles).toHaveLength(2);
    expect(sunSoaked.tower.warmth).toMatchObject({
      value: 10,
      sunSoaked: false,
    });
  });

  it('stuns and disarms each eligible carrier once while preserving immune carriers', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { engine, tower, targets } = createBattle();
    tower.warmth!.value = 10;
    const objectives = targets.map((target) => giveObjective(engine, target));
    targets[2].immuneToStatusEffects = true;

    engine.tick(1, 1);
    engine.tick(600, 600);

    for (const target of targets.slice(0, 2)) {
      expect(target.hp).toBeLessThan(500);
      expect(target.statusConditions).toContainEqual(
        expect.objectContaining({ type: 'STUN' })
      );
      expect(target.heldCaptureUnitId).toBeUndefined();
      expect(target.hasBeenWindDisarmed).toBe(true);
      expect(target.itemPickupBlockedUntilMs).toBeGreaterThan(
        engine.elapsedTimeMs
      );
    }
    expect(objectives[0].heldByEnemyId).toBeUndefined();
    expect(objectives[1].heldByEnemyId).toBeUndefined();

    targets[0].heldCaptureUnitId = objectives[0].id;
    objectives[0].heldByEnemyId = targets[0].id;
    disarmSaltSpitTarget(engine, targets[0], ATTACK_FIXTURES.SALT_SPIT);
    expect(targets[0].heldCaptureUnitId).toBe(objectives[0].id);
    expect(objectives[0].heldByEnemyId).toBe(targets[0].id);

    expect(targets[2].statusConditions).not.toContainEqual(
      expect.objectContaining({ type: 'STUN' })
    );
    expect(targets[2].heldCaptureUnitId).toBe(objectives[2].id);
    expect(objectives[2].heldByEnemyId).toBe(targets[2].id);
  });
});
