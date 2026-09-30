import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  EffectProcessor,
  MAX_POISON_STACKS,
  POISON_DURATION_MS,
} from '@/engine/tower-defense/attacks/EffectProcessor';
import { ATTACK_FIXTURES, installAttackFixtures } from './fixtures';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { Enemy, Tower } from '@/engine/tower-defense/types';
import {
  findPoison,
  hasAnyPoison,
  TOXIC_POLLEN_POISON_ID,
  VENOM_SPRAY_POISON_ID,
} from '@/engine/tower-defense/poison';

installAttackFixtures();

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

describe('Stacking poison', () => {
  it('deals immediate damage and applies a successful poison roll', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const engine = new TowerDefenseEngine(levelData);
    const source = createMarophisTower();
    const target = createEnemy();

    EffectProcessor.applyDamageAndEffects(
      engine,
      source,
      target,
      ATTACK_FIXTURES.VENOM_SPRAY
    );

    expect(target.hp).toBeLessThan(target.maxHp);
    expect(target.statusConditions).toEqual([
      {
        type: 'POISON',
        poisonId: VENOM_SPRAY_POISON_ID,
        durationMs: POISON_DURATION_MS,
        tickDamage: 1,
        stackCount: 1,
        stackPotencies: [1],
        tickIntervalMs: 1000,
        nextTickAtMs: 1000,
        expiresAtMs: 5000,
      },
    ]);
    expect(engine.floatingTexts.at(-1)?.text).toBe('Venom ×1');
    engine.destroy();
  });

  it('applies venom to an immortal Attack & Ability Lab target without reducing its HP', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const engine = new TowerDefenseEngine(levelData);
    const source = createMarophisTower();
    const target = { ...createEnemy(), isInvulnerable: true };

    EffectProcessor.applyDamageAndEffects(
      engine,
      source,
      target,
      ATTACK_FIXTURES.VENOM_SPRAY
    );

    expect(target.hp).toBe(target.maxHp);
    expect(findPoison(target, VENOM_SPRAY_POISON_ID)).toMatchObject({
      stackCount: 1,
      stackPotencies: [1],
      tickDamage: 1,
    });
    expect(engine.floatingTexts.at(-1)?.text).toBe('Venom ×1');
    engine.destroy();
  });

  it('increases poison damage through five stacks, then only refreshes it', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const engine = new TowerDefenseEngine(levelData);
    const source = createMarophisTower();
    const target = createEnemy();

    for (let stack = 1; stack <= MAX_POISON_STACKS; stack += 1) {
      const existingPoison = findPoison(target, VENOM_SPRAY_POISON_ID);
      if (existingPoison) existingPoison.durationMs = 100;

      EffectProcessor.applyDamageAndEffects(
        engine,
        source,
        target,
        ATTACK_FIXTURES.VENOM_SPRAY
      );

      expect(target.statusConditions).toHaveLength(1);
      expect(target.statusConditions[0]).toMatchObject({
        type: 'POISON',
        poisonId: VENOM_SPRAY_POISON_ID,
        durationMs: POISON_DURATION_MS,
        stackCount: stack,
        stackPotencies: Array.from({ length: stack }, () => 1),
        tickDamage: stack,
      });
    }

    target.statusConditions[0].durationMs = 100;
    EffectProcessor.applyDamageAndEffects(
      engine,
      source,
      target,
      ATTACK_FIXTURES.VENOM_SPRAY
    );

    expect(target.statusConditions).toHaveLength(1);
    expect(target.statusConditions[0]).toMatchObject({
      durationMs: POISON_DURATION_MS,
      stackCount: MAX_POISON_STACKS,
      stackPotencies: Array.from({ length: MAX_POISON_STACKS }, () => 1),
      tickDamage: MAX_POISON_STACKS,
    });
    engine.destroy();
  });

  it('does not add a stack or refresh duration when the poison roll fails', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.51);
    const engine = new TowerDefenseEngine(levelData);
    const source = createMarophisTower();
    const target = createEnemy();
    target.statusConditions.push({
      type: 'POISON',
      poisonId: VENOM_SPRAY_POISON_ID,
      durationMs: 900,
      tickDamage: 2,
      stackCount: 2,
      stackPotencies: [1, 1],
      tickIntervalMs: 1000,
      nextTickAtMs: 1000,
      expiresAtMs: 900,
    });

    EffectProcessor.applyDamageAndEffects(
      engine,
      source,
      target,
      ATTACK_FIXTURES.VENOM_SPRAY
    );

    expect(target.hp).toBeLessThan(target.maxHp);
    expect(target.statusConditions[0]).toMatchObject({
      durationMs: 900,
      stackCount: 2,
      tickDamage: 2,
    });
    expect(
      engine.floatingTexts.some((text) => text.text.startsWith('Venom ×'))
    ).toBe(false);
    engine.destroy();
  });

  it('coexists with Toxic Pollen while remaining visible to universal poison checks', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const engine = new TowerDefenseEngine(levelData);
    const source = createMarophisTower();
    const target = createEnemy();
    target.statusConditions.push({
      type: 'POISON',
      poisonId: TOXIC_POLLEN_POISON_ID,
      durationMs: 5000,
      tickDamage: 1,
      remainingDamage: 5,
      ticksRemaining: 5,
      tickIntervalMs: 1000,
      nextTickAtMs: 1000,
      expiresAtMs: 5000,
    });

    EffectProcessor.applyDamageAndEffects(
      engine,
      source,
      target,
      ATTACK_FIXTURES.VENOM_SPRAY
    );

    expect(target.statusConditions).toHaveLength(2);
    expect(findPoison(target, TOXIC_POLLEN_POISON_ID)).toBeDefined();
    expect(findPoison(target, VENOM_SPRAY_POISON_ID)).toMatchObject({
      stackCount: 1,
      stackPotencies: [1],
    });
    expect(hasAnyPoison(target)).toBe(true);

    const hpAfterImpact = target.hp;
    engine.enemies = [target];
    for (let tick = 1; tick <= 5; tick += 1) {
      engine.tick(tick * 1000, 1000);
    }
    expect(target.hp).toBe(hpAfterImpact - 10);
    expect(target.statusConditions).toHaveLength(0);
    engine.destroy();
  });

  it('records each successful stack using the potency of its own direct hit', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const engine = new TowerDefenseEngine(levelData);
    const source = createMarophisTower();
    const target = createEnemy();

    EffectProcessor.applyDamageAndEffects(
      engine,
      source,
      target,
      ATTACK_FIXTURES.VENOM_SPRAY
    );
    source.currentSpecialAttack = 200;
    EffectProcessor.applyDamageAndEffects(
      engine,
      source,
      target,
      ATTACK_FIXTURES.VENOM_SPRAY
    );

    expect(findPoison(target, VENOM_SPRAY_POISON_ID)).toMatchObject({
      stackCount: 2,
      stackPotencies: [1, 5],
      tickDamage: 6,
    });
    engine.destroy();
  });
});
