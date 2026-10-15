import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  DRENCHED_DAMAGE_MULTIPLIER,
  DRENCHED_DURATION_MS,
  EffectProcessor,
} from '@/engine/tower-defense/attacks/EffectProcessor';
import type { AttackDefinition } from '@/engine/tower-defense/attacks/types';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import type { Enemy, Tower } from '@/engine/tower-defense/types';
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

const source: Tower = {
  id: 'source',
  creature: {
    id: 'monkeg',
    speciesId: 'starter_monkey',
    level: 6,
    xp: 0,
    equippedAttacks: [],
    gender: 'female' as const,
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
  equippedAttacksRuntime: [],
  selectedAttackIndex: 0,
  facingDirection: 'right',
};

const createEnemy = (drenched: boolean): Enemy => ({
  id: 'target',
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

describe('Drenched', () => {
  const damageFrom = (type: ElementType, drenched: boolean) => {
    const engine = new TowerDefenseEngine(levelData);
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
    const target = createEnemy(true);
    target.statusConditions[0].durationMs = 200;
    const drenchAttack: AttackDefinition = {
      id: 'TEST_DRENCH',
      name: 'Test Drench',
      type: ElementType.WATER,
      category: 'special',
      power: 1,
      cooldownMs: 800,
      rangeIndex: 25,
      behaviorType: 'PROJECTILE',
      effects: [{ type: 'DRENCHED', chance: 1, value: DRENCHED_DURATION_MS }],
    };

    EffectProcessor.applyDamageAndEffects(engine, source, target, drenchAttack);

    expect(
      target.statusConditions.filter((status) => status.type === 'DRENCHED')
    ).toEqual([{ type: 'DRENCHED', durationMs: DRENCHED_DURATION_MS }]);
    engine.destroy();
  });
});
