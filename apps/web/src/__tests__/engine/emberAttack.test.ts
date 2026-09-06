import { describe, expect, it } from 'vitest';

import { STARTER_IGUANA } from '@/constants/creatures';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { ProjectileBehavior } from '@/engine/tower-defense/attacks/behaviors';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { Enemy, Tower } from '@/engine/tower-defense/types';

const createFueguanaTower = (): Tower => ({
  id: 'fueguana_tower',
  creature: {
    id: 'fueguana',
    speciesId: 'starter_iguana',
    level: 9,
    xp: 0,
    equippedAttacks: ['EMBER'],
    isShiny: false,
  },
  position: { x: 0, y: 0 },
  lastAttackTime: 0,
  currentAttack: 70,
  currentSpecialAttack: 46,
  currentDefense: 35,
  currentSpecialDefense: 44,
  hp: 100,
  maxHp: 100,
  equippedAttacksRuntime: [{ definitionId: 'EMBER', lastFiredTime: 0 }],
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

describe('Ember', () => {
  it('is learned by Fueguana at level 9', () => {
    expect(
      STARTER_IGUANA.learnableAttacks.find(
        (attack) => attack.attackId === 'EMBER'
      )
    ).toEqual({ level: 9, attackId: 'EMBER' });
  });

  it('fires three progressively smaller flames with only the lead flame damaging', () => {
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
      createFueguanaTower(),
      ATTACK_DEFS.EMBER
    );

    expect(engine.projectiles).toHaveLength(3);
    expect(
      engine.projectiles.map((projectile) => projectile.visualScale)
    ).toEqual([1.35, 0.9, 0.6]);
    expect(
      engine.projectiles.map((projectile) => projectile.dealsDamage)
    ).toEqual([true, false, false]);
    expect(
      engine.projectiles.map((projectile) => projectile.position.x)
    ).toEqual([0, -3, -6]);

    engine.tick(0, 1000);

    expect(enemy.hp).toBe(100 - ATTACK_DEFS.EMBER.power);
    expect(engine.projectiles).toHaveLength(0);
    engine.destroy();
  });
});
