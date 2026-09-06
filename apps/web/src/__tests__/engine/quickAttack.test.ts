import { describe, expect, it } from 'vitest';

import { MOUSE_1 } from '@/constants/creatures';
import { ProjectileBehavior } from '@/engine/tower-defense/attacks/behaviors';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { Enemy, Tower } from '@/engine/tower-defense/types';
import { ElementType } from '@/types/baseGame';

const createKnotiaTower = (): Tower => ({
  id: 'knotia_tower',
  creature: {
    id: 'knotia',
    speciesId: 'mouse_1',
    level: 6,
    xp: 0,
    equippedAttacks: ['QUICK_ATTACK'],
    isShiny: false,
  },
  position: { x: 0, y: 0 },
  lastAttackTime: 0,
  currentAttack: 56,
  currentSpecialAttack: 25,
  currentDefense: 35,
  currentSpecialDefense: 35,
  hp: 100,
  maxHp: 100,
  equippedAttacksRuntime: [{ definitionId: 'QUICK_ATTACK', lastFiredTime: 0 }],
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

describe('Quick Attack', () => {
  it('is learned by Knotia at level 4', () => {
    expect(
      MOUSE_1.learnableAttacks.find(
        (attack) => attack.attackId === 'QUICK_ATTACK'
      )
    ).toEqual({ level: 4, attackId: 'QUICK_ATTACK' });
  });

  it('is a weaker Tackle with half the cooldown and the same dash behavior', () => {
    expect(ATTACK_DEFS.QUICK_ATTACK).toMatchObject({
      name: 'Dart',
      type: ElementType.NORMAL,
      category: 'physical',
      power: 15,
      cooldownMs: 400,
      rangeIndex: ATTACK_DEFS.TACKLE.rangeIndex,
      projectileSpeed: ATTACK_DEFS.TACKLE.projectileSpeed,
      behaviorType: ATTACK_DEFS.TACKLE.behaviorType,
      isDashAttack: true,
    });
    expect(ATTACK_DEFS.QUICK_ATTACK.power).toBeLessThan(
      ATTACK_DEFS.TACKLE.power
    );
    expect(ATTACK_DEFS.QUICK_ATTACK.cooldownMs).toBe(
      ATTACK_DEFS.TACKLE.cooldownMs / 2
    );
  });

  it('creates one damaging dash projectile', () => {
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
    engine.enemies = [createEnemy()];

    ProjectileBehavior.execute(
      engine,
      createKnotiaTower(),
      ATTACK_DEFS.QUICK_ATTACK
    );

    expect(engine.projectiles).toHaveLength(1);
    expect(engine.projectiles[0]).toMatchObject({
      attackDefinitionId: 'QUICK_ATTACK',
      damage: 15,
      dealsDamage: true,
    });
    engine.destroy();
  });
});
