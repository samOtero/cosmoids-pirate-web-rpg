import { afterEach, describe, expect, it, vi } from 'vitest';

import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';

import { ATTACK_FIXTURES, installAttackFixtures } from './fixtures';
import { EffectProcessor } from '@/engine/tower-defense/attacks/EffectProcessor';
import {
  SharedSlumberBehavior,
  isSleeping,
  SHARED_SLUMBER_DURATION_MS,
  SHARED_SLUMBER_RESISTANCE_MS,
} from '@/engine/tower-defense/attacks/sharedSlumber';
import type { Enemy } from '@/engine/tower-defense/types';

installAttackFixtures();

const engines: TowerDefenseEngine[] = [];

afterEach(() => {
  engines.splice(0).forEach((engine) => engine.destroy());
  vi.restoreAllMocks();
});

function createEnemy(id: string, x: number): Enemy {
  return {
    id,
    definitionId: 'mouse_1',
    level: 8,
    position: { x, y: 50 },
    hp: 300,
    maxHp: 300,
    speed: 0.01,
    currentAttack: 20,
    currentSpecialAttack: 20,
    currentDefense: 20,
    currentSpecialDefense: 20,
    statusConditions: [],
    currentWaypointIndex: 1,
    pathIndex: 0,
    facingDirection: 'right',
    damagedByTowerIds: new Set(),
  };
}

function battle() {
  const engine = new TowerDefenseEngine(
    {
      paths: [
        [
          { x: 0, y: 50 },
          { x: 100, y: 50 },
        ],
      ],
      placementSpots: [
        { x: 40, y: 50 },
        { x: 42, y: 50 },
      ],
      waves: [{ id: 'empty', groups: [] }],
    },
    [
      {
        id: 'dormatee-one',
        speciesId: 'dormatee',
        level: 8,
        xp: 0,
        equippedAttacks: ['SHARED_SLUMBER', 'TACKLE'],
        gender: 'female' as const,
        isShiny: false,
      },
    ]
  );
  engines.push(engine);
  engine.placeTower('dormatee-one', 40, 50);
  const source = engine.towers[0];
  const target = createEnemy('target', 50);
  engine.enemies = [target];
  return { engine, source, target };
}

describe('Shared sleep and wake resistance', () => {
  it('sleeps every eligible enemy in range and commits Dormatee for six seconds', () => {
    const { engine, source, target } = battle();
    const second = createEnemy('second', 60);
    const immune = createEnemy('immune', 55);
    immune.immuneToStatusEffects = true;
    const structure = createEnemy('structure', 55);
    structure.kind = 'structure';
    const distant = createEnemy('distant', 90);
    engine.enemies = [target, second, immune, structure, distant];

    SharedSlumberBehavior.execute(
      engine,
      source,
      ATTACK_FIXTURES.SHARED_SLUMBER
    );

    expect(source.sharedSlumberUntilMs).toBe(SHARED_SLUMBER_DURATION_MS);
    expect(isSleeping(target)).toBe(true);
    expect(isSleeping(second)).toBe(true);
    expect(isSleeping(immune)).toBe(false);
    expect(isSleeping(structure)).toBe(false);
    expect(isSleeping(distant)).toBe(false);
    expect(target.hp).toBe(target.maxHp);
    expect(engine.visualEffects).toContainEqual(
      expect.objectContaining({
        configId: 'attack_shared_slumber_1',
        durationMs: 800,
        rangeIndex: 40,
        targetIds: ['target', 'second'],
      })
    );
  });

  it('keeps the same sleeping tower object through attack changes, movement, removal, and replacement', () => {
    const { engine, source } = battle();
    engine.tick(1, 1);
    expect(source.sharedSlumberUntilMs).toBe(6001);

    engine.setTowerAttack(source.creature.id, 1);
    engine.placeTower(source.creature.id, 42, 50);
    expect(engine.towers[0]).toBe(source);
    expect(engine.towers[0].selectedAttackIndex).toBe(1);

    engine.removeTower(source.creature.id);
    expect(engine.towers).toHaveLength(0);
    engine.tick(3001, 3000);
    engine.placeTower(source.creature.id, 40, 50);
    expect(engine.towers[0]).toBe(source);

    engine.tick(5001, 2000);
    expect(engine.projectiles).toHaveLength(0);
    engine.tick(6002, 1001);
    expect(source.equippedAttacksRuntime[1].lastFiredTime).toBe(6002);
  });

  it('allows direct damage to wake a target after the guaranteed opening and grants resistance', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { engine, source, target } = battle();
    SharedSlumberBehavior.execute(
      engine,
      source,
      ATTACK_FIXTURES.SHARED_SLUMBER
    );

    EffectProcessor.applyDamageAndEffects(
      engine,
      source,
      target,
      ATTACK_FIXTURES.TACKLE
    );
    expect(isSleeping(target)).toBe(true);

    engine.elapsedTimeMs = 750;
    EffectProcessor.applyDamageAndEffects(
      engine,
      source,
      target,
      ATTACK_FIXTURES.TACKLE
    );
    expect(isSleeping(target)).toBe(false);
    expect(target.sleepResistantUntilMs).toBe(
      750 + SHARED_SLUMBER_RESISTANCE_MS
    );
    expect(engine.visualEffects).toContainEqual(
      expect.objectContaining({
        configId: 'attack_shared_slumber_wake_1',
        durationMs: 360,
        targetId: target.id,
      })
    );
    expect(
      SharedSlumberBehavior.canExecute(
        engine,
        source,
        ATTACK_FIXTURES.SHARED_SLUMBER
      )
    ).toBe(false);
  });

  it('wakes naturally after six seconds and applies the same shared resistance', () => {
    const { engine, target } = battle();
    engine.tick(1, 1);
    const x = target.position.x;
    engine.tick(6001, 6000);

    expect(isSleeping(target)).toBe(false);
    expect(target.sleepResistantUntilMs).toBe(
      6001 + SHARED_SLUMBER_RESISTANCE_MS
    );
    expect(target.position.x).toBe(x);
  });
});
