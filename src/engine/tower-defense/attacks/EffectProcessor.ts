import { TowerDefenseEngine } from '../TowerDefenseEngine';
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
    const damage = attackDef.power;
    target.hp -= damage;

    if (attackDef.effects && target.hp > 0) {
      attackDef.effects.forEach((effect) => {
        if (Math.random() <= effect.chance) {
          switch (effect.type) {
            case 'BURN':
              target.statusConditions.push({
                type: 'BURN',
                durationMs: 3000,
                tickDamage: Math.max(1, damage * 0.1),
                lastTickTime: 0,
              });
              break;
            case 'POISON':
              target.statusConditions.push({
                type: 'POISON',
                durationMs: 5000,
                tickDamage: Math.max(1, damage * 0.05),
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
