import { TowerDefenseEngine, TD_CREATURE_DEFS } from '../TowerDefenseEngine';
import { Tower, Enemy } from '../types';
import { AttackDefinition } from './types';
import { ElementType } from '@/types/baseGame';
import { startDamageFlash } from '../damageFlash';
import { applyPersistentSpeedSlow } from '../speedModifiers';
import { CREATURE_TD_CONFIGS } from '@/constants/tdConfigs';

export const DRENCHED_DURATION_MS = 4000;
export const DRENCHED_DAMAGE_MULTIPLIER = 1.5;
export const POISON_DURATION_MS = 5000;
export const MAX_POISON_STACKS = 5;

const NEUTRAL_EFFECTIVENESS: Record<ElementType, number> = {
  [ElementType.NORMAL]: 1,
  [ElementType.FIRE]: 1,
  [ElementType.WATER]: 1,
  [ElementType.GRASS]: 1,
  [ElementType.BUG]: 1,
  [ElementType.ROCK]: 1,
  [ElementType.GROUND]: 1,
  [ElementType.STEEL]: 1,
  [ElementType.POISON]: 1,
  [ElementType.DARK]: 1,
  [ElementType.PSYCHIC]: 1,
  [ElementType.ELECTRIC]: 1,
  [ElementType.FIGHTING]: 1,
  [ElementType.FLYING]: 1,
};

