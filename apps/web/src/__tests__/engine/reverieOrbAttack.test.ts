import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Graphics, Sprite } from 'pixi.js';
import { DORMATEE } from '@/constants/creatures';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
import dormateeManifest from '@/content/creatures/dormatee.json';
import {
  drawReverieOrbProjectile,
  getDormateeOrbSocket,
  getReverieOrbWaveOffset,
} from '@/app/components/tower-defense/reverieOrbVisuals';
import { ProjectileBehavior } from '@/engine/tower-defense/attacks/behaviors';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import type { TDEvent } from '@/engine/tower-defense/events/TDEventBus';
import { ElementType } from '@/types/baseGame';

const engines: TowerDefenseEngine[] = [];
afterEach(() => {
  engines.forEach((engine) => engine.destroy());
  engines.length = 0;
  vi.restoreAllMocks();
});

function createEngine() {
  const engine = new TowerDefenseEngine(
    {
      paths: [
        [
          { x: 0, y: 50 },
          { x: 100, y: 50 },
        ],
      ],
      placementSpots: [],
      waves: [],
    },
    [
      {
        id: 'manatee',
        speciesId: 'dormatee',
        level: 12,
        xp: 0,
        equippedAttacks: ['REVERIE_ORB'],
        isShiny: false,
      },
    ]
  );
  engines.push(engine);
  engine.placeTower('manatee', 40, 50);
  engine.spawnPreviewEnemy({
    id: 'target',
    creatureId: 'mouse_1',
    level: 10,
    position: { x: 58, y: 50 },
    isInvulnerable: true,
  });
  return engine;
}

describe('Reverie Orb', () => {
  it('replaces only Dormatee’s level-4 String Shot placeholder', () => {
    expect(DORMATEE.learnableAttacks).toEqual([
      { level: 1, attackId: 'GRUMBLE' },
      { level: 4, attackId: 'REVERIE_ORB' },
      { level: 8, attackId: 'SHARED_SLUMBER' },
    ]);
    expect(dormateeManifest.learnableAttacks).toEqual(
      DORMATEE.learnableAttacks
    );
    expect(ATTACK_DEFS.REVERIE_ORB).toMatchObject({
      name: 'Reverie Orb',
      type: ElementType.PSYCHIC,
      category: 'special',
      power: 65,
      cooldownMs: 2500,
      rangeIndex: 40,
      behaviorType: 'PROJECTILE',
      projectileSpeed: 0.65,
      projectileVisual: { type: 'REVERIE_ORB' },
      launchVisualEffectConfigId: 'attack_reverie_orb_launch_1',
      visualEffectConfigId: 'attack_reverie_orb_1',
    });
    expect(ATTACK_DEFS.REVERIE_ORB.effects).toBeUndefined();
    expect(ATTACK_DEFS.REVERIE_ORB.isDashAttack).toBeUndefined();
    expect(
      CREATURE_TD_CONFIGS.attack_reverie_orb_1.default.vfxAnimation?.type
    ).toBe('REVERIE_ORB');
  });

  it('lands one delayed special hit with launch and impact effects, but no status', () => {
    const engine = createEngine();
    const tower = engine.towers[0];
    const events: TDEvent[] = [];
    engine.events.subscribe((event) => events.push(event));

    ProjectileBehavior.execute(engine, tower, ATTACK_DEFS.REVERIE_ORB);
    expect(engine.projectiles).toHaveLength(1);
    expect(engine.projectiles[0]).toMatchObject({
      attackDefinitionId: 'REVERIE_ORB',
      origin: { x: 40, y: 50 },
      launchFacingDirection: 'right',
      speed: 0.65,
    });
    expect(engine.visualEffects[0]).toMatchObject({
      configId: 'attack_reverie_orb_launch_1',
      targetId: tower.id,
    });
    expect(
      events.filter((event) => event.type === 'ATTACK_DAMAGE_DEALT')
    ).toHaveLength(0);

    for (let i = 0; i < 40; i += 1) engine.tick(0, 16);
    expect(engine.projectiles).toHaveLength(0);
    expect(
      events.filter((event) => event.type === 'ATTACK_DAMAGE_DEALT')
    ).toMatchObject([{ attackDefId: 'REVERIE_ORB', targetEnemyId: 'target' }]);
    expect(engine.visualEffects).toContainEqual(
      expect.objectContaining({
        configId: 'attack_reverie_orb_1',
        targetId: 'target',
      })
    );
    expect(engine.enemies[0].statusConditions).toHaveLength(0);
  });

  it('uses Special Attack rather than physical Attack', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const damageWith = (attack: number, specialAttack: number) => {
      const engine = createEngine();
      engine.towers[0].currentAttack = attack;
      engine.towers[0].currentSpecialAttack = specialAttack;
      let damage = 0;
      engine.events.subscribe((event) => {
        if (event.type === 'ATTACK_DAMAGE_DEALT') damage += event.damage;
      });
      ProjectileBehavior.execute(
        engine,
        engine.towers[0],
        ATTACK_DEFS.REVERIE_ORB
      );
      for (let i = 0; i < 40; i += 1) engine.tick(0, 16);
      return damage;
    };
    const baseline = damageWith(20, 65);
    expect(baseline).toBeGreaterThan(0);
    expect(damageWith(200, 65)).toBe(baseline);
    expect(damageWith(20, 130)).toBeGreaterThan(baseline);
  });

  it('anchors the orb to each directional sprite and waves only between endpoints', () => {
    const side = {
      x: 0,
      y: -42,
      scale: { x: 0.38, y: 0.38 },
      texture: { orig: { width: 360, height: 240 } },
    } as Sprite;
    const left = getDormateeOrbSocket(side, 'left');
    const right = getDormateeOrbSocket(side, 'right');
    expect(left.x).toBeCloseTo(-right.x);
    expect(left.y).toBe(right.y);
    const front = {
      x: 0,
      y: -47,
      scale: { x: 0.38, y: 0.38 },
      texture: { orig: { width: 200, height: 275 } },
    } as Sprite;
    expect(getDormateeOrbSocket(front, 'up').x).toBeLessThan(0);
    expect(getDormateeOrbSocket(front, 'down').x).toBeGreaterThan(0);
    expect(getReverieOrbWaveOffset(0, 100, 0)).toEqual({ x: 0, y: 0 });
    expect(getReverieOrbWaveOffset(1, 100, 0).y).toBeCloseTo(0);
    expect(getReverieOrbWaveOffset(0.25, 100, 0).y).toBeGreaterThan(10);
    expect(getReverieOrbWaveOffset(0.75, 100, 0).y).toBeLessThan(-10);
    expect(getReverieOrbWaveOffset(0.25, 0, -100).x).toBeGreaterThan(10);
    expect(getReverieOrbWaveOffset(0.25, 0, 0)).toEqual({ x: 0, y: 0 });

    const graphics = {
      clear: vi.fn().mockReturnThis(),
      circle: vi.fn().mockReturnThis(),
      fill: vi.fn().mockReturnThis(),
      stroke: vi.fn().mockReturnThis(),
    };
    const palette = ATTACK_DEFS.REVERIE_ORB.projectileVisual;
    if (palette?.type !== 'REVERIE_ORB')
      throw new Error('Missing Reverie Orb palette');
    drawReverieOrbProjectile(graphics as unknown as Graphics, palette, 200);
    expect(graphics.circle).toHaveBeenCalled();
    expect(graphics.fill).toHaveBeenCalled();
  });
});
