import { describe, expect, it } from 'vitest';

import { BIRD_1 } from '@/constants/creatures';
import { InstantAoeBehavior } from '@/engine/tower-defense/attacks/behaviors';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { CaptureUnit, Enemy, Tower } from '@/engine/tower-defense/types';
import { ElementType } from '@/types/baseGame';

const levelData = {
  paths: [
    [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ],
  ],
  placementSpots: [],
  waves: [{ id: 'empty', groups: [] }],
};

const createHarlequillTower = (): Tower => ({
  id: 'harlequill_tower',
  creature: {
    id: 'harlequill',
    speciesId: 'harlequill',
    level: 5,
    xp: 0,
    equippedAttacks: ['WIND_GUST'],
    isShiny: false,
  },
  position: { x: 0, y: 0 },
  lastAttackTime: 0,
  currentAttack: 15,
  currentSpecialAttack: 10,
  currentDefense: 20,
  currentSpecialDefense: 10,
  hp: 100,
  maxHp: 100,
  equippedAttacksRuntime: [{ definitionId: 'WIND_GUST', lastFiredTime: 0 }],
  selectedAttackIndex: 0,
  facingDirection: 'right',
  targetingMode: 'closest',
});

const createEnemy = (
  id: string,
  x: number,
  heldCaptureUnitId?: string
): Enemy => ({
  id,
  definitionId: 'mouse_1',
  level: 3,
  position: { x, y: 0 },
  hp: 100,
  maxHp: 100,
  speed: 0,
  currentAttack: 10,
  currentSpecialAttack: 10,
  currentDefense: 10,
  currentSpecialDefense: 10,
  statusConditions: [],
  currentWaypointIndex: 1,
  pathIndex: 0,
  facingDirection: 'right',
  heldCaptureUnitId,
  damagedByTowerIds: new Set(),
});

const createCaptureUnit = (
  id: string,
  x: number,
  heldByEnemyId?: string
): CaptureUnit => ({
  id,
  tdConfigId: id.startsWith('coin') ? 'coin_1' : 'food_supplies',
  position: { x, y: 0 },
  homePosition: { x, y: 0 },
  facingDirection: 'down',
  hp: 1,
  maxHp: 1,
  heldByEnemyId,
});

describe('Wind Gust', () => {
  it('is a non-damaging area attack learned by Harlequill at level 5', () => {
    expect(
      BIRD_1.learnableAttacks.find((attack) => attack.attackId === 'WIND_GUST')
    ).toEqual({ level: 5, attackId: 'WIND_GUST' });
    expect(ATTACK_DEFS.WIND_GUST).toMatchObject({
      type: ElementType.FLYING,
      power: 0,
      rangeIndex: 20,
      behaviorType: 'INSTANT_AOE',
      itemPickupLockMs: 2000,
      visualEffectConfigId: 'attack_wind_gust_1',
    });
  });

  it('drops every carried item in range while leaving it available to other enemies', () => {
    const engine = new TowerDefenseEngine(levelData);
    const carrierOne = createEnemy('carrier_one', 10, 'coin_one');
    const carrierTwo = createEnemy('carrier_two', 18, 'sack_one');
    const farCarrier = createEnemy('far_carrier', 40, 'coin_far');
    const unlockedReceiver = createEnemy('receiver', 10);
    const coin = createCaptureUnit('coin_one', 10, carrierOne.id);
    const sack = createCaptureUnit('sack_one', 18, carrierTwo.id);
    const farCoin = createCaptureUnit('coin_far', 40, farCarrier.id);
    engine.enemies = [carrierOne, carrierTwo, farCarrier, unlockedReceiver];
    engine.captureUnits = [coin, sack, farCoin];

    InstantAoeBehavior.execute(
      engine,
      createHarlequillTower(),
      ATTACK_DEFS.WIND_GUST
    );

    expect(carrierOne.heldCaptureUnitId).toBeUndefined();
    expect(carrierTwo.heldCaptureUnitId).toBeUndefined();
    expect(coin.heldByEnemyId).toBeUndefined();
    expect(sack.heldByEnemyId).toBeUndefined();
    expect(farCarrier.heldCaptureUnitId).toBe(farCoin.id);
    expect(farCoin.heldByEnemyId).toBe(farCarrier.id);
    expect(carrierOne.damagedByTowerIds).toEqual(
      new Set(['harlequill_tower'])
    );
    expect(carrierTwo.damagedByTowerIds).toEqual(
      new Set(['harlequill_tower'])
    );
    expect(farCarrier.damagedByTowerIds).toEqual(new Set());
    expect(unlockedReceiver.damagedByTowerIds).toEqual(new Set());
    expect(carrierOne).toMatchObject({
      hasBeenWindDisarmed: true,
      itemPickupBlockedUntilMs: 2000,
    });
    expect(carrierTwo).toMatchObject({
      hasBeenWindDisarmed: true,
      itemPickupBlockedUntilMs: 2000,
    });
    expect(coin).not.toHaveProperty('itemPickupBlockedUntilMs');
    expect(engine.visualEffects).toContainEqual(
      expect.objectContaining({
        configId: 'attack_wind_gust_1',
        position: { x: 0, y: 0 },
        rangeIndex: 20,
      })
    );

    engine.tick(0, 16);

    expect(unlockedReceiver.heldCaptureUnitId).toBe(coin.id);
    expect(coin.heldByEnemyId).toBe(unlockedReceiver.id);
    engine.destroy();
  });

  it('restores pickup after the lock but never lets Wind Gust disarm that enemy again', () => {
    const engine = new TowerDefenseEngine(levelData);
    const carrier = createEnemy('carrier', 10, 'coin_one');
    const coin = createCaptureUnit('coin_one', 10, carrier.id);
    const harlequill = createHarlequillTower();
    engine.enemies = [carrier];
    engine.captureUnits = [coin];

    InstantAoeBehavior.execute(engine, harlequill, ATTACK_DEFS.WIND_GUST);
    engine.tick(0, 1000);
    expect(carrier.heldCaptureUnitId).toBeUndefined();

    engine.tick(1000, 1001);
    expect(carrier.heldCaptureUnitId).toBe(coin.id);
    expect(coin.heldByEnemyId).toBe(carrier.id);
    expect(
      InstantAoeBehavior.canExecute(engine, harlequill, ATTACK_DEFS.WIND_GUST)
    ).toBe(false);

    InstantAoeBehavior.execute(engine, harlequill, ATTACK_DEFS.WIND_GUST);
    expect(carrier.heldCaptureUnitId).toBe(coin.id);
    expect(coin.heldByEnemyId).toBe(carrier.id);
    engine.destroy();
  });
});
