import type {
  AttackDefinition,
  AttackEffect,
} from '@/engine/tower-defense/attacks/types';

export const formatAttackNumber = (value: number) =>
  Number(value.toFixed(2)).toString();
export const attackSeconds = (milliseconds: number) =>
  `${formatAttackNumber(milliseconds / 1000)}s`;
const percent = (fraction: number) => `${formatAttackNumber(fraction * 100)}%`;

function describeEffect(effect: AttackEffect): string {
  const chance = effect.chance < 1 ? `${percent(effect.chance)} chance: ` : '';
  switch (effect.type) {
    case 'BURN':
      return `${chance}burns the target for damage over time.`;
    case 'POISON':
      return `${chance}poisons the target${effect.durationMs ? ` for ${attackSeconds(effect.durationMs)}` : ''}${effect.tickCount ? ` across ${effect.tickCount} pulses` : ''}.`;
    case 'STACKING_POISON':
      return `${chance}adds poison${effect.durationMs ? ` for ${attackSeconds(effect.durationMs)}` : ''}${effect.maxStacks ? `, up to ${effect.maxStacks} stacks` : ''}.${effect.damagePerTickRatio ? ` Each stack deals ${percent(effect.damagePerTickRatio)} of its triggering hit per pulse.` : ''}`;
    case 'STUN':
      return `${chance}stuns the target${effect.value ? ` for ${attackSeconds(effect.value)}` : ''}.`;
    case 'DRENCHED':
      return `${chance}drenches the target${effect.value ? ` for ${attackSeconds(effect.value)}` : ''}, making it vulnerable to follow-up damage.`;
    case 'SPEED_SLOW':
      return `${chance}slows movement${effect.value !== undefined ? ` by ${percent(1 - effect.value)}` : ''}. The slow persists; repeated slows do not stack, and a temporary speed boost can prevent it.`;
    case 'DRAIN':
      return effect.value === undefined
        ? `${chance}restores health from damage dealt.`
        : `${chance}restores health equal to ${percent(effect.value)} of damage dealt.`;
    case 'MULTI_HIT':
      return effect.value === undefined
        ? `${chance}can hit repeatedly.`
        : `${chance}hits up to ${effect.value} times.`;
    case 'KNOCKBACK':
      return `${chance}pushes the target back.`;
  }
}

function targeting(attack: AttackDefinition): string {
  if (attack.supportBuff)
    return attack.supportBuff.global
      ? 'All allied Cosmoids, including the user'
      : 'Allied Cosmoids in reach, including the user';
  switch (attack.behaviorType) {
    case 'WARMTH_SUPPORT':
      return 'The user';
    case 'REPAIR_SUPPORT':
      return 'One allied Cosmoid in reach, prioritizing the most injured';
    case 'SHARED_SLUMBER':
      return 'The user and eligible enemies in reach';
    case 'INSTANT_AOE':
    case 'FUNNY_DANCE':
      return 'Carrying enemies in reach';
    case 'POISON_AOE':
      return 'Eligible enemies in reach';
    case 'SHIKO_QUAKE':
      return 'Several enemies in reach';
    case 'ADAPTIVE_TARGETED_AOE':
      return 'One enemy and nearby enemies';
    case 'ROLLING_BARREL':
      return 'Enemies along the rolling path';
    case 'RIGGING_NEST':
      return 'Summons that pursue nearby enemies';
    case 'SAILCUTTER':
      return `Up to ${attack.sailcutter?.projectileCount ?? 1} different enemies`;
    default:
      return attack.flyingColors
        ? `Up to ${attack.flyingColors.maxTargets} different enemies`
        : 'One enemy in reach';
  }
}

