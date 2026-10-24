import { afterEach, describe, expect, it, vi } from 'vitest';
import { makePlayerCreature, testDefinitionId } from '../utils/dataBuilders';
import { battleSpecies, actor } from './behaviorFixtures';
import {
  RogueliteBattleEngine,
  RogueliteRun,
} from '@/engine/roguelite/RogueliteRun';
import { RunAttackController } from '@/engine/roguelite/attacks/RunAttackController';
import {
  drawStartingMoves,
  RUN_ATTACK_DEFS,
  type RunAttackDefinition,
  type RunAttackPattern,
} from '@/engine/roguelite/attacks/definitions';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { SpeciesId } from '@/types/definitionIds';
import { ElementType } from '@/types/baseGame';

const engines: RogueliteBattleEngine[] = [];
afterEach(() => {
  engines.splice(0).forEach((engine) => engine.destroy());
  vi.restoreAllMocks();
});

function setup(pattern: RunAttackPattern) {
  const sourceSpecies = testDefinitionId('pattern-source');
  const targetSpecies = testDefinitionId('pattern-target');
  battleSpecies(sourceSpecies);
  battleSpecies(targetSpecies);
  const id = testDefinitionId('controlled-pattern');
  const attack: RunAttackDefinition = {
    id,
    name: 'Controlled move',
    type: ElementType.FIRE,
    category: 'physical',
    power: 50,
    cooldownMs: 1000,
    rangeIndex: 100,
    castMs: 200,
    projectileSpeed: 1,
    behaviorType: 'PROJECTILE',
    pattern,
    placementHint: 'Controlled geometry',
  };
  const creature = makePlayerCreature({
    id: 'source',
    speciesId: sourceSpecies,
    level: 5,
    equippedAttacks: [id],
  });
  const engine = new RogueliteBattleEngine(
    {
      paths: [
        [
          { x: 0, y: 50 },
          { x: 200, y: 50 },
        ],
      ],
      placementSpots: [],
      waves: [{ id: 'empty', groups: [] }],
    },
    [creature]
  );
  engines.push(engine);
  engine.setAspectRatio(1);
  engine.placeTower(creature.id, 50, 50);
  const source = engine.towers[0];
  const definitions = { [id]: attack };
  vi.spyOn(engine, 'getAttackDefinition').mockImplementation(
    (moveId) => definitions[moveId] ?? ATTACK_DEFS[moveId]
  );
  const controller = new RunAttackController(
    engine,
    new Map([[creature.id, 'right']]),
    definitions
  );
  const enemy = (name: string, x: number, y = 50) => {
    const target = actor(engine, name, targetSpecies, x);
    target.position.y = y;
    target.hp = target.maxHp = 1000;
    target.speed = 0;
    return target;
  };
  return { engine, source, controller, attack, definitions, enemy };
}

