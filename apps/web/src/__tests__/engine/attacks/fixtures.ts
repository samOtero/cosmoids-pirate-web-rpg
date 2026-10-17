import { AttackId } from '@/types/definitionIds';
import { beforeEach, afterEach } from 'vitest';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import type { AttackDefinition } from '@/engine/tower-defense/attacks/types';
import { ElementType } from '@/types/baseGame';

function mechanic(
  id: AttackId,
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
export const ATTACK_FIXTURES: Record<AttackId, AttackDefinition> = {
  [AttackId.BARREL_BASH]: mechanic(AttackId.BARREL_BASH, {
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
  [AttackId.BARREL_BOWLING]: mechanic(AttackId.BARREL_BOWLING, {
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
  [AttackId.COIR_SNAP]: mechanic(AttackId.COIR_SNAP, {
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
  [AttackId.DEEPWATER_GRIP]: mechanic(AttackId.DEEPWATER_GRIP, {
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
  [AttackId.FIRE_CLAW]: mechanic(AttackId.FIRE_CLAW, {
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
  [AttackId.FLYING_COLORS]: mechanic(AttackId.FLYING_COLORS, {
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
  [AttackId.FUNNY_DANCE]: mechanic(AttackId.FUNNY_DANCE, {
    category: 'special',
    power: 0,
    cooldownMs: 1600,
    rangeIndex: 60,
    behaviorType: 'FUNNY_DANCE',
    itemPickupLockMs: 2500,
    visualEffectConfigId: 'attack_funny_dance_1',
  }),
  [AttackId.FUSE_RUSH]: mechanic(AttackId.FUSE_RUSH, {
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
  [AttackId.LOOSE_END]: mechanic(AttackId.LOOSE_END, {
    power: 50,
    projectileSpeed: 1.4,
    looseEnd: {
      followUpRadius: 40,
    },
  }),
  [AttackId.MALLET_SMASH]: mechanic(AttackId.MALLET_SMASH, {
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
  [AttackId.NECTAR_SIPHON]: mechanic(AttackId.NECTAR_SIPHON, {
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
  [AttackId.NIBBLE]: mechanic(AttackId.NIBBLE, {
    cooldownMs: 800,
    visualEffectConfigId: 'attack_nibble_1',
    isDashAttack: true,
  }),
  [AttackId.PALM_SLAM]: mechanic(AttackId.PALM_SLAM, {
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
  [AttackId.PINCH]: mechanic(AttackId.PINCH, {
    cooldownMs: 800,
    isDashAttack: true,
  }),
  [AttackId.QUICK_ATTACK]: mechanic(AttackId.QUICK_ATTACK, {
    power: 15,
    cooldownMs: 400,
    isDashAttack: true,
  }),
  [AttackId.RALLY_HOWL]: mechanic(AttackId.RALLY_HOWL, {
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
  [AttackId.RIGGING_NEST]: mechanic(AttackId.RIGGING_NEST, {
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
  [AttackId.SAILCUTTER]: mechanic(AttackId.SAILCUTTER, {
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
  [AttackId.SALT_SPIT]: mechanic(AttackId.SALT_SPIT, {
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
  [AttackId.SCRATCH]: mechanic(AttackId.SCRATCH, {
    cooldownMs: 800,
    visualEffectConfigId: 'attack_scratch_1',
    isDashAttack: true,
  }),
  [AttackId.SHARED_SLUMBER]: mechanic(AttackId.SHARED_SLUMBER, {
    type: ElementType.PSYCHIC,
    category: 'special',
    power: 0,
    cooldownMs: 10000,
    behaviorType: 'SHARED_SLUMBER',
    visualEffectConfigId: 'attack_shared_slumber_1',
  }),
  [AttackId.SHIKO_QUAKE]: mechanic(AttackId.SHIKO_QUAKE, {
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
  [AttackId.SHIPSHAPE]: mechanic(AttackId.SHIPSHAPE, {
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
  [AttackId.STATIC_YIP]: mechanic(AttackId.STATIC_YIP, {
    type: ElementType.ELECTRIC,
    category: 'special',
    cooldownMs: 800,
    projectileSpeed: 1.6,
    launchVisualEffectConfigId: 'attack_static_yip_launch_1',
    visualEffectConfigId: 'attack_static_yip_1',
  }),
  [AttackId.TACKLE]: mechanic(AttackId.TACKLE, {
    cooldownMs: 800,
    isDashAttack: true,
  }),
  [AttackId.TOXIC_POLLEN]: mechanic(AttackId.TOXIC_POLLEN, {
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
  [AttackId.VENOM_SPRAY]: mechanic(AttackId.VENOM_SPRAY, {
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
  [AttackId.WAKE_WHIP]: mechanic(AttackId.WAKE_WHIP, {
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
  [AttackId.WATER_GUN]: mechanic(AttackId.WATER_GUN, {
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
  [AttackId.WIND_GUST]: mechanic(AttackId.WIND_GUST, {
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
  const originals = new Map<AttackId, AttackDefinition | undefined>();
  beforeEach(() => {
    for (const fixture of Object.values(ATTACK_FIXTURES)) {
      const id = fixture.id;
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
