import { describe, expect, it, vi } from 'vitest';

import { BUG_STAGE_1 } from '@/constants/creatures';
import { ProjectileBehavior } from '@/engine/tower-defense/attacks/behaviors';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { EffectProcessor } from '@/engine/tower-defense/attacks/EffectProcessor';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { getActiveSpeedMultiplier } from '@/engine/tower-defense/speedModifiers';
import { Enemy, Tower } from '@/engine/tower-defense/types';
import { ElementType } from '@/types/baseGame';

const createBugletTower = (): Tower => ({
  id: 'buglet_tower',
  creature: {
    id: 'buglet',
    speciesId: 'bug_stage_1',
    level: 1,
    xp: 0,
    equippedAttacks: ['STRING_SHOT'],
    isShiny: false,
  },
  position: { x: 0, y: 0 },
  lastAttackTime: 0,
  currentAttack: 15,
  currentSpecialAttack: 10,
  currentDefense: 20,
  currentSpecialDefense: 15,
  hp: 25,
  maxHp: 25,
  equippedAttacksRuntime: [
    { definitionId: 'STRING_SHOT', lastFiredTime: 0 },
  ],
  selectedAttackIndex: 0,
  facingDirection: 'right',
});

const createEnemy = (): Enemy => ({
  id: 'enemy',
  definitionId: 'senticle',
  level: 1,
  position: { x: 10, y: 0 },
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

describe('String Shot', () => {
  it('is available to Sailkworm at level 1 as a guaranteed status move', () => {
    expect(BUG_STAGE_1.learnableAttacks).toContainEqual({
      level: 1,
      attackId: 'STRING_SHOT',
    });
    expect(ATTACK_DEFS.STRING_SHOT).toMatchObject({
      type: ElementType.BUG,
      power: 0,
      projectileVisual: {
        type: 'STRING_COIL',
        fiberColor: 0xe2e8f0,
        highlightColor: 0xffffff,
      },
      effects: [{ type: 'SPEED_SLOW', chance: 1, value: 2 / 3 }],
      visualEffectConfigId: 'attack_string_shot_1',
    });
  });

  it('slows its target without dealing damage', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const engine = new TowerDefenseEngine({
      paths: [
        [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
        ],
      ],
      placementSpots: [],
      waves: [],
    });
    const source = createBugletTower();
    const target = createEnemy();
    engine.towers = [source];
    const damageEvents: number[] = [];
    engine.events.subscribe((event) => {
      if (event.type === 'ATTACK_DAMAGE_DEALT') damageEvents.push(event.damage);
    });

    EffectProcessor.applyDamageAndEffects(
      engine,
      source,
      target,
      ATTACK_DEFS.STRING_SHOT
    );

    expect(target.hp).toBe(target.maxHp);
    expect(target.damagedByTowerIds).toEqual(new Set([source.id]));
    expect(damageEvents).toEqual([]);
    expect(getActiveSpeedMultiplier(target, 1_000_000)).toBeCloseTo(2 / 3);
    expect(engine.floatingTexts).toContainEqual(
      expect.objectContaining({ text: 'Slowed!' })
    );

    engine.events.emit({
      type: 'ENEMY_DIED',
      enemyId: target.id,
      enemyDefinitionId: target.definitionId,
      enemyLevel: target.level,
      participantTowerIds: Array.from(target.damagedByTowerIds),
    });

    expect(source.creature.xp).toBeGreaterThan(0);
    engine.destroy();
  });

  it('skips enemies after String Shot has slowed them', () => {
    const engine = new TowerDefenseEngine({
      paths: [
        [
          { x: 0, y: 0 },
          { x: 100, y: 0 },
        ],
      ],
      placementSpots: [],
      waves: [],
    });
    const source = createBugletTower();

    const frontEnemy = createEnemy();
    frontEnemy.id = 'front_enemy';
    frontEnemy.position.x = 20;
    const backEnemy = createEnemy();
    backEnemy.id = 'back_enemy';
    backEnemy.position.x = 10;
    engine.enemies = [frontEnemy, backEnemy];

    frontEnemy.speedSlowMultiplier = 2 / 3;
    ProjectileBehavior.execute(
      engine,
      source,
      ATTACK_DEFS.STRING_SHOT
    );

    expect(engine.projectiles.map((projectile) => projectile.targetId)).toEqual(
      ['back_enemy']
    );

    backEnemy.speedSlowMultiplier = 2 / 3;
    engine.projectiles = [];

    expect(
      ProjectileBehavior.canExecute(
        engine,
        source,
        ATTACK_DEFS.STRING_SHOT
      )
    ).toBe(false);
    ProjectileBehavior.execute(
      engine,
      source,
      ATTACK_DEFS.STRING_SHOT
    );
    expect(engine.projectiles).toEqual([]);
    engine.destroy();
  });
});
