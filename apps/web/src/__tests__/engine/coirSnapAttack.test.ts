import { afterEach, describe, expect, it, vi } from 'vitest';
import { CARAPENTER, STARTER_CRAB } from '@/constants/creatures';
import { ProjectileBehavior } from '@/engine/tower-defense/attacks/behaviors';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { EffectProcessor } from '@/engine/tower-defense/attacks/EffectProcessor';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { Enemy, Tower } from '@/engine/tower-defense/types';
import { ElementType } from '@/types/baseGame';
import { getDefaultAttacksForLevel } from '@/utils/resolvePlayerCreature';

const engines: TowerDefenseEngine[] = [];

afterEach(() => {
  engines.splice(0).forEach((engine) => engine.destroy());
  vi.restoreAllMocks();
});

const createEngine = (): TowerDefenseEngine => {
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
  engines.push(engine);
  return engine;
};

const createPalmitTower = (id = 'palmit_tower'): Tower => ({
  id,
  creature: {
    id: `palmit_${id}`,
    speciesId: 'starter_crab',
    level: 5,
    xp: 0,
    equippedAttacks: ['COIR_SNAP'],
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
  equippedAttacksRuntime: [{ definitionId: 'COIR_SNAP', lastFiredTime: 0 }],
  selectedAttackIndex: 0,
  facingDirection: 'right',
  targetingMode: 'closest',
});

const createEnemy = (): Enemy => ({
  id: 'enemy',
  definitionId: 'senticle',
  level: 5,
  position: { x: 10, y: 0 },
  hp: 1000,
  maxHp: 1000,
  speed: 0,
  currentAttack: 10,
  currentSpecialAttack: 10,
  currentDefense: 20,
  currentSpecialDefense: 20,
  statusConditions: [],
  currentWaypointIndex: 1,
  pathIndex: 0,
  facingDirection: 'right',
  damagedByTowerIds: new Set(),
});

describe('Husk Shot', () => {
  it('unlocks at level 6 after Pinch, before Coir Snare at level 9', () => {
    expect(getDefaultAttacksForLevel(STARTER_CRAB, 5)).toEqual(['PINCH']);
    expect(getDefaultAttacksForLevel(STARTER_CRAB, 6)).toEqual([
      'PINCH',
      'COIR_SNAP',
    ]);
    expect(STARTER_CRAB.learnableAttacks).toContainEqual({
      level: 9,
      attackId: 'COIR_SNARE',
    });
    expect(CARAPENTER.learnableAttacks.slice(0, 3)).toEqual([
      { level: 1, attackId: 'PINCH' },
      { level: 6, attackId: 'COIR_SNAP' },
      { level: 9, attackId: 'COIR_SNARE' },
    ]);
    expect(TowerDefenseEngine.getDefaultAttacks('starter_crab')).toEqual([
      'PINCH',
    ]);
  });

  it('is a lighter physical Grass attack that reuses Coir Snare’s projectile art', () => {
    expect(ATTACK_DEFS.COIR_SNAP).toMatchObject({
      name: 'Husk Shot',
      type: ElementType.GRASS,
      category: 'physical',
      power: 25,
      cooldownMs: 900,
      rangeIndex: 40,
      projectileVisual: ATTACK_DEFS.COIR_SNARE.projectileVisual,
      coirSnapCombo: {
        hitsToBind: 3,
        bindDurationMs: 500,
        bindVisualEffectConfigId: 'attack_coir_snare_1',
        projectileScales: [0.72, 0.86, 1],
      },
    });
  });

  it('cycles one, two, bind, one successful hits per Palmit', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const engine = createEngine();
    const palmit = createPalmitTower();
    const enemy = createEnemy();

    for (const progress of [1, 2, 0, 1]) {
      EffectProcessor.applyDamageAndEffects(
        engine,
        palmit,
        enemy,
        ATTACK_DEFS.COIR_SNAP
      );
      expect(palmit.coirSnapHits).toBe(progress);
    }

    expect(enemy.statusConditions).toContainEqual({
      type: 'STUN',
      durationMs: 500,
    });
    expect(
      engine.visualEffects.filter(
        (effect) => effect.configId === 'attack_coir_snare_1'
      )
    ).toEqual([
      expect.objectContaining({ targetId: enemy.id, durationMs: 500 }),
    ]);
    expect(engine.floatingTexts.some((text) => text.text === 'Bound!')).toBe(
      true
    );
  });

  it('grows the reused coir projectile as its caster approaches the binding hit', () => {
    const engine = createEngine();
    const enemy = createEnemy();
    const firstPalmit = createPalmitTower('first');
    const secondPalmit = createPalmitTower('second');
    engine.enemies = [enemy];

    for (const [progress, expectedScale] of [
      [0, 0.72],
      [1, 0.86],
      [2, 1],
    ] as const) {
      firstPalmit.coirSnapHits = progress;
      ProjectileBehavior.execute(engine, firstPalmit, ATTACK_DEFS.COIR_SNAP);
      expect(engine.projectiles.at(-1)?.visualScale).toBe(expectedScale);
    }

    ProjectileBehavior.execute(engine, secondPalmit, ATTACK_DEFS.COIR_SNAP);
    expect(engine.projectiles.at(-1)?.visualScale).toBe(0.72);
  });
});
