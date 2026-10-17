import type { AttackId } from '@/types/definitionIds';
import {
  makePlayerCreature,
  testDefinitionId,
} from '@/__tests__/utils/dataBuilders';
import { afterEach, beforeEach, vi } from 'vitest';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import type { AttackDefinition } from '@/engine/tower-defense/attacks/types';
import type { Enemy, Tower } from '@/engine/tower-defense/types';
import { ElementType } from '@/types/baseGame';

const engines: TowerDefenseEngine[] = [];
const originals = new Map<AttackId, AttackDefinition | undefined>();

beforeEach(() => vi.spyOn(Math, 'random').mockReturnValue(0.5));
afterEach(() => {
  engines.splice(0).forEach((engine) => engine.destroy());
  for (const [id, original] of originals) {
    if (original) ATTACK_DEFS[id] = original;
    else delete ATTACK_DEFS[id];
  }
  originals.clear();
  vi.restoreAllMocks();
});

export function makeAttack(
  overrides: Partial<AttackDefinition> = {}
): AttackDefinition {
  return {
    id: testDefinitionId('TEST_PROJECTILE'),
    name: 'Controlled behavior input',
    type: ElementType.NORMAL,
    category: 'special',
    power: 40,
    cooldownMs: 1000,
    rangeIndex: 40,
    projectileSpeed: 1,
    behaviorType: 'PROJECTILE',
    ...overrides,
  };
}

export function registerAttack(attack: AttackDefinition) {
  if (!originals.has(attack.id))
    originals.set(attack.id, ATTACK_DEFS[attack.id]);
  ATTACK_DEFS[attack.id] = attack;
  return attack;
}

export function makeEnemy(overrides: Partial<Enemy> = {}): Enemy {
  return {
    id: 'target',
    definitionId: 'test_defender',
    elementTypes: [ElementType.NORMAL],
    level: 10,
    position: { x: 10, y: 0 },
    hp: 2000,
    maxHp: 2000,
    speed: 0,
    currentAttack: 40,
    currentSpecialAttack: 40,
    currentDefense: 40,
    currentSpecialDefense: 40,
    statusConditions: [],
    currentWaypointIndex: 1,
    pathIndex: 0,
    facingDirection: 'right',
    damagedByTowerIds: new Set(),
    ...overrides,
  };
}

export function makeBattle(
  attack = makeAttack(),
  sourceOverrides: Partial<Tower> = {},
  targetOverrides: Partial<Enemy> = {}
) {
  registerAttack(attack);
  const engine = new TowerDefenseEngine({
    paths: [
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ],
    ],
    placementSpots: [],
    // An empty authored wave disables the engine's random-spawn fallback.
    waves: [{ id: 'test_empty_wave', groups: [] }],
  });
  engines.push(engine);
  const source: Tower = {
    id: 'caster',
    creature: makePlayerCreature({
      id: 'caster',
      speciesId: testDefinitionId('test_attacker'),
      level: 10,
      equippedAttacks: [attack.id],
    }),
    position: { x: 0, y: 0 },
    hp: 200,
    maxHp: 200,
    currentAttack: 60,
    currentSpecialAttack: 60,
    currentDefense: 40,
    currentSpecialDefense: 40,
    lastAttackTime: 0,
    // Direct behavior tests perform exactly one activation. Loop tests opt in.
    equippedAttacksRuntime: [],
    selectedAttackIndex: 0,
    facingDirection: 'right',
    targetingMode: 'closest',
    ...sourceOverrides,
  };
  const target = makeEnemy(targetOverrides);
  engine.towers = [source];
  engine.enemies = [target];
  return { engine, source, target, attack };
}
