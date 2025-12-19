import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Screens,
  Profile,
  DialogContext,
  DialogContextData,
  Creature,
} from "@/types/baseGame";
import { MAX_PROFILES } from "@/constants/game";

interface GameState {
  currentScreen: Screens;
  dialogContext: DialogContext | null;
  dialogContextData: DialogContextData | null;
  setScreen: (
    screen: Screens,
    context?: DialogContext,
    contextData?: DialogContextData
  ) => void;
  profiles: (Profile | null)[];
  currentProfileId: number | null;
  createProfile: (slotId: number) => void;
  deleteProfile: (slotId: number) => void;
  selectProfile: (slotId: number) => void;
  addCreatureToProfile: (slotId: number, creature: Creature) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      currentScreen: Screens.START,
      dialogContext: null,
      dialogContextData: null,
      setScreen: (screen, context = undefined, contextData = undefined) =>
        set({
          currentScreen: screen,
          dialogContext: context || null,
          dialogContextData: contextData || null,
        }),
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
          return {
            profiles: newProfiles,
            currentProfileId: slotId,
            currentScreen: Screens.DIALOG,
            dialogContext: DialogContext.GAME_INTRO,
          };
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
          const isNewPlayer = newProfiles[slotId]?.isNew;
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
            currentScreen: isNewPlayer ? Screens.DIALOG : Screens.MAP,
            dialogContext: isNewPlayer ? DialogContext.GAME_INTRO : null,
          };
        }),
      addCreatureToProfile: (slotId: number, creature: Creature) =>
        set((state) => {
          if (slotId < 0 || slotId >= MAX_PROFILES || !state.profiles[slotId])
            return state;
          const newProfiles = [...state.profiles];
          if (newProfiles[slotId]) {
            newProfiles[slotId] = {
              ...newProfiles[slotId]!,
              creatures: [...newProfiles[slotId]!.creatures, creature],
            };
          }
          return { profiles: newProfiles };
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
