import { afterEach, describe, expect, it, vi } from 'vitest';

import { SailcutterBehavior } from '@/engine/tower-defense/attacks/behaviors';
import { ATTACK_FIXTURES, installAttackFixtures } from './fixtures';
import { EffectProcessor } from '@/engine/tower-defense/attacks/EffectProcessor';
import { updateRiggingNests } from '@/engine/tower-defense/attacks/riggingNest';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import type { Enemy, RiggingThreadling } from '@/engine/tower-defense/types';

installAttackFixtures();

const engines: TowerDefenseEngine[] = [];

afterEach(() => {
  vi.restoreAllMocks();
  engines.splice(0).forEach((engine) => engine.destroy());
});

function createEnemy(id: string, x: number, y = 50): Enemy {
  return {
    id,
    definitionId: 'mouse_1',
    level: 10,
    position: { x, y },
    hp: 10000,
    maxHp: 10000,
    speed: 0,
    currentAttack: 10,
    currentSpecialAttack: 10,
    currentDefense: 40,
    currentSpecialDefense: 40,
    statusConditions: [],
    currentWaypointIndex: 1,
    pathIndex: 0,
    facingDirection: 'right',
    damagedByTowerIds: new Set(),
  };
}

function battle() {
  const engine = new TowerDefenseEngine(
    {
      paths: [
        [
          { x: 0, y: 50 },
          { x: 100, y: 50 },
        ],
      ],
      placementSpots: [{ x: 40, y: 50 }],
      waves: [{ id: 'empty', groups: [] }],
    },
    [
      {
        id: 'mainscale-one',
        speciesId: 'bug_stage_3',
        level: 10,
        xp: 0,
        equippedAttacks: ['SAILCUTTER', 'RIGGING_NEST'],
        isShiny: false,
      },
    ]
  );
  engines.push(engine);
  engine.placeTower('mainscale-one', 40, 50);
  return { engine, source: engine.towers[0] };
}

function createThreadling(
  ownerTowerId: string,
  id: string,
  x: number,
  targetId?: string
): RiggingThreadling {
  return {
    id,
    ownerTowerId,
    attackDefinitionId: 'RIGGING_NEST',
    ownerOrigin: { x: 40, y: 50 },
    nestPosition: { x: 43.5, y: 52.5 },
    position: { x, y: 52.5 },
    facingDirection: 'right',
    spawnedAtMs: 0,
    expiresAtMs: 10000,
    nextAttackAtMs: 0,
    attacksRemaining: 3,
    targetId,
  };
}

describe('Marking volleys', () => {
  it('launches at most three projectiles toward three unique targets', () => {
    const { engine, source } = battle();
    engine.enemies = [
      createEnemy('one', 44),
      createEnemy('two', 48),
      createEnemy('three', 52),
      createEnemy('four', 56),
    ];

    SailcutterBehavior.execute(engine, source, ATTACK_FIXTURES.SAILCUTTER);

    expect(engine.projectiles).toHaveLength(3);
    expect(new Set(engine.projectiles.map((shot) => shot.targetId)).size).toBe(
      3
    );
  });

  it('fires only one cutter when one target exists and resolves without impact VFX', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { engine, source } = battle();
    const target = createEnemy('solo', 44);
    engine.enemies = [target];

    SailcutterBehavior.execute(engine, source, ATTACK_FIXTURES.SAILCUTTER);
    expect(engine.projectiles).toHaveLength(1);
    expect(engine.projectiles[0]).toMatchObject({
      attackDefinitionId: 'SAILCUTTER',
      targetId: 'solo',
      damage: 35,
    });

    engine.tick(0, 200);

    expect(target.hp).toBeLessThan(target.maxHp);
    expect(target.sailcutterMarks?.[source.id]).toBe(
      engine.elapsedTimeMs + 4000
    );
    expect(engine.visualEffects).toHaveLength(0);
  });

  it('applies and refreshes a source-specific four-second Wind Mark', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { engine, source } = battle();
    const target = createEnemy('marked', 45);

    EffectProcessor.applyDamageAndEffects(
      engine,
      source,
      target,
      ATTACK_FIXTURES.SAILCUTTER
    );
    expect(target.sailcutterMarks?.[source.id]).toBe(4000);

    engine.elapsedTimeMs = 1200;
    EffectProcessor.applyDamageAndEffects(
      engine,
      source,
      target,
      ATTACK_FIXTURES.SAILCUTTER
    );
    expect(target.sailcutterMarks?.[source.id]).toBe(5200);
  });

  it('splits threadlings across marks and grants the pursuit-speed bonus', () => {
    const { engine, source } = battle();
    const first = createEnemy('first-mark', 55, 52.5);
    const second = createEnemy('second-mark', 58, 52.5);
    first.sailcutterMarks = { [source.id]: 5000 };
    second.sailcutterMarks = { [source.id]: 5000 };
    engine.enemies = [first, second];
    engine.riggingThreadlings = [
      createThreadling(source.id, 'threadling-one', 43.5),
      createThreadling(source.id, 'threadling-two', 43.5),
    ];

    updateRiggingNests(engine, [source], 100);

    expect(
      new Set(engine.riggingThreadlings.map((unit) => unit.targetId))
    ).toEqual(new Set(['first-mark', 'second-mark']));
    for (const threadling of engine.riggingThreadlings) {
      expect(threadling.position.x).toBeCloseTo(48.62, 2);
    }
  });

  it('increases threadling bite damage by 35% against its owner’s mark', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { engine, source } = battle();
    const baseline = createEnemy('baseline', 44, 52.5);
    const marked = createEnemy('marked', 44, 52.5);
    marked.sailcutterMarks = { [source.id]: 5000 };

    EffectProcessor.applyDamageAndEffects(
      engine,
      source,
      baseline,
      ATTACK_FIXTURES.RIGGING_NEST
    );
    const baselineDamage = baseline.maxHp - baseline.hp;

    engine.enemies = [marked];
    engine.riggingThreadlings = [
      createThreadling(source.id, 'biting-threadling', 43.5, marked.id),
    ];
    updateRiggingNests(engine, [source], 16);

    const markedDamage = marked.maxHp - marked.hp;
    expect(markedDamage).toBe(Math.floor(baselineDamage * 1.35));
  });
});
