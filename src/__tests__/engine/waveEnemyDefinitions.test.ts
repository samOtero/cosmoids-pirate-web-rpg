import { describe, expect, it } from 'vitest';

import {
  TD_CREATURE_DEFS,
  TowerDefenseEngine,
} from '@/engine/tower-defense/TowerDefenseEngine';
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
      currentSpecialDefense:
        calculateStat(mouse.specialDefense, 7) * 2.5,
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
});
