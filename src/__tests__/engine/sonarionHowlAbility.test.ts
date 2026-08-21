import { describe, expect, it } from 'vitest';

import { LEVEL_4 } from '@/constants/tdLevels/level4';
import { ENEMY_ABILITY_DEFS } from '@/engine/tower-defense/enemyAbilities';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { TDLevelData } from '@/engine/tower-defense/types';

const createLevel = (): TDLevelData => ({
  paths: [
    [
      { x: 0, y: 50 },
      { x: 100, y: 50 },
    ],
  ],
  placementSpots: [],
  captureUnits: [
    {
      tdConfigId: 'maribel_capture',
      position: { x: 50, y: 50 },
      carrierSpeedMultiplier: 0.5,
    },
  ],
  waveEnemyDefinitions: [
    {
      id: 'support',
      creatureId: 'sonarion',
      level: 5,
      canCarryCaptureUnits: false,
      abilityId: 'SONARION_HOWL',
    },
  ],
  waves: [],
});

function addEnemy(
  engine: TowerDefenseEngine,
  id: string,
  creatureId: 'sonarion' | 'resonarion',
  x: number,
  abilityId?: string
) {
  const enemy = engine.spawnPreviewEnemy({
    id,
    creatureId,
    level: creatureId === 'sonarion' ? 5 : 8,
    position: { x, y: 50 },
    abilityId,
    manualAbilityOnly: false,
  });
  if (!enemy) throw new Error(`Expected ${creatureId} to spawn`);
  if (creatureId === 'sonarion') enemy.waveEnemyDefinitionId = 'support';
  return enemy;
}

describe('Sonarion Howl enemy ability', () => {
  it('is configured only on the Level 4 Sonarion support variant', () => {
    expect(ENEMY_ABILITY_DEFS.SONARION_HOWL).toMatchObject({
      type: 'PROXIMITY_HOWL_SPEED_STACK',
      cooldownMs: 1400,
      triggerRadius: 11,
      targetCreatureId: 'resonarion',
      maxActivations: 3,
      speedIncreasePerActivation: 0.05,
      maxSpeedMultiplier: 5,
    });
    expect(LEVEL_4.resonantEvolution).toBeUndefined();
    expect(
      LEVEL_4.waveEnemyDefinitions.find(
        (definition) => definition.id === 'ironbell_sonarion'
      )?.abilityId
    ).toBe('SONARION_HOWL');
  });

  it('buffs only currently spawned Resonarion and disappears after three howls', () => {
    const engine = new TowerDefenseEngine(createLevel());
    const sonarion = addEnemy(
      engine,
      'sonarion',
      'sonarion',
      45,
      'SONARION_HOWL'
    );
    const original = addEnemy(engine, 'original', 'resonarion', 20);

    engine.tick(0, 16);
    expect(original.persistentSpeedBoostMultiplier).toBe(1.05);
    expect(sonarion.abilityRuntime?.activationCount).toBe(1);

    const lateArrival = addEnemy(engine, 'late', 'resonarion', 30);
    expect(lateArrival.persistentSpeedBoostMultiplier).toBeUndefined();

    // Once triggered, the sequence continues while Sonarion retreats and even
    // if Mari is carried away from its original position.
    sonarion.position.x = 20;
    engine.captureUnits[0].position.x = 80;
    engine.tick(1400, 1400);
    expect(original.persistentSpeedBoostMultiplier).toBe(1.1);
    expect(lateArrival.persistentSpeedBoostMultiplier).toBe(1.05);
    expect(sonarion.abilityRuntime?.activationCount).toBe(2);

    engine.tick(2800, 1400);
    expect(original.persistentSpeedBoostMultiplier).toBeCloseTo(1.15);
    expect(lateArrival.persistentSpeedBoostMultiplier).toBe(1.1);
    expect(engine.enemies.some((enemy) => enemy.id === sonarion.id)).toBe(
      false
    );

    engine.destroy();
  });

  it('does not begin howling until Sonarion reaches Mari', () => {
    const engine = new TowerDefenseEngine(createLevel());
    const sonarion = addEnemy(
      engine,
      'sonarion',
      'sonarion',
      20,
      'SONARION_HOWL'
    );
    const resonarion = addEnemy(engine, 'resonarion', 'resonarion', 10);

    engine.tick(0, 16);
    expect(sonarion.abilityRuntime?.activationCount).toBeUndefined();
    expect(resonarion.persistentSpeedBoostMultiplier).toBeUndefined();

    sonarion.position.x = 45;
    engine.tick(16, 16);
    expect(sonarion.abilityRuntime?.activationCount).toBe(1);
    expect(resonarion.persistentSpeedBoostMultiplier).toBe(1.05);

    engine.destroy();
  });

  it('applies Mari slowdown after a fully stacked howl multiplier', () => {
    const engine = new TowerDefenseEngine(createLevel());
    const carrier = addEnemy(engine, 'carrier', 'resonarion', 0);
    const mari = engine.captureUnits[0];
    mari.position = { ...carrier.position };
    mari.heldByEnemyId = carrier.id;
    carrier.heldCaptureUnitId = mari.id;
    carrier.speed = 1;
    carrier.persistentSpeedBoostMultiplier = 5;

    engine.tick(0, 16);

    expect(carrier.position.x).toBeCloseTo((1 * 5 * 0.5 * 16) / 16.666, 5);

    engine.destroy();
  });
});
