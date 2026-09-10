import { afterEach, describe, expect, it } from 'vitest';

import { LEVEL_6 } from '@/constants/tdLevels/level6';
import { ENEMY_ABILITY_DEFS } from '@/engine/tower-defense/enemyAbilities';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import type { PlayerCreature } from '@/types/baseGame';

const engines: TowerDefenseEngine[] = [];

afterEach(() => {
  engines.forEach((engine) => engine.destroy());
  engines.length = 0;
});

function createCreature(id: string): PlayerCreature {
  return {
    id,
    speciesId: 'mopup',
    level: 8,
    xp: 0,
    equippedAttacks: ['TACKLE'],
    activeAttackIndex: 0,
    targetingMode: 'first',
    isShiny: false,
  };
}

function createEngine(creatureIds: string[]) {
  const engine = new TowerDefenseEngine(
    {
      paths: [
        [
          { x: 0, y: 50 },
          { x: 100, y: 50 },
        ],
      ],
      placementSpots: [
        { x: 25, y: 20 },
        { x: 25, y: 80 },
      ],
      safePlacementSpotIndices: [1],
      waves: [],
    },
    creatureIds.map(createCreature)
  );
  engines.push(engine);
  engine.spawnPreviewEnemy({
    id: 'voltusk',
    creatureId: 'voltusk',
    level: 10,
    position: { x: 50, y: 10 },
    abilityId: 'VOLTUSK_ELECTRIC_ORB',
    isInvulnerable: true,
    manualAbilityOnly: false,
  });
  return engine;
}

describe('Voltusk Electric Orb enemy ability', () => {
  it('is assigned to stationary Level 6 Voltusk with the lower placements safe', () => {
    expect(ENEMY_ABILITY_DEFS.VOLTUSK_ELECTRIC_ORB).toMatchObject({
      type: 'TOWER_GROUND_ORB',
      initialCooldownMs: 2500,
      cooldownMs: 4500,
      projectileTravelMs: 1400,
      aimDurationMs: 350,
      maxHpDamageFraction: 0.25,
      impactRadius: 4,
    });
    expect(LEVEL_6.safePlacementSpotIndices).toEqual([3, 4, 5]);
    expect(
      LEVEL_6.waveEnemyDefinitions.find(
        (definition) => definition.id === 'level_6_voltusk'
      )
    ).toMatchObject({
      stationaryPosition: { x: 50, y: 12 },
      abilityId: 'VOLTUSK_ELECTRIC_ORB',
    });
  });

  it('snapshots an occupied combat spot and misses after its tower moves to safety', () => {
    const engine = createEngine(['dodger']);
    expect(engine.placeTower('dodger', 25, 20)).toBe(true);
    const tower = engine.towers[0];
    const startingHp = tower.hp;

    engine.tick(0, 2499);
    expect(engine.enemyGroundOrbs).toHaveLength(0);
    engine.tick(0, 1);
    expect(engine.enemies[0].facingDirection).toBe('left');
    expect(engine.enemyGroundOrbs).toContainEqual(
      expect.objectContaining({
        sourceEnemyId: 'voltusk',
        sourcePosition: { x: 50, y: 10 },
        targetPosition: { x: 25, y: 20 },
        launchedAtMs: 2500,
        impactAtMs: 3900,
      })
    );

    engine.tick(0, 349);
    expect(engine.enemies[0].facingDirection).toBe('left');
    engine.tick(0, 1);
    expect(engine.enemies[0].facingDirection).toBe('down');

    expect(engine.placeTower('dodger', 25, 80)).toBe(true);
    engine.tick(0, 1049);
    engine.tick(0, 1);

    expect(tower.hp).toBe(startingHp);
    expect(engine.enemyGroundOrbs[0].impactedAtMs).toBe(3900);
    expect(engine.floatingTexts).toContainEqual(
      expect.objectContaining({
        text: 'DODGED!',
        position: { x: 25, y: 20 },
      })
    );

    engine.tick(0, 3100);
    expect(engine.enemyGroundOrbs).toHaveLength(0);
    expect(tower.hp).toBe(startingHp);
  });

  it('damages whichever tower occupies the marked location on impact', () => {
    const engine = createEngine(['original-target', 'replacement']);
    const damageEvents: unknown[] = [];
    engine.events.subscribe((event) => {
      if (event.type === 'TOWER_DAMAGED') damageEvents.push(event);
    });
    expect(engine.placeTower('original-target', 25, 20)).toBe(true);
    expect(engine.placeTower('replacement', 25, 80)).toBe(true);
    const originalTarget = engine.towers.find(
      (tower) => tower.creature.id === 'original-target'
    )!;
    const replacement = engine.towers.find(
      (tower) => tower.creature.id === 'replacement'
    )!;
    const originalHp = originalTarget.hp;
    const replacementHp = replacement.hp;

    engine.tick(0, 2500);
    expect(engine.enemyGroundOrbs).toHaveLength(1);
    expect(engine.placeTower('replacement', 25, 20)).toBe(true);
    engine.tick(0, 1399);
    engine.tick(0, 1);

    expect(originalTarget.hp).toBe(originalHp);
    expect(replacement.hp).toBe(
      replacementHp - Math.floor(replacement.maxHp * 0.25)
    );
    expect(replacement.damageFlashTimerMs).toBeGreaterThan(0);
    expect(engine.floatingTexts).toContainEqual(
      expect.objectContaining({
        text: Math.floor(replacement.maxHp * 0.25).toString(),
        position: { x: 25, y: 20 },
      })
    );
    expect(damageEvents).toContainEqual(
      expect.objectContaining({
        towerId: replacement.id,
        creatureId: 'replacement',
        sourceEnemyId: 'voltusk',
        damage: Math.floor(replacement.maxHp * 0.25),
      })
    );
  });
});
