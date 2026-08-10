import { describe, expect, it } from 'vitest';

import { BUG_STAGE_3 } from '@/constants/creatures';
import { VANE_LEVEL } from '@/constants/tdLevels/vaneLevel';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { ENEMY_ABILITY_DEFS } from '@/engine/tower-defense/enemyAbilities';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { hasActiveSpeedBoost } from '@/engine/tower-defense/speedModifiers';
import { Enemy } from '@/engine/tower-defense/types';

const abilityTestLevel = {
  paths: [
    [
      { x: 0, y: 0 },
      { x: 1000, y: 0 },
    ],
  ],
  placementSpots: [],
  waveEnemyDefinitions: [
    {
      id: 'test_tailwind_moth',
      creatureId: 'bug_stage_3',
      level: 8,
      abilityId: 'MOTH_TAILWIND',
    },
  ],
  waves: [
    {
      id: 'ability_wave',
      groups: [
        {
          enemyDefinitionId: 'test_tailwind_moth',
          count: 1,
          spawnIntervalMs: 1,
          delayBeforeGroupMs: 0,
          pathIndex: 0,
        },
      ],
    },
  ],
};

const createAlly = (): Enemy => ({
  id: 'ally',
  definitionId: 'bug_stage_1',
  level: 3,
  position: { x: 0, y: 0 },
  hp: 100,
  maxHp: 100,
  speed: 0.1,
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

describe('Moth Tailwind enemy ability', () => {
  it('keeps the speed-buffing version enemy-only and places its caster in level three', () => {
    expect(ENEMY_ABILITY_DEFS.MOTH_TAILWIND).toMatchObject({
      initialCooldownMs: 7000,
      cooldownMs: 12000,
      durationMs: 4000,
      speedMultiplier: 1.6,
    });
    expect(ATTACK_DEFS.MOTH_TAILWIND).toBeUndefined();
    expect(
      BUG_STAGE_3.learnableAttacks.some(
        (attack) => attack.attackId === 'MOTH_TAILWIND'
      )
    ).toBe(false);
    expect(VANE_LEVEL.waveEnemyDefinitions).toContainEqual(
      expect.objectContaining({
        id: 'vane_tailwind_moth',
        creatureId: 'bug_stage_3',
        abilityId: 'MOTH_TAILWIND',
      })
    );
    expect(
      VANE_LEVEL.waves.some((wave) =>
        wave.groups.some(
          (group) => group.enemyDefinitionId === 'vane_tailwind_moth'
        )
      )
    ).toBe(true);
  });

  it('only speeds allies present when it casts, excluding itself and later spawns', () => {
    const engine = new TowerDefenseEngine(abilityTestLevel);

    engine.tick(1, 1);
    const moth = engine.enemies.find(
      (enemy) => enemy.definitionId === 'bug_stage_3'
    );
    expect(moth?.abilityRuntime).toEqual({
      definitionId: 'MOTH_TAILWIND',
      nextReadyTimeMs: 7001,
    });
    expect(moth?.waveEnemyDefinitionId).toBe('test_tailwind_moth');

    engine.tick(7000, 6999);
    expect(engine.visualEffects).toHaveLength(0);

    engine.tick(7001, 1);
    expect(engine.visualEffects).toHaveLength(0);
    expect(moth?.abilityRuntime?.nextReadyTimeMs).toBe(7001);

    const ally = createAlly();
    engine.enemies.push(ally);
    const mothPositionBeforeCast = moth?.position.x ?? 0;
    const allyPositionBeforeCast = ally.position.x;
    engine.tick(7002, 1);
    expect(engine.visualEffects).toContainEqual(
      expect.objectContaining({
        configId: 'attack_wind_gust_1',
        targetId: moth?.id,
        rangeIndex: 100,
      })
    );

    const lateAlly = createAlly();
    lateAlly.id = 'late_ally';
    engine.enemies.push(lateAlly);

    engine.tick(8002, 1000);
    expect(hasActiveSpeedBoost(ally, engine.elapsedTimeMs)).toBe(true);
    expect(ally.position.x - allyPositionBeforeCast).toBeCloseTo(9.6, 1);
    expect((moth?.position.x ?? 0) - mothPositionBeforeCast).toBeCloseTo(
      ((moth?.speed ?? 0) * 1001) / 16.666,
      5
    );
    expect(lateAlly.position.x).toBeCloseTo(6, 1);
    expect(moth?.speedBoostUntilMs).toBeUndefined();
    expect(lateAlly.speedBoostUntilMs).toBeUndefined();

    engine.tick(11002, 3000);
    expect(hasActiveSpeedBoost(ally, engine.elapsedTimeMs)).toBe(false);
    const afterBoost = ally.position.x;
    engine.tick(12002, 1000);
    expect(ally.position.x - afterBoost).toBeCloseTo(6, 1);

    engine.destroy();
  });
});
