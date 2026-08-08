import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
});

import { STARTER_CRAB } from '@/constants/creatures';
import { ProjectileBehavior } from '@/engine/tower-defense/attacks/behaviors';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { Enemy, Tower } from '@/engine/tower-defense/types';
import { ElementType } from '@/types/baseGame';

const createPalmitTower = (): Tower => ({
  id: 'palmit_tower',
  creature: {
    id: 'palmit',
    speciesId: 'starter_crab',
    level: 6,
    xp: 0,
    equippedAttacks: ['COIR_SNARE'],
    isShiny: false,
  },
  position: { x: 0, y: 0 },
  lastAttackTime: 0,
  currentAttack: 55,
  currentSpecialAttack: 45,
  currentDefense: 65,
  currentSpecialDefense: 58,
  hp: 100,
  maxHp: 100,
  equippedAttacksRuntime: [{ definitionId: 'COIR_SNARE', lastFiredTime: 0 }],
  selectedAttackIndex: 0,
  facingDirection: 'right',
  targetingMode: 'closest',
});

const createEnemy = (): Enemy => ({
  id: 'enemy',
  definitionId: 'senticle',
  level: 5,
  position: { x: 10, y: 0 },
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
  damagedByTowerIds: new Set(),
});

describe('Coir Snare', () => {
  it('is learned by Palmit at level 6', () => {
    expect(
      STARTER_CRAB.learnableAttacks.find(
        (attack) => attack.attackId === 'COIR_SNARE'
      )
    ).toEqual({ level: 6, attackId: 'COIR_SNARE' });
  });

  it('uses a physical Grass-type coir bola visual', () => {
    expect(ATTACK_DEFS.COIR_SNARE).toMatchObject({
      name: 'Coir Snare',
      type: ElementType.GRASS,
      category: 'physical',
      power: 30,
      cooldownMs: 1600,
      visualEffectConfigId: 'attack_coir_snare_1',
      projectileVisual: { type: 'COIR_BOLA' },
    });
  });

  it('binds its target for one second and creates the tightening-rope effect', () => {
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
    const enemy = createEnemy();
    const palmit = createPalmitTower();
    engine.enemies = [enemy];
    engine.towers = [palmit];

    ProjectileBehavior.execute(engine, palmit, ATTACK_DEFS.COIR_SNARE);

    expect(engine.projectiles).toHaveLength(1);
    engine.tick(0, 100);
    engine.tick(100, 100);

    expect(enemy.statusConditions).toContainEqual({
      type: 'STUN',
      durationMs: 1000,
    });
    expect(engine.visualEffects).toContainEqual(
      expect.objectContaining({
        configId: 'attack_coir_snare_1',
        targetId: enemy.id,
        durationMs: 1000,
      })
    );
    engine.destroy();
  });
});
