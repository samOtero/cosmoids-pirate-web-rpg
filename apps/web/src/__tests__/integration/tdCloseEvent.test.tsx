import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, resetStore } from '@/__tests__/utils/test-utils';
import { useGameStore } from '@/store/gameStore';
import { Screens, TDLevelContext } from '@/types/baseGame';
import { TD_LEVELS } from '@/constants/tdLevels';
import Home from '@/app/page';
import { act } from '@testing-library/react';

// Mock TowerDefenseScreen to bypass lazy/suspense chunk loading and rendering delays
vi.mock('@/app/components/tower-defense/TowerDefenseScreen', () => {
  return {
    default: ({ onClose }: any) => (
      <div data-testid="mock-td-screen">
        <button onClick={onClose}>Close</button>
      </div>
    ),
  };
});

describe('Tower Defense Level Close Event Integration', () => {
  beforeEach(() => {
    resetStore();
  });

  it('should queue up the loseEvents for the level when onClose is called on TowerDefenseScreen', async () => {
    const store = useGameStore.getState();

    // 1. Setup a valid profile
    act(() => {
      store.createProfile(0);
      store.selectProfile(0);
      store.clearQueue();
    });

    // 2. Set the current TD level and active screen
    const firstLevelConfig = TD_LEVELS[TDLevelContext.FIRST_LEVEL];
    act(() => {
      store.setTdLevel(firstLevelConfig);
      store.setScreen(Screens.TOWER_DEFENSE);
    });

    // Verify initial setup
    expect(useGameStore.getState().currentScreen).toBe(Screens.TOWER_DEFENSE);
    expect(useGameStore.getState().currentTdLevel).toEqual(firstLevelConfig);

    // 3. Render the Home page screen
    const { findByText } = render(<Home />);

    // Locate the Close button on the TD Screen and click it
    const closeButton = await findByText('Close', undefined, { timeout: 10000 });
    expect(closeButton).toBeInTheDocument();

    // 4. Click the Close button
    act(() => {
      closeButton.click();
    });

    // 5. Verify that firstLevel's loseEvents are queued up in the eventQueue.
    // The first event from FIRST_LEVEL.loseEvents is SHOW_DIALOG (context: STARTER_BATTLE_LOSE).
    // Because it is processed, currentScreen becomes Screens.DIALOG and context is set.
    // The rest of the events (GO_TO_LEVEL_SELECT) are left in the queue.
    const freshState = useGameStore.getState();
    expect(freshState.currentScreen).toBe(Screens.DIALOG);
    expect(freshState.dialogContext).toBe('STARTER_BATTLE_LOSE');
    
    // Verify the rest of the queue contains the second lose event
    expect(freshState.eventQueue).toHaveLength(1);
    expect(freshState.eventQueue[0].type).toBe('GO_TO_LEVEL_SELECT');
  });

  it('should go straight to challenge select when closing a challenge level', async () => {
    const store = useGameStore.getState();

    // 1. Setup a valid profile
    act(() => {
      store.createProfile(0);
      store.selectProfile(0);
      store.clearQueue();
    });

    // 2. Set current level to a challenge level and screens
    const challengeLevelConfig = TD_LEVELS[TDLevelContext.CHALLENGE_FIRST_LEVEL];
    act(() => {
      store.setTdLevel(challengeLevelConfig);
      store.setScreen(Screens.TOWER_DEFENSE);
    });

    // 3. Render Home page
    const { findByText } = render(<Home />);

    // Locate the Close button and click it
    const closeButton = await findByText('Close', undefined, { timeout: 10000 });
    act(() => {
      closeButton.click();
    });

    // 4. Verify that it went straight to Screens.CHALLENGE_SELECT
    const freshState = useGameStore.getState();
    expect(freshState.currentScreen).toBe(Screens.CHALLENGE_SELECT);
    expect(freshState.eventQueue).toHaveLength(0);
  });
});
