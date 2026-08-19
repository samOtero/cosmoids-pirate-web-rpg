import { afterEach, describe, expect, it, vi } from 'vitest';

import { BUG_STAGE_3 } from '@/constants/creatures';
import { ProjectileBehavior } from '@/engine/tower-defense/attacks/behaviors';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { Enemy, Tower } from '@/engine/tower-defense/types';
import { ElementType } from '@/types/baseGame';

afterEach(() => {
  vi.restoreAllMocks();
});

const createMainscaleTower = (): Tower => ({
  id: 'mainscale_tower',
  creature: {
    id: 'mainscale',
    speciesId: 'bug_stage_3',
    level: 10,
    xp: 0,
    equippedAttacks: ['SAILCUTTER'],
    isShiny: false,
  },
  position: { x: 0, y: 0 },
  lastAttackTime: 0,
  currentAttack: 45,
  currentSpecialAttack: 90,
  currentDefense: 70,
  currentSpecialDefense: 50,
  hp: 100,
  maxHp: 100,
  equippedAttacksRuntime: [{ definitionId: 'SAILCUTTER', lastFiredTime: 0 }],
  selectedAttackIndex: 0,
  facingDirection: 'right',
  targetingMode: 'closest',
});

const createEnemy = (): Enemy => ({
  id: 'enemy',
  definitionId: 'mouse_1',
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

describe('Sailcutter', () => {
  it("is Mainscale's level-10 Flying-type special attack with 50 power", () => {
    expect(
      BUG_STAGE_3.learnableAttacks.find(
        (attack) => attack.attackId === 'SAILCUTTER'
      )
    ).toEqual({ level: 10, attackId: 'SAILCUTTER' });
    expect(ATTACK_DEFS.SAILCUTTER).toMatchObject({
      name: 'Sailcutter',
      type: ElementType.FLYING,
      category: 'special',
      power: 50,
      cooldownMs: 800,
      behaviorType: 'PROJECTILE',
      projectileVisual: { type: 'SAILCUTTER' },
    });
    expect(ATTACK_DEFS.SAILCUTTER.visualEffectConfigId).toBeUndefined();
  });

  it('launches one wind blade without a secondary impact effect', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
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
    const mainscale = createMainscaleTower();
    engine.enemies = [enemy];
    engine.towers = [mainscale];

    ProjectileBehavior.execute(engine, mainscale, ATTACK_DEFS.SAILCUTTER);

    expect(engine.projectiles).toHaveLength(1);
    expect(engine.projectiles[0]).toMatchObject({
      attackDefinitionId: 'SAILCUTTER',
      damage: 50,
    });

    engine.tick(0, 200);

    expect(enemy.hp).toBeLessThan(100);
    expect(engine.visualEffects).toHaveLength(0);
    engine.destroy();
  });
});
