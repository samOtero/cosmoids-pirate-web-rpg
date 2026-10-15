import { describe, expect, it } from 'vitest';
import { TD_CREATURE_DEFS } from '@/engine/tower-defense/TowerDefenseEngine';
import {
  calculateMaxHp,
  calculateStat,
  resolvePlayerCreature,
} from '@/utils/resolvePlayerCreature';
import type { TDWaveGroup } from '@/engine/tower-defense/types';
import { actor, battle, battleSpecies } from './behaviorFixtures';

function wave(group: Partial<TDWaveGroup> = {}) {
  return [
    {
      id: 'test_wave',
      groups: [
        {
          enemyDefinitionId: 'test_enemy',
          count: 1,
          spawnIntervalMs: 0,
          delayBeforeGroupMs: 0,
          pathIndex: 0,
          ...group,
        },
      ],
    },
  ];
}

describe('level combat rules', () => {
  it.each([undefined, false, true])(
    'loads encounter displacement immunity=%s independently of zero movement speed',
    (immuneToDisplacement) => {
      const fixture = battleSpecies('test_anchored_species');
      const anchor = { x: 50, y: 20 };
      const engine = battle({
        waveEnemyDefinitions: [
          {
            id: 'test_enemy',
            creatureId: fixture.id,
            level: 5,
            stationaryPosition: anchor,
            immuneToDisplacement,
          },
        ],
        waves: wave(),
      });
      engine.tick(0, 16);
      const enemy = engine.enemies[0];
      expect(enemy.speed).toBe(0);
      const waypoint = enemy.currentWaypointIndex;
      engine.pushEnemyAgainstMovement(enemy, 10);
      engine.pushEnemyAgainstMovement(enemy, -10);
      if (immuneToDisplacement) {
        expect(enemy.position).toEqual(anchor);
        expect(enemy.currentWaypointIndex).toBe(waypoint);
      } else {
        expect(enemy.position.y).toBe(engine.paths[0][0].y);
      }
    }
  );

  it('keeps a fixed guest defender in place without adding it to the player roster', () => {
    const fixture = battleSpecies('test_guest');
    const creature = {
      id: 'test_guest_instance',
      speciesId: fixture.id,
      level: 5,
      xp: 0,
      equippedAttacks: [],
      gender: 'female' as const,
      isShiny: false,
    };
    const position = { x: 20, y: 30 };
    const engine = battle({
      startingTowers: [{ creature, position, isFixed: true }],
    });
    const tower = engine.towers[0];
    expect(tower.creature).toEqual(creature);
    expect(engine.roster).toEqual([]);
    expect(tower.receivesExperience).toBe(false);
    expect(engine.removeTower(creature.id)).toBe(false);
    expect(engine.placeTower(creature.id, 40, 30)).toBe(false);
    expect(engine.towers).toContain(tower);
    expect(tower.position).toEqual(position);
  });

  it.each([
    { uncapturable: false, isCursed: false, canCapture: true },
    { uncapturable: true, isCursed: false, canCapture: false },
    { uncapturable: false, isCursed: true, canCapture: false },
  ])(
    'applies capture restrictions: $uncapturable, cursed: $isCursed',
    ({ uncapturable, isCursed, canCapture }) => {
      battleSpecies('test_species');
      const engine = battle({
        waveEnemyDefinitions: [
          { id: 'test_enemy', creatureId: 'test_species', level: 5 },
        ],
        waves: wave({ uncapturable, isCursed }),
      });
      engine.tick(0, 16);
      const enemy = engine.enemies[0];
      expect(enemy.uncapturable).toBe(!canCapture);
      const captured = engine.captureEnemy(enemy.id);
      if (canCapture) {
        expect(captured).toMatchObject({ speciesId: 'test_species', level: 5 });
        expect(engine.enemies).not.toContain(enemy);
      } else {
        expect(captured).toBeNull();
        expect(engine.enemies).toContain(enemy);
      }
    }
  );

  it('applies enemy multipliers to battlefield stats without carrying them into a capture', () => {
    const fixture = battleSpecies('test_species');
    const level = 4;
    const engine = battle({
      enemyHpMultiplier: 2,
      waveEnemyDefinitions: [
        {
          id: 'test_enemy',
          creatureId: fixture.id,
          level,
          hpMultiplier: 3,
          defenseMultiplier: 2.5,
          specialDefenseMultiplier: 3,
        },
      ],
      waves: wave(),
    });
    engine.tick(0, 16);
    const enemy = engine.enemies[0];
    const base = TD_CREATURE_DEFS[fixture.id].baseCreature;
    expect(enemy.maxHp).toBe(calculateMaxHp(base.maxHp, level) * 2 * 3);
    expect(enemy.hp).toBe(enemy.maxHp);
    expect(enemy.currentDefense).toBe(calculateStat(base.defense, level) * 2.5);
    expect(enemy.currentSpecialDefense).toBe(
      calculateStat(base.specialDefense, level) * 3
    );
    expect(enemy.waveEnemyDefinitionId).toBe('test_enemy');
    const captured = engine.captureEnemy(enemy.id);
    expect(captured).not.toBeNull();
    expect(resolvePlayerCreature(captured!).maxHp).toBe(
      calculateMaxHp(fixture.baseStats.hp, level)
    );
    expect(resolvePlayerCreature(captured!).maxHp).not.toBe(enemy.maxHp);
    expect(captured?.level).toBe(level);
  });

  it.each([false, true])(
    'handles an enemy reaching the goal with cannotLose=%s',
    (cannotLose) => {
      battleSpecies('test_species');
      const engine = battle({ lives: 2, cannotLose });
      const enemy = actor(engine, 'goal_enemy', 'test_species', 1000);
      enemy.currentWaypointIndex = engine.paths[0].length;
      engine.tick(0, 16);
      expect(engine.enemies).not.toContain(enemy);
      expect(engine.lives).toBe(cannotLose ? 2 : 1);
    }
  );
});
