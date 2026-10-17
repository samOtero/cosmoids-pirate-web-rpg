import type { AttackId, SpeciesId } from '@/types/definitionIds';
export interface TDStatSnapshot {
  hp: number;
  attack: number;
  specialAttack: number;
  defense: number;
  specialDefense: number;
}

export type TDEvent =
  | {
      type: 'ATTACK_DAMAGE_DEALT';
      towerId: string;
      targetEnemyId: string;
      attackDefId: AttackId;
      damage: number;
    }
  | {
      type: 'TOWER_DAMAGED';
      towerId: string;
      creatureId: string;
      sourceEnemyId: string;
      damage: number;
      hp: number;
      maxHp: number;
    }
  | {
      type: 'TOWER_HEALED';
      towerId: string;
      creatureId: string;
      amount: number;
      hp: number;
      maxHp: number;
    }
  | {
      type: 'ENEMY_DIED';
      enemyId: string;
      enemyDefinitionId: SpeciesId | string;
      enemyLevel: number;
      participantTowerIds: string[];
    }
  | {
      type: 'STRUCTURE_DESTROYED';
      structureId: string;
      participantTowerIds: string[];
      winsLevel: boolean;
    }
  | {
      type: 'ENEMY_CAPTURED';
      enemyId: string;
      enemyDefinitionId: SpeciesId | string;
      enemyLevel: number;
      participantTowerIds: string[];
    }
  | {
      type: 'TOWER_XP_GAINED';
      towerId: string;
      xpGained: number;
      totalXp: number;
    }
  | {
      type: 'TOWER_LEVELED_UP';
      towerId: string;
      speciesId: SpeciesId;
      prevLevel: number;
      newLevel: number;
      prevStats: TDStatSnapshot;
      newStats: TDStatSnapshot;
    }
  | {
      type: 'TOWER_EVOLVED';
      towerId: string;
      oldDefinitionId: SpeciesId;
      newDefinitionId: SpeciesId;
    }
  | {
      type: 'TOWER_ASK_EVOLUTION';
      towerId: string;
      oldDefinitionId: SpeciesId;
      newDefinitionId: SpeciesId;
    }
  | { type: 'TOWER_LEARNED_ATTACK'; towerId: string; attackDefId: AttackId }
  | {
      type: 'TOWER_ASK_REPLACE_ATTACK';
      towerId: string;
      newAttackDefId: AttackId;
    }
  | {
      type: 'SHINY_ENEMY_SPAWNED';
      enemyId: string;
      enemyDefinitionId: SpeciesId;
      level: number;
    }
  | {
      type: 'CURSED_PHASE_TRIGGERED';
      enemyId: string;
      enemyDefinitionId: SpeciesId | string;
    };

type TDEventHandler = (event: TDEvent) => void;

export class TDEventBus {
  private listeners: TDEventHandler[] = [];

  public subscribe(handler: TDEventHandler): () => void {
    this.listeners.push(handler);
    return () => {
      this.listeners = this.listeners.filter((h) => h !== handler);
    };
  }

  public emit(event: TDEvent): void {
    // We clone the listener array just in case a handler unsubscribes during emission
    const currentListeners = [...this.listeners];
    for (const handler of currentListeners) {
      handler(event);
    }
  }
}