function fallbackSummary(attack: AttackDefinition): string {
  switch (attack.behaviorType) {
    case 'REPAIR_SUPPORT':
      return 'Restores an ally’s health and braces its defenses.';
    case 'SUPPORT_AURA':
      return 'Boosts allied attack speed when enemies are present.';
    case 'WARMTH_SUPPORT':
      return 'Builds Warmth to empower the user’s Water moves.';
    case 'SHARED_SLUMBER':
      return 'The user sleeps while putting nearby enemies to sleep.';
    case 'INSTANT_AOE':
    case 'FUNNY_DANCE':
      return 'Makes carrying enemies drop their objectives.';
    case 'POISON_AOE':
      return 'Applies poison to eligible enemies in reach.';
    case 'ROLLING_BARREL':
      return 'Lobs a barrel that rolls through enemies, damaging each enemy it hits.';
    case 'RIGGING_NEST':
      return 'Creates a nest that releases attacking helpers.';
    case 'ADAPTIVE_TARGETED_AOE':
      return 'Strikes an area, with a stronger hit against a lone target.';
    case 'CONSTRICTION':
      return 'Holds one enemy and deals repeated damage during the hold.';
    default:
      return attack.power === 0 &&
        attack.effects?.some((effect) => effect.type === 'SPEED_SLOW')
        ? 'Fires a slowing projectile at one enemy.'
        : attack.isDashAttack
          ? 'Strikes an enemy with a contact attack.'
          : 'Launches an attack at an enemy in reach.';
  }
}

/** Presentation derived from live definitions, with no duplicate balance values. */
export function getAttackInformation(attack: AttackDefinition) {
  const poisonPower = (attack.effects ?? []).reduce(
    (sum, effect) =>
      sum + (effect.type === 'POISON' ? (effect.totalPower ?? 0) : 0),
    0
  );
  const hasDamage = attack.power > 0 || poisonPower > 0;
  const power =
    attack.power > 0
      ? {
          label: attack.constriction
            ? 'Power per pulse'
            : attack.riggingNest
              ? 'Power per bite'
              : 'Power',
          value: attack.power,
        }
      : poisonPower > 0
        ? { label: 'Poison power', value: poisonPower }
        : undefined;
  const effects = (attack.effects ?? []).map(describeEffect);
  if (attack.supportBuff) {
    const buff = attack.supportBuff;
    effects.push(
      `Increases attack speed by ${percent(buff.attackSpeedMultiplier - 1)} for ${attackSeconds(buff.durationMs)}. Repeated uses refresh the buff without stacking it. Activates when enemies are present.`
    );
  }
  if (attack.repairSupport) {
    const repair = attack.repairSupport;
    effects.push(
      `Restores up to ${percent(repair.healFraction)} of the recipient’s maximum health and increases Defense by ${percent(repair.defenseMultiplier - 1)}. The defense bonus does not stack.`
    );
  }
  if (attack.constriction) {
    const hold = attack.constriction;
    effects.push(
      `Holds for ${attackSeconds(hold.durationMs)}, dealing damage every ${attackSeconds(hold.pulseIntervalMs)}. The user cannot attack during the hold. The target then resists holds for ${attackSeconds(hold.resistanceMs)}.`
    );
  }
  if (attack.adaptiveTargetedAoe) {
    effects.push(
      `Against a lone target: ${attack.adaptiveTargetedAoe.singleTargetPower} power.`
    );
    effects.push(
      ...(attack.adaptiveTargetedAoe.singleTargetEffects ?? []).map(
        (effect) => `Lone target: ${describeEffect(effect)}`
      )
    );
  }
  if (attack.fuseRushCombo)
    effects.push(
      `Every ${attack.fuseRushCombo.hitsToTrigger} successful hits on a target trigger a ${formatAttackNumber(attack.fuseRushCombo.damageMultiplier)}× damage finisher. Marks are shared between users of this move.`
    );
  if (attack.coirSnapCombo)
    effects.push(
      `Every ${attack.coirSnapCombo.hitsToBind} successful hits by this user bind the target for ${attackSeconds(attack.coirSnapCombo.bindDurationMs)}.`
    );
  if (attack.fireClawHeat) {
    const heat = attack.fireClawHeat;
    effects.push(
      `Successful hits build up to ${heat.maxStacks} Heat stacks: +${percent(heat.damageBonusPerStack)} damage each. After ${attackSeconds(heat.lullBeforeDecayMs)} without a hit, Heat decays every ${attackSeconds(heat.decayIntervalMs)}. Moving clears Heat.`
    );
  }
  if (attack.poisonPayoff)
    effects.push(
      `Deals ${formatAttackNumber(attack.poisonPayoff.damageMultiplier)}× damage to poisoned targets.${attack.poisonPayoff.prioritizePoisonedTargets ? ' Prefers poisoned enemies unless a structure is focused.' : ''}`
    );
  if (attack.burningTargetSplash)
    effects.push(
      `Hitting a burning enemy scatters ${percent(attack.burningTargetSplash.damageRatio)} of the hit’s damage to nearby enemies.`
    );
  if (attack.secondaryImpactPush)
    effects.push(
      'Pushes other enemies near the impact backward without damaging them.'
    );
  if (attack.looseEnd)
    effects.push(
      'Defeating the target launches one full-power follow-up at a nearby enemy.'
    );
  if (attack.flyingColors)
    effects.push(
      `Chains between up to ${attack.flyingColors.maxTargets} different enemies without requiring a knockout.`
    );
  if (attack.riggingNest) {
    const nest = attack.riggingNest;
    effects.push(
      `Nest lasts ${attackSeconds(nest.durationMs)} and releases up to ${nest.maxSpawns} helpers, with up to ${nest.maxActiveThreadlings} active at once. Each helper can bite up to ${nest.threadlingMaxAttacks} times.`
    );
  }
  if (attack.sailcutter) {
    const cutters = attack.sailcutter;
    effects.push(
      `Wind-Marks targets for ${attackSeconds(cutters.markDurationMs)}. Helpers pursuing a marked target gain ${percent(cutters.threadlingMoveSpeedMultiplier - 1)} movement speed and ${percent(cutters.threadlingDamageMultiplier - 1)} bite damage.`
    );
  }
  if (attack.itemPickupLockMs)
    effects.push(
      `Disarmed enemies cannot pick up objectives for ${attackSeconds(attack.itemPickupLockMs)}. Each enemy can be disarmed once by this move.`
    );
  if (attack.wakeWhip)
    effects.push(
      `Windup: ${attackSeconds(attack.wakeWhip.windupMs)}. Recovery: ${attackSeconds(attack.wakeWhip.recoveryMs)}. Moving interrupts the windup.`
    );
  if (
    attack.behaviorType === 'PALM_SLAM' ||
    attack.behaviorType === 'SHIKO_QUAKE'
  )
    effects.push(
      'Requires a stationary windup. Moving before impact interrupts the strike.'
    );
  if (attack.projectilePattern?.damageMode === 'EACH')
    effects.push('Fires multiple damaging projectiles.');
  return {
    summary: attack.description ?? fallbackSummary(attack),
    targeting: targeting(attack),
    power,
    hasDamage,
    category: hasDamage
      ? attack.category === 'physical'
        ? 'Physical · uses Attack'
        : 'Special · uses Special Attack'
      : ['SUPPORT_AURA', 'WARMTH_SUPPORT', 'REPAIR_SUPPORT'].includes(
            attack.behaviorType
          )
        ? 'Support'
        : 'Control',
    reach: attack.supportBuff?.global
      ? 'Whole battlefield'
      : attack.behaviorType === 'WARMTH_SUPPORT'
        ? 'Self'
        : formatAttackNumber(attack.rangeIndex),
    effects,
  };
}

