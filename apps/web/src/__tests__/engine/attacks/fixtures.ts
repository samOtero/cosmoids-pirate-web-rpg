import { beforeEach, afterEach } from 'vitest';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import type { AttackDefinition } from '@/engine/tower-defense/attacks/types';
import { ElementType } from '@/types/baseGame';

function mechanic(
  id: string,
  overrides: Partial<AttackDefinition>
): AttackDefinition {
  return {
    id,
    name: 'Controlled behavior input',
    type: ElementType.NORMAL,
    category: 'physical',
    power: 40,
    cooldownMs: 1000,
    rangeIndex: 40,
    projectileSpeed: 1,
    behaviorType: 'PROJECTILE',
    ...overrides,
  };
}

// Stable simulation inputs, independent of shipped move tuning. Never synchronize
// these values with the production registry. Only mechanics under test own them.
// Existing IDs route legacy engine hooks that still dispatch by move ID.
export const ATTACK_FIXTURES: Record<string, AttackDefinition> = {
  BARREL_BASH: mechanic('BARREL_BASH', {
    type: ElementType.WATER,
    cooldownMs: 1200,
    projectileSpeed: 1.15,
    secondaryImpactPush: {
      radiusIndex: 12,
      distance: 8,
    },
    visualEffectConfigId: 'attack_barrel_bash_1',
    isDashAttack: true,
    dashTrailType: 'WATER',
  }),
  BARREL_BOWLING: mechanic('BARREL_BOWLING', {
    type: ElementType.WATER,
    power: 50,
    cooldownMs: 1600,
    behaviorType: 'ROLLING_BARREL',
    rollingBarrel: {
      lobDurationMs: 400,
      rollDistance: 45,
      rollSpeed: 45,
      hitRadius: 4,
    },
  }),
  COIR_SNAP: mechanic('COIR_SNAP', {
    type: ElementType.GRASS,
    power: 25,
    cooldownMs: 900,
    projectileSpeed: 1.35,
    coirSnapCombo: {
      hitsToBind: 3,
      bindDurationMs: 500,
      bindVisualEffectConfigId: 'attack_coir_snare_1',
      projectileScales: [0.72, 0.86, 1],
    },
  }),
  DEEPWATER_GRIP: mechanic('DEEPWATER_GRIP', {
    type: ElementType.WATER,
    category: 'special',
    power: 20,
    cooldownMs: 8000,
    behaviorType: 'CONSTRICTION',
    constriction: {
      durationMs: 4000,
      pulseIntervalMs: 1000,
      resistanceMs: 6000,
    },
  }),
  FIRE_CLAW: mechanic('FIRE_CLAW', {
    type: ElementType.FIRE,
    power: 20,
    cooldownMs: 800,
    visualEffectConfigId: 'attack_fire_claw_1',
    isDashAttack: true,
    dashTrailType: 'FIRE',
    fireClawHeat: {
      maxStacks: 3,
      damageBonusPerStack: 0.2,
      lullBeforeDecayMs: 3000,
      decayIntervalMs: 2000,
    },
  }),
  FLYING_COLORS: mechanic('FLYING_COLORS', {
    type: ElementType.FLYING,
    category: 'special',
    power: 30,
    cooldownMs: 1200,
    rangeIndex: 50,
    projectileSpeed: 1.4,
    flyingColors: {
      maxTargets: 3,
      hopRange: 40,
    },
    visualEffectConfigId: 'attack_flying_colors_1',
  }),
  FUNNY_DANCE: mechanic('FUNNY_DANCE', {
    category: 'special',
    power: 0,
    cooldownMs: 1600,
    rangeIndex: 60,
    behaviorType: 'FUNNY_DANCE',
    itemPickupLockMs: 2500,
    visualEffectConfigId: 'attack_funny_dance_1',
  }),
  FUSE_RUSH: mechanic('FUSE_RUSH', {
    type: ElementType.FIRE,
    power: 45,
    cooldownMs: 800,
    projectileSpeed: 1.5,
    isDashAttack: true,
    dashTrailType: 'FIRE',
    fuseRushCombo: {
      hitsToTrigger: 3,
      damageMultiplier: 2,
    },
  }),
  LOOSE_END: mechanic('LOOSE_END', {
    power: 50,
    projectileSpeed: 1.4,
    looseEnd: {
      followUpRadius: 40,
    },
  }),
  MALLET_SMASH: mechanic('MALLET_SMASH', {
    type: ElementType.GRASS,
    power: 50,
    cooldownMs: 1200,
    behaviorType: 'ADAPTIVE_TARGETED_AOE',
    effects: [
      {
        type: 'SPEED_SLOW',
        chance: 0.3,
        value: 0.8,
      },
    ],
    adaptiveTargetedAoe: {
      radiusIndex: 12,
      singleTargetPower: 75,
      singleTargetEffects: [
        {
          type: 'SPEED_SLOW',
          chance: 1,
          value: 0.5,
        },
      ],
    },
    visualEffectConfigId: 'attack_mallet_smash_1',
    isDashAttack: true,
    dashImpactHoldMs: 520,
    dashStopRange: 16,
  }),
  NECTAR_SIPHON: mechanic('NECTAR_SIPHON', {
    type: ElementType.GRASS,
    category: 'special',
    cooldownMs: 800,
    projectileSpeed: 1.5,
    poisonPayoff: {
      damageMultiplier: 1.5,
      prioritizePoisonedTargets: true,
    },
    effects: [
      {
        type: 'DRAIN',
        chance: 1,
        value: 0.5,
      },
    ],
  }),
  NIBBLE: mechanic('NIBBLE', {
    cooldownMs: 800,
    visualEffectConfigId: 'attack_nibble_1',
    isDashAttack: true,
  }),
  PALM_SLAM: mechanic('PALM_SLAM', {
    type: ElementType.FIGHTING,
    power: 95,
    cooldownMs: 3000,
    behaviorType: 'PALM_SLAM',
    effects: [
      {
        type: 'STUN',
        chance: 1,
        value: 650,
      },
    ],
    visualEffectConfigId: 'attack_palm_slam_1',
  }),
  PINCH: mechanic('PINCH', {
    cooldownMs: 800,
    isDashAttack: true,
  }),
  QUICK_ATTACK: mechanic('QUICK_ATTACK', {
    power: 15,
    cooldownMs: 400,
    isDashAttack: true,
  }),
  RALLY_HOWL: mechanic('RALLY_HOWL', {
    category: 'special',
    power: 0,
    cooldownMs: 20000,
    behaviorType: 'SUPPORT_AURA',
    supportBuff: {
      attackSpeedMultiplier: 1.2,
      durationMs: 15000,
      global: true,
    },
    visualEffectConfigId: 'attack_rally_howl_1',
  }),
  RIGGING_NEST: mechanic('RIGGING_NEST', {
    type: ElementType.BUG,
    category: 'special',
    power: 15,
    cooldownMs: 12000,
    behaviorType: 'RIGGING_NEST',
    riggingNest: {
      durationMs: 10000,
      firstSpawnDelayMs: 1000,
      spawnIntervalMs: 2000,
      maxSpawns: 5,
      maxActiveThreadlings: 2,
      threadlingLifetimeMs: 3200,
      threadlingMoveSpeed: 32,
      threadlingAttackIntervalMs: 900,
      threadlingMaxAttacks: 3,
      threadlingBiteRange: 2.6,
      offset: {
        x: 3.5,
        y: 2.5,
      },
      nestSpriteUrl: '/UI/Icons/bugitor_icon.png',
      threadlingSpriteUrls: {
        left: '/battles/cosmoids/bug_1_left_1.webp',
        right: '/battles/cosmoids/bug_1_left_1.webp',
        up: '/battles/cosmoids/bug_1_up_1.webp',
        down: '/battles/cosmoids/bug_1_down_1.webp',
      },
    },
  }),
  SAILCUTTER: mechanic('SAILCUTTER', {
    type: ElementType.FLYING,
    category: 'special',
    power: 35,
    cooldownMs: 4000,
    rangeIndex: 55,
    behaviorType: 'SAILCUTTER',
    projectileSpeed: 1.65,
    sailcutter: {
      projectileCount: 3,
      markDurationMs: 4000,
      threadlingMoveSpeedMultiplier: 1.6,
      threadlingDamageMultiplier: 1.35,
    },
  }),
  SALT_SPIT: mechanic('SALT_SPIT', {
    type: ElementType.WATER,
    power: 30,
    cooldownMs: 2400,
    behaviorType: 'SALT_SPIT',
    projectileSpeed: 1.4,
    saltSpit: {
      warmProjectileCount: 3,
    },
    itemPickupLockMs: 2500,
    effects: [
      {
        type: 'STUN',
        chance: 1,
        value: 500,
      },
    ],
  }),
  SCRATCH: mechanic('SCRATCH', {
    cooldownMs: 800,
    visualEffectConfigId: 'attack_scratch_1',
    isDashAttack: true,
  }),
  SHARED_SLUMBER: mechanic('SHARED_SLUMBER', {
    type: ElementType.PSYCHIC,
    category: 'special',
    power: 0,
    cooldownMs: 10000,
    behaviorType: 'SHARED_SLUMBER',
    visualEffectConfigId: 'attack_shared_slumber_1',
  }),
  SHIKO_QUAKE: mechanic('SHIKO_QUAKE', {
    type: ElementType.FIGHTING,
    power: 35,
    cooldownMs: 2400,
    behaviorType: 'SHIKO_QUAKE',
    effects: [
      {
        type: 'STUN',
        chance: 1,
        value: 350,
      },
    ],
    visualEffectConfigId: 'attack_shiko_quake_1',
  }),
  SHIPSHAPE: mechanic('SHIPSHAPE', {
    type: ElementType.GRASS,
    power: 0,
    cooldownMs: 5000,
    behaviorType: 'REPAIR_SUPPORT',
    repairSupport: {
      healFraction: 0.2,
      defenseMultiplier: 1.25,
    },
    visualEffectConfigId: 'attack_shipshape_taps',
  }),
  STATIC_YIP: mechanic('STATIC_YIP', {
    type: ElementType.ELECTRIC,
    category: 'special',
    cooldownMs: 800,
    projectileSpeed: 1.6,
    launchVisualEffectConfigId: 'attack_static_yip_launch_1',
    visualEffectConfigId: 'attack_static_yip_1',
  }),
  TACKLE: mechanic('TACKLE', {
    cooldownMs: 800,
    isDashAttack: true,
  }),
  TOXIC_POLLEN: mechanic('TOXIC_POLLEN', {
    type: ElementType.POISON,
    category: 'special',
    power: 0,
    cooldownMs: 2400,
    behaviorType: 'POISON_AOE',
    effects: [
      {
        type: 'POISON',
        chance: 1,
        poisonId: 'TOXIC_POLLEN',
        totalPower: 40,
        durationMs: 5000,
        tickCount: 5,
      },
    ],
    visualEffectConfigId: 'attack_toxic_pollen_1',
  }),
  VENOM_SPRAY: mechanic('VENOM_SPRAY', {
    type: ElementType.POISON,
    category: 'special',
    power: 35,
    cooldownMs: 800,
    projectileSpeed: 1.3,
    projectilePattern: {
      count: 5,
      spacing: 1.2,
      scales: [1.1, 0.96, 0.82, 0.68, 0.54],
      damageMode: 'FIRST_ONLY',
    },
    effects: [
      {
        type: 'STACKING_POISON',
        chance: 0.5,
        maxStacks: 5,
        poisonId: 'VENOM_SPRAY',
        durationMs: 5000,
        tickCount: 5,
        damagePerTickRatio: 0.05,
      },
    ],
  }),
  WAKE_WHIP: mechanic('WAKE_WHIP', {
    type: ElementType.WATER,
    behaviorType: 'WAKE_WHIP',
    projectileSpeed: 1.35,
    wakeWhip: {
      windupMs: 520,
      recoveryMs: 150,
      pushDistance: 4,
      warmPushDistance: 7,
    },
  }),
  WATER_GUN: mechanic('WATER_GUN', {
    type: ElementType.WATER,
    category: 'special',
    cooldownMs: 800,
    projectileSpeed: 1.4,
    projectilePattern: {
      count: 7,
      spacing: 1.35,
      scales: [1.15, 1.08, 1, 0.95, 0.9, 0.82, 0.72],
      damageMode: 'FIRST_ONLY',
    },
  }),
  WIND_GUST: mechanic('WIND_GUST', {
    type: ElementType.FLYING,
    category: 'special',
    power: 0,
    cooldownMs: 1600,
    behaviorType: 'INSTANT_AOE',
    itemPickupLockMs: 2000,
    visualEffectConfigId: 'attack_wind_gust_1',
  }),
};

export function installAttackFixtures() {
  const originals = new Map<string, AttackDefinition | undefined>();
  beforeEach(() => {
    for (const [id, fixture] of Object.entries(ATTACK_FIXTURES)) {
      originals.set(id, ATTACK_DEFS[id]);
      ATTACK_DEFS[id] = structuredClone(fixture);
    }
  });
  afterEach(() => {
    for (const [id, original] of originals) {
      if (original) ATTACK_DEFS[id] = original;
      else delete ATTACK_DEFS[id];
    }
    originals.clear();
  });
}
