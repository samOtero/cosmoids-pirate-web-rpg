import { describe, expect, it, vi } from 'vitest';
import {
  makePlayerCreature,
  makeProfile,
  testDefinitionId,
} from '../utils/dataBuilders';
import { RUN_PARTNERS, RUN_TEAM_LIMIT, RUN_WAVES } from '@/constants/roguelite';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import {
  RogueliteBattleEngine,
  RogueliteRun,
  RUN_UPGRADES,
  RunCombatEffects,
  type RunUpgrade,
} from '@/engine/roguelite/RogueliteRun';
import { ElementType } from '@/types/baseGame';
import type { Enemy, TDLevelData } from '@/engine/tower-defense/types';

const controlledLevel = (): TDLevelData => ({
  paths: [
    [
      { x: 0, y: 50 },
      { x: 50, y: 50 },
    ],
  ],
  placementSpots: [],
  captureUnits: [{ tdConfigId: 'coin_1', position: { x: 50, y: 50 } }],
  waveEnemyDefinitions: [],
  waves: [{ id: 'controlled', groups: [] }],
});
const makeEnemy = (id = 'carrier'): Enemy => ({
  id,
  definitionId: testDefinitionId('enemy'),
  position: { x: 10, y: 50 },
  level: 1,
  hp: 500,
  maxHp: 500,
  speed: 0,
  currentAttack: 10,
  currentSpecialAttack: 10,
  currentDefense: 10,
  currentSpecialDefense: 10,
  statusConditions: [],
  damagedByTowerIds: new Set(),
  pathIndex: 0,
  currentWaypointIndex: 1,
  facingDirection: 'right',
});

function clearWave(run: RogueliteRun) {
  if (run.phase === 'preparation') expect(run.startWave()).toBe(true);
  expect(run.phase).toBe('battle');
  run.engine.hasFinishedAllWaves = true;
  run.engine.enemies = [];
  run.tick(16);
}

describe('run objective recovery', () => {
  it('rescues a dropped coin without changing ordinary floor-drop behavior', () => {
    for (const Engine of [TowerDefenseEngine, RogueliteBattleEngine]) {
      const engine = new Engine(controlledLevel());
      const enemy = makeEnemy();
      const coin = engine.captureUnits[0];
      coin.position = { ...enemy.position };
      coin.heldByEnemyId = enemy.id;
      enemy.heldCaptureUnitId = coin.id;
      engine.dropCaptureUnit(enemy);
      expect(coin.position).toEqual(
        engine instanceof RogueliteBattleEngine
          ? coin.homePosition
          : enemy.position
      );
      expect(coin.heldByEnemyId).toBeUndefined();
      expect(engine.lives).toBe(1);
      engine.destroy();
    }
  });

  it('does not lose while all coins are carried, but loses when a carrier escapes', () => {
    const engine = new RogueliteBattleEngine(controlledLevel());
    const enemy = makeEnemy();
    enemy.isMovingBackward = true;
    enemy.currentWaypointIndex = 0;
    const coin = engine.captureUnits[0];
    coin.heldByEnemyId = enemy.id;
    enemy.heldCaptureUnitId = coin.id;
    engine.enemies = [enemy];
    engine.tick(1, 1);
    expect(engine.lives).toBe(1);
    enemy.currentWaypointIndex = -1;
    engine.tick(2, 1);
    expect(engine.lives).toBe(0);
    expect(engine.captureUnits).toHaveLength(0);
    expect(engine.rescuedCoins).toBe(0);
    engine.destroy();
  });
});

