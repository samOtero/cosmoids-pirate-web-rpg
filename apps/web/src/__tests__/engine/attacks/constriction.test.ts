import { AttackId, SpeciesId } from '@/types/definitionIds';
import { makePlayerCreature } from '@/__tests__/utils/dataBuilders';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { ATTACK_FIXTURES, installAttackFixtures } from './fixtures';
import { ConstrictionBehavior } from '@/engine/tower-defense/attacks/deepwaterGrip';
import type { Enemy } from '@/engine/tower-defense/types';

installAttackFixtures();

const engines: TowerDefenseEngine[] = [];
afterEach(() => {
  engines.splice(0).forEach((e) => e.destroy());
  vi.restoreAllMocks();
});
const move = ATTACK_FIXTURES[AttackId.DEEPWATER_GRIP];
function battle() {
  const engine = new TowerDefenseEngine(
    {
      paths: [
        [
          { x: 0, y: 50 },
          { x: 100, y: 50 },
        ],
      ],
      placementSpots: [],
      waves: [{ id: 'empty', groups: [] }],
    },
    ['one', 'two'].map((id) =>
      makePlayerCreature({
        id,
        speciesId: SpeciesId.MAROPHIS,
        level: 12,
        equippedAttacks: [AttackId.DEEPWATER_GRIP, AttackId.WATER_GUN],
      })
    )
  );
  engines.push(engine);
  engine.placeTower('one', 40, 50);
  engine.placeTower('two', 42, 50);
  const [source, other] = engine.towers;
  other.equippedAttacksRuntime = [];
  const target: Enemy = {
    id: 'target',
    definitionId: SpeciesId.KNOTIA,
    level: 12,
    position: { x: 50, y: 50 },
    hp: 500,
    maxHp: 500,
    speed: 0.01,
    currentAttack: 20,
    currentSpecialAttack: 20,
    currentDefense: 20,
    currentSpecialDefense: 20,
    statusConditions: [],
    currentWaypointIndex: 1,
    pathIndex: 0,
    facingDirection: 'right',
    damagedByTowerIds: new Set(),
  };
  engine.enemies = [target];
  return { engine, source, other, target };
}

