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
        { x: 45, y: 20 },
        { x: 65, y: 20 },
        { x: 25, y: 80 },
      ],
      safePlacementSpotIndices: [3],
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
  it('is assigned to stationary Level 6 Voltusk with the recovery placements safe', () => {
    expect(ENEMY_ABILITY_DEFS.VOLTUSK_ELECTRIC_ORB).toMatchObject({
      type: 'TOWER_GROUND_ORB',
      initialCooldownMs: 2500,
      cooldownMs: 4500,
      projectileTravelMs: 1400,
      aimDurationMs: 350,
      maxHpDamageFraction: 0.25,
      impactRadius: 4,
      targetCount: 1,
      cursedTargetCount: 3,
    });
    expect(LEVEL_6.safePlacementSpotIndices).toEqual([3, 5]);
    expect(
      LEVEL_6.waveEnemyDefinitions.find(
        (definition) => definition.id === 'level_6_voltusk'
      )
    ).toMatchObject({
      stationaryPosition: { x: 85, y: 14 },
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

  it('marks up to three distinct occupied combat spots while cursed', () => {
    const engine = createEngine(['one', 'two', 'three', 'safe']);
    expect(engine.placeTower('one', 25, 20)).toBe(true);
    expect(engine.placeTower('two', 45, 20)).toBe(true);
    expect(engine.placeTower('three', 65, 20)).toBe(true);
    expect(engine.placeTower('safe', 25, 80)).toBe(true);
    engine.enemies[0].isCursed = true;

    engine.tick(0, 2500);

    expect(engine.enemyGroundOrbs).toHaveLength(3);
    expect(
      new Set(
        engine.enemyGroundOrbs.map(
          (orb) => `${orb.targetPosition.x},${orb.targetPosition.y}`
        )
      )
    ).toEqual(new Set(['25,20', '45,20', '65,20']));
  });

  it('triggers the Level 6 cursed phase once at 30% health', () => {
    const engine = new TowerDefenseEngine({
      paths: [
        [
          { x: 0, y: 50 },
          { x: 100, y: 50 },
        ],
      ],
      placementSpots: [],
      waves: [],
      cursedPhase: LEVEL_6.cursedPhase,
    });
    engines.push(engine);
    const voltusk = engine.spawnPreviewEnemy({
      id: 'phase-voltusk',
      creatureId: 'voltusk',
      level: 10,
      position: { x: 50, y: 10 },
      abilityId: 'VOLTUSK_ELECTRIC_ORB',
      manualAbilityOnly: true,
    })!;
    voltusk.waveEnemyDefinitionId = 'level_6_voltusk';
    const phaseEvents: unknown[] = [];
    engine.events.subscribe((event) => {
      if (event.type === 'CURSED_PHASE_TRIGGERED') phaseEvents.push(event);
    });

    voltusk.hp = voltusk.maxHp * 0.31;
    engine.tick(0, 1);
    expect(phaseEvents).toHaveLength(0);

    voltusk.hp = voltusk.maxHp * 0.3;
    engine.tick(0, 1);
    expect(phaseEvents).toEqual([
      expect.objectContaining({
        enemyId: 'phase-voltusk',
        enemyDefinitionId: 'voltusk',
      }),
    ]);
    expect(voltusk.isCursed).not.toBe(true);
    expect(engine.activateCursedPhase(voltusk.id)).toBe(true);
    expect(voltusk.isCursed).toBe(true);

    engine.tick(0, 1);
    expect(phaseEvents).toHaveLength(1);
    expect(engine.activateCursedPhase(voltusk.id)).toBe(false);
  });
});
