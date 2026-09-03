import { afterEach, describe, expect, it, vi } from 'vitest';

import { MAROPHIS } from '@/constants/creatures';
import {
  EffectProcessor,
  MAX_POISON_STACKS,
  POISON_DURATION_MS,
} from '@/engine/tower-defense/attacks/EffectProcessor';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
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

const createMarophisTower = (): Tower => ({
  id: 'marophis_tower',
  creature: {
    id: 'marophis_one',
    speciesId: 'marophis',
    level: 8,
    xp: 0,
    equippedAttacks: ['VENOM_SPRAY'],
    isShiny: false,
  },
  position: { x: 0, y: 0 },
  lastAttackTime: 0,
  currentAttack: 12,
  currentSpecialAttack: 16,
  currentDefense: 13,
  currentSpecialDefense: 18,
  hp: 28,
  maxHp: 28,
  equippedAttacksRuntime: [{ definitionId: 'VENOM_SPRAY', lastFiredTime: 0 }],
  selectedAttackIndex: 0,
  facingDirection: 'right',
  targetingMode: 'closest',
});

const createEnemy = (): Enemy => ({
  id: 'target',
  definitionId: 'mouse_1',
  level: 8,
  position: { x: 10, y: 0 },
  hp: 200,
  maxHp: 200,
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

afterEach(() => vi.restoreAllMocks());

describe('Venom Spray', () => {
  it("is Marophis's level-8 direct-damage stacking Poison attack", () => {
    expect(MAROPHIS.learnableAttacks).toContainEqual({
      level: 8,
      attackId: 'VENOM_SPRAY',
    });
    expect(MAROPHIS.learnableAttacks).toContainEqual({
      level: 14,
      attackId: 'BUBBLE_BEAM',
    });
    expect(ATTACK_DEFS.VENOM_SPRAY).toMatchObject({
      type: ElementType.POISON,
      category: 'special',
      power: 35,
      behaviorType: 'PROJECTILE',
      effects: [
        {
          type: 'STACKING_POISON',
          chance: 0.25,
          maxStacks: MAX_POISON_STACKS,
        },
      ],
      projectileVisual: { type: 'VENOM_STREAM' },
    });
  });

  it('deals immediate damage and applies a successful poison roll', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const engine = new TowerDefenseEngine(levelData);
    const source = createMarophisTower();
    const target = createEnemy();

    EffectProcessor.applyDamageAndEffects(
      engine,
      source,
      target,
      ATTACK_DEFS.VENOM_SPRAY
    );

    expect(target.hp).toBeLessThan(target.maxHp);
    expect(target.statusConditions).toEqual([
      {
        type: 'POISON',
        durationMs: POISON_DURATION_MS,
        tickDamage: 1,
        lastTickTime: 0,
        stackCount: 1,
        damagePerStack: 1,
      },
    ]);
    expect(engine.floatingTexts.at(-1)?.text).toBe('Poison ×1');
    engine.destroy();
  });

  it('increases poison damage through five stacks, then only refreshes it', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const engine = new TowerDefenseEngine(levelData);
    const source = createMarophisTower();
    const target = createEnemy();

    for (let stack = 1; stack <= MAX_POISON_STACKS; stack += 1) {
      const existingPoison = target.statusConditions[0];
      if (existingPoison) existingPoison.durationMs = 100;

      EffectProcessor.applyDamageAndEffects(
        engine,
        source,
        target,
        ATTACK_DEFS.VENOM_SPRAY
      );

      expect(target.statusConditions).toHaveLength(1);
      expect(target.statusConditions[0]).toMatchObject({
        type: 'POISON',
        durationMs: POISON_DURATION_MS,
        stackCount: stack,
        damagePerStack: 1,
        tickDamage: stack,
      });
    }

    target.statusConditions[0].durationMs = 100;
    EffectProcessor.applyDamageAndEffects(
      engine,
      source,
      target,
      ATTACK_DEFS.VENOM_SPRAY
    );

    expect(target.statusConditions).toHaveLength(1);
    expect(target.statusConditions[0]).toMatchObject({
      durationMs: POISON_DURATION_MS,
      stackCount: MAX_POISON_STACKS,
      damagePerStack: 1,
      tickDamage: MAX_POISON_STACKS,
    });
    engine.destroy();
  });

  it('does not add a stack or refresh duration when the poison roll fails', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const engine = new TowerDefenseEngine(levelData);
    const source = createMarophisTower();
    const target = createEnemy();
    target.statusConditions.push({
      type: 'POISON',
      durationMs: 900,
      tickDamage: 2,
      lastTickTime: 0,
      stackCount: 2,
      damagePerStack: 1,
    });

    EffectProcessor.applyDamageAndEffects(
      engine,
      source,
      target,
      ATTACK_DEFS.VENOM_SPRAY
    );

    expect(target.hp).toBeLessThan(target.maxHp);
    expect(target.statusConditions[0]).toMatchObject({
      durationMs: 900,
      stackCount: 2,
      tickDamage: 2,
    });
    expect(
      engine.floatingTexts.some((text) => text.text.startsWith('Poison ×'))
    ).toBe(false);
    engine.destroy();
  });
});