const TYPE_EFFECTIVENESS: Record<ElementType, Record<ElementType, number>> = {
  [ElementType.NORMAL]: {
    ...NEUTRAL_EFFECTIVENESS,
    [ElementType.ROCK]: 0.5,
    [ElementType.STEEL]: 0.5,
  },
  [ElementType.FIRE]: {
    ...NEUTRAL_EFFECTIVENESS,
    [ElementType.FIRE]: 0.5,
    [ElementType.WATER]: 0.5,
    [ElementType.GRASS]: 2,
    [ElementType.BUG]: 2,
    [ElementType.ROCK]: 0.5,
    [ElementType.STEEL]: 2,
  },
  [ElementType.WATER]: {
    ...NEUTRAL_EFFECTIVENESS,
    [ElementType.FIRE]: 2,
    [ElementType.WATER]: 0.5,
    [ElementType.GRASS]: 0.5,
    [ElementType.ROCK]: 2,
    [ElementType.GROUND]: 2,
  },
  [ElementType.GRASS]: {
    ...NEUTRAL_EFFECTIVENESS,
    [ElementType.FIRE]: 0.5,
    [ElementType.WATER]: 2,
    [ElementType.GRASS]: 0.5,
    [ElementType.ROCK]: 2,
    [ElementType.GROUND]: 2,
    [ElementType.BUG]: 0.5,
    [ElementType.STEEL]: 0.5,
    [ElementType.POISON]: 0.5,
    [ElementType.FLYING]: 0.5,
  },
  [ElementType.ELECTRIC]: {
    ...NEUTRAL_EFFECTIVENESS,
    [ElementType.WATER]: 2,
    [ElementType.GRASS]: 0.5,
    [ElementType.ELECTRIC]: 0.5,
    [ElementType.FLYING]: 2,
    [ElementType.GROUND]: 0,
  },
  [ElementType.FIGHTING]: {
    ...NEUTRAL_EFFECTIVENESS,
    [ElementType.NORMAL]: 2,
    [ElementType.ROCK]: 2,
    [ElementType.STEEL]: 2,
    [ElementType.DARK]: 2,
    [ElementType.POISON]: 0.5,
    [ElementType.BUG]: 0.5,
    [ElementType.PSYCHIC]: 0.5,
    [ElementType.FLYING]: 0.5,
  },
  [ElementType.FLYING]: {
    ...NEUTRAL_EFFECTIVENESS,
    [ElementType.GRASS]: 2,
    [ElementType.BUG]: 2,
    [ElementType.ROCK]: 0.5,
    [ElementType.STEEL]: 0.5,
    [ElementType.ELECTRIC]: 0.5,
  },
  [ElementType.POISON]: {
    ...NEUTRAL_EFFECTIVENESS,
    [ElementType.GRASS]: 1,
    [ElementType.ROCK]: 0.5,
    [ElementType.POISON]: 0.5,
    [ElementType.STEEL]: 0,
    [ElementType.GROUND]: 0.5,
  },
  [ElementType.BUG]: {
    ...NEUTRAL_EFFECTIVENESS,
    [ElementType.FIRE]: 0.5,
    [ElementType.GRASS]: 2,
    [ElementType.DARK]: 2,
    [ElementType.PSYCHIC]: 2,
    [ElementType.POISON]: 0.5,
    [ElementType.FLYING]: 0.5,
    [ElementType.STEEL]: 0.5,
  },
  [ElementType.STEEL]: {
    ...NEUTRAL_EFFECTIVENESS,
    [ElementType.FIRE]: 0.5,
    [ElementType.WATER]: 0.5,
    [ElementType.ROCK]: 2,
    [ElementType.ELECTRIC]: 0.5,
    [ElementType.STEEL]: 0.5,
  },
  [ElementType.ROCK]: {
    ...NEUTRAL_EFFECTIVENESS,
    [ElementType.FIRE]: 2,
    [ElementType.BUG]: 2,
    [ElementType.FLYING]: 2,
    [ElementType.STEEL]: 0.5,
    [ElementType.GROUND]: 0.5,
  },
  [ElementType.GROUND]: {
    ...NEUTRAL_EFFECTIVENESS,
    [ElementType.FIRE]: 2,
    [ElementType.GRASS]: 0.5,
    [ElementType.BUG]: 0.5,
    [ElementType.ROCK]: 2,
    [ElementType.GROUND]: 1,
    [ElementType.STEEL]: 2,
    [ElementType.POISON]: 2,
    [ElementType.ELECTRIC]: 2,
    [ElementType.FLYING]: 0,
  },
  [ElementType.DARK]: {
    ...NEUTRAL_EFFECTIVENESS,
    [ElementType.DARK]: 0.5,
    [ElementType.PSYCHIC]: 2,
  },
  [ElementType.PSYCHIC]: {
    ...NEUTRAL_EFFECTIVENESS,
    [ElementType.POISON]: 2,
    [ElementType.PSYCHIC]: 0.5,
    [ElementType.STEEL]: 0.5,
    [ElementType.DARK]: 0,
  },
};
export class EffectProcessor {
  public static applyDamageAndEffects(
    engine: TowerDefenseEngine,
    source: Tower,
    target: Enemy,
    attackDef: AttackDefinition,
    hitCount: number = 1
  ) {
    // Multiple projectiles can arrive in one tick; dead targets cannot build combos.
    if (target.hp <= 0) return;
    const level = source.creature.level;
    const power = attackDef.power;

    // Physical/Special split: pick the right attack and defense stats
    const attack =
      attackDef.category === 'special'
        ? source.currentSpecialAttack
        : source.currentAttack;
    const baseDefense =
      attackDef.category === 'special'
        ? target.currentSpecialDefense
        : target.currentDefense;
    const scouredMultiplier =
      target.scouredEffect &&
      target.scouredEffect.expiresAtMs > engine.elapsedTimeMs
        ? attackDef.category === 'special'
          ? target.scouredEffect.specialDefenseMultiplier
          : target.scouredEffect.defenseMultiplier
        : 1;
    const defense = Math.max(1, baseDefense * scouredMultiplier);

    // Get Defender Type
    const defenderMeta = TD_CREATURE_DEFS[target.definitionId];
    const defenderTypes =
      target.elementTypes && target.elementTypes.length > 0
        ? target.elementTypes
        : defenderMeta
          ? [
              defenderMeta.baseCreature.type,
              defenderMeta.baseCreature.secondaryType,
            ].filter((type): type is ElementType => type !== undefined)
          : [ElementType.NORMAL];

    // Get Attacker Type
    const attackerMeta = TD_CREATURE_DEFS[source.creature.speciesId];
    const attackerTypes = attackerMeta
      ? [
          attackerMeta.baseCreature.type,
          attackerMeta.baseCreature.secondaryType,
        ].filter((type): type is ElementType => type !== undefined)
      : [ElementType.NORMAL];

    // Pokemon Damage Formula
    const baseDamage =
      Math.floor(
        Math.floor(
          (Math.floor((2 * level) / 5 + 2) * power * attack) / defense
        ) / 50
      ) + 2;

    const isStab = attackerTypes.includes(attackDef.type);
    const stabMultiplier = isStab ? 1.5 : 1.0;

    const effectivenessMultiplier = defenderTypes.reduce(
      (multiplier, defenderType) =>
        multiplier *
        (TYPE_EFFECTIVENESS[attackDef.type]?.[defenderType] ?? 1.0),
      1.0
    );
    const isDrenched = target.statusConditions.some(
      (status) => status.type === 'DRENCHED'
    );
    const drenchedMultiplier =
      isDrenched &&
      (attackDef.type === ElementType.WATER ||
        attackDef.type === ElementType.ELECTRIC)
        ? DRENCHED_DAMAGE_MULTIPLIER
        : 1;
    const combinedEffectiveness = effectivenessMultiplier * drenchedMultiplier;

    // Add a slight randomization (85% to 100%)
    const randomModifier = (Math.floor(Math.random() * 16) + 85) / 100;
    let finalDamage = Math.floor(
      baseDamage * stabMultiplier * combinedEffectiveness * randomModifier
    );

    // Status moves resolve their effects without inflicting the formula's
    // minimum one point of damage.
    finalDamage =
      power > 0
        ? effectivenessMultiplier === 0
          ? 0
          : Math.max(1, finalDamage)
        : 0;

    let fuseFinisher = false;
    if (finalDamage > 0 && attackDef.fuseRushCombo) {
      const combo = attackDef.fuseRushCombo;
      const nextMarks = (target.fuseRushMarks ?? 0) + 1;
      fuseFinisher = nextMarks >= combo.hitsToTrigger;
      target.fuseRushMarks = fuseFinisher ? 0 : nextMarks;
      // Multiply the resolved hit, not base power, using the finishing caster's stats.
      if (fuseFinisher) finalDamage *= combo.damageMultiplier;
      const configId = fuseFinisher
        ? 'attack_fuse_rush_detonation'
        : 'attack_fuse_rush_hit';
      engine.visualEffects.push({
        id: `vfx_fuse_${target.id}_${engine.elapsedTimeMs}_${Math.random()}`,
        configId,
        position: { ...target.position },
        targetId: target.id,
        durationMs:
          CREATURE_TD_CONFIGS[configId].default.vfxAnimation!.durationMs!,
        elapsedMs: 0,
      });
    }

    // Reaching an enemy with an attack counts as participating in its defeat,
    // even when the attack is a non-damaging status move.
    target.damagedByTowerIds.add(source.id);

    let textColor = 0xffffff;
    let textScale = 1.0;

    if (combinedEffectiveness > 1) {
      textColor = 0xfacc15; // Yellow-ish for super effective
      textScale = 1.4;
    } else if (combinedEffectiveness < 1) {
      textColor = 0x9ca3af; // Gray for not very effective
      textScale = 0.75;
    }

    let damageDealt = 0;
    if (finalDamage > 0) {
      if (!target.isInvulnerable) {
        damageDealt = Math.min(target.hp, finalDamage);
        target.hp -= finalDamage;
      }
      if (target.hp <= 0) target.fuseRushMarks = undefined;
      if (fuseFinisher) {
        textColor = 0xffa63d;
        textScale = Math.max(textScale, 1.5);
      }
      startDamageFlash(target, attackDef.type);

      engine.events?.emit({
        type: 'ATTACK_DAMAGE_DEALT',
        towerId: source.id,
        targetEnemyId: target.id,
        attackDefId: attackDef.id,
        damage: finalDamage,
      });

      engine.floatingTexts.push({
        id: `ft_dmg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        text: Math.ceil(finalDamage).toString(),
        position: { ...target.position },
        color: textColor,
        scale: textScale,
        durationMs: 1000,
        elapsedMs: 0,
      });
    }

    attackDef.effects
      ?.filter((effect) => effect.type === 'DRAIN')
      .forEach((effect) => {
        if (damageDealt <= 0 || Math.random() > effect.chance) return;

        const missingHp = Math.max(0, source.maxHp - source.hp);
        const healAmount = Math.min(
          missingHp,
          Math.floor(damageDealt * (effect.value ?? 0.5))
        );
        if (healAmount <= 0) return;

        source.hp += healAmount;
        engine.floatingTexts.push({
          id: `ft_drain_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          text: `+${healAmount}`,
          position: { ...source.position },
          color: 0x86efac,
          scale: 0.9,
          durationMs: 1000,
          elapsedMs: 0,
        });
      });

