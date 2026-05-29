export interface TDStatSnapshot {
  hp: number;
  attack: number;
  specialAttack: number;
  defense: number;
  specialDefense: number;
}

export type TDEvent =
  | {
      type: 'ENEMY_DIED';
      enemyId: string;
      enemyDefinitionId: string;
      enemyLevel: number;
      participantTowerIds: string[];
    }
  | {
      type: 'ENEMY_CAPTURED';
      enemyId: string;
      enemyDefinitionId: string;
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
      speciesId: string;
      prevLevel: number;
      newLevel: number;
      prevStats: TDStatSnapshot;
      newStats: TDStatSnapshot;
    }
  | {
      type: 'TOWER_EVOLVED';
      towerId: string;
      oldDefinitionId: string;
      newDefinitionId: string;
    }
  | { type: 'TOWER_LEARNED_ATTACK'; towerId: string; attackDefId: string }
  | {
      type: 'TOWER_ASK_REPLACE_ATTACK';
      towerId: string;
      newAttackDefId: string;
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
