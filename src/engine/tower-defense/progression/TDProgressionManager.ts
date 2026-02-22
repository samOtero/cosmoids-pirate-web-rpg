import { TowerDefenseEngine, TD_CREATURE_DEFS } from '../TowerDefenseEngine';
import { TDEventBus, TDEvent } from '../events/TDEventBus';

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
        killer.xp += event.xpValue;

        // Simple RPG curve: Level 1->2 is 100xp, 2->3 is 200xp, etc.
        const requiredXp = killer.level * 100;

        if (killer.xp >= requiredXp) {
          killer.xp -= requiredXp;
          killer.level += 1;

          // Scale Stats
          const metadata = TD_CREATURE_DEFS[killer.definitionId];
          const statGrowth = 2; // Flat +2 attack per level as simple example
          killer.currentAttack =
            metadata.baseCreature.attack + killer.level * statGrowth;

          // We decouple the trigger so Pixi can safely animate
          this.engine.events.emit({
            type: 'TOWER_LEVELED_UP',
            towerId: killer.id,
            newLevel: killer.level,
          });
        }
      }
    } else if (event.type === 'TOWER_LEVELED_UP') {
      const tower = this.engine.towers.find((t) => t.id === event.towerId);
      if (tower) {
        const metadata = TD_CREATURE_DEFS[tower.definitionId];

        if (metadata.attackUnlocks) {
          metadata.attackUnlocks.forEach((node) => {
            if (node.level === event.newLevel) {
              // Avoid duplicates
              if (
                !tower.equippedAttacks.find(
                  (a) => a.definitionId === node.attackDefId
                )
              ) {
                tower.equippedAttacks.push({
                  definitionId: node.attackDefId,
                  lastFiredTime: 0,
                });
                this.engine.events.emit({
                  type: 'TOWER_LEARNED_ATTACK',
                  towerId: tower.id,
                  attackDefId: node.attackDefId,
                });
              }
            }
          });
        }

        if (metadata.evolutionNodes) {
          metadata.evolutionNodes.forEach((node) => {
            if (node.level === event.newLevel) {
              const oldDef = tower.definitionId;
              tower.definitionId = node.evolutionDefId;

              const newMetadata = TD_CREATURE_DEFS[tower.definitionId];
              tower.currentAttack =
                newMetadata.baseCreature.attack + tower.level * 2;

              this.engine.events.emit({
                type: 'TOWER_EVOLVED',
                towerId: tower.id,
                oldDefinitionId: oldDef,
                newDefinitionId: tower.definitionId,
              });
            }
          });
        }
      }
    }
  }
}
