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
    if (event.type === 'ENEMY_DIED') {
      const killer = this.engine.towers.find(
        (t) => t.id === event.killerTowerId
      );
      if (killer) {
        killer.creature.xp += event.xpValue;

        this.engine.events.emit({
          type: 'TOWER_XP_GAINED',
          towerId: killer.id,
          xpGained: event.xpValue,
          totalXp: killer.creature.xp,
        });

        // Don't level up past the cap
        if (killer.creature.level >= MAX_LEVEL) return;

        // Simple RPG curve: Level 1->2 is 100xp, 2->3 is 200xp, etc.
        const requiredXp = killer.creature.level * 100;

        if (killer.creature.xp >= requiredXp) {
          killer.creature.xp -= requiredXp;
          killer.creature.level += 1;

          // Scale Stats using Pokemon formula
          const metadata = TD_CREATURE_DEFS[killer.creature.speciesId];
          killer.currentAttack = calculateStat(
            metadata.baseCreature.attack,
            killer.creature.level
          );

          // Recalculate HP and restore to full on level-up
          const newMaxHp = calculateMaxHp(
            metadata.baseCreature.maxHp,
            killer.creature.level
          );
          killer.maxHp = newMaxHp;
          killer.hp = newMaxHp;

          // We decouple the trigger so Pixi can safely animate
          this.engine.events.emit({
            type: 'TOWER_LEVELED_UP',
            towerId: killer.id,
            newLevel: killer.creature.level,
          });
        }
      }
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
}
