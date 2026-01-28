import { renderHook, act } from "@testing-library/react";
import { useGameStore } from "../../store/gameStore";
import { BattleContext, DialogContext, GameEvent, Screens } from "../../types/baseGame";

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

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("useGameStore - enqueueAndProcessEvents", () => {
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

  it("should append events to the queue and process the first one immediately", () => {
    const { result } = renderHook(() => useGameStore());

    const event1: GameEvent = {
        type: "START_BATTLE",
        payload: { context: BattleContext.FIRST_BATTLE, enemyId: "101" }
    };

    const event2: GameEvent = {
        type: "SHOW_DIALOG",
        payload: { context: DialogContext.GAME_INTRO }
    };

    act(() => {
        result.current.enqueueAndProcessEvents([event1, event2]);
    });

    // Expect queue to have the second event (first one processed)
    expect(result.current.eventQueue).toHaveLength(1);
    expect(result.current.eventQueue[0]).toEqual(event2);

    // Expect state to change based on the first event (START_BATTLE)
    expect(result.current.currentScreen).toBe(Screens.BATTLE);
  });

  it("should handle empty array gracefully", () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
        result.current.enqueueAndProcessEvents([]);
    });

    expect(result.current.eventQueue).toHaveLength(0);
  });


  it("should automatically process the next event if autoProceed is true", () => {
    const { result } = renderHook(() => useGameStore());

    // Event 1: Go to MAP, autoProceed = true
    const event1: GameEvent = {
        type: "GO_TO_MAP",
        payload: { islandId: 1 },
        autoProceed: true
    };

    // Event 2: Start Battle (should be processed immediately after Event 1)
    const event2: GameEvent = {
        type: "START_BATTLE",
        payload: { context: BattleContext.FIRST_BATTLE }
    };

    act(() => {
        result.current.enqueueAndProcessEvents([event1, event2]);
    });

    // Final state should be BATTLE, because Event 1 auto-proceeded to Event 2
    expect(result.current.currentScreen).toBe(Screens.BATTLE);
    
    // Queue should be empty because both were processed
    expect(result.current.eventQueue).toHaveLength(0);
  });
});