    if (attackDef.effects && target.hp > 0 && !target.immuneToStatusEffects) {
      attackDef.effects.forEach((effect) => {
        if (effect.type === 'DRAIN') return;
        if (Math.random() <= effect.chance) {
          switch (effect.type) {
            case 'BURN':
              target.statusConditions.push({
                type: 'BURN',
                durationMs: 3000,
                tickDamage: Math.max(1, finalDamage * 0.1),
                lastTickTime: 0,
              });
              break;
            case 'POISON': {
              const poisonTickDamage = Math.max(1, finalDamage * 0.05);
              target.statusConditions.push({
                type: 'POISON',
                durationMs: POISON_DURATION_MS,
                tickDamage: poisonTickDamage,
                lastTickTime: 0,
                stackCount: 1,
                damagePerStack: poisonTickDamage,
              });
              break;
            }
            case 'STACKING_POISON': {
              const maxStacks = effect.maxStacks ?? MAX_POISON_STACKS;
              const newDamagePerStack = Math.max(1, finalDamage * 0.05);
              const existing = target.statusConditions.find(
                (status) => status.type === 'POISON'
              );

              if (existing) {
                const currentStacks = Math.max(1, existing.stackCount ?? 1);
                const nextStacks = Math.min(maxStacks, currentStacks + 1);
                const damagePerStack = Math.max(
                  existing.damagePerStack ??
                    existing.tickDamage ??
                    newDamagePerStack,
                  newDamagePerStack
                );
                existing.stackCount = nextStacks;
                existing.damagePerStack = damagePerStack;
                existing.tickDamage = damagePerStack * nextStacks;
                existing.durationMs = POISON_DURATION_MS;
              } else {
                target.statusConditions.push({
                  type: 'POISON',
                  durationMs: POISON_DURATION_MS,
                  tickDamage: newDamagePerStack,
                  lastTickTime: 0,
                  stackCount: 1,
                  damagePerStack: newDamagePerStack,
                });
              }

              const poison = target.statusConditions.find(
                (status) => status.type === 'POISON'
              );
              engine.floatingTexts.push({
                id: `ft_poison_${Date.now()}_${Math.random()
                  .toString(36)
                  .substring(7)}`,
                text: `Poison ×${poison?.stackCount ?? 1}`,
                position: { ...target.position },
                color: 0xe879f9,
                scale: 0.8,
                durationMs: 900,
                elapsedMs: 0,
              });
              break;
            }
            case 'STUN':
              target.statusConditions.push({
                type: 'STUN',
                durationMs: effect.value || 1000,
              });
              break;
            case 'DRENCHED': {
              const durationMs = effect.value || DRENCHED_DURATION_MS;
              const existing = target.statusConditions.find(
                (status) => status.type === 'DRENCHED'
              );
              if (existing) {
                existing.durationMs = durationMs;
              } else {
                target.statusConditions.push({
                  type: 'DRENCHED',
                  durationMs,
                });
                engine.floatingTexts.push({
                  id: `ft_drenched_${Date.now()}_${Math.random()
                    .toString(36)
                    .substring(7)}`,
                  text: 'Drenched!',
                  position: { ...target.position },
                  color: 0x38bdf8,
                  scale: 0.8,
                  durationMs: 900,
                  elapsedMs: 0,
                });
              }
              break;
            }
            case 'SPEED_SLOW': {
              const wasApplied = applyPersistentSpeedSlow(
                target,
                effect.value ?? 2 / 3,
                engine.elapsedTimeMs
              );
              if (wasApplied) {
                engine.floatingTexts.push({
                  id: `ft_slow_${Date.now()}_${Math.random()
                    .toString(36)
                    .substring(7)}`,
                  text: 'Slowed!',
                  position: { ...target.position },
                  color: 0xd1d5db,
                  scale: 0.8,
                  durationMs: 900,
                  elapsedMs: 0,
                });
              }
              break;
            }
            case 'MULTI_HIT':
              if (hitCount < (effect.value || 2)) {
                this.applyDamageAndEffects(
                  engine,
                  source,
                  target,
                  attackDef,
                  hitCount + 1
                );
              }
              break;
          }
        }
      });
    }
  }
}
