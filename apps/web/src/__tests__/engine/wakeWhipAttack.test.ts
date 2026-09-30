import { afterEach, describe, expect, it, vi } from 'vitest';

import { AGUANA, NAUTIGUAN } from '@/constants/creatures';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { updateWakeWhips } from '@/engine/tower-defense/attacks/wakeWhip';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { ElementType } from '@/types/baseGame';

const engines: TowerDefenseEngine[] = [];

afterEach(() => {
  engines.splice(0).forEach((engine) => engine.destroy());
  vi.restoreAllMocks();
});

function createBattle() {
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
        id: 'aguana',
        speciesId: 'aguana',
        level: 8,
        xp: 0,
        equippedAttacks: ['WAKE_WHIP'],
        isShiny: false,
      },
    ]
  );
  engines.push(engine);
  engine.placeTower('aguana', 40, 50);
  const target = engine.spawnPreviewEnemy({
    id: 'wake-target',
    creatureId: 'mouse_1',
    level: 8,
    position: { x: 70, y: 50 },
  })!;
  target.speed = 0;
  return { engine, tower: engine.towers[0], target };
}

describe('Wake Whip', () => {
  it('is the Aguana family level-5 physical Water move', () => {
    expect(ATTACK_DEFS.WAKE_WHIP).toMatchObject({
      name: 'Wake Whip',
      type: ElementType.WATER,
      category: 'physical',
      power: 40,
      cooldownMs: 1000,
      behaviorType: 'WAKE_WHIP',
      projectileVisual: {
        type: 'WAKE_WHIP',
        spriteUrl: '/battles/attacks/wake_whip_wave.webp',
      },
      wakeWhip: {
        windupMs: 520,
        recoveryMs: 150,
        pushDistance: 4,
        warmPushDistance: 7,
      },
    });
    for (const species of [AGUANA, NAUTIGUAN]) {
      expect(species.learnableAttacks).toContainEqual({
        level: 5,
        attackId: 'WAKE_WHIP',
      });
      expect(species.learnableAttacks).not.toContainEqual({
        level: 5,
        attackId: 'WATER_GUN',
      });
    }
  });

  it('faces its target, commits through the waggle, and launches one empowered wake', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { engine, tower, target } = createBattle();
    tower.warmth!.value = 10;
    tower.equippedAttacksRuntime[0].lastFiredTime = -1000;

    engine.tick(1, 1);

    expect(tower.facingDirection).toBe('right');
    expect(tower.wakeWhip).toMatchObject({
      targetId: target.id,
      attackFacingDirection: 'right',
      warmthDamageMultiplier: 1.4,
      launched: false,
    });
    expect(tower.warmth?.value).toBe(0);
    expect(engine.projectiles).toHaveLength(0);

    engine.elapsedTimeMs = tower.wakeWhip!.launchAtMs;
    updateWakeWhips(engine);

    expect(tower.facingDirection).toBe('right');
    expect(tower.wakeWhip?.launched).toBe(true);
    expect(engine.projectiles).toHaveLength(1);
    expect(engine.projectiles[0]).toMatchObject({
      attackDefinitionId: 'WAKE_WHIP',
      targetId: target.id,
      warmthDamageMultiplier: 1.4,
      facingDirection: 'right',
    });

    const positionBeforeImpact = target.position.x;
    engine.tick(200, 500);

    expect(target.hp).toBeLessThan(target.maxHp);
    expect(target.position.x).toBeLessThan(positionBeforeImpact);
    expect(tower.wakeWhip).toBeUndefined();
    expect(tower.facingDirection).toBe('right');
  });

  it('cancels the committed windup when the tower is moved', () => {
    const { engine, tower } = createBattle();
    tower.equippedAttacksRuntime[0].lastFiredTime = -1000;
    engine.tick(1, 1);
    expect(tower.wakeWhip).toBeDefined();

    engine.placeTower('aguana', 30, 50);

    expect(tower.wakeWhip).toBeUndefined();
    engine.tick(1000, 1000);
    expect(engine.projectiles).toHaveLength(0);
  });
});
