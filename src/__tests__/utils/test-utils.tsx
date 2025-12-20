import { ReactElement, ReactNode } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { useGameStore } from "@/store/gameStore";
import { Screens } from "@/types/baseGame";

// Create a wrapper that can reset the store between tests
function TestWrapper({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

// Custom render function with store reset
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: TestWrapper, ...options });
}

// Helper to reset the Zustand store
export function resetStore() {
  const store = useGameStore.getState();
  useGameStore.setState({
    currentScreen: "START" as Screens,
    profiles: [null, null, null],
    currentProfileId: null,
  });
  localStorage.clear();
}

// Re-export everything from React Testing Library
export * from "@testing-library/react";
export { customRender as render };
