import { create } from "zustand";
import { Screens } from "@/types/baseGames";

interface GameState {
  currentScreen: Screens;
  setScreen: (screen: Screens) => void;
}

export const useGameStore = create<GameState>()((set) => ({
  currentScreen: Screens.START,
  setScreen: (screen) => set({ currentScreen: screen }),
}));
