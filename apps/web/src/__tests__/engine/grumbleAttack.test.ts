import { afterEach, describe, expect, it, vi } from 'vitest';
import { DORMATEE } from '@/constants/creatures';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
import dormateeManifest from '@/content/creatures/dormatee.json';
import { ProjectileBehavior } from '@/engine/tower-defense/attacks/behaviors';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import type { TDEvent } from '@/engine/tower-defense/events/TDEventBus';
import { ElementType } from '@/types/baseGame';
import type { Graphics } from 'pixi.js';
import { drawGrumbleProjectile } from '@/app/components/tower-defense/grumbleVisuals';

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
        equippedAttacks: ['GRUMBLE'],
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

describe('Grumble', () => {
  it('draws a complete circular travelling pulse rather than open wavefronts', () => {
    const palette = ATTACK_DEFS.GRUMBLE.projectileVisual;
    if (palette?.type !== 'GRUMBLE') throw new Error('Missing Grumble palette');
    const graphics = {
      clear: vi.fn().mockReturnThis(),
      circle: vi.fn().mockReturnThis(),
      stroke: vi.fn().mockReturnThis(),
    };
    drawGrumbleProjectile(graphics as unknown as Graphics, palette);
    expect(graphics.circle).toHaveBeenCalledTimes(4);
    expect(graphics.circle).toHaveBeenCalledWith(0, 0, 15);
  });

  it('replaces Dormatee’s level-1 Body Rush with a plain Normal special projectile', () => {
    expect(DORMATEE.learnableAttacks[0]).toEqual({
      level: 1,
      attackId: 'GRUMBLE',
    });
    expect(dormateeManifest.learnableAttacks[0]).toEqual({
      level: 1,
      attackId: 'GRUMBLE',
    });
    expect(ATTACK_DEFS.GRUMBLE).toMatchObject({
      name: 'Grumble',
      type: ElementType.NORMAL,
      category: 'special',
      power: 35,
      cooldownMs: 1200,
      rangeIndex: 40,
      behaviorType: 'PROJECTILE',
      projectileSpeed: 1.3,
      projectileVisual: { type: 'GRUMBLE' },
      launchVisualEffectConfigId: 'attack_grumble_launch_1',
      visualEffectConfigId: 'attack_grumble_1',
    });
    expect(ATTACK_DEFS.GRUMBLE.effects).toBeUndefined();
    expect(ATTACK_DEFS.GRUMBLE.isDashAttack).toBeUndefined();
    expect(
      CREATURE_TD_CONFIGS.attack_grumble_1.default.vfxAnimation?.type
    ).toBe('GRUMBLE');
  });

  it('launches from its facing direction and hits once without a status effect', () => {
    const engine = createEngine();
    const tower = engine.towers[0];
    const events: TDEvent[] = [];
    engine.events.subscribe((event) => events.push(event));

    ProjectileBehavior.execute(engine, tower, ATTACK_DEFS.GRUMBLE);
    expect(engine.projectiles).toHaveLength(1);
    expect(engine.projectiles[0]).toMatchObject({
      attackDefinitionId: 'GRUMBLE',
      origin: { x: 40, y: 50 },
      launchFacingDirection: 'right',
    });
    expect(engine.visualEffects[0]).toMatchObject({
      configId: 'attack_grumble_launch_1',
      targetId: tower.id,
    });
    expect(tower.position).toEqual({ x: 40, y: 50 });

    for (let i = 0; i < 20; i += 1) engine.tick(0, 16);
    expect(engine.projectiles).toHaveLength(0);
    expect(
      events.filter((event) => event.type === 'ATTACK_DAMAGE_DEALT')
    ).toMatchObject([{ attackDefId: 'GRUMBLE', targetEnemyId: 'target' }]);
    expect(engine.visualEffects[0].configId).toBe('attack_grumble_1');
    expect(engine.enemies[0].statusConditions).toHaveLength(0);
  });

  it('scales with Special Attack rather than physical Attack', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const damageWith = (attack: number, specialAttack: number) => {
      const engine = createEngine();
      engine.towers[0].currentAttack = attack;
      engine.towers[0].currentSpecialAttack = specialAttack;
      let damage = 0;
      engine.events.subscribe((event) => {
        if (event.type === 'ATTACK_DAMAGE_DEALT') damage += event.damage;
      });
      ProjectileBehavior.execute(engine, engine.towers[0], ATTACK_DEFS.GRUMBLE);
      for (let i = 0; i < 20; i += 1) engine.tick(0, 16);
      return damage;
    };
    const baseline = damageWith(20, 65);
    expect(baseline).toBeGreaterThan(0);
    expect(damageWith(200, 65)).toBe(baseline);
    expect(damageWith(20, 130)).toBeGreaterThan(baseline);
  });
});
