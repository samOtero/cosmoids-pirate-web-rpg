import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Screens, Profile } from "@/types/baseGame";
import { MAX_PROFILES } from "@/constants/game";

interface GameState {
  currentScreen: Screens;
  setScreen: (screen: Screens) => void;
  profiles: (Profile | null)[];
  currentProfileId: number | null;
  createProfile: (slotId: number) => void;
  deleteProfile: (slotId: number) => void;
  selectProfile: (slotId: number) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      currentScreen: Screens.START,
      setScreen: (screen) => set({ currentScreen: screen }),
      profiles: Array(MAX_PROFILES).fill(null),
      currentProfileId: null,
      createProfile: (slotId: number) =>
        set((state) => {
          if (slotId < 0 || slotId >= MAX_PROFILES) return state;
          const newProfiles = [...state.profiles];
          newProfiles[slotId] = {
            id: slotId,
            name: `Caleb`,
            lastPlayed: Date.now(),
            isNew: true,
            creatures: [],
            inventory: [],
            unlockedIslands: 0,
            currentIslandId: 0,
          };
          return { profiles: newProfiles };
        }),
      deleteProfile: (slotId: number) =>
        set((state) => {
          if (slotId < 0 || slotId >= MAX_PROFILES) return state;
          const newProfiles = [...state.profiles];
          newProfiles[slotId] = null;
          return {
            profiles: newProfiles,
            currentProfileId:
              state.currentProfileId === slotId ? null : state.currentProfileId,
          };
        }),
      selectProfile: (slotId: number) =>
        set((state) => {
          if (slotId < 0 || slotId >= MAX_PROFILES || !state.profiles[slotId])
            return state;
          const newProfiles = [...state.profiles];
          if (newProfiles[slotId]) {
            newProfiles[slotId] = {
              ...newProfiles[slotId]!,
              lastPlayed: Date.now(),
              isNew: false,
            };
          }
          return {
            profiles: newProfiles,
            currentProfileId: slotId,
            currentScreen: Screens.MAP,
          };
        }),
    }),
    {
      name: "cosmoids-game-state",
      partialize: (state) => ({
        profiles: state.profiles,
      }),
    }
  )
);
