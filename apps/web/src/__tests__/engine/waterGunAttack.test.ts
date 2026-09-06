import { describe, expect, it } from 'vitest';

import { STARTER_MONKEY } from '@/constants/creatures';
import { ProjectileBehavior } from '@/engine/tower-defense/attacks/behaviors';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { Enemy, Tower } from '@/engine/tower-defense/types';
import { DAMAGE_FLASH_COLORS } from '@/engine/tower-defense/damageFlash';
import { ElementType } from '@/types/baseGame';

const createMonkegTower = (): Tower => ({
  id: 'monkeg_tower',
  creature: {
    id: 'monkeg',
    speciesId: 'starter_monkey',
    level: 8,
    xp: 0,
    equippedAttacks: ['WATER_GUN'],
    isShiny: false,
  },
  position: { x: 0, y: 0 },
  lastAttackTime: 0,
  currentAttack: 65,
  currentSpecialAttack: 44,
  currentDefense: 58,
  currentSpecialDefense: 55,
  hp: 100,
  maxHp: 100,
  equippedAttacksRuntime: [{ definitionId: 'WATER_GUN', lastFiredTime: 0 }],
  selectedAttackIndex: 0,
  facingDirection: 'right',
  targetingMode: 'closest',
});

const createEnemy = (): Enemy => ({
  id: 'enemy',
  definitionId: 'senticle',
  level: 5,
  position: { x: 10, y: 0 },
  hp: 100,
  maxHp: 100,
  speed: 0,
  currentAttack: 10,
  currentSpecialAttack: 10,
  currentDefense: 10,
  currentSpecialDefense: 10,
  statusConditions: [],
  currentWaypointIndex: 1,
  pathIndex: 0,
  facingDirection: 'right',
  damagedByTowerIds: new Set(),
});

describe('Spurt', () => {
  it("remains registered but is no longer in Monkeg's learnset", () => {
    expect(ATTACK_DEFS.WATER_GUN).toMatchObject({
      name: 'Spurt',
      behaviorType: 'PROJECTILE',
    });
    expect(
      STARTER_MONKEY.learnableAttacks.find(
        (attack) => attack.attackId === 'WATER_GUN'
      )
    ).toBeUndefined();
  });

  it('fires a long, tapered stream whose lead segment deals all damage', () => {
    const engine = new TowerDefenseEngine({
      paths: [
        [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
        ],
      ],
      placementSpots: [],
      waves: [],
    });
    const enemy = createEnemy();
    engine.enemies = [enemy];

    ProjectileBehavior.execute(
      engine,
      createMonkegTower(),
      ATTACK_DEFS.WATER_GUN
    );

    expect(engine.projectiles).toHaveLength(7);
    expect(engine.projectiles.length).toBeGreaterThan(3);
    expect(
      engine.projectiles.map((projectile) => projectile.visualScale)
    ).toEqual([1.15, 1.08, 1, 0.95, 0.9, 0.82, 0.72]);
    expect(engine.projectiles[0].dealsDamage).toBe(true);
    expect(
      engine.projectiles
        .slice(1)
        .every((projectile) => projectile.dealsDamage === false)
    ).toBe(true);

    engine.tick(0, 1000);

    expect(enemy.hp).toBe(100 - ATTACK_DEFS.WATER_GUN.power);
    expect(enemy.damageFlashColor).toBe(DAMAGE_FLASH_COLORS[ElementType.WATER]);
    expect(engine.projectiles).toHaveLength(0);
    engine.destroy();
  });
});
