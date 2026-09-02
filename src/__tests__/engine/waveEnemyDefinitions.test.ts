import { describe, expect, it, vi } from 'vitest';

import { isUnitWeakened } from '@/app/components/tower-defense/PixiBattlefield';
import { EffectProcessor } from '@/engine/tower-defense/attacks/EffectProcessor';
import type { AttackDefinition } from '@/engine/tower-defense/attacks/types';
import {
  TD_CREATURE_DEFS,
  TowerDefenseEngine,
} from '@/engine/tower-defense/TowerDefenseEngine';
import type { Tower } from '@/engine/tower-defense/types';
import { ElementType } from '@/types/baseGame';
import { calculateMaxHp, calculateStat } from '@/utils/resolvePlayerCreature';

describe('wave enemy definitions', () => {
  it('spawns independently configured variants of the same creature', () => {
    const engine = new TowerDefenseEngine({
      paths: [
        [
          { x: 0, y: 0 },
          { x: 1000, y: 0 },
        ],
      ],
      placementSpots: [],
      waveEnemyDefinitions: [
        {
          id: 'mouse_scout',
          creatureId: 'mouse_1',
          level: 3,
          speedMultiplier: 2,
        },
        {
          id: 'mouse_tank',
          creatureId: 'mouse_1',
          level: 7,
          speedMultiplier: 0.5,
          hpMultiplier: 3,
          defenseMultiplier: 2,
          specialDefenseMultiplier: 2.5,
          abilityId: 'MOTH_TAILWIND',
        },
      ],
      waves: [
        {
          id: 'variant_wave',
          groups: [
            {
              enemyDefinitionId: 'mouse_scout',
              count: 1,
              spawnIntervalMs: 0,
              delayBeforeGroupMs: 0,
              pathIndex: 0,
            },
            {
              enemyDefinitionId: 'mouse_tank',
              count: 1,
              spawnIntervalMs: 0,
              delayBeforeGroupMs: 0,
              pathIndex: 0,
              concurrentWithPrevious: true,
            },
          ],
        },
      ],
    });

    engine.tick(0, 16);

    const scout = engine.enemies.find(
      (enemy) => enemy.waveEnemyDefinitionId === 'mouse_scout'
    );
    const tank = engine.enemies.find(
      (enemy) => enemy.waveEnemyDefinitionId === 'mouse_tank'
    );
    const mouse = TD_CREATURE_DEFS.mouse_1.baseCreature;

    expect(scout).toMatchObject({
      definitionId: 'mouse_1',
      level: 3,
      speed: (mouse.speed / 100) * 2,
    });
    expect(scout?.abilityRuntime).toBeUndefined();

    expect(tank).toMatchObject({
      definitionId: 'mouse_1',
      level: 7,
      speed: (mouse.speed / 100) * 0.5,
      maxHp: calculateMaxHp(mouse.maxHp, 7) * 3,
      currentDefense: calculateStat(mouse.defense, 7) * 2,
      currentSpecialDefense: calculateStat(mouse.specialDefense, 7) * 2.5,
      abilityRuntime: {
        definitionId: 'MOTH_TAILWIND',
        nextReadyTimeMs: 7016,
      },
    });

    engine.destroy();
  });

  it('applies configured goal damage when an enemy reaches the end', () => {
    const engine = new TowerDefenseEngine({
      paths: [
        [
          { x: 0, y: 0 },
          { x: 0.01, y: 0 },
        ],
      ],
      placementSpots: [],
      lives: 10,
      waveEnemyDefinitions: [
        {
          id: 'boat_breaker',
          creatureId: 'mouse_1',
          level: 3,
          goalDamage: 10,
        },
      ],
      waves: [
        {
          id: 'goal_damage_wave',
          groups: [
            {
              enemyDefinitionId: 'boat_breaker',
              count: 1,
              spawnIntervalMs: 0,
              delayBeforeGroupMs: 0,
              pathIndex: 0,
            },
          ],
        },
      ],
    });

    engine.tick(0, 16);

    expect(engine.lives).toBe(0);
    engine.destroy();
  });

  it('allows overriding the weakened threshold per enemy definition', () => {
    const engine = new TowerDefenseEngine({
      paths: [
        [
          { x: 0, y: 0 },
          { x: 1000, y: 0 },
        ],
      ],
      placementSpots: [],
      waveEnemyDefinitions: [
        {
          id: 'standard_mouse',
          creatureId: 'mouse_1',
          level: 5,
        },
        {
          id: 'boss_mouse',
          creatureId: 'mouse_1',
          level: 5,
          weakenedThreshold: 0.3,
        },
      ],
      waves: [
        {
          id: 'threshold_wave',
          groups: [
            {
              enemyDefinitionId: 'standard_mouse',
              count: 1,
              spawnIntervalMs: 0,
              delayBeforeGroupMs: 0,
              pathIndex: 0,
            },
            {
              enemyDefinitionId: 'boss_mouse',
              count: 1,
              spawnIntervalMs: 0,
              delayBeforeGroupMs: 0,
              pathIndex: 0,
              concurrentWithPrevious: true,
            },
          ],
        },
      ],
    });

    engine.tick(0, 16);

    const standardEnemy = engine.enemies.find(
      (e) => e.waveEnemyDefinitionId === 'standard_mouse'
    );
    const bossEnemy = engine.enemies.find(
      (e) => e.waveEnemyDefinitionId === 'boss_mouse'
    );

    expect(standardEnemy).toBeDefined();
    expect(bossEnemy).toBeDefined();

    expect(standardEnemy?.weakenedThreshold).toBeUndefined();
    expect(bossEnemy?.weakenedThreshold).toBe(0.3);

    // Test standard enemy: weakened at 80% HP (default threshold is 0.9)
    if (standardEnemy) {
      standardEnemy.hp = standardEnemy.maxHp * 0.8;
      expect(isUnitWeakened(standardEnemy)).toBe(true);

      standardEnemy.hp = standardEnemy.maxHp * 0.95;
      expect(isUnitWeakened(standardEnemy)).toBe(false);
    }

    // Test boss enemy: NOT weakened at 50% HP, weakened at 30% HP (custom threshold 0.3)
    if (bossEnemy) {
      bossEnemy.hp = bossEnemy.maxHp * 0.5;
      expect(isUnitWeakened(bossEnemy)).toBe(false);

      bossEnemy.hp = bossEnemy.maxHp * 0.3;
      expect(isUnitWeakened(bossEnemy)).toBe(true);

      bossEnemy.hp = bossEnemy.maxHp * 0.2;
      expect(isUnitWeakened(bossEnemy)).toBe(true);
    }

    engine.destroy();
  });

  it('supports a stationary, unrewarded structure in the enemy pipeline', () => {
    const engine = new TowerDefenseEngine({
      paths: [
        [
          { x: 0, y: 0 },
          { x: 1000, y: 0 },
        ],
      ],
      placementSpots: [],
      waveEnemyDefinitions: [
        {
          id: 'cell_bars',
          level: 1,
          structure: {
            tdConfigId: 'cell_bars',
            displayName: 'CELL BARS',
            elementTypes: [ElementType.STEEL],
            maxHp: 200,
            defense: 30,
            specialDefense: 30,
            winsLevelOnDestroy: true,
          },
        },
        {
          id: 'mouse_guard',
          creatureId: 'mouse_1',
          level: 3,
        },
      ],
      waves: [
        {
          id: 'structure_wave',
          groups: [
            {
              enemyDefinitionId: 'cell_bars',
              count: 1,
              spawnIntervalMs: 0,
              delayBeforeGroupMs: 0,
              pathIndex: 0,
            },
            {
              enemyDefinitionId: 'mouse_guard',
              count: 1,
              spawnIntervalMs: 0,
              delayBeforeGroupMs: 0,
              pathIndex: 0,
              concurrentWithPrevious: true,
            },
          ],
        },
      ],
    });

    engine.tick(0, 16);

    const structure = engine.enemies.find(
      (enemy) => enemy.kind === 'structure'
    );
    const guard = engine.enemies.find((enemy) => enemy.kind === 'creature');
    expect(structure).toMatchObject({
      definitionId: 'cell_bars',
      speed: 0,
      maxHp: 200,
      uncapturable: true,
      elementTypes: [ElementType.STEEL],
      immuneToStatusEffects: true,
      winsLevelOnDestroy: true,
    });
    expect(guard).toBeDefined();

    const tower = { id: 'test_tower', position: { x: 0, y: 0 } } as Tower;
    expect(engine.getTargetForTower(tower, 1000)?.id).toBe(guard?.id);

    if (guard) guard.hp = 0;
    engine.tick(16, 16);
    expect(engine.getTargetForTower(tower, 1000)?.id).toBe(structure?.id);

    const moneyBeforeStructure = engine.money;
    const destroyedStructures: string[] = [];
    const unsubscribe = engine.events.subscribe((event) => {
      if (event.type === 'STRUCTURE_DESTROYED' && event.winsLevel) {
        destroyedStructures.push(event.structureId);
      }
    });
    if (structure) {
      structure.hp = 0;
      engine.emitEnemyDefeated(structure, tower);
    }
    expect(engine.hasDestroyedVictoryStructure).toBe(true);
    expect(destroyedStructures).toEqual(['cell_bars']);
    engine.tick(32, 16);
    expect(engine.money).toBe(moneyBeforeStructure);
    unsubscribe();
    engine.destroy();
  });

  it('uses structure typing and ignores status effects', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const engine = new TowerDefenseEngine({
      paths: [
        [
          { x: 0, y: 0 },
          { x: 1000, y: 0 },
        ],
      ],
      placementSpots: [],
      waveEnemyDefinitions: [
        {
          id: 'steel_target',
          level: 1,
          structure: {
            tdConfigId: 'steel_target',
            displayName: 'STEEL TARGET',
            elementTypes: [ElementType.STEEL],
            maxHp: 200,
            defense: 30,
            specialDefense: 30,
          },
        },
      ],
      waves: [
        {
          id: 'target_wave',
          groups: [
            {
              enemyDefinitionId: 'steel_target',
              count: 1,
              spawnIntervalMs: 0,
              delayBeforeGroupMs: 0,
              pathIndex: 0,
            },
          ],
        },
      ],
    });
    engine.tick(0, 16);
    const target = engine.enemies[0];
    const tower = {
      id: 'fire_tower',
      creature: { speciesId: 'starter_iguana', level: 8 },
      currentAttack: 60,
      currentSpecialAttack: 60,
    } as Tower;
    const attack = (type: ElementType): AttackDefinition => ({
      id: `TEST_${type}`,
      name: 'Test',
      type,
      category: 'special',
      power: 40,
      cooldownMs: 800,
      rangeIndex: 40,
      behaviorType: 'PROJECTILE',
      projectileSpeed: 1,
      effects: [{ type: 'POISON', chance: 1 }],
    });

    const initialHp = target.hp;
    EffectProcessor.applyDamageAndEffects(
      engine,
      tower,
      target,
      attack(ElementType.FIRE)
    );
    expect(target.hp).toBeLessThan(initialHp);
    expect(target.statusConditions).toEqual([]);

    const hpBeforePoison = target.hp;
    EffectProcessor.applyDamageAndEffects(
      engine,
      tower,
      target,
      attack(ElementType.POISON)
    );
    expect(target.hp).toBe(hpBeforePoison);
    expect(target.statusConditions).toEqual([]);
    engine.destroy();
    vi.restoreAllMocks();
  });
});
