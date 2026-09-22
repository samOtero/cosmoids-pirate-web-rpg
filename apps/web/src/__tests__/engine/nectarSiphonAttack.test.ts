import { afterEach, describe, expect, it, vi } from 'vitest';

import { BUFFLORA } from '@/constants/creatures';
import { EffectProcessor } from '@/engine/tower-defense/attacks/EffectProcessor';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { Enemy, Tower } from '@/engine/tower-defense/types';
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

const createBuffloraTower = (): Tower => ({
  id: 'bufflora_tower',
  creature: {
    id: 'bufflora_one',
    speciesId: 'bufflora',
    level: 12,
    xp: 0,
    equippedAttacks: ['NECTAR_SIPHON'],
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

describe('Siphon Lash', () => {
  it("replaces Vine Whip in Bufflora's level-12 slot", () => {
    expect(BUFFLORA.learnableAttacks).toContainEqual({
      level: 12,
      attackId: 'NECTAR_SIPHON',
    });
    expect(BUFFLORA.learnableAttacks).not.toContainEqual({
      level: 12,
      attackId: 'VINE_WHIP',
    });
    expect(ATTACK_DEFS.NECTAR_SIPHON).toMatchObject({
      type: ElementType.GRASS,
      category: 'special',
      power: 30,
      behaviorType: 'PROJECTILE',
      effects: [{ type: 'DRAIN', chance: 1, value: 0.5 }],
      projectileVisual: {
        type: 'NECTAR_TONGUE',
        spriteUrl: '/battles/attacks/nectar_siphon.webp',
      },
    });
  });

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
      ATTACK_DEFS.NECTAR_SIPHON
    );

    const damageDealt = startingTargetHp - target.hp;
    expect(damageDealt).toBeGreaterThan(0);
    expect(source.hp - startingSourceHp).toBe(Math.floor(damageDealt * 0.5));
    expect(engine.floatingTexts.at(-1)?.text).toBe(
      `+${Math.floor(damageDealt * 0.5)}`
    );
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
      ATTACK_DEFS.NECTAR_SIPHON
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
      ATTACK_DEFS.NECTAR_SIPHON
    );

    expect(target.hp).toBe(target.maxHp);
    expect(source.hp).toBe(20);
    expect(engine.floatingTexts.some((text) => text.text.startsWith('+'))).toBe(
      false
    );
    engine.destroy();
  });
});
