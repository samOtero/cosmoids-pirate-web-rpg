export type TDEvent =
  | {
      type: 'ENEMY_DIED';
      enemyId: string;
      killerTowerId: string;
      xpValue: number;
    }
  | { type: 'TOWER_LEVELED_UP'; towerId: string; newLevel: number }
  | {
      type: 'TOWER_EVOLVED';
      towerId: string;
      oldDefinitionId: string;
      newDefinitionId: string;
    }
  | { type: 'TOWER_LEARNED_ATTACK'; towerId: string; attackDefId: string };

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
