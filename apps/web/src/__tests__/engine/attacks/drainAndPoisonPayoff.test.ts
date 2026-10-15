import { afterEach, describe, expect, it, vi } from 'vitest';

import { ProjectileBehavior } from '@/engine/tower-defense/attacks/behaviors';
import { EffectProcessor } from '@/engine/tower-defense/attacks/EffectProcessor';
import { ATTACK_FIXTURES, installAttackFixtures } from './fixtures';
import {
  TOXIC_POLLEN_POISON_ID,
  VENOM_SPRAY_POISON_ID,
} from '@/engine/tower-defense/poison';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { Enemy, Tower } from '@/engine/tower-defense/types';

installAttackFixtures();

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

const createBuffloraTower = (): Tower => ({
  id: 'bufflora_tower',
  creature: {
    id: 'bufflora_one',
    speciesId: 'bufflora',
    level: 12,
    xp: 0,
    equippedAttacks: ['NECTAR_SIPHON'],
    gender: 'female' as const,
    isShiny: false,
  },
  position: { x: 0, y: 0 },
  lastAttackTime: 0,
  currentAttack: 15,
  currentSpecialAttack: 20,
  currentDefense: 15,
  currentSpecialDefense: 15,
  hp: 20,
  maxHp: 40,
  equippedAttacksRuntime: [{ definitionId: 'NECTAR_SIPHON', lastFiredTime: 0 }],
  selectedAttackIndex: 0,
  facingDirection: 'right',
  targetingMode: 'closest',
});

const createEnemy = (): Enemy => ({
  id: 'target',
  definitionId: 'mouse_1',
  level: 12,
  position: { x: 10, y: 0 },
  hp: 200,
  maxHp: 200,
  speed: 0,
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

afterEach(() => vi.restoreAllMocks());

describe('Drain and poison payoff', () => {
  it('heals Bufflora for half the actual damage dealt', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const engine = new TowerDefenseEngine(levelData);
    const source = createBuffloraTower();
    const target = createEnemy();
    const startingTargetHp = target.hp;
    const startingSourceHp = source.hp;

    EffectProcessor.applyDamageAndEffects(
      engine,
      source,
      target,
      ATTACK_FIXTURES.NECTAR_SIPHON
    );

    const damageDealt = startingTargetHp - target.hp;
    expect(damageDealt).toBeGreaterThan(0);
    expect(source.hp - startingSourceHp).toBe(Math.floor(damageDealt * 0.5));
    expect(engine.floatingTexts.at(-1)?.text).toBe(
      `+${Math.floor(damageDealt * 0.5)}`
    );
    engine.destroy();
  });

  it('gains one binary damage bonus from any poison without altering it', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const engine = new TowerDefenseEngine(levelData);
    const source = createBuffloraTower();
    const unpoisoned = createEnemy();
    const pollened: Enemy = {
      ...createEnemy(),
      id: 'pollened',
      statusConditions: [],
    };
    const doublyPoisoned: Enemy = {
      ...createEnemy(),
      id: 'doubly_poisoned',
      statusConditions: [],
    };
    pollened.statusConditions.push({
      type: 'POISON',
      poisonId: TOXIC_POLLEN_POISON_ID,
      durationMs: 4000,
      tickDamage: 2,
    });
    doublyPoisoned.statusConditions.push(
      {
        type: 'POISON',
        poisonId: TOXIC_POLLEN_POISON_ID,
        durationMs: 4000,
        tickDamage: 2,
      },
      {
        type: 'POISON',
        poisonId: VENOM_SPRAY_POISON_ID,
        durationMs: 3000,
        tickDamage: 3,
        stackCount: 3,
      }
    );

    for (const target of [unpoisoned, pollened, doublyPoisoned]) {
      EffectProcessor.applyDamageAndEffects(
        engine,
        source,
        target,
        ATTACK_FIXTURES.NECTAR_SIPHON
      );
    }

    const unpoisonedDamage = unpoisoned.maxHp - unpoisoned.hp;
    const pollenedDamage = pollened.maxHp - pollened.hp;
    const doublyPoisonedDamage = doublyPoisoned.maxHp - doublyPoisoned.hp;
    expect(unpoisonedDamage).toBeGreaterThan(0);
    expect(pollenedDamage).toBeGreaterThan(unpoisonedDamage);
    expect(doublyPoisonedDamage).toBe(pollenedDamage);
    expect(pollened.statusConditions).toHaveLength(1);
    expect(pollened.statusConditions[0].durationMs).toBe(4000);
    expect(doublyPoisoned.statusConditions).toHaveLength(2);
    expect(
      doublyPoisoned.statusConditions.map((status) => status.durationMs)
    ).toEqual([4000, 3000]);
    engine.destroy();
  });

  it('prioritizes a poisoned enemy before applying the selected targeting mode', () => {
    const engine = new TowerDefenseEngine(levelData);
    const source = createBuffloraTower();
    source.targetingMode = 'closest';
    const closerUnpoisoned = {
      ...createEnemy(),
      id: 'closer_unpoisoned',
      position: { x: 5, y: 0 },
    };
    const fartherPoisoned = {
      ...createEnemy(),
      id: 'farther_poisoned',
      position: { x: 20, y: 0 },
      statusConditions: [
        {
          type: 'POISON' as const,
          poisonId: VENOM_SPRAY_POISON_ID,
          durationMs: 3000,
          tickDamage: 1,
        },
      ],
    };
    engine.enemies = [closerUnpoisoned, fartherPoisoned];

    ProjectileBehavior.execute(engine, source, ATTACK_FIXTURES.NECTAR_SIPHON);

    expect(engine.projectiles).toHaveLength(1);
    expect(engine.projectiles[0].targetId).toBe(fartherPoisoned.id);
    engine.destroy();
  });

  it('uses remaining enemy HP for lethal-hit healing and cannot overheal', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const engine = new TowerDefenseEngine(levelData);
    const source = createBuffloraTower();
    const target = createEnemy();
    source.hp = 39;
    target.hp = 10;

    EffectProcessor.applyDamageAndEffects(
      engine,
      source,
      target,
      ATTACK_FIXTURES.NECTAR_SIPHON
    );

    expect(target.hp).toBeLessThanOrEqual(0);
    expect(source.hp).toBe(source.maxHp);
    engine.destroy();
  });

  it('does not heal from an invulnerable preview target', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const engine = new TowerDefenseEngine(levelData);
    const source = createBuffloraTower();
    const target = createEnemy();
    target.isInvulnerable = true;

    EffectProcessor.applyDamageAndEffects(
      engine,
      source,
      target,
      ATTACK_FIXTURES.NECTAR_SIPHON
    );

    expect(target.hp).toBe(target.maxHp);
    expect(source.hp).toBe(20);
    expect(engine.floatingTexts.some((text) => text.text.startsWith('+'))).toBe(
      false
    );
    engine.destroy();
  });
});
