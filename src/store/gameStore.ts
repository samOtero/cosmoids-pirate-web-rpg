import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";
import {
  Screens,
  Profile,
  DialogContext,
  DialogContextData,
  Creature,
  BattleConfig,
  StartBattleEventPayload,
  BattleContext,
} from "@/types/baseGame";
import { MAX_PROFILES } from "@/constants/game";
import { GameEvent, ShowDialogEventPayload, PickStarterEventPayload } from "@/types/baseGame";
import { BATTLES } from "@/constants/battles";
import { STARTER_CRAB, STARTER_IGUANA, STARTER_MONKEY } from "@/constants/dialogs";


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
  currentEnemy: Creature | null;
  setCurrentEnemy: (enemy: Creature) => void;
  clearCurrentEnemy: () => void;
  completeIntroduction: () => void;
  // Battle Config
  currentBattle: BattleConfig | null;
  handleBattleWin: () => void;
  handleBattleLose: () => void;
  // Event Queue
  eventQueue: GameEvent[];
  enqueueEvent: (event: GameEvent) => void;
  pushEventToFront: (event: GameEvent) => void;
  processNextEvent: () => void;
  enqueueAndProcessEvents: (events: GameEvent[]) => void;
  clearQueue: () => void;
}

export const useGameStore = create<GameState>()(
  devtools(
    persist(
    (set, get) => ({
      currentScreen: Screens.START,
      dialogContext: null,
      dialogContextData: null,
      setScreen: (screen, context = undefined, contextData = undefined) =>
        set({
          currentScreen: screen,
          dialogContext: context || null,
          dialogContextData: contextData || null,
        }),
      eventQueue: [],
      enqueueEvent: (event) => set((state) => ({ eventQueue: [...state.eventQueue, event] })),
      pushEventToFront: (event) => set((state) => ({ eventQueue: [event, ...state.eventQueue] })),
      enqueueAndProcessEvents: (events) => {
        set((state) => ({ eventQueue: [...state.eventQueue, ...events] }));
        get().processNextEvent();
      },
      processNextEvent: () =>
        set((state) => {
          if (state.eventQueue.length === 0) return state;
          const [nextEvent, ...remainingEvents] = state.eventQueue;
            
          // Handle the event
          let updates: Partial<GameState> = { eventQueue: remainingEvents };
          
          switch (nextEvent.type) {
              case "SHOW_DIALOG": {
                  const payload = nextEvent.payload as ShowDialogEventPayload;
                  updates = { 
                      ...updates, 
                      currentScreen: Screens.DIALOG, 
                      dialogContext: payload.context || null,
                      dialogContextData: payload.contextData || null
                  };
                  break;
              }
              case "START_BATTLE": {
                  const payload = nextEvent.payload as StartBattleEventPayload;
                  updates = { ...updates, currentScreen: Screens.BATTLE };
                  
                  if (payload.context && BATTLES[payload.context]) {
                      const battleConfig = BATTLES[payload.context];
                      updates = {
                          ...updates,
                          currentBattle: battleConfig,
                          currentEnemy: battleConfig.enemy
                      };
                  }
                  break;
              }
              case "GO_TO_MAP": {
                  updates = { ...updates, currentScreen: Screens.MAP };
                  break;
              }
              case "GO_TO_PROFILES": {
                  updates = { ...updates, currentScreen: Screens.PROFILES };
                  break;
              }
              case "PICK_STARTER": {
                  const payload = nextEvent.payload as PickStarterEventPayload;
                  const state = get();
                  if (state.currentProfileId !== null && payload.creatureId) {
                      const creatureMap: Record<string, Creature> = {
                        starter_grass: STARTER_CRAB,
                        starter_fire: STARTER_IGUANA,
                        starter_water: STARTER_MONKEY,
                      };
                      const creature = creatureMap[payload.creatureId];
                      if (creature) {
                          // We can't use `addCreatureToProfile` directly because we are inside `set` via `processNextEvent`.
                          // `addCreatureToProfile` calls `set` itself.
                          // So we must manually update the profile here or queue another action?
                          // Actually `processNextEvent` is returning `updates` to `set`.
                          // So we should update `profiles` in `updates`.
                          
                          const newProfiles = [...state.profiles];
                          const profile = newProfiles[state.currentProfileId];
                          if (profile) {
                              newProfiles[state.currentProfileId] = {
                                  ...profile,
                                  creatures: [...profile.creatures, { ...creature }]
                              };
                              updates = { ...updates, profiles: newProfiles };
                          }
                      }
                  }
                  break;
              }
          }

          return updates;
        }),
      clearQueue: () => set({ eventQueue: [] }),
      currentEnemy: null,
      setCurrentEnemy: (enemy) => set({ currentEnemy: enemy }),
      clearCurrentEnemy: () => set({ currentEnemy: null }),
      currentBattle: null,
      handleBattleWin: () => {
          const state = get();
          if (state.currentBattle) {
              get().enqueueAndProcessEvents(state.currentBattle.winEvents);
          }
           set({ currentBattle: null, currentEnemy: null });
      },
      handleBattleLose: () => {
          const state = get();
          if (state.currentBattle) {
              get().enqueueAndProcessEvents(state.currentBattle.loseEvents);
          }
          set({ currentBattle: null, currentEnemy: null });
      },
      profiles: Array(MAX_PROFILES).fill(null),
      currentProfileId: null,
      createProfile: (slotId: number) => {
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
            eventQueue: [{
                type: "SHOW_DIALOG",
                payload: { context: DialogContext.GAME_INTRO }
            }, {
                type: "SHOW_DIALOG",
                payload: { context: DialogContext.LEVEL_1_THE_MESSAGE, contextData: {dialogStartIndex: 1}}
            }, { type: "START_BATTLE", payload: { context: BattleContext.FIRST_BATTLE } }]
          };
        }); get().processNextEvent();},
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
      selectProfile: (slotId: number) => {
        set((state) => {
          if (slotId < 0 || slotId >= MAX_PROFILES || !state.profiles[slotId])
            return state;
          const newProfiles = [...state.profiles];
          const profile = newProfiles[slotId]!;
          // Update last played time
          newProfiles[slotId] = {
              ...profile,
              lastPlayed: Date.now(),
          };
          
          const isNewPlayer = profile.isNew;
          
          let initialEvents: GameEvent[] = [];

          if (isNewPlayer) {
              if (profile.creatures.length === 0) {
                   initialEvents.push({
                       type: "SHOW_DIALOG",
                       payload: { context: DialogContext.GAME_INTRO, contextData: {dialogStartIndex: 0} }
                   });
              } else {
                   initialEvents.push({
                       type: "SHOW_DIALOG",
                       payload: { context: DialogContext.LEVEL_1_THE_MESSAGE }
                   });
              }
          } else {
              initialEvents.push({
                  type: "GO_TO_MAP"
              });
          }

          return {
            profiles: newProfiles,
            currentProfileId: slotId,
            eventQueue: initialEvents,
          };
        });
        get().processNextEvent();
      },
      completeIntroduction: () => 
        set((state) => {
            if (state.currentProfileId === null) return state;
            const newProfiles = [...state.profiles];
            if (newProfiles[state.currentProfileId]) {
                 newProfiles[state.currentProfileId] = {
                    ...newProfiles[state.currentProfileId]!,
                    isNew: false,
                  };
            }
            return { profiles: newProfiles };
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
  )
);