describe('roguelite pattern mechanics', () => {
  it('cleaves a nearby frontal cluster and alternates sweep visuals without starting with Heat', () => {
    const { controller, source, attack, enemy, engine } = setup({
      kind: 'cleave',
      halfAngle: 1,
    });
    attack.rangeIndex = 20;
    const front = enemy('front', 60);
    const neighbor = enemy('neighbor', 62, 54);
    const behind = enemy('behind', 40);
    const distant = enemy('distant', 85);
    controller.updateTower(source);
    expect(front.hp).toBeLessThan(front.maxHp);
    expect(neighbor.hp).toBeLessThan(neighbor.maxHp);
    expect(behind.hp).toBe(behind.maxHp);
    expect(distant.hp).toBe(distant.maxHp);
    expect(source.fireClawHeat).toBeUndefined();
    const firstSide = controller.visuals[0].side;
    engine.elapsedTimeMs = 1001;
    controller.updateTower(source);
    expect(controller.visuals.at(-1)?.side).toBe(-firstSide!);
  });

  it('launches only one aimed projectile at a selected target', () => {
    const { controller, source, engine, enemy } = setup({ kind: 'aimed' });
    enemy('one', 60);
    enemy('two', 65);
    controller.updateTower(source);
    expect(engine.projectiles).toHaveLength(1);
    expect(
      engine.enemies.some(
        (target) => target.id === engine.projectiles[0].targetId
      )
    ).toBe(true);
    expect(engine.enemies.every((target) => target.hp === target.maxHp)).toBe(
      true
    );
  });

  it('pierces multiple enemies once per pulse along a fixed line, including across large simulation steps', () => {
    const { controller, source, enemy } = setup({
      kind: 'piercing',
      width: 2,
      speed: 100,
      pulses: 1,
      pulseIntervalMs: 100,
    });
    const near = enemy('near', 60);
    const far = enemy('far', 80);
    const side = enemy('side', 70, 60);
    const behind = enemy('behind', 45);
    controller.updateTower(source);
    controller.tick(350);
    expect(near.hp).toBeLessThan(near.maxHp);
    expect(far.hp).toBeLessThan(far.maxHp);
    expect(side.hp).toBe(side.maxHp);
    expect(behind.hp).toBe(behind.maxHp);
    const previousHp = near.hp;
    controller.tick(100);
    expect(near.hp).toBe(previousHp);
  });

  it('waits for flight and fuse, then blasts a fixed landing area instead of following its target', () => {
    const { controller, source, enemy, engine } = setup({
      kind: 'bomb',
      blastRadius: 3,
      flightMs: 200,
      fuseMs: 300,
      fanAngles: [0],
    });
    const target = enemy('target', 60);
    controller.updateTower(source);
    const landing = { ...controller.shots[0].destination };
    target.position.x = 90;
    const bystander = enemy('bystander', landing.x, landing.y);
    const outside = enemy('outside', landing.x + 6, landing.y);
    engine.towerRangeMultiplier = 2;
    controller.tick(499);
    expect(bystander.hp).toBe(bystander.maxHp);
    controller.tick(1);
    expect(target.hp).toBe(target.maxHp);
    expect(bystander.hp).toBeLessThan(bystander.maxHp);
    expect(outside.hp).toBe(outside.maxHp);
    expect(controller.shots).toHaveLength(0);
    expect(controller.visuals.some((effect) => effect.kind === 'blast')).toBe(
      true
    );
  });

  it('takes turns casting, keeps each move cooldown, and lets thrown bombs outlast a cast', () => {
    const { controller, source, definitions, attack, enemy, engine } = setup({
      kind: 'bomb',
      blastRadius: 3,
      flightMs: 900,
      fuseMs: 400,
      fanAngles: [0],
    });
    const other = { ...attack, id: testDefinitionId('second-pattern') };
    definitions[other.id] = other;
    source.equippedAttacksRuntime.push({
      definitionId: other.id,
      lastFiredTime: 0,
    });
    enemy('target', 60);
    controller.updateTower(source);
    expect(controller.shots).toHaveLength(1);
    engine.elapsedTimeMs = 100;
    controller.updateTower(source);
    expect(controller.shots).toHaveLength(1);
    engine.elapsedTimeMs = 250;
    controller.updateTower(source);
    expect(controller.shots).toHaveLength(2);
    engine.elapsedTimeMs = 500;
    controller.updateTower(source);
    expect(controller.shots).toHaveLength(2);
    controller.tick(300);
    expect(controller.shots).toHaveLength(2);
  });
});

describe('starting move selection', () => {
  it('draws two distinct registered choices and can offer every move', () => {
    const seen = new Set<number>();
    for (let index = 0; index < 100; index++) {
      const pair = drawStartingMoves(
        () => ((index * 7 + seen.size * 3) % 100) / 100
      );
      expect(pair).toHaveLength(2);
      expect(new Set(pair).size).toBe(2);
      pair.forEach((id) => {
        expect(RUN_ATTACK_DEFS[id]).toBeDefined();
        seen.add(id);
      });
    }
    expect(seen.size).toBe(Object.keys(RUN_ATTACK_DEFS).length);
  });

  it('starts with only the chosen run move and rejects story moves for Fueguana', () => {
    for (const move of Object.values(RUN_ATTACK_DEFS)) {
      const run = new RogueliteRun(SpeciesId.FUEGUANA, 123, move.id);
      expect(run.engine.roster[0].equippedAttacks).toEqual([move.id]);
      expect(run.engine.getAttackDefinition(move.id)).toBe(move);
      expect(ATTACK_DEFS[move.id]).toBeUndefined();
      run.destroy();
    }
    expect(
      () =>
        new RogueliteRun(
          SpeciesId.FUEGUANA,
          123,
          Object.values(ATTACK_DEFS)[0].id
        )
    ).toThrow();
  });
});
