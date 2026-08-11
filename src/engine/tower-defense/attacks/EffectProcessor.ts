import { TowerDefenseEngine, TD_CREATURE_DEFS } from '../TowerDefenseEngine';
import { Tower, Enemy } from '../types';
import { AttackDefinition } from './types';
import { ElementType } from '@/types/baseGame';
import { startDamageFlash } from '../damageFlash';
import { applyPersistentSpeedSlow } from '../speedModifiers';

export const DRENCHED_DURATION_MS = 4000;
export const DRENCHED_DAMAGE_MULTIPLIER = 1.5;

const NEUTRAL_EFFECTIVENESS: Record<ElementType, number> = {
  [ElementType.NORMAL]: 1,
  [ElementType.FIRE]: 1,
  [ElementType.WATER]: 1,
  [ElementType.GRASS]: 1,
  [ElementType.BUG]: 1,
  [ElementType.STEEL]: 1,
  [ElementType.POISON]: 1,
  [ElementType.ELECTRIC]: 1,
  [ElementType.FLYING]: 1,
};

const TYPE_EFFECTIVENESS: Record<ElementType, Record<ElementType, number>> = {
  [ElementType.NORMAL]: {
    ...NEUTRAL_EFFECTIVENESS,
    [ElementType.STEEL]: 0.5,
  },
  [ElementType.FIRE]: {
    ...NEUTRAL_EFFECTIVENESS,
    [ElementType.FIRE]: 0.5,
    [ElementType.WATER]: 0.5,
    [ElementType.GRASS]: 2,
    [ElementType.BUG]: 2,
    [ElementType.STEEL]: 2,
  },
  [ElementType.WATER]: {
    ...NEUTRAL_EFFECTIVENESS,
    [ElementType.FIRE]: 2,
    [ElementType.WATER]: 0.5,
    [ElementType.GRASS]: 0.5,
  },
  [ElementType.GRASS]: {
    ...NEUTRAL_EFFECTIVENESS,
    [ElementType.FIRE]: 0.5,
    [ElementType.WATER]: 2,
    [ElementType.GRASS]: 0.5,
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
  },
  [ElementType.FLYING]: {
    ...NEUTRAL_EFFECTIVENESS,
    [ElementType.GRASS]: 2,
    [ElementType.BUG]: 2,
    [ElementType.STEEL]: 0.5,
    [ElementType.ELECTRIC]: 0.5,
  },
  [ElementType.POISON]: {
    ...NEUTRAL_EFFECTIVENESS,
    [ElementType.GRASS]: 1,
    [ElementType.POISON]: 0.5,
    [ElementType.STEEL]: 0,
  },
  [ElementType.BUG]: {
    ...NEUTRAL_EFFECTIVENESS,
    [ElementType.FIRE]: 0.5,
    [ElementType.GRASS]: 2,
    [ElementType.POISON]: 0.5,
    [ElementType.FLYING]: 0.5,
    [ElementType.STEEL]: 0.5,
  },
  [ElementType.STEEL]: {
    ...NEUTRAL_EFFECTIVENESS,
    [ElementType.FIRE]: 0.5,
    [ElementType.WATER]: 0.5,
    [ElementType.ELECTRIC]: 0.5,
    [ElementType.STEEL]: 0.5,
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
    const level = source.creature.level;
    const power = attackDef.power;

    // Physical/Special split: pick the right attack and defense stats
    const attack =
      attackDef.category === 'special'
        ? source.currentSpecialAttack
        : source.currentAttack;
    const defense =
      attackDef.category === 'special'
        ? target.currentSpecialDefense
        : target.currentDefense;

    // Get Defender Type
    const defenderMeta = TD_CREATURE_DEFS[target.definitionId];
    const defenderTypes = defenderMeta
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
    finalDamage = power > 0 ? Math.max(1, finalDamage) : 0;

    let textColor = 0xffffff;
    let textScale = 1.0;

    if (combinedEffectiveness > 1) {
      textColor = 0xfacc15; // Yellow-ish for super effective
      textScale = 1.4;
    } else if (combinedEffectiveness < 1) {
      textColor = 0x9ca3af; // Gray for not very effective
      textScale = 0.75;
    }

    if (finalDamage > 0) {
      if (!target.isInvulnerable) {
        target.hp -= finalDamage;
      }
      startDamageFlash(target, attackDef.type);

      // Track this tower as a participant for EXP distribution
      target.damagedByTowerIds.add(source.id);

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

    if (attackDef.effects && target.hp > 0) {
      attackDef.effects.forEach((effect) => {
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
            case 'POISON':
              target.statusConditions.push({
                type: 'POISON',
                durationMs: 5000,
                tickDamage: Math.max(1, finalDamage * 0.05),
                lastTickTime: 0,
              });
              break;
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
