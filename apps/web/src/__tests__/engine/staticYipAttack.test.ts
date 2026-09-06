import { afterEach, describe, expect, it, vi } from 'vitest';
import { RESONARION, SONARION } from '@/constants/creatures';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';
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

function createEngine(level = 10, equippedAttacks = ['STATIC_YIP']) {
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
        id: 'razcall',
        speciesId: 'sonarion',
        level,
        xp: 0,
        equippedAttacks,
        isShiny: false,
      },
    ]
  );
  engines.push(engine);
  engine.placeTower('razcall', 40, 50);
  engine.spawnPreviewEnemy({
    id: 'target',
    creatureId: 'mouse_1',
    level: 10,
    position: { x: 58, y: 50 },
    isInvulnerable: true,
  });
  return engine;
}

describe('Static Yip', () => {
  it('unlocks at level 10 for Razcall and remains in Razound’s learnset', () => {
    for (const species of [SONARION, RESONARION]) {
      expect(
        species.learnableAttacks.filter(
          (move) => move.attackId === 'STATIC_YIP'
        )
      ).toEqual([{ level: 10, attackId: 'STATIC_YIP' }]);
    }
    expect(ATTACK_DEFS.STATIC_YIP).toMatchObject({
      name: 'Static Yip',
      type: ElementType.ELECTRIC,
      category: 'special',
      power: 40,
      cooldownMs: 800,
      rangeIndex: 40,
      projectileSpeed: 1.6,
      behaviorType: 'PROJECTILE',
      projectileVisual: { type: 'STATIC_YIP' },
    });
    expect(ATTACK_DEFS.STATIC_YIP.isDashAttack).toBeUndefined();
    expect(ATTACK_DEFS.STATIC_YIP.effects).toBeUndefined();
  });

  it('learns the attack exactly once when Razcall crosses level 10', () => {
    const engine = createEngine(9, ['NIBBLE', 'QUICK_ATTACK']);
    const tower = engine.towers[0];
    const events: TDEvent[] = [];
    engine.events.subscribe((event) => events.push(event));
    const grantXp = () =>
      engine.events.emit({
        type: 'ENEMY_DIED',
        enemyId: 'defeated',
        enemyDefinitionId: 'bug_stage_1',
        enemyLevel: 1,
        participantTowerIds: [tower.id],
      });
    grantXp();
    expect(tower.creature.level).toBe(9);
    expect(tower.creature.equippedAttacks).not.toContain('STATIC_YIP');
    tower.creature.xp = 10 ** 3 - 9 ** 3;
    grantXp();
    expect(tower.creature.level).toBe(10);
    expect(tower.creature.equippedAttacks).toContain('STATIC_YIP');
    expect(tower.equippedAttacksRuntime).toContainEqual({
      definitionId: 'STATIC_YIP',
      lastFiredTime: 0,
    });
    expect(engine.roster[0].equippedAttacks).toContain('STATIC_YIP');
    grantXp();
    expect(
      events.filter(
        (event) =>
          event.type === 'TOWER_LEARNED_ATTACK' &&
          event.attackDefId === 'STATIC_YIP'
      )
    ).toHaveLength(1);
  });

  it.each([
    ['right', 58, 50],
    ['left', 22, 50],
    ['up', 40, 32],
    ['down', 40, 68],
  ] as const)(
    'anchors the launch and single bark ring when facing %s',
    (facing, x, y) => {
      const engine = createEngine();
      const tower = engine.towers[0];
      engine.enemies[0].position = { x, y };
      ProjectileBehavior.execute(engine, tower, ATTACK_DEFS.STATIC_YIP);
      expect(tower.facingDirection).toBe(facing);
      expect(engine.projectiles).toHaveLength(1);
      expect(engine.projectiles[0]).toMatchObject({
        attackDefinitionId: 'STATIC_YIP',
        origin: { x: 40, y: 50 },
        launchFacingDirection: facing,
        dealsDamage: true,
      });
      expect(engine.visualEffects).toHaveLength(1);
      expect(engine.visualEffects[0]).toMatchObject({
        configId: 'attack_static_yip_launch_1',
        targetId: tower.id,
        facingDirection: facing,
        durationMs: 160,
      });
      expect(tower.position).toEqual({ x: 40, y: 50 });
    }
  );

  it('preserves Spark separately from the Razcall family learnsets', () => {
    expect(ATTACK_DEFS.SPARK).toMatchObject({
      id: 'SPARK',
      name: 'Spark',
      type: ElementType.ELECTRIC,
      category: 'special',
      power: 40,
      cooldownMs: 800,
      rangeIndex: 40,
      projectileSpeed: 1.6,
      projectileVisual: { type: 'SPARK' },
      launchVisualEffectConfigId: 'attack_spark_launch_1',
      visualEffectConfigId: 'attack_spark_1',
    });
    for (const species of [SONARION, RESONARION]) {
      expect(
        species.learnableAttacks.some((move) => move.attackId === 'SPARK')
      ).toBe(false);
    }
    const engine = createEngine(10, ['SPARK']);
    ProjectileBehavior.execute(engine, engine.towers[0], ATTACK_DEFS.SPARK);
    expect(engine.projectiles).toHaveLength(1);
    expect(engine.projectiles[0].attackDefinitionId).toBe('SPARK');
    expect(engine.visualEffects[0].configId).toBe('attack_spark_launch_1');
    for (let i = 0; i < 15; i += 1) engine.tick(0, 16);
    expect(engine.visualEffects).toHaveLength(1);
    expect(engine.visualEffects[0].configId).toBe('attack_spark_1');
  });

  it('does not flash or launch without a live in-range target', () => {
    const engine = createEngine();
    engine.enemies[0].position.x = 85;
    expect(
      ProjectileBehavior.canExecute(
        engine,
        engine.towers[0],
        ATTACK_DEFS.STATIC_YIP
      )
    ).toBe(false);
    ProjectileBehavior.execute(
      engine,
      engine.towers[0],
      ATTACK_DEFS.STATIC_YIP
    );
    expect(engine.projectiles).toHaveLength(0);
    expect(engine.visualEffects).toHaveLength(0);
  });

  it('damages only once on arrival and expires both cosmetic effects', () => {
    const engine = createEngine();
    const events: TDEvent[] = [];
    engine.events.subscribe((event) => events.push(event));
    ProjectileBehavior.execute(
      engine,
      engine.towers[0],
      ATTACK_DEFS.STATIC_YIP
    );
    expect(
      events.filter((event) => event.type === 'ATTACK_DAMAGE_DEALT')
    ).toHaveLength(0);
    for (let i = 0; i < 15; i += 1) engine.tick(0, 16);
    expect(engine.projectiles).toHaveLength(0);
    const hits = events.filter((event) => event.type === 'ATTACK_DAMAGE_DEALT');
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({
      targetEnemyId: 'target',
      attackDefId: 'STATIC_YIP',
    });
    expect(engine.visualEffects).toHaveLength(1);
    expect(engine.visualEffects[0]).toMatchObject({
      configId: 'attack_static_yip_1',
      targetId: 'target',
      durationMs: 240,
    });
    expect(
      CREATURE_TD_CONFIGS.attack_static_yip_1.default.vfxAnimation?.type
    ).toBe('STATIC_YIP');
    for (let i = 0; i < 20; i += 1) engine.tick(0, 16);
    expect(engine.visualEffects).toHaveLength(0);
    expect(
      events.filter((event) => event.type === 'ATTACK_DAMAGE_DEALT')
    ).toHaveLength(1);
  });

  it('uses Special Attack, not physical Attack', () => {
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
        ATTACK_DEFS.STATIC_YIP
      );
      for (let i = 0; i < 15; i += 1) engine.tick(0, 16);
      return damage;
    };
    const baseline = damageWith(20, 65);
    expect(baseline).toBeGreaterThan(0);
    expect(damageWith(200, 65)).toBe(baseline);
    expect(damageWith(20, 130)).toBeGreaterThan(baseline);
  });
});
