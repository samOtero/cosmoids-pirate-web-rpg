import { afterEach, describe, expect, it } from 'vitest';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { ATTACK_FIXTURES, installAttackFixtures } from './fixtures';
import {
  getShipshapeTarget,
  RepairSupportBehavior,
} from '@/engine/tower-defense/attacks/behaviors';
import { STARTER_CRAB } from '@/constants/creatures';
import { calculateStat } from '@/utils/resolvePlayerCreature';

installAttackFixtures();

const engines: TowerDefenseEngine[] = [];
afterEach(() => {
  engines.splice(0).forEach((engine) => engine.destroy());
});
const move = ATTACK_FIXTURES.SHIPSHAPE;
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
    ['caster', 'ally', 'far', 'dead'].map((id) => ({
      id,
      speciesId: 'starter_crab',
      level: 12,
      xp: 0,
      equippedAttacks: ['SHIPSHAPE', 'PINCH'],
      gender: 'female' as const,
      isShiny: false,
    }))
  );
  engines.push(engine);
  for (const [id, x, y] of [
    ['caster', 40, 50],
    ['ally', 50, 50],
    ['far', 40, 95],
    ['dead', 45, 50],
  ] as const) {
    engine.placeTower(id, x, y);
  }
  const [caster, ally, far, dead] = engine.towers;
  for (const unit of engine.towers) {
    unit.maxHp = unit.hp = 100;
    unit.currentDefense = 40;
    // Only the caster acts during simulation-clock tests.
    if (unit !== caster) unit.equippedAttacksRuntime = [];
  }
  dead.hp = 0;
  return { engine, caster, ally, far, dead };
}

describe('Healing and defensive support', () => {
  it('selects by missing health percentage, excludes dead/out-of-range allies, and favors allies on ties', () => {
    const { engine, caster, ally, far } = battle();
    caster.maxHp = 200;
    caster.hp = 80;
    ally.hp = 50;
    far.hp = 1;
    expect(getShipshapeTarget(engine, caster, move)).toBe(caster);
    ally.hp = 40;
    expect(getShipshapeTarget(engine, caster, move)).toBe(ally);
  });

  it('heals the injured target before reinforcing a healthy one and never stacks or changes special defense', () => {
    const { engine, caster, ally } = battle();
    ally.hp = 20;
    const specialDefense = ally.currentSpecialDefense;
    RepairSupportBehavior.execute(engine, caster, move);
    expect(ally.hp).toBe(40);
    expect(ally.currentDefense).toBe(50);
    expect(ally.defenseBoostMultiplier).toBe(1.25);
    expect(ally.currentSpecialDefense).toBe(specialDefense);
    expect(ally.specialDefenseBoostMultiplier).toBeUndefined();
    engine.visualEffects = [];
    RepairSupportBehavior.execute(engine, caster, move);
    expect(ally.hp).toBe(60);
    expect(ally.currentDefense).toBe(50);
    expect(caster.defenseBoostMultiplier).toBeUndefined();
    expect(engine.visualEffects.map((effect) => effect.configId)).toEqual([
      'attack_shipshape_taps',
      'attack_shipshape_heal',
    ]);
    ally.hp = 95;
    RepairSupportBehavior.execute(engine, caster, move);
    expect(ally.hp).toBe(100);
  });

  it('reinforces healthy allies before self, then waits without resetting the cooldown', () => {
    const { engine, caster, ally } = battle();
    engine.tick(1, 1);
    expect(ally.defenseBoostMultiplier).toBe(1.25);
    expect(caster.defenseBoostMultiplier).toBeUndefined();
    expect(engine.visualEffects.map((effect) => effect.configId)).toEqual([
      'attack_shipshape_taps',
      'attack_shipshape_brace',
    ]);
    engine.tick(5001, 5000);
    expect(caster.defenseBoostMultiplier).toBe(1.25);
    engine.tick(10001, 5000);
    expect(caster.equippedAttacksRuntime[0].readyAtMs).toBe(10001);
    expect(RepairSupportBehavior.canExecute(engine, caster, move)).toBe(false);
    ally.hp = 70;
    engine.tick(10002, 1);
    expect(ally.hp).toBe(90);
    expect(caster.equippedAttacksRuntime[0].readyAtMs).toBe(15002);
  });

  it('preserves a stronger existing physical boost while still healing', () => {
    const { engine, caster, ally } = battle();
    ally.hp = 50;
    ally.defenseBoostMultiplier = 2;
    ally.currentDefense = 80;
    RepairSupportBehavior.execute(engine, caster, move);
    expect(ally.hp).toBe(70);
    expect(ally.currentDefense).toBe(80);
    expect(ally.defenseBoostMultiplier).toBe(2);
    expect(
      engine.visualEffects.some(
        (effect) => effect.configId === 'attack_shipshape_brace'
      )
    ).toBe(false);
  });

  it('keeps its five-second cooldown through attack swaps and attack-speed buffs', () => {
    const { engine, caster, ally } = battle();
    engine.tick(1, 1);
    ally.hp = 50;
    caster.attackSpeedBuff = {
      multiplier: 2,
      appliedAtMs: 1,
      expiresAtMs: 20000,
    };
    engine.setTowerAttack('caster', 1);
    engine.tick(1000, 999);
    engine.setTowerAttack('caster', 0);
    engine.tick(100000, 1);
    expect(ally.hp).toBe(50);
    expect(caster.equippedAttacksRuntime[0].readyAtMs).toBe(5001);
    engine.tick(100001, 4000);
    expect(ally.hp).toBe(70);
  });

  it('retains reinforcement when level-up recalculates combat stats', () => {
    const { engine, caster, ally } = battle();
    engine.towers = [caster];
    RepairSupportBehavior.execute(engine, caster, move);
    caster.creature.xp = 13 ** 3 - 12 ** 3;
    engine.events.emit({
      type: 'ENEMY_DIED',
      enemyId: 'defeated',
      enemyDefinitionId: 'bug_stage_1',
      enemyLevel: 1,
      participantTowerIds: [caster.id],
    });
    expect(caster.creature.level).toBe(13);
    expect(caster.currentDefense).toBe(
      calculateStat(STARTER_CRAB.baseStats.defense, 13) * 1.25
    );
    expect(ally.defenseBoostMultiplier).toBeUndefined();
  });
});
