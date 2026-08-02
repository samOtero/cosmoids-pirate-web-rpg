import { TowerDefenseEngine } from '../TowerDefenseEngine';
import { TDEventBus, TDEvent } from '../events/TDEventBus';
import { calculateMaxHp, calculateStat } from '@/utils/resolvePlayerCreature';
import { COSMOID_TEMPLATES } from '@/constants/creatures';

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
    }
  }

  private processLevelUpProgression(tower: any, newLevel: number) {
    const template = COSMOID_TEMPLATES[tower.creature.speciesId];
    if (!template) return;

    if (template.learnableAttacks) {
      template.learnableAttacks.forEach((node) => {
        if (node.level === newLevel) {
          // Avoid duplicates
          if (!tower.creature.equippedAttacks.includes(node.attackId)) {
            if (tower.creature.equippedAttacks.length < 4) {
              tower.creature.equippedAttacks.push(node.attackId);
              tower.equippedAttacksRuntime.push({
                definitionId: node.attackId,
                lastFiredTime: 0,
              });
              this.engine.events.emit({
                type: 'TOWER_LEARNED_ATTACK',
                towerId: tower.id,
                attackDefId: node.attackId,
              });
            } else {
              this.engine.events.emit({
                type: 'TOWER_ASK_REPLACE_ATTACK',
                towerId: tower.id,
                newAttackDefId: node.attackId,
              });
            }
          }
        }
      });
    }

    if (template.evolutionNodes) {
      template.evolutionNodes.forEach((node) => {
        if (node.level === newLevel) {
          const oldDef = tower.creature.speciesId;
          tower.creature.speciesId = node.evolutionDefId;

          const newTemplate = COSMOID_TEMPLATES[tower.creature.speciesId];
          if (newTemplate) {
            tower.creature.type = newTemplate.type;
            tower.creature.secondaryType = newTemplate.secondaryType;
            tower.currentAttack = calculateStat(
              newTemplate.baseStats.attack,
              tower.creature.level
            );
            tower.currentSpecialAttack = calculateStat(
              newTemplate.baseStats.specialAttack,
              tower.creature.level
            );
            tower.currentDefense = calculateStat(
              newTemplate.baseStats.defense,
              tower.creature.level
            );
            tower.currentSpecialDefense = calculateStat(
              newTemplate.baseStats.specialDefense,
              tower.creature.level
            );

            // Recalculate HP and restore to full on evolution
            const newMaxHp = calculateMaxHp(
              newTemplate.baseStats.hp,
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
        }
      });
    }
  }

  private distributeExperience(
    enemyDefinitionId: string,
    enemyLevel: number,
    participantTowerIds: string[]
  ) {
    const template = COSMOID_TEMPLATES[enemyDefinitionId];
    const baseExperience = template ? template.baseExperience : 50;

    // Distribute EXP to each participating tower
    const participantCount = Math.max(1, participantTowerIds.length);

    for (const towerId of participantTowerIds) {
      const tower = this.engine.towers.find((t) => t.id === towerId);
      if (!tower) continue;

      const towerLevel = tower.creature.level;

      // Formula: ΔEXP = ((baseExperience * enemyLevel / 5) * (1 / participantCount) * ((2 * enemyLevel + 10) / (enemyLevel + towerLevel + 10))^2.5) + 1

      const baseValue = (baseExperience * enemyLevel) / 5;
      const levelRatio = (2 * enemyLevel + 10) / (enemyLevel + towerLevel + 10);

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

      const initialLevel = tower.creature.level;
      const initialStats = {
        hp: tower.maxHp,
        attack: tower.currentAttack,
        specialAttack: tower.currentSpecialAttack,
        defense: tower.currentDefense,
        specialDefense: tower.currentSpecialDefense,
      };

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
        const towerTemplate = COSMOID_TEMPLATES[tower.creature.speciesId];
        if (towerTemplate) {
          tower.currentAttack = calculateStat(
            towerTemplate.baseStats.attack,
            tower.creature.level
          );
          tower.currentSpecialAttack = calculateStat(
            towerTemplate.baseStats.specialAttack,
            tower.creature.level
          );
          tower.currentDefense = calculateStat(
            towerTemplate.baseStats.defense,
            tower.creature.level
          );
          tower.currentSpecialDefense = calculateStat(
            towerTemplate.baseStats.specialDefense,
            tower.creature.level
          );

          // Recalculate HP and restore to full on level-up
          const newMaxHp = calculateMaxHp(
            towerTemplate.baseStats.hp,
            tower.creature.level
          );
          tower.maxHp = newMaxHp;
          tower.hp = newMaxHp;
        }

        // Process move-learning and evolution for this intermediate level-up step
        this.processLevelUpProgression(tower, tower.creature.level);
      }

      // If we actually leveled up, emit a SINGLE event!
      if (tower.creature.level > initialLevel) {
        this.engine.floatingTexts.push({
          id: `ft_lvl_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          text: `Level Up!`,
          position: { ...tower.position },
          color: 0xfacc15,
          scale: 1.2,
          durationMs: 1400,
          elapsedMs: 0,
        });

        this.engine.events.emit({
          type: 'TOWER_LEVELED_UP',
          towerId: tower.id,
          speciesId: tower.creature.speciesId,
          prevLevel: initialLevel,
          newLevel: tower.creature.level,
          prevStats: initialStats,
          newStats: {
            hp: tower.maxHp,
            attack: tower.currentAttack,
            specialAttack: tower.currentSpecialAttack,
            defense: tower.currentDefense,
            specialDefense: tower.currentSpecialDefense,
          },
        });
      }
    }
  }
}
