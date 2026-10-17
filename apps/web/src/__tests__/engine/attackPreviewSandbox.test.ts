import { SpeciesId, AttackId } from '@/types/definitionIds';
import { makePlayerCreature } from '@/__tests__/utils/dataBuilders';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EffectProcessor } from '@/engine/tower-defense/attacks/EffectProcessor';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { hasActiveSpeedBoost } from '@/engine/tower-defense/speedModifiers';

const previewLevel = {
  paths: [
    [
      { x: 0, y: 50 },
      { x: 100, y: 50 },
    ],
  ],
  placementSpots: [{ x: 42, y: 50 }],
  waveEnemyDefinitions: [],
  waves: [{ id: 'preview', groups: [] }],
};

function createTowerEngine() {
  const engine = new TowerDefenseEngine(previewLevel, [
    makePlayerCreature({
      id: 'preview-tower',
      speciesId: SpeciesId.FUEGUANA,
      level: 10,
      equippedAttacks: [AttackId.EMBER],
    }),
  ]);
  engine.placeTower('preview-tower', 42, 50);
  return engine;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('attack preview sandbox hooks', () => {
  it('reports real attack damage while keeping an invulnerable target at full HP', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const engine = createTowerEngine();
    const target = engine.spawnPreviewEnemy({
      id: 'primary-target',
      creatureId: SpeciesId.KNOTIA,
      level: 10,
      position: { x: 60, y: 50 },
      isInvulnerable: true,
    });
    const tower = engine.towers[0];
    const damageEvents: number[] = [];
    const unsubscribe = engine.events.subscribe((event) => {
      if (event.type === 'ATTACK_DAMAGE_DEALT') {
        damageEvents.push(event.damage);
      }
    });

    expect(target).not.toBeNull();
    EffectProcessor.applyDamageAndEffects(
      engine,
      tower,
      target!,
      ATTACK_DEFS[AttackId.EMBER]
    );

    expect(damageEvents).toHaveLength(1);
    expect(damageEvents[0]).toBeGreaterThan(0);
    expect(target?.hp).toBe(target?.maxHp);
    expect(engine.floatingTexts.at(-1)?.text).toBe(damageEvents[0].toString());

    unsubscribe();
    engine.destroy();
  });

  it('keeps preview abilities manual and triggers them through production logic', () => {
    const engine = new TowerDefenseEngine(previewLevel);
    const caster = engine.spawnPreviewEnemy({
      id: 'tailwind-caster',
      creatureId: SpeciesId.MAINSCALE,
      level: 8,
      position: { x: 60, y: 35 },
      abilityId: 'MOTH_TAILWIND',
    });
    const ally = engine.spawnPreviewEnemy({
      id: 'tailwind-ally',
      creatureId: SpeciesId.BEETADEL,
      level: 8,
      position: { x: 70, y: 50 },
    });

    engine.tick(8000, 8000);
    expect(engine.visualEffects).toHaveLength(0);
    expect(hasActiveSpeedBoost(ally!, engine.elapsedTimeMs)).toBe(false);

    expect(engine.triggerEnemyAbility(caster!.id)).toBe(true);
    expect(hasActiveSpeedBoost(ally!, engine.elapsedTimeMs)).toBe(true);
    expect(engine.visualEffects).toContainEqual(
      expect.objectContaining({
        configId: 'attack_wind_gust_1',
        targetId: caster!.id,
      })
    );

    engine.destroy();
  });

  it('replays one-use ability visuals without stacking permanent stats', () => {
    const engine = new TowerDefenseEngine(previewLevel);
    const target = engine.spawnPreviewEnemy({
      id: 'harden-target',
      creatureId: SpeciesId.BEETADEL,
      level: 10,
      position: { x: 60, y: 50 },
      abilityId: 'BETTLE_HARDEN',
    });
    const baseDefense = target!.currentDefense;

    expect(engine.triggerEnemyAbility(target!.id)).toBe(true);
    const boostedDefense = target!.currentDefense;
    expect(boostedDefense).toBeCloseTo(baseDefense * 2);

    expect(engine.triggerEnemyAbility(target!.id)).toBe(true);
    expect(target!.currentDefense).toBe(boostedDefense);
    expect(
      engine.visualEffects.filter(
        (effect) => effect.configId === 'enemy_harden_1'
      )
    ).toHaveLength(2);

    engine.destroy();
  });
});
