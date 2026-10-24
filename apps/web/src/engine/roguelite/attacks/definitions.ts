import { ElementType } from '@/types/baseGame';
import { AttackId, ROGUELITE_ATTACK_IDS } from '@/types/definitionIds';
import type { AttackDefinition } from '@/engine/tower-defense/attacks/types';
import { validateDefinitionRegistry } from '@/utils/definitionRegistry';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';

export type RunAttackPattern =
  | { kind: 'cleave'; halfAngle: number }
  | { kind: 'aimed' }
  | {
      kind: 'piercing';
      width: number;
      speed: number;
      pulses: number;
      pulseIntervalMs: number;
    }
  | {
      kind: 'bomb';
      blastRadius: number;
      flightMs: number;
      fuseMs: number;
      fanAngles: readonly number[];
    };

export interface RunAttackDefinition extends AttackDefinition {
  pattern: RunAttackPattern;
  castMs: number;
  placementHint: string;
}

// Independent definitions. Existing effect artwork and damage mechanics are reusable.
export const RUN_ATTACK_DEFS: Record<number, RunAttackDefinition> = {
  [AttackId.ROGUELITE_FIRE_CLAW]: {
    id: AttackId.ROGUELITE_FIRE_CLAW,
    name: 'Fire Claw',
    description:
      'Alternating short claw sweeps cleave nearby enemies in front. Starts without Heat; Stoke the Flame unlocks escalation.',
    type: ElementType.FIRE,
    category: 'physical',
    power: 42,
    cooldownMs: 850,
    rangeIndex: 28,
    castMs: 240,
    behaviorType: 'INSTANT_AOE',
    pattern: { kind: 'cleave', halfAngle: Math.PI / 2.6 },
    visualEffectConfigId: 'attack_fire_claw_1',
    placementHint:
      'Place close to a bend or the stash to catch a cluster in each sweep.',
  },
  [AttackId.ROGUELITE_CINDER_SPIT]: {
    id: AttackId.ROGUELITE_CINDER_SPIT,
    name: 'Cinder Spit',
    description:
      'Spits a long-range, aimed cinder at one enemy. Reliable interception with no base splash or Heat.',
    type: ElementType.FIRE,
    category: 'special',
    power: 46,
    cooldownMs: 950,
    rangeIndex: 62,
    castMs: 220,
    behaviorType: 'PROJECTILE',
    projectileSpeed: 1.4,
    pattern: { kind: 'aimed' },
    projectileVisual: {
      type: 'FLAME',
      outerColor: 0xdc2626,
      innerColor: 0xfb923c,
    },
    placementHint:
      'Use its longer reach to cover separated lanes and escaping carriers.',
  },
  [AttackId.ROGUELITE_FIRE_BREATH]: {
    id: AttackId.ROGUELITE_FIRE_BREATH,
    name: 'Fire Breath',
    description:
      'Fires a three-pulse stream along a fixed cardinal direction. Flames pierce every enemy in their path and never turn.',
    type: ElementType.FIRE,
    category: 'special',
    power: 24,
    cooldownMs: 1900,
    rangeIndex: 72,
    castMs: 600,
    behaviorType: 'PROJECTILE',
    pattern: {
      kind: 'piercing',
      width: 9,
      speed: 85,
      pulses: 3,
      pulseIntervalMs: 140,
    },
    placementHint:
      'Choose a direction in the move menu. Line up with a straight path; the stream cannot turn corners.',
  },
  [AttackId.ROGUELITE_TAIL_BOMB]: {
    id: AttackId.ROGUELITE_TAIL_BOMB,
    name: 'Tail Bomb',
    description:
      'Quickly lobs small firebombs in an alternating fan around an enemy’s position. Each lands, burns through a short fuse, then blasts that spot.',
    type: ElementType.FIRE,
    category: 'physical',
    power: 48,
    cooldownMs: 750,
    rangeIndex: 48,
    castMs: 240,
    behaviorType: 'PROJECTILE',
    pattern: {
      kind: 'bomb',
      blastRadius: 14,
      flightMs: 420,
      fuseMs: 380,
      fanAngles: [-0.24, 0, 0.24],
    },
    visualEffectConfigId: 'attack_cinder_spit_sparks',
    placementHint:
      'Bombs keep their landing spot. Bind or push enemies back into the explosions.',
  },
};

validateDefinitionRegistry(
  'Roguelite attacks',
  ROGUELITE_ATTACK_IDS,
  RUN_ATTACK_DEFS
);
validateDefinitionRegistry('All attack identities', AttackId, {
  ...ATTACK_DEFS,
  ...RUN_ATTACK_DEFS,
});

export function getRunAttackDefinition(id: number): AttackDefinition {
  return RUN_ATTACK_DEFS[id] ?? ATTACK_DEFS[id];
}

export function drawStartingMoves(
  random: () => number = Math.random
): number[] {
  const pool = Object.values(RUN_ATTACK_DEFS).map((attack) => attack.id);
  for (let index = pool.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [pool[index], pool[swap]] = [pool[swap], pool[index]];
  }
  return pool.slice(0, 2);
}
