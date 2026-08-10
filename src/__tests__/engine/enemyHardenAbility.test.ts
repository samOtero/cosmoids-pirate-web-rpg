import { describe, expect, it } from 'vitest';

import { BETTLE } from '@/constants/creatures';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
import { VANE_LEVEL } from '@/constants/tdLevels/vaneLevel';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { ENEMY_ABILITY_DEFS } from '@/engine/tower-defense/enemyAbilities';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';

const abilityTestLevel = {
  paths: [
    [
      { x: 0, y: 0 },
      { x: 10000, y: 0 },
    ],
  ],
  placementSpots: [],
  waveEnemyDefinitions: [
    {
      id: 'test_harden_bettle',
      creatureId: 'bettle',
      level: 1,
      abilityId: 'BETTLE_HARDEN',
    },
  ],
  waves: [
    {
      id: 'ability_wave',
      groups: [
        {
          enemyDefinitionId: 'test_harden_bettle',
          count: 1,
          spawnIntervalMs: 1,
          delayBeforeGroupMs: 0,
          pathIndex: 0,
        },
      ],
    },
  ],
};

describe('Bettle Harden enemy ability', () => {
  it('is an enemy-only, one-use ability assigned to the Level 3 Bettle', () => {
    expect(ENEMY_ABILITY_DEFS.BETTLE_HARDEN).toMatchObject({
      type: 'SELF_DEFENSE_BOOST',
      initialCooldownMs: 3000,
      oncePerFight: true,
      defenseMultiplier: 1.5,
      specialDefenseMultiplier: 1.5,
      visualEffectConfigId: 'enemy_harden_1',
    });
    expect(ATTACK_DEFS.BETTLE_HARDEN).toBeUndefined();
    expect(
      BETTLE.learnableAttacks.some(
        (attack) => attack.attackId === 'BETTLE_HARDEN'
      )
    ).toBe(false);
    expect(CREATURE_TD_CONFIGS.enemy_harden_1.default.vfxAnimation).toEqual(
      expect.objectContaining({ type: 'HARDEN' })
    );
    expect(VANE_LEVEL.waveEnemyDefinitions).toContainEqual(
      expect.objectContaining({
        id: 'vane_bettle_guard',
        creatureId: 'bettle',
        abilityId: 'BETTLE_HARDEN',
      })
    );
  });

  it('boosts both defenses for the rest of the fight and activates only once', () => {
    const engine = new TowerDefenseEngine(abilityTestLevel);

    engine.tick(1, 1);
    const bettle = engine.enemies[0];
    expect(bettle.abilityRuntime).toEqual({
      definitionId: 'BETTLE_HARDEN',
      nextReadyTimeMs: 3001,
    });
    const startingDefense = bettle.currentDefense;
    const startingSpecialDefense = bettle.currentSpecialDefense;

    engine.tick(3000, 2999);
    expect(bettle.currentDefense).toBe(startingDefense);
    expect(bettle.currentSpecialDefense).toBe(startingSpecialDefense);

    engine.tick(3001, 1);
    expect(bettle.currentDefense).toBeCloseTo(startingDefense * 1.5);
    expect(bettle.currentSpecialDefense).toBeCloseTo(
      startingSpecialDefense * 1.5
    );
    expect(bettle.defenseBoostMultiplier).toBe(1.5);
    expect(bettle.specialDefenseBoostMultiplier).toBe(1.5);
    expect(bettle.abilityRuntime?.hasActivated).toBe(true);
    expect(engine.visualEffects).toContainEqual(
      expect.objectContaining({
        configId: 'enemy_harden_1',
        targetId: bettle.id,
      })
    );
    expect(engine.floatingTexts).toContainEqual(
      expect.objectContaining({ text: 'Harden!' })
    );

    engine.tick(12000, 8999);
    expect(bettle.currentDefense).toBeCloseTo(startingDefense * 1.5);
    expect(bettle.currentSpecialDefense).toBeCloseTo(
      startingSpecialDefense * 1.5
    );
    expect(bettle.defenseBoostMultiplier).toBe(1.5);

    engine.destroy();
  });
});
