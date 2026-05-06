import { TowerDefenseEngine, TD_CREATURE_DEFS } from '../TowerDefenseEngine';
import { TDEventBus, TDEvent } from '../events/TDEventBus';
import { calculateMaxHp, calculateStat } from '@/utils/resolvePlayerCreature';

const MAX_LEVEL = 10;

export class TDProgressionManager {
  private engine: TowerDefenseEngine;
  private unsubscribe: () => void;

  constructor(engine: TowerDefenseEngine, eventBus: TDEventBus) {
    this.engine = engine;
    this.unsubscribe = eventBus.subscribe(this.handleEvent.bind(this));
  }

  public destroy() {
    this.unsubscribe();
  }

  private handleEvent(event: TDEvent) {
    if (event.type === 'ENEMY_DIED' || event.type === 'ENEMY_CAPTURED') {
      this.distributeExperience(
        event.enemyDefinitionId,
        event.enemyLevel,
        event.participantTowerIds
      );
    } else if (event.type === 'TOWER_LEVELED_UP') {
      const tower = this.engine.towers.find((t) => t.id === event.towerId);
      if (tower) {
        const metadata = TD_CREATURE_DEFS[tower.creature.speciesId];

        if (metadata.attackUnlocks) {
          metadata.attackUnlocks.forEach((node) => {
            if (node.level === event.newLevel) {
              // Avoid duplicates
              if (!tower.creature.equippedAttacks.includes(node.attackDefId)) {
                if (tower.creature.equippedAttacks.length < 4) {
                  tower.creature.equippedAttacks.push(node.attackDefId);
                  tower.equippedAttacksRuntime.push({
                    definitionId: node.attackDefId,
                    lastFiredTime: 0,
                  });
                  this.engine.events.emit({
                    type: 'TOWER_LEARNED_ATTACK',
                    towerId: tower.id,
                    attackDefId: node.attackDefId,
                  });
                } else {
                  this.engine.events.emit({
                    type: 'TOWER_ASK_REPLACE_ATTACK',
                    towerId: tower.id,
                    newAttackDefId: node.attackDefId,
                  });
                }
              }
            }
          });
        }

        if (metadata.evolutionNodes) {
          metadata.evolutionNodes.forEach((node) => {
            if (node.level === event.newLevel) {
              const oldDef = tower.creature.speciesId;
              tower.creature.speciesId = node.evolutionDefId;

              const newMetadata = TD_CREATURE_DEFS[tower.creature.speciesId];
              tower.currentAttack = calculateStat(
                newMetadata.baseCreature.attack,
                tower.creature.level
              );
              tower.currentSpecialAttack = calculateStat(
                newMetadata.baseCreature.specialAttack,
                tower.creature.level
              );
              tower.currentDefense = calculateStat(
                newMetadata.baseCreature.defense,
                tower.creature.level
              );
              tower.currentSpecialDefense = calculateStat(
                newMetadata.baseCreature.specialDefense,
                tower.creature.level
              );

              // Recalculate HP and restore to full on evolution
              const newMaxHp = calculateMaxHp(
                newMetadata.baseCreature.maxHp,
                tower.creature.level
              );
              tower.maxHp = newMaxHp;
              tower.hp = newMaxHp;

              this.engine.events.emit({
                type: 'TOWER_EVOLVED',
                towerId: tower.id,
                oldDefinitionId: oldDef,
                newDefinitionId: tower.creature.speciesId,
              });
            }
          });
        }
      }
    }
  }

  private distributeExperience(
    enemyDefinitionId: string,
    enemyLevel: number,
    participantTowerIds: string[]
  ) {
    const meta = TD_CREATURE_DEFS[enemyDefinitionId];
    const baseExperience = meta ? meta.baseCreature.baseExperience : 50;

    // Distribute EXP to each participating tower
    const participantCount = Math.max(1, participantTowerIds.length);

    for (const towerId of participantTowerIds) {
      const tower = this.engine.towers.find((t) => t.id === towerId);
      if (!tower) continue;

      const towerLevel = tower.creature.level;

      // Formula: ΔEXP = ((baseExperience * enemyLevel / 5) * (1 / participantCount) * ((2 * enemyLevel + 10) / (enemyLevel + towerLevel + 10))^2.5) + 1

      const baseValue = (baseExperience * enemyLevel) / 5;
      const levelRatio =
        (2 * enemyLevel + 10) / (enemyLevel + towerLevel + 10);

      // The core scaling factor uses a power of 2.5
      const scalingFactor = Math.pow(levelRatio, 2.5);

      // Calculate final XP
      let xpGained =
        Math.floor((baseValue / participantCount) * scalingFactor) + 1;

      // Ensure at least 1 XP is gained
      xpGained = Math.max(1, xpGained);

      tower.creature.xp += xpGained;

      this.engine.events.emit({
        type: 'TOWER_XP_GAINED',
        towerId: tower.id,
        xpGained: xpGained,
        totalXp: tower.creature.xp,
      });

      // Process multiple level-ups if enough XP was gained
      while (tower.creature.level < MAX_LEVEL) {
        const nextLevel = tower.creature.level + 1;
        const requiredXp = nextLevel ** 3 - tower.creature.level ** 3;

        if (tower.creature.xp < requiredXp) {
          break;
        }

        tower.creature.xp -= requiredXp;
        tower.creature.level += 1;

        // Scale Stats using Pokemon formula
        const towerMeta = TD_CREATURE_DEFS[tower.creature.speciesId];
        tower.currentAttack = calculateStat(
          towerMeta.baseCreature.attack,
          tower.creature.level
        );
        tower.currentSpecialAttack = calculateStat(
          towerMeta.baseCreature.specialAttack,
          tower.creature.level
        );
        tower.currentDefense = calculateStat(
          towerMeta.baseCreature.defense,
          tower.creature.level
        );
        tower.currentSpecialDefense = calculateStat(
          towerMeta.baseCreature.specialDefense,
          tower.creature.level
        );

        // Recalculate HP and restore to full on level-up
        const newMaxHp = calculateMaxHp(
          towerMeta.baseCreature.maxHp,
          tower.creature.level
        );
        tower.maxHp = newMaxHp;
        tower.hp = newMaxHp;

        // We decouple the trigger so Pixi can safely animate
        this.engine.events.emit({
          type: 'TOWER_LEVELED_UP',
          towerId: tower.id,
          newLevel: tower.creature.level,
        });
      }
    }
  }
}