describe('run combat modifiers', () => {
  function setup(upgrades: RunUpgrade[]) {
    const engine = new RogueliteBattleEngine(controlledLevel());
    const enemy = makeEnemy();
    engine.enemies = [enemy];
    const fire = testDefinitionId('fire');
    const grass = testDefinitionId('grass');
    const water = testDefinitionId('water');
    const normal = testDefinitionId('normal');
    const types = new Map([
      [fire, ElementType.FIRE],
      [grass, ElementType.GRASS],
      [water, ElementType.WATER],
      [normal, ElementType.NORMAL],
    ]);
    const effects = new RunCombatEffects(engine, new Set(upgrades), (id) =>
      types.get(id)
    );
    const hit = (attackDefId: number, towerId = 'source') =>
      engine.events.emit({
        type: 'ATTACK_DAMAGE_DEALT',
        attackDefId,
        targetEnemyId: enemy.id,
        towerId,
        damage: 100,
      });
    return { engine, enemy, fire, grass, water, normal, effects, hit };
  }

  it('lets a different partner consume a Grass opening once, including with an off-type move', () => {
    const { hit, grass, normal, enemy, effects } = setup(['openings']);
    hit(grass);
    hit(normal);
    expect(enemy.hp).toBe(500);
    hit(normal, 'ally');
    expect(enemy.hp).toBe(460);
    hit(normal, 'ally');
    expect(enemy.hp).toBe(460);
    expect(effects.followUps).toBe(1);
    effects.destroy();
  });

  it('expires openings and reconnects subscriptions without duplicating effects', () => {
    const { hit, grass, normal, enemy, engine, effects } = setup(['openings']);
    hit(grass);
    engine.elapsedTimeMs = 3001;
    hit(normal, 'ally');
    expect(enemy.hp).toBe(500);
    effects.destroy();
    effects.connect();
    effects.connect();
    hit(grass);
    hit(normal, 'ally');
    expect(enemy.hp).toBe(460);
    effects.destroy();
  });

  it('builds Fire pressure, caps it, and resets after a lull', () => {
    const { hit, fire, enemy, engine, effects } = setup(['stoke']);
    hit(fire);
    expect(enemy.hp).toBe(500);
    hit(fire);
    hit(fire);
    hit(fire);
    hit(fire);
    hit(fire);
    expect(enemy.hp).toBe(360);
    engine.elapsedTimeMs = 3001;
    hit(fire);
    expect(enemy.hp).toBe(360);
    effects.destroy();
  });

  it('keys displacement to the move type and respects its per-enemy cooldown', () => {
    const { hit, water, fire, engine, effects } = setup(['backwash']);
    const push = vi.spyOn(engine, 'pushEnemyAgainstMovement');
    hit(fire);
    expect(push).not.toHaveBeenCalled();
    hit(water);
    hit(water, 'other');
    expect(push).toHaveBeenCalledOnce();
    engine.elapsedTimeMs = 2000;
    hit(water);
    expect(push).toHaveBeenCalledTimes(2);
    effects.destroy();
  });

  it('carries Fire escalation forward after a finishing hit', () => {
    const { hit, fire, enemy, effects } = setup(['stoke']);
    enemy.hp = 0;
    hit(fire);
    enemy.hp = 500;
    hit(fire);
    expect(enemy.hp).toBeLessThan(500);
    effects.destroy();
  });
});

