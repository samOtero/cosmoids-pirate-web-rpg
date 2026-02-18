import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '@/store/gameStore';
import { BATTLES } from '@/constants/battles';
import { BattleContext, DialogContext, GameEvent } from '@/types/baseGame';
import { resolveDialog } from '@/utils/dialogResolver';

describe('Battle Drop System', () => {
  beforeEach(() => {
    useGameStore.getState().profiles = Array(3).fill(null);
    useGameStore.getState().currentProfileId = null;
    useGameStore.getState().eventQueue = [];
    useGameStore.getState().currentBattle = null;
  });

  it('should award items and show dialog when winning a battle with drops', () => {
    const store = useGameStore.getState();
    store.createProfile(0);
    // Process initial events to get to a stable state
    store.clearQueue();

    // Set up a battle with guaranteed drops
    // We'll use the FOREST_BUG_BATTLE which we modified to have 100% drop rate
    const battleConfig = BATTLES[BattleContext.FOREST_BUG_BATTLE];
    store.setBattleConfig(battleConfig, battleConfig.enemy);

    // Mock Math.random to ensure drop if chance wasn't 100% (though it is now)
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.1);

    // Trigger win
    store.handleBattleWin();

    // Check event queue for drop events
    const queue = useGameStore.getState().eventQueue;

    // Expect:
    // 1. SHOW_DIALOG processed -> current screen is DIALOG, context is FOUND_ITEM
    // 2. GAIN_ITEM should be next in queue (or processed if dialog auto-proceeded, but it doesn't)

    // Need to get fresh state as store variable is stale
    expect(useGameStore.getState().currentScreen).toBe('DIALOG'); // Screens.DIALOG
    expect(useGameStore.getState().dialogContext).toBe(
      DialogContext.FOUND_ITEM
    );

    // Verify dialog resolution
    // This confirms the "Blank Dialog" bug is fixed by ensuring resolveDialog returns content
    const dialogConfig = resolveDialog(DialogContext.FOUND_ITEM, null);
    expect(dialogConfig.sequence.length).toBeGreaterThan(0);
    expect(dialogConfig.sequence[0].text).toContain('found');

    // Check queue in fresh state
    const currentQueue = useGameStore.getState().eventQueue;
    const gainItemEvent = currentQueue.find((e) => e.type === 'GAIN_ITEM');
    expect(gainItemEvent).toBeDefined();
    expect((gainItemEvent?.payload as any)?.itemId).toBe('BERRY');

    // Process the events to verify inventory update
    useGameStore.getState().processNextEvent(); // Use fresh state action

    // GAIN_ITEM has autoProceed: true in my implementation.
    // So calling processNextEvent should handle it AND the subsequent events until one stops.

    const profile = useGameStore.getState().profiles[0];
    expect(profile?.inventory).toHaveLength(1);
    expect(profile?.inventory[0].id).toBe('BERRY');
    expect(profile?.inventory[0].count).toBe(1);

    randomSpy.mockRestore();
  });
});
