import { afterEach, describe, expect, it, vi } from 'vitest';

import { AGUANA, NAUTIGUAN } from '@/constants/creatures';
import { EffectProcessor } from '@/engine/tower-defense/attacks/EffectProcessor';
import { WarmthSupportBehavior } from '@/engine/tower-defense/attacks/behaviors';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { updateWakeWhips } from '@/engine/tower-defense/attacks/wakeWhip';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import {
  consumeWaterActivationWarmth,
  getWarmthWaterDamageMultiplier,
  updatePassiveWarmth,
} from '@/engine/tower-defense/warmth';
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
        id: 'aguana',
        speciesId: 'aguana',
        level: 8,
        xp: 0,
        equippedAttacks: ['SUNBATHE', 'SCRATCH', 'WAKE_WHIP', 'DEEPWATER_GRIP'],
        isShiny: false,
      },
    ]
  );
  engines.push(engine);
  engine.placeTower('aguana', 40, 50);
  return engine;
}

describe('Aguana family Warmth', () => {
  it('gives both stages Sunbathe at level 4', () => {
    for (const species of [AGUANA, NAUTIGUAN]) {
      expect(species.learnableAttacks).toContainEqual({
        level: 4,
        attackId: 'SUNBATHE',
      });
    }
    expect(ATTACK_DEFS.SUNBATHE).toMatchObject({
      name: 'Sunbathe',
      type: ElementType.NORMAL,
      power: 0,
      cooldownMs: 45000,
      behaviorType: 'WARMTH_SUPPORT',
    });
  });

  it('waits one second, then gains 10% per second while a non-Water move remains active', () => {
    const engine = createEngine();
    const tower = engine.towers[0];
    expect(tower.warmth).toEqual({
      value: 0,
      sunSoaked: false,
      nonWaterActiveMs: 0,
    });

    updatePassiveWarmth(tower, ATTACK_DEFS.SCRATCH, 999);
    expect(tower.warmth?.value).toBe(0);
    updatePassiveWarmth(tower, ATTACK_DEFS.SUNBATHE, 1);
    expect(tower.warmth?.value).toBe(10);
    updatePassiveWarmth(tower, ATTACK_DEFS.SCRATCH, 2000);
    expect(tower.warmth?.value).toBe(30);

    updatePassiveWarmth(tower, ATTACK_DEFS.SCRATCH, 500);
    updatePassiveWarmth(tower, ATTACK_DEFS.WAKE_WHIP, 5000);
    updatePassiveWarmth(tower, ATTACK_DEFS.SCRATCH, 500);
    expect(tower.warmth?.value).toBe(30);
    updatePassiveWarmth(tower, ATTACK_DEFS.SCRATCH, 500);
    expect(tower.warmth?.value).toBe(40);
  });

  it('gives the full 40% Water bonus whenever any Warmth is available', () => {
    const engine = createEngine();
    const tower = engine.towers[0];
    expect(getWarmthWaterDamageMultiplier(tower, ATTACK_DEFS.WAKE_WHIP)).toBe(
      1
    );
    tower.warmth!.value = 10;
    expect(getWarmthWaterDamageMultiplier(tower, ATTACK_DEFS.WAKE_WHIP)).toBe(
      1.4
    );
    tower.warmth!.value = 100;
    expect(getWarmthWaterDamageMultiplier(tower, ATTACK_DEFS.WAKE_WHIP)).toBe(
      1.4
    );
    expect(getWarmthWaterDamageMultiplier(tower, ATTACK_DEFS.SCRATCH)).toBe(1);

    vi.spyOn(Math, 'random').mockReturnValue(0);
    const coldTarget = engine.spawnPreviewEnemy({
      id: 'cold-target',
      creatureId: 'mouse_1',
      level: 8,
      position: { x: 50, y: 50 },
    })!;
    const warmTarget = engine.spawnPreviewEnemy({
      id: 'warm-target',
      creatureId: 'mouse_1',
      level: 8,
      position: { x: 50, y: 50 },
    })!;
    tower.warmth!.value = 0;
    EffectProcessor.applyDamageAndEffects(
      engine,
      tower,
      coldTarget,
      ATTACK_DEFS.WAKE_WHIP
    );
    const coldDamage = coldTarget.maxHp - coldTarget.hp;
    tower.warmth!.value = 100;
    EffectProcessor.applyDamageAndEffects(
      engine,
      tower,
      warmTarget,
      ATTACK_DEFS.WAKE_WHIP
    );
    const warmDamage = warmTarget.maxHp - warmTarget.hp;
    expect(warmDamage).toBe(Math.floor(coldDamage * 1.4));
  });

  it('fills Warmth and grants one free empowered Water activation with Sunbathe', () => {
    const engine = createEngine();
    const tower = engine.towers[0];

    WarmthSupportBehavior.execute(engine, tower, ATTACK_DEFS.SUNBATHE);
    expect(tower.warmth).toEqual({
      value: 100,
      sunSoaked: true,
      nonWaterActiveMs: 0,
    });
    expect(engine.floatingTexts.at(-1)?.text).toBe('Warmth 100% + Sun-Soaked!');
    expect(
      WarmthSupportBehavior.canExecute(engine, tower, ATTACK_DEFS.SUNBATHE)
    ).toBe(false);

    expect(consumeWaterActivationWarmth(tower)).toEqual({
      consumedAmount: 0,
      usedSunSoaked: true,
    });
    expect(tower.warmth?.value).toBe(100);
    expect(tower.warmth?.sunSoaked).toBe(false);
    expect(consumeWaterActivationWarmth(tower)).toEqual({
      consumedAmount: 10,
      usedSunSoaked: false,
    });
    expect(tower.warmth?.value).toBe(90);
  });

  it('snapshots Warmth for a projectile before the activation drains the final 10%', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const engine = createEngine();
    const tower = engine.towers[0];
    const coldTarget = engine.spawnPreviewEnemy({
      id: 'cold-target',
      creatureId: 'mouse_1',
      level: 8,
      position: { x: 95, y: 50 },
    })!;
    const warmTarget = engine.spawnPreviewEnemy({
      id: 'warm-target',
      creatureId: 'mouse_1',
      level: 8,
      position: { x: 50, y: 50 },
    })!;
    EffectProcessor.applyDamageAndEffects(
      engine,
      tower,
      coldTarget,
      ATTACK_DEFS.WAKE_WHIP
    );
    const coldDamage = coldTarget.maxHp - coldTarget.hp;

    tower.warmth!.value = 10;
    engine.setTowerAttack('aguana', 2);
    tower.equippedAttacksRuntime[2].lastFiredTime = -1000;
    engine.tick(1, 1);

    expect(tower.warmth?.value).toBe(0);
    expect(tower.wakeWhip?.warmthDamageMultiplier).toBe(1.4);
    engine.elapsedTimeMs = tower.wakeWhip!.launchAtMs;
    updateWakeWhips(engine);
    const launchedProjectiles = engine.projectiles.filter(
      (projectile) => projectile.attackDefinitionId === 'WAKE_WHIP'
    );
    expect(launchedProjectiles).toHaveLength(1);
    expect(
      launchedProjectiles.every(
        (projectile) => projectile.warmthDamageMultiplier === 1.4
      )
    ).toBe(true);

    engine.tick(200, 199);
    expect(warmTarget.maxHp - warmTarget.hp).toBe(Math.floor(coldDamage * 1.4));
  });

  it('keeps the captured bonus for every delayed Deepwater Grip pulse', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const engine = createEngine();
    const tower = engine.towers[0];
    const coldTarget = engine.spawnPreviewEnemy({
      id: 'cold-grip-target',
      creatureId: 'mouse_1',
      level: 8,
      position: { x: 95, y: 50 },
    })!;
    const warmTarget = engine.spawnPreviewEnemy({
      id: 'warm-grip-target',
      creatureId: 'mouse_1',
      level: 8,
      position: { x: 50, y: 50 },
    })!;
    coldTarget.speed = 0;
    warmTarget.speed = 0;
    EffectProcessor.applyDamageAndEffects(
      engine,
      tower,
      coldTarget,
      ATTACK_DEFS.DEEPWATER_GRIP
    );
    const coldPulseDamage = coldTarget.maxHp - coldTarget.hp;

    tower.warmth!.value = 10;
    engine.setTowerAttack('aguana', 3);
    engine.tick(1, 1);

    expect(tower.warmth?.value).toBe(0);
    expect(tower.deepwaterGrip?.warmthDamageMultiplier).toBe(1.4);
    engine.tick(1001, 1000);
    expect(warmTarget.maxHp - warmTarget.hp).toBe(
      Math.floor(coldPulseDamage * 1.4)
    );
  });

  it('keeps Sunbathe cooldown on its move instance while swapping attacks', () => {
    const engine = createEngine();
    const tower = engine.towers[0];
    engine.tick(1, 1);
    expect(tower.warmth?.value).toBe(100);
    expect(tower.warmth?.sunSoaked).toBe(true);
    expect(tower.equippedAttacksRuntime[0].readyAtMs).toBe(45001);

    engine.setTowerAttack('aguana', 1);
    engine.tick(5001, 5000);
    expect(tower.warmth?.value).toBe(100);
    engine.setTowerAttack('aguana', 0);
    expect(tower.equippedAttacksRuntime[0].readyAtMs).toBe(45001);
  });
});