describe('run lifecycle and isolation', () => {
  const starter = RUN_PARTNERS.find((partner) => partner.starter)!;

  it('moves, swaps and benches partners during combat without resetting their runtime', () => {
    const run = new RogueliteRun(starter.speciesId, 123);
    clearWave(run);
    run.chooseReward(run.rewards[0].id);
    const [first, second] = run.engine.towers;
    const firstSpot = { ...first.position };
    const secondSpot = { ...second.position };
    first.hp--;
    first.equippedAttacksRuntime[0].readyAtMs = 4000;
    expect(run.placePartner(first.creature.id, secondSpot)).toBe(true);
    expect(first.position).toEqual(secondSpot);
    expect(second.position).toEqual(firstSpot);
    expect(first.hp).toBe(first.maxHp - 1);
    expect(first.equippedAttacksRuntime[0].readyAtMs).toBe(4000);
    expect(run.removePartner(first.creature.id)).toBe(true);
    expect(run.placePartner(first.creature.id, firstSpot)).toBe(true);
    expect(run.engine.towers).toContain(first);
    run.removePartner(first.creature.id);
    clearWave(run);
    expect(run.placePartner(second.creature.id, firstSpot)).toBe(false);
    expect(run.removePartner(second.creature.id)).toBe(false);
    run.chooseReward(run.rewards[0].id);
    expect(run.phase).toBe('battle');
    expect(
      run.engine.towers.some((tower) => tower.creature.id === first.creature.id)
    ).toBe(false);
    expect(run.placePartner(first.creature.id, firstSpot)).toBe(true);
    run.destroy();
  });

  it('accepts rewards only between cleared waves and preserves coins, placement and temporary progression', () => {
    const run = new RogueliteRun(starter.speciesId, 123);
    const creature = run.engine.roster[0];
    const spot = run.engine.placementSpots.at(-1)!;
    expect(run.chooseReward('invented')).toBe(false);
    expect(run.placePartner(creature.id, spot)).toBe(true);
    clearWave(run);
    expect(run.phase).toBe('reward');
    expect(run.rewards.every((reward) => reward.kind === 'partner')).toBe(true);
    run.engine.lives--;
    run.coins = run.engine.lives;
    const choice = run.rewards[0].id;
    expect(run.chooseReward(choice)).toBe(true);
    expect(run.chooseReward(choice)).toBe(false);
    expect(run.engine.roster).toHaveLength(2);
    expect(run.engine.lives).toBe(run.coins);
    expect(
      run.engine.towers.find((tower) => tower.creature.id === creature.id)
        ?.position
    ).toEqual(spot);
    expect(
      run.engine.towers.every((tower) => tower.receivesExperience === false)
    ).toBe(true);
    expect(run.phase).toBe('battle');
    run.destroy();
  });

  it('keeps drafts repeatable, offers usable rewards, caps recruitment, and reaches the final result', () => {
    const a = new RogueliteRun(starter.speciesId, 42);
    const b = new RogueliteRun(starter.speciesId, 42);
    for (let wave = 1; wave <= RUN_WAVES; wave++) {
      clearWave(a);
      clearWave(b);
      expect(a.rewards).toEqual(b.rewards);
      if (wave === RUN_WAVES) break;
      expect(new Set(a.rewards.map((reward) => reward.id)).size).toBe(
        a.rewards.length
      );
      expect(a.rewards.length).toBeGreaterThanOrEqual(2);
      for (const reward of a.rewards) {
        if (reward.kind === 'partner')
          expect(a.engine.roster.length).toBeLessThan(RUN_TEAM_LIMIT);
        else if (!RUN_UPGRADES[reward.upgrade].repeatable)
          expect(a.upgrades.has(reward.upgrade)).toBe(false);
      }
      a.chooseReward(a.rewards[0].id);
      b.chooseReward(b.rewards[0].id);
      expect(a.engine.roster.length).toBeLessThanOrEqual(RUN_TEAM_LIMIT);
    }
    expect(a.phase).toBe('won');
    expect(a.startWave()).toBe(false);
    a.destroy();
    b.destroy();
  });

  it('leaves profiles and authored attacks untouched and resets a fresh attempt', () => {
    const profile = makeProfile({
      creatures: [
        makePlayerCreature({
          id: 'story_partner',
          speciesId: starter.speciesId,
        }),
      ],
    });
    const before = structuredClone(profile);
    const attacks = structuredClone(ATTACK_DEFS);
    const run = new RogueliteRun(starter.speciesId, 7);
    clearWave(run);
    run.chooseReward(run.rewards[0].id);
    run.upgrades.add('stoke');
    run.engine.roster[0].level++;
    const fresh = new RogueliteRun(starter.speciesId, 7);
    expect(fresh.upgrades.size).toBe(0);
    expect(fresh.engine.roster).toHaveLength(1);
    expect(fresh.engine.roster[0].level).toBeLessThan(
      run.engine.roster[0].level
    );
    expect(profile).toEqual(before);
    expect(ATTACK_DEFS).toEqual(attacks);
    run.destroy();
    fresh.destroy();
  });

  it('applies training across waves without compounding it when repositioning', () => {
    const run = new RogueliteRun(starter.speciesId, 1);
    const baseAttack = run.engine.towers[0].currentAttack;
    const baseRange = run.engine.towerRangeMultiplier;
    clearWave(run);
    run.rewards = [
      { id: 'controlled_power', kind: 'upgrade', upgrade: 'practice' },
    ];
    run.chooseReward('controlled_power');
    const trainedAttack = run.engine.towers[0].currentAttack;
    expect(trainedAttack).toBeGreaterThan(baseAttack);
    run.placePartner(
      run.engine.roster[0].id,
      run.engine.placementSpots.at(-1)!
    );
    expect(run.engine.towers[0].currentAttack).toBe(trainedAttack);
    clearWave(run);
    run.rewards = [
      { id: 'controlled_reach', kind: 'upgrade', upgrade: 'watch' },
    ];
    run.chooseReward('controlled_reach');
    expect(run.engine.towerRangeMultiplier).toBeGreaterThan(baseRange);
    expect(run.engine.towers[0].currentAttack).toBe(trainedAttack);
    run.destroy();
  });
});
