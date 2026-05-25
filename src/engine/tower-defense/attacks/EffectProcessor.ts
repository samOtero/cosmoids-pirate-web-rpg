import { TowerDefenseEngine, TD_CREATURE_DEFS } from '../TowerDefenseEngine';
import { Tower, Enemy } from '../types';
import { AttackDefinition } from './types';
import { ElementType } from '@/types/baseGame';

const TYPE_EFFECTIVENESS: Record<ElementType, Record<ElementType, number>> = {
  [ElementType.NORMAL]: {
    [ElementType.NORMAL]: 1,
    [ElementType.FIRE]: 1,
    [ElementType.WATER]: 1,
    [ElementType.GRASS]: 1,
    [ElementType.ELECTRIC]: 1,
    [ElementType.FLYING]: 1,
  },
  [ElementType.FIRE]: {
    [ElementType.NORMAL]: 1,
    [ElementType.FIRE]: 0.5,
    [ElementType.WATER]: 0.5,
    [ElementType.GRASS]: 2,
    [ElementType.ELECTRIC]: 1,
    [ElementType.FLYING]: 1,
  },
  [ElementType.WATER]: {
    [ElementType.NORMAL]: 1,
    [ElementType.FIRE]: 2,
    [ElementType.WATER]: 0.5,
    [ElementType.GRASS]: 0.5,
    [ElementType.ELECTRIC]: 1,
    [ElementType.FLYING]: 1,
  },
  [ElementType.GRASS]: {
    [ElementType.NORMAL]: 1,
    [ElementType.FIRE]: 0.5,
    [ElementType.WATER]: 2,
    [ElementType.GRASS]: 0.5,
    [ElementType.ELECTRIC]: 1,
    [ElementType.FLYING]: 0.5,
  },
  [ElementType.ELECTRIC]: {
    [ElementType.NORMAL]: 1,
    [ElementType.FIRE]: 1,
    [ElementType.WATER]: 2,
    [ElementType.GRASS]: 0.5,
    [ElementType.ELECTRIC]: 0.5,
    [ElementType.FLYING]: 2,
  },
  [ElementType.FLYING]: {
    [ElementType.NORMAL]: 1,
    [ElementType.FIRE]: 1,
    [ElementType.WATER]: 1,
    [ElementType.GRASS]: 2,
    [ElementType.ELECTRIC]: 0.5,
    [ElementType.FLYING]: 1,
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
    const defenderType = defenderMeta
      ? defenderMeta.baseCreature.type
      : ElementType.NORMAL;

    // Get Attacker Type
    const attackerMeta = TD_CREATURE_DEFS[source.creature.speciesId];
    const attackerType = attackerMeta
      ? attackerMeta.baseCreature.type
      : ElementType.NORMAL;

    // Pokemon Damage Formula
    const baseDamage =
      Math.floor(
        Math.floor(
          (Math.floor((2 * level) / 5 + 2) * power * attack) / defense
        ) / 50
      ) + 2;

    const isStab = attackerType === attackDef.type;
    const stabMultiplier = isStab ? 1.5 : 1.0;

    const effectivenessMultiplier =
      TYPE_EFFECTIVENESS[attackDef.type]?.[defenderType as ElementType] ?? 1.0;

    // Add a slight randomization (85% to 100%)
    const randomModifier = (Math.floor(Math.random() * 16) + 85) / 100;
    let finalDamage = Math.floor(
      baseDamage * stabMultiplier * effectivenessMultiplier * randomModifier
    );

    // Ensure at least 1 damage
    finalDamage = Math.max(1, finalDamage);

    let textColor = 0xffffff;
    let textScale = 1.0;

    if (effectivenessMultiplier > 1) {
      textColor = 0xfacc15; // Yellow-ish for super effective
      textScale = 1.4;
    } else if (effectivenessMultiplier < 1) {
      textColor = 0x9ca3af; // Gray for not very effective
      textScale = 0.75;
    }

    target.hp -= finalDamage;
    target.damageFlashTimerMs = 150;

    // Track this tower as a participant for EXP distribution
    target.damagedByTowerIds.add(source.id);

    engine.floatingTexts.push({
      id: `ft_dmg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      text: Math.ceil(finalDamage).toString(),
      position: { ...target.position },
      color: textColor,
      scale: textScale,
      durationMs: 1000,
      elapsedMs: 0,
    });

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
