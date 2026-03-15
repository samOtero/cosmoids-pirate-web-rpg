import { TowerDefenseEngine, TD_CREATURE_DEFS } from '../TowerDefenseEngine';
import { Tower, Enemy } from '../types';
import { AttackDefinition } from './types';

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
    const attack = source.currentAttack;

    // Get Enemy Defense
    const defenderMeta = TD_CREATURE_DEFS[target.definitionId];
    const defense = defenderMeta ? defenderMeta.baseCreature.defense : 1; // Fallback to 1 to prevent division by zero

    // Pokemon Damage Formula
    const baseDamage = Math.floor(
      Math.floor(
        (Math.floor((2 * level) / 5 + 2) * power * attack) / defense
      ) / 50
    ) + 2;

    // Add a slight randomization (85% to 100%)
    const randomModifier = (Math.floor(Math.random() * 16) + 85) / 100;
    let finalDamage = Math.floor(baseDamage * randomModifier);

    // Ensure at least 1 damage
    finalDamage = Math.max(1, finalDamage);

    target.hp -= finalDamage;
    target.damageFlashTimerMs = 150;

    engine.floatingTexts.push({
      id: `ft_dmg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      text: Math.ceil(finalDamage).toString(),
      position: { ...target.position },
      color: 0xffffff,
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
