import { renderHook, act } from '@testing-library/react';
import { useGameStore } from '../../store/gameStore';
import {
  DialogContext,
  GameEvent,
  Screens,
} from '../../types/baseGame';

// Mock localStorage to avoid persist errors
const localStorageMock = (function () {
  let store: Record<string, string> = {};
  return {
    getItem: function (key: string) {
      return store[key] || null;
    },
    setItem: function (key: string, value: string) {
      store[key] = value.toString();
    },
    clear: function () {
      store = {};
    },
    removeItem: function (key: string) {
      delete store[key];
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useGameStore - enqueueAndProcessEvents', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useGameStore());
    act(() => {
      // Manually reset state if needed, or rely on create/persist behavior
      result.current.clearQueue();
      result.current.setScreen(Screens.START);
    });
    localStorageMock.clear();
  });

  it('should append events to the queue and process the first one immediately', () => {
    const { result } = renderHook(() => useGameStore());

    const event1: GameEvent = {
      type: 'GO_TO_PARTY',
    };

    const event2: GameEvent = {
      type: 'SHOW_DIALOG',
      payload: { context: DialogContext.NEW_PLAYER_WELCOME_DIALOG },
    };

    act(() => {
      result.current.enqueueAndProcessEvents([event1, event2]);
    });

    // Expect queue to have the second event (first one processed)
    expect(result.current.eventQueue).toHaveLength(1);
    expect(result.current.eventQueue[0]).toEqual(event2);

    // Expect state to change based on the first event (GO_TO_PARTY)
    expect(result.current.currentScreen).toBe(Screens.PARTY);
  });

  it('should handle empty array gracefully', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.enqueueAndProcessEvents([]);
    });

    expect(result.current.eventQueue).toHaveLength(0);
  });

  it('should automatically process the next event if autoProceed is true', () => {
    const { result } = renderHook(() => useGameStore());

    // Event 1: Go to Level Select, autoProceed = true
    const event1: GameEvent = {
      type: 'GO_TO_LEVEL_SELECT',
      autoProceed: true,
    };

    // Event 2: Go to Party (should be processed immediately after Event 1)
    const event2: GameEvent = {
      type: 'GO_TO_PARTY',
    };

    act(() => {
      result.current.enqueueAndProcessEvents([event1, event2]);
    });

    // Final state should be PARTY, because Event 1 auto-proceeded to Event 2
    expect(result.current.currentScreen).toBe(Screens.PARTY);

    // Queue should be empty because both were processed
    expect(result.current.eventQueue).toHaveLength(0);
  });

  it('should not switch screen when SHOW_LEVEL_SELECT_DIALOG is triggered during LEVEL_SELECT', () => {
    const { result } = renderHook(() => useGameStore());

    // 1. Go to Level Select
    act(() => {
      result.current.enqueueAndProcessEvents([
        {
          type: 'GO_TO_LEVEL_SELECT',
        },
      ]);
    });

    expect(result.current.currentScreen).toBe(Screens.LEVEL_SELECT);

    // 2. Trigger Level Select Dialog
    act(() => {
      result.current.enqueueAndProcessEvents([
        {
          type: 'SHOW_LEVEL_SELECT_DIALOG',
          payload: { context: DialogContext.ISLAND_INTRO },
        },
      ]);
    });

    // 3. Verify screen is STILL Level Select
    expect(result.current.currentScreen).toBe(Screens.LEVEL_SELECT);
    // 4. Verify dialog context is set
    expect(result.current.dialogContext).toBe(DialogContext.ISLAND_INTRO);
  });
});
