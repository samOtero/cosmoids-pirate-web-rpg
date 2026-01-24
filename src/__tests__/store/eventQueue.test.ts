import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from "@/store/gameStore";
import { Screens, DialogContext } from "@/types/baseGame";

describe("GameStore Event Queue", () => {
  beforeEach(() => {
    useGameStore.setState({
      eventQueue: [],
      currentScreen: Screens.START,
      dialogContext: null,
      profiles: [],
      currentProfileId: null,
    });
  });

  it("should enqueue and process events", () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.enqueueEvent({
        type: "GO_TO_MAP",
      });
    });

    expect(result.current.eventQueue).toHaveLength(1);

    act(() => {
      result.current.processNextEvent();
    });

    expect(result.current.eventQueue).toHaveLength(0);
    expect(result.current.currentScreen).toBe(Screens.MAP);
  });

  it("should handle SHOW_DIALOG event", () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.enqueueEvent({
        type: "SHOW_DIALOG",
        payload: { context: DialogContext.GAME_INTRO },
      });
      result.current.processNextEvent();
    });

    expect(result.current.currentScreen).toBe(Screens.DIALOG);
    expect(result.current.dialogContext).toBe(DialogContext.GAME_INTRO);
  });

  it("should process items in FIFO order", () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
        result.current.enqueueEvent({
            type: "GO_TO_MAP",
        });
        result.current.enqueueEvent({
            type: "GO_TO_MAP",
        });
    });

    act(() => {
        result.current.processNextEvent();
    });
    expect(result.current.currentScreen).toBe(Screens.PROFILES);

    act(() => {
        result.current.processNextEvent();
    });
    expect(result.current.currentScreen).toBe(Screens.MAP);
  });
});