describe('Constriction and periodic damage', () => {
  it('releases both sides of a tower swap immediately and does not leave a replaced caster holding a target', () => {
    const { engine, source, other, target } = battle();
    engine.tick(1, 1);
    engine.placeTower(other.creature.id, source.position.x, source.position.y);
    expect(source.deepwaterGrip).toBeUndefined();
    expect(target.constrictedByTowerId).toBeUndefined();
    expect(target.constrictionResistantUntilMs).toBe(6001);

    target.constrictionResistantUntilMs = 0;
    ConstrictionBehavior.execute(engine, source, move);
    engine.roster.push({ ...other.creature, id: 'replacement' });
    engine.placeTower('replacement', source.position.x, source.position.y);
    expect(engine.towers).not.toContain(source);
    expect(source.deepwaterGrip).toBeUndefined();
    expect(target.constrictedByTowerId).toBeUndefined();
    expect(target.constrictionResistantUntilMs).toBe(6001);
  });

  it('allows existing poison to keep ticking while the victim is held', () => {
    const { engine, target } = battle();
    target.statusConditions.push({
      type: 'POISON',
      durationMs: 5000,
      tickDamage: 3,
      lastTickTime: 0,
    });
    engine.tick(1, 1);
    const hp = target.hp;
    engine.tick(1002, 1001);
    expect(target.hp).toBeLessThan(hp - 3);
    expect(target.statusConditions[0].lastTickTime).toBe(1002);
    expect(target.constrictedByTowerId).toBeDefined();
  });
  it('holds for the configured duration with evenly spaced damage pulses', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const { engine, source, target } = battle();
    const hits: number[] = [];
    engine.events.subscribe((event) => {
      if (event.type === 'ATTACK_DAMAGE_DEALT') hits.push(event.damage);
    });
    engine.tick(1, 1);
    const x = target.position.x;
    expect(source.deepwaterGrip?.targetId).toBe(target.id);
    expect(target.hp).toBe(500);
    for (let i = 1; i <= 4; i++) {
      engine.tick(1 + i * 1000, 1000);
      expect(target.position.x).toBe(x);
      expect(hits).toHaveLength(i);
    }
    expect(new Set(hits).size).toBe(1);
    expect(hits.every((damage) => damage > 0)).toBe(true);
    expect(source.deepwaterGrip).toBeUndefined();
    expect(target.constrictedByTowerId).toBeUndefined();
    expect(target.constrictionResistantUntilMs).toBe(10001);
    engine.tick(4101, 100);
    expect(target.position.x).toBeGreaterThan(x);
  });

  it('prevents overlapping holds and grants six seconds of resistance against every caster', () => {
    const { engine, source, other, target } = battle();
    engine.tick(1, 1);
    ConstrictionBehavior.execute(engine, other, move);
    expect(other.deepwaterGrip).toBeUndefined();
    engine.tick(4001, 4000);
    expect(ConstrictionBehavior.canExecute(engine, other, move)).toBe(false);
    engine.tick(10000, 5999);
    expect(source.deepwaterGrip).toBeUndefined();
    expect(ConstrictionBehavior.canExecute(engine, other, move)).toBe(false);
    source.equippedAttacksRuntime = [];
    engine.tick(10001, 1);
    expect(ConstrictionBehavior.canExecute(engine, other, move)).toBe(true);
    ConstrictionBehavior.execute(engine, other, move);
    expect(target.constrictedByTowerId).toBe(other.id);
  });

  it('keeps the caster occupied after switching moves and preserves its simulation cooldown', () => {
    const { engine, source } = battle();
    engine.tick(1, 1);
    source.selectedAttackIndex = 1;
    engine.tick(2001, 2000);
    expect(engine.projectiles).toHaveLength(0);
    expect(source.deepwaterGrip).toBeDefined();
    expect(source.equippedAttacksRuntime[0].readyAtMs).toBe(8001);
    engine.tick(4001, 2000);
    expect(source.equippedAttacksRuntime[1].lastFiredTime).toBe(4001);
    expect(source.deepwaterGrip).toBeUndefined();
  });

  it('catches up exactly four pulses on a long frame and moves only for its unheld portion', () => {
    const { engine, target } = battle();
    const hit = vi.fn();
    engine.events.subscribe((event) => {
      if (event.type === 'ATTACK_DAMAGE_DEALT') hit();
    });
    engine.tick(1, 1);
    const x = target.position.x;
    engine.tick(5001, 5000);
    expect(hit).toHaveBeenCalledTimes(4);
    expect(target.position.x - x).toBeCloseTo((target.speed * 1000) / 16.666);
    expect(target.constrictionResistantUntilMs).toBe(10001);
  });

  it.each(['remove', 'move', 'death', 'capture'] as const)(
    'cleans up after %s, without another damage pulse',
    (reason) => {
      const { engine, source, target } = battle();
      engine.tick(1, 1);
      if (reason === 'remove') engine.removeTower(source.creature.id);
      if (reason === 'move') source.position.x += 1;
      if (reason === 'death') source.hp = 0;
      if (reason === 'capture') engine.enemies = [];
      engine.tick(1001, 1000);
      expect(source.deepwaterGrip).toBeUndefined();
      expect(target.hp).toBe(500);
      if (reason !== 'capture') {
        expect(target.constrictedByTowerId).toBeUndefined();
        expect(target.constrictionResistantUntilMs).toBeGreaterThan(
          engine.elapsedTimeMs
        );
      }
    }
  );

  it('releases immediately when a pulse kills its target and credits participation', () => {
    const { engine, source, target } = battle();
    target.hp = 1;
    engine.tick(1, 1);
    engine.tick(1001, 1000);
    expect(source.deepwaterGrip).toBeUndefined();
    expect(engine.enemies).toHaveLength(0);
    expect(target.damagedByTowerIds.has(source.id)).toBe(true);
  });

  it('skips status-immune targets, structures, and targets outside range', () => {
    const { engine, source, target } = battle();
    target.immuneToStatusEffects = true;
    expect(ConstrictionBehavior.canExecute(engine, source, move)).toBe(false);
    target.immuneToStatusEffects = false;
    target.kind = 'structure';
    expect(ConstrictionBehavior.canExecute(engine, source, move)).toBe(false);
    target.kind = 'creature';
    target.position.y = 100;
    expect(ConstrictionBehavior.canExecute(engine, source, move)).toBe(false);
  });
});
