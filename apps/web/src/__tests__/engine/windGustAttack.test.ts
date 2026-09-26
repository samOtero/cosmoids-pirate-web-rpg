import { describe, expect, it } from 'vitest';

import { BIRD_1, BUFFLORA } from '@/constants/creatures';
import {
  FunnyDanceBehavior,
  InstantAoeBehavior,
} from '@/engine/tower-defense/attacks/behaviors';
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
    equippedAttacks: ['FUNNY_DANCE'],
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
  equippedAttacksRuntime: [{ definitionId: 'FUNNY_DANCE', lastFiredTime: 0 }],
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

describe('Funny Dance', () => {
  it('is Harlequill\'s long-range Normal utility move', () => {
    expect(
      BIRD_1.learnableAttacks.find((attack) => attack.attackId === 'FUNNY_DANCE')
    ).toEqual({ level: 5, attackId: 'FUNNY_DANCE' });
    expect(ATTACK_DEFS.FUNNY_DANCE).toMatchObject({
      name: 'Funny Dance',
      type: ElementType.NORMAL,
      power: 0,
      rangeIndex: 60,
      behaviorType: 'FUNNY_DANCE',
      itemPickupLockMs: 2500,
      visualEffectConfigId: 'attack_funny_dance_1',
    });
  });

  it('only affects carrying enemies and locks pickup only for the disarmed carriers', () => {
    const engine = new TowerDefenseEngine(levelData);
    const carrierOne = createEnemy('carrier_one', 10, 'coin_one');
    const carrierTwo = createEnemy('carrier_two', 18, 'sack_one');
    const farCarrier = createEnemy('far_carrier', 70, 'coin_far');
    const unlockedReceiver = createEnemy('receiver', 10);
    const coin = createCaptureUnit('coin_one', 10, carrierOne.id);
    const sack = createCaptureUnit('sack_one', 18, carrierTwo.id);
    const farCoin = createCaptureUnit('coin_far', 70, farCarrier.id);
    engine.enemies = [carrierOne, carrierTwo, farCarrier, unlockedReceiver];
    engine.captureUnits = [coin, sack, farCoin];
    const harlequill = createHarlequillTower();

    FunnyDanceBehavior.execute(
      engine,
      harlequill,
      ATTACK_DEFS.FUNNY_DANCE
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
      itemPickupBlockedUntilMs: 2500,
      funnyDanceReaction: { startedAtMs: 0, endsAtMs: 650 },
    });
    expect(carrierTwo).toMatchObject({
      hasBeenWindDisarmed: true,
      itemPickupBlockedUntilMs: 2500,
      funnyDanceReaction: { startedAtMs: 0, endsAtMs: 650 },
    });
    expect(unlockedReceiver).not.toHaveProperty('funnyDanceReaction');
    expect(unlockedReceiver).not.toHaveProperty('itemPickupBlockedUntilMs');
    expect(farCarrier).not.toHaveProperty('funnyDanceReaction');
    expect(harlequill.funnyDance).toEqual({
      startedAtMs: 0,
      endsAtMs: 900,
    });
    expect(coin).not.toHaveProperty('itemPickupBlockedUntilMs');
    expect(engine.visualEffects).toContainEqual(
      expect.objectContaining({
        configId: 'attack_funny_dance_1',
        position: { x: 0, y: 0 },
        rangeIndex: 60,
        targetIds: ['carrier_one', 'carrier_two'],
      })
    );

    engine.tick(0, 16);

    // CarrierOne is blocked for 2500ms, but unlockedReceiver was not locked, so receiver picks up coin
    expect(carrierOne.heldCaptureUnitId).toBeUndefined();
    expect(unlockedReceiver.heldCaptureUnitId).toBe(coin.id);
    expect(coin.heldByEnemyId).toBe(unlockedReceiver.id);
    engine.destroy();
  });

  it('restores pickup after the lock and never forces or locks the same enemy twice', () => {
    const engine = new TowerDefenseEngine(levelData);
    const carrier = createEnemy('carrier', 10, 'coin_one');
    const coin = createCaptureUnit('coin_one', 10, carrier.id);
    const harlequill = createHarlequillTower();
    engine.enemies = [carrier];
    engine.captureUnits = [coin];

    FunnyDanceBehavior.execute(engine, harlequill, ATTACK_DEFS.FUNNY_DANCE);
    expect(carrier.heldCaptureUnitId).toBeUndefined();
    expect(coin.heldByEnemyId).toBeUndefined();
    expect(carrier.hasBeenWindDisarmed).toBe(true);
    expect(carrier.itemPickupBlockedUntilMs).toBe(2500);

    engine.tick(0, 1000);
    expect(carrier.heldCaptureUnitId).toBeUndefined();

    // After 2500ms expiration, carrier re-acquires the coin
    engine.tick(1500, 1501);
    expect(carrier.heldCaptureUnitId).toBe(coin.id);
    expect(coin.heldByEnemyId).toBe(carrier.id);
    expect(
      FunnyDanceBehavior.canExecute(
        engine,
        harlequill,
        ATTACK_DEFS.FUNNY_DANCE
      )
    ).toBe(false);

    // Second execution must not disarm or re-lock carrier
    FunnyDanceBehavior.execute(engine, harlequill, ATTACK_DEFS.FUNNY_DANCE);
    expect(carrier.heldCaptureUnitId).toBe(coin.id);
    expect(coin.heldByEnemyId).toBe(carrier.id);
    expect(carrier.itemPickupBlockedUntilMs).toBe(2500);
    engine.destroy();
  });
});

describe('Wind Gust', () => {
  it('remains Bufflora\'s Flying move with its original range and visuals', () => {
    expect(
      BUFFLORA.learnableAttacks.find((attack) => attack.attackId === 'WIND_GUST')
    ).toEqual({ level: 4, attackId: 'WIND_GUST' });
    expect(ATTACK_DEFS.WIND_GUST).toMatchObject({
      name: 'Wind Gust',
      type: ElementType.FLYING,
      power: 0,
      rangeIndex: 40,
      behaviorType: 'INSTANT_AOE',
      itemPickupLockMs: 2000,
      visualEffectConfigId: 'attack_wind_gust_1',
    });
  });

  it('only blocks the enemies it makes drop an objective', () => {
    const engine = new TowerDefenseEngine(levelData);
    const carrier = createEnemy('carrier', 10, 'coin_one');
    const bystander = createEnemy('bystander', 12);
    const coin = createCaptureUnit('coin_one', 10, carrier.id);
    const tower = createHarlequillTower();
    engine.enemies = [carrier, bystander];
    engine.captureUnits = [coin];

    InstantAoeBehavior.execute(engine, tower, ATTACK_DEFS.WIND_GUST);

    expect(carrier).toMatchObject({
      hasBeenWindDisarmed: true,
      itemPickupBlockedUntilMs: 2000,
    });
    expect(carrier).not.toHaveProperty('funnyDanceReaction');
    expect(bystander).not.toHaveProperty('itemPickupBlockedUntilMs');
    expect(tower).not.toHaveProperty('funnyDance');
    expect(engine.visualEffects).toContainEqual(
      expect.objectContaining({
        configId: 'attack_wind_gust_1',
        rangeIndex: 40,
      })
    );
    engine.destroy();
  });
});
