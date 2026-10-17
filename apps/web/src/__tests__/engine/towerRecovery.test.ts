import { SpeciesId, AttackId } from '@/types/definitionIds';
import { makePlayerCreature } from '@/__tests__/utils/dataBuilders';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import type { PlayerCreature } from '@/types/baseGame';

const engines: TowerDefenseEngine[] = [];

afterEach(() => {
  engines.forEach((engine) => engine.destroy());
  engines.length = 0;
});

function createCreature(): PlayerCreature {
  return makePlayerCreature({
    id: 'patient',
    speciesId: SpeciesId.MOPUP,
    level: 8,
    equippedAttacks: [AttackId.TACKLE],
    activeAttackIndex: 0,
    targetingMode: 'first',
  });
}

function createEngine() {
  const engine = new TowerDefenseEngine(
    {
      paths: [],
      placementSpots: [
        { x: 25, y: 25 },
        { x: 50, y: 80 },
      ],
      waveEnemyDefinitions: [],
      waves: [],
      towerRecovery: {
        placementSpotIndices: [1],
        healerPosition: { x: 50, y: 90 },
        healerIdleFacingDirection: 'down',
        healFraction: 0.25,
        feedingIntervalMs: 1000,
      },
      environmentUnits: [
        {
          tdConfigId: 'maribel_capture',
          position: { x: 50, y: 90 },
          facingDirection: 'down',
        },
      ],
    },
    [createCreature()]
  );
  engines.push(engine);
  return engine;
}

describe('tower recovery feeding', () => {
  it('tosses food and heals an injured tower moved onto a recovery spot', () => {
    const engine = createEngine();
    const healed = vi.fn();
    engine.events.subscribe((event) => {
      if (event.type === 'TOWER_HEALED') healed(event);
    });

    expect(engine.placeTower('patient', 25, 25)).toBe(true);
    const tower = engine.towers[0];
    tower.hp = Math.floor(tower.maxHp * 0.5);

    expect(engine.placeTower('patient', 50, 80)).toBe(true);
    expect(engine.isTowerOnRecoverySpot(tower)).toBe(true);
    expect(engine.towerRecoveryFeeds).toContainEqual(
      expect.objectContaining({
        towerId: tower.id,
        sourcePosition: { x: 50, y: 90 },
        targetPosition: { x: 50, y: 80 },
      })
    );

    const hpBeforeFoodArrives = tower.hp;
    engine.tick(0, 449);
    expect(tower.hp).toBe(hpBeforeFoodArrives);
    engine.tick(0, 1);

    const expectedHeal = Math.ceil(tower.maxHp * 0.25);
    expect(tower.hp).toBe(hpBeforeFoodArrives + expectedHeal);
    expect(healed).toHaveBeenCalledWith(
      expect.objectContaining({
        creatureId: 'patient',
        amount: expectedHeal,
      })
    );
    expect(engine.floatingTexts).toContainEqual(
      expect.objectContaining({ text: `+${expectedHeal} HP` })
    );
  });

  it('feeds an injured occupant again after the configured interval', () => {
    const engine = createEngine();
    expect(engine.placeTower('patient', 25, 25)).toBe(true);
    const tower = engine.towers[0];
    tower.hp = Math.floor(tower.maxHp * 0.1);
    expect(engine.placeTower('patient', 50, 80)).toBe(true);

    engine.tick(0, 450);
    const hpAfterFirstMeal = tower.hp;
    engine.tick(0, 550);
    expect(engine.towerRecoveryFeeds).toContainEqual(
      expect.objectContaining({ startedAtMs: 1000 })
    );
    expect(engine.towerRecoveryFeeds[0].impactedAtMs).toBeUndefined();
    engine.tick(0, 450);

    expect(tower.hp).toBeGreaterThan(hpAfterFirstMeal);
  });

  it('does not feed an injured tower outside the recovery area', () => {
    const engine = createEngine();
    expect(engine.placeTower('patient', 25, 25)).toBe(true);
    const tower = engine.towers[0];
    tower.hp -= 10;

    engine.tick(0, 2000);

    expect(engine.towerRecoveryFeeds).toHaveLength(0);
    expect(tower.hp).toBe(tower.maxHp - 10);
  });

  it('faces the injured recovery target, then returns to the idle facing', () => {
    const engine = createEngine();
    const healer = engine.environmentUnits[0];
    expect(healer.facingDirection).toBe('down');

    expect(engine.placeTower('patient', 25, 25)).toBe(true);
    const tower = engine.towers[0];
    tower.hp -= 10;
    expect(engine.placeTower('patient', 50, 80)).toBe(true);

    engine.tick(0, 1);
    expect(healer.facingDirection).toBe('up');
    expect(engine.towerRecoveryTargetTowerId).toBe(tower.id);

    tower.hp = tower.maxHp;
    engine.tick(0, 1);
    expect(healer.facingDirection).toBe('down');
    expect(engine.towerRecoveryTargetTowerId).toBeUndefined();
  });
});
