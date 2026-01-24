import { renderHook, act } from "@testing-library/react";
import { useGameStore } from "../../store/gameStore";
import { DialogContext, GameEvent, Screens, ShowDialogEventPayload } from "../../types/baseGame";

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
        payload: { enemyId: 101 }
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
});