/** Describe differences without treating power as a universal upgrade score. */
export function compareAttacks(
  previous: AttackDefinition,
  next: AttackDefinition
): string[] {
  const oldInfo = getAttackInformation(previous),
    newInfo = getAttackInformation(next);
  const changes: string[] = [];
  if (previous.type !== next.type)
    changes.push(`Type changes from ${previous.type} to ${next.type}.`);
  if (oldInfo.category !== newInfo.category)
    changes.push(
      `${newInfo.category} instead of ${oldInfo.category.toLowerCase()}.`
    );
  if (oldInfo.reach !== newInfo.reach)
    changes.push(`Reach: ${oldInfo.reach} → ${newInfo.reach}.`);
  if (previous.cooldownMs !== next.cooldownMs)
    changes.push(
      `Base time between uses: ${attackSeconds(previous.cooldownMs)} → ${attackSeconds(next.cooldownMs)}.`
    );
  if (
    oldInfo.power?.label === newInfo.power?.label &&
    oldInfo.power &&
    newInfo.power &&
    oldInfo.power.value !== newInfo.power.value
  )
    changes.push(
      `${newInfo.power.label}: ${oldInfo.power.value} → ${newInfo.power.value}.`
    );
  if (oldInfo.targeting !== newInfo.targeting)
    changes.push(`Targets: ${newInfo.targeting.toLowerCase()}.`);
  if (changes.length === 0)
    changes.push(
      'The basic stats match. Compare the descriptions and effects for their different uses.'
    );
  return changes;
}
