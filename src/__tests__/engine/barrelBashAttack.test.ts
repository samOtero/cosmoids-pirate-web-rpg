import { afterEach, describe, expect, it, vi } from 'vitest';

import { STARTER_MONKEY } from '@/constants/creatures';
import { ProjectileBehavior } from '@/engine/tower-defense/attacks/behaviors';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import {
  DRENCHED_DAMAGE_MULTIPLIER,
  DRENCHED_DURATION_MS,
  EffectProcessor,
} from '@/engine/tower-defense/attacks/EffectProcessor';
import { AttackDefinition } from '@/engine/tower-defense/attacks/types';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { Enemy, Tower } from '@/engine/tower-defense/types';
import { ElementType } from '@/types/baseGame';

const levelData = {
  paths: [
    [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ],
  ],
  placementSpots: [],
  waves: [{ id: 'empty', groups: [] }],
};

const createMonkegTower = (): Tower => ({
  id: 'monkeg_tower',
  creature: {
    id: 'monkeg',
    speciesId: 'starter_monkey',
    level: 8,
    xp: 0,
    equippedAttacks: ['BARREL_BASH'],
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
  equippedAttacksRuntime: [{ definitionId: 'BARREL_BASH', lastFiredTime: 0 }],
  selectedAttackIndex: 0,
  facingDirection: 'right',
  targetingMode: 'closest',
});

const createEnemy = (drenched = false): Enemy => ({
  id: `enemy_${drenched ? 'wet' : 'dry'}`,
  definitionId: 'mouse_1',
  level: 5,
  position: { x: 10, y: 0 },
  hp: 100,
  maxHp: 100,
  speed: 0,
  currentAttack: 10,
  currentSpecialAttack: 10,
  currentDefense: 40,
  currentSpecialDefense: 40,
  statusConditions: drenched
    ? [{ type: 'DRENCHED', durationMs: DRENCHED_DURATION_MS }]
    : [],
  currentWaypointIndex: 1,
  pathIndex: 0,
  facingDirection: 'right',
  damagedByTowerIds: new Set(),
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Barrel Bash', () => {
  it("replaces Water Gun in Monkeg's level-8 learnset", () => {
    expect(
      STARTER_MONKEY.learnableAttacks.find(
        (attack) => attack.attackId === 'BARREL_BASH'
      )
    ).toEqual({ level: 8, attackId: 'BARREL_BASH' });
    expect(
      STARTER_MONKEY.learnableAttacks.some(
        (attack) => attack.attackId === 'WATER_GUN'
      )
    ).toBe(false);
  });

  it('is a physical Water dash with a charge trail and splash impact', () => {
    expect(ATTACK_DEFS.BARREL_BASH).toMatchObject({
      type: ElementType.WATER,
      category: 'physical',
      power: 40,
      cooldownMs: 1000,
      projectileSpeed: 1.15,
      isDashAttack: true,
      dashTrailType: 'WATER',
      visualEffectConfigId: 'attack_barrel_bash_1',
      effects: [{ type: 'DRENCHED', chance: 0.25, value: 4000 }],
    });
  });

  it('hits once, applies Drenched, and creates its impact effect', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const engine = new TowerDefenseEngine(levelData);
    const monkeg = createMonkegTower();
    const enemy = createEnemy();
    engine.towers = [monkeg];
    engine.enemies = [enemy];

    ProjectileBehavior.execute(engine, monkeg, ATTACK_DEFS.BARREL_BASH);
    expect(engine.projectiles).toHaveLength(1);
    engine.tick(0, 200);

    expect(enemy.statusConditions).toContainEqual({
      type: 'DRENCHED',
      durationMs: DRENCHED_DURATION_MS,
    });
    expect(
      enemy.statusConditions.filter((status) => status.type === 'DRENCHED')
    ).toHaveLength(1);
    expect(engine.visualEffects).toContainEqual(
      expect.objectContaining({
        configId: 'attack_barrel_bash_1',
        targetId: enemy.id,
        durationMs: 400,
      })
    );
    engine.destroy();
  });
});

describe('Drenched', () => {
  const damageFrom = (type: ElementType, drenched: boolean) => {
    const engine = new TowerDefenseEngine(levelData);
    const source = createMonkegTower();
    const target = createEnemy(drenched);
    const attack: AttackDefinition = {
      id: `TEST_${type}`,
      name: 'Test',
      type,
      category: 'special',
      power: 60,
      cooldownMs: 800,
      rangeIndex: 25,
      behaviorType: 'PROJECTILE',
    };
    EffectProcessor.applyDamageAndEffects(engine, source, target, attack);
    engine.destroy();
    return target.maxHp - target.hp;
  };

  it('increases Water and Electric damage by 1.5x without affecting other types', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const dryWater = damageFrom(ElementType.WATER, false);
    const wetWater = damageFrom(ElementType.WATER, true);
    const dryElectric = damageFrom(ElementType.ELECTRIC, false);
    const wetElectric = damageFrom(ElementType.ELECTRIC, true);
    const dryNormal = damageFrom(ElementType.NORMAL, false);
    const wetNormal = damageFrom(ElementType.NORMAL, true);

    expect(DRENCHED_DAMAGE_MULTIPLIER).toBe(1.5);
    expect(wetWater).toBeGreaterThan(dryWater);
    expect(wetElectric).toBeGreaterThan(dryElectric);
    expect(wetNormal).toBe(dryNormal);
  });

  it('refreshes Drenched instead of stacking it', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const engine = new TowerDefenseEngine(levelData);
    const source = createMonkegTower();
    const target = createEnemy(true);
    target.statusConditions[0].durationMs = 200;

    EffectProcessor.applyDamageAndEffects(
      engine,
      source,
      target,
      ATTACK_DEFS.BARREL_BASH
    );

    expect(
      target.statusConditions.filter((status) => status.type === 'DRENCHED')
    ).toEqual([{ type: 'DRENCHED', durationMs: DRENCHED_DURATION_MS }]);
    engine.destroy();
  });
});
