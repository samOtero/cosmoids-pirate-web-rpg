import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import {
  Screens,
  Profile,
  DialogContext,
  DialogContextData,
  Creature,
  BattleConfig,
  StartBattleEventPayload,
  BattleContext,
  AddCreatureToProfileEventPayload,
  GameFlagValue,
} from '@/types/baseGame';
import { MAX_PROFILES } from '@/constants/game';
import {
  GameEvent,
  ShowDialogEventPayload,
  ShowBattleDialogEventPayload,
  ShowIslandMapDialogEventPayload,
  SetFlagEventPayload,
  RemoveFlagEventPayload,
  UnlockIslandEventPayload,
  AdvanceNodeEventPayload,
  GameFlag,
} from '@/types/baseGame';
import { BATTLES } from '@/constants/battles';
import {
  NEW_PLAYER_EVENTS,
  FIRST_BATTLE_AFTER_GETTING_STARTER,
} from '@/constants/events';
import {
  STARTER_CRAB,
  STARTER_IGUANA,
  STARTER_MONKEY,
} from '@/constants/creatures';

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

  // Progression
  setGameFlag: (flag: GameFlagValue) => void;
  removeGameFlag: (flag: GameFlagValue) => void;
  unlockIsland: (islandId: number) => void;
  advanceNode: (islandId: number, nodeIndex: number) => void;
  // Battle Config
  currentBattle: BattleConfig | null;
  handleBattleWin: () => void;
  handleBattleLose: () => void;
  currentEnemy: Creature | null;
  setBattleConfig: (
    battleConfig: BattleConfig | null,
    enemy: Creature | null
  ) => void;
  setCurrentEnemy: (enemy: Creature) => void;
  clearCurrentEnemy: () => void;
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
        eventQueue: [],
        profiles: Array(MAX_PROFILES).fill(null),
        currentProfileId: null,
        currentEnemy: null,
        currentBattle: null,
        setScreen: (screen, context = undefined, contextData = undefined) =>
          set(
            {
              currentScreen: screen,
              dialogContext: context || null,
              dialogContextData: contextData || null,
            },
            false,
            'setScreen'
          ),
        enqueueEvent: (event) =>
          set(
            (state) => ({ eventQueue: [...state.eventQueue, event] }),
            false,
            'enqueueEvent'
          ),
        pushEventToFront: (event) =>
          set(
            (state) => ({ eventQueue: [event, ...state.eventQueue] }),
            false,
            'pushEventToFront'
          ),
        enqueueAndProcessEvents: (events) => {
          set(
            (state) => ({ eventQueue: [...state.eventQueue, ...events] }),
            false,
            'enqueueAndProcessEvents'
          );
          get().processNextEvent();
        },
        processNextEvent: () =>
          set(
            (state) => {
              if (state.eventQueue.length === 0) return state;
              const [nextEvent, ...remainingEvents] = state.eventQueue;

              // Handle the event
              let updates: Partial<GameState> = { eventQueue: remainingEvents };

              // Loop to process events as long as autoProceed is true and there are events
              let currentEvent = nextEvent;
              let currentQueue = remainingEvents;
              let shouldContinue = true;

              while (shouldContinue) {
                switch (currentEvent.type) {
                  case 'SHOW_DIALOG': {
                    const dialogPayload =
                      currentEvent.payload as ShowDialogEventPayload;
                    state.setScreen(
                      Screens.DIALOG,
                      dialogPayload.context || null,
                      dialogPayload.contextData || undefined
                    );
                    break;
                  }
                  case 'SHOW_BATTLE_DIALOG': {
                    const dialogPayload =
                      currentEvent.payload as ShowBattleDialogEventPayload;
                    state.setScreen(
                      Screens.BATTLE,
                      dialogPayload.context || null,
                      dialogPayload.contextData || undefined
                    );
                    break;
                  }
                  case 'SHOW_ISLAND_MAP_DIALOG': {
                    const dialogPayload =
                      currentEvent.payload as ShowIslandMapDialogEventPayload;
                    state.setScreen(
                      Screens.ISLAND_MAP,
                      dialogPayload.context || null,
                      dialogPayload.contextData || undefined
                    );
                    break;
                  }
                  case 'START_BATTLE': {
                    const payload =
                      currentEvent.payload as StartBattleEventPayload;
                    if (payload.context && BATTLES[payload.context]) {
                      const battleConfig = BATTLES[payload.context];
                      state.setBattleConfig(battleConfig, battleConfig.enemy);
                      state.setScreen(Screens.BATTLE);
                    }
                    break;
                  }
                  case 'GO_TO_MAP': {
                    state.setScreen(Screens.MAP);
                    break;
                  }
                  case 'GO_TO_ISLAND_MAP': {
                    state.setScreen(Screens.ISLAND_MAP);
                    break;
                  }
                  case 'GO_TO_PROFILES': {
                    state.setScreen(Screens.PROFILES);
                    break;
                  }
                  case 'PICK_STARTER': {
                    const payload = currentEvent.payload as SetFlagEventPayload;
                    const currentProfileId =
                      updates.currentProfileId ?? state.currentProfileId; // Use ?? because id can be 0 or null

                    if (currentProfileId !== null && payload.flag) {
                      const creatureMap: Record<string, Creature> = {
                        [GameFlag.STARTER_PALMIT]: STARTER_CRAB,
                        [GameFlag.STARTER_FUEGUANA]: STARTER_IGUANA,
                        [GameFlag.STARTER_MONKEG]: STARTER_MONKEY,
                      };
                      const creature = creatureMap[payload.flag];
                      if (creature) {
                        state.setGameFlag(payload.flag);
                        state.addCreatureToProfile(currentProfileId, creature);
                      }
                    }
                    break;
                  }
                  case 'ADD_CREATURE_TO_PROFILE': {
                    const payload =
                      currentEvent.payload as AddCreatureToProfileEventPayload;
                    state.addCreatureToProfile(
                      payload.profileId,
                      payload.creature
                    );
                    break;
                  }
                  case 'SET_FLAG': {
                    const payload = currentEvent.payload as SetFlagEventPayload;
                    state.setGameFlag(payload.flag);
                    break;
                  }
                  case 'REMOVE_FLAG': {
                    const payload =
                      currentEvent.payload as RemoveFlagEventPayload;
                    state.removeGameFlag(payload.flag);
                    break;
                  }
                  case 'UNLOCK_ISLAND': {
                    const payload =
                      currentEvent.payload as UnlockIslandEventPayload;
                    state.unlockIsland(payload.islandId);
                    break;
                  }
                  case 'ADVANCE_NODE': {
                    const payload =
                      currentEvent.payload as AdvanceNodeEventPayload;
                    state.advanceNode(payload.islandId, payload.nodeIndex);
                    break;
                  }
                }

                if (currentEvent.autoProceed && currentQueue.length > 0) {
                  // Prepare for next iteration
                  const [next, ...rest] = currentQueue;
                  currentEvent = next;
                  currentQueue = rest;
                  shouldContinue = true;
                } else {
                  shouldContinue = false;
                }
              }

              updates = { ...updates, eventQueue: currentQueue };
              return updates;
            },
            false,
            'processNextEvent'
          ),
        clearQueue: () => set({ eventQueue: [] }, false, 'clearQueue'),
        setCurrentEnemy: (enemy) =>
          set({ currentEnemy: enemy }, false, 'setCurrentEnemy'),
        clearCurrentEnemy: () =>
          set({ currentEnemy: null }, false, 'clearCurrentEnemy'),
        handleBattleWin: () => {
          const state = get();
          if (state.currentBattle) {
            state.enqueueAndProcessEvents(state.currentBattle.winEvents);
          }
          set(
            { currentBattle: null, currentEnemy: null },
            false,
            'handleBattleWin'
          );
        },
        handleBattleLose: () => {
          const state = get();
          if (state.currentBattle) {
            state.enqueueAndProcessEvents(state.currentBattle.loseEvents);
          }
          set(
            { currentBattle: null, currentEnemy: null },
            false,
            'handleBattleLose'
          );
        },
        setBattleConfig(battleConfig, enemy) {
          set(
            { currentBattle: battleConfig, currentEnemy: enemy },
            false,
            'setBattleConfig'
          );
        },
        createProfile: (slotId: number) => {
          set(
            (state) => {
              if (slotId < 0 || slotId >= MAX_PROFILES) return state;
              const newProfiles = [...state.profiles];
              newProfiles[slotId] = {
                id: slotId,
                name: `Caleb`,
                lastPlayed: Date.now(),
                creatures: [],
                inventory: [],
                unlockedIslands: 0,
                currentIslandId: 0,
                islandNodeProgress: { 0: 0 },
                gameFlags: [],
              };
              return {
                profiles: newProfiles,
                currentProfileId: slotId,
                eventQueue: [...NEW_PLAYER_EVENTS],
              };
            },
            false,
            'createProfile'
          );
          get().processNextEvent();
        },
        deleteProfile: (slotId: number) =>
          set(
            (state) => {
              if (slotId < 0 || slotId >= MAX_PROFILES) return state;
              const newProfiles = [...state.profiles];
              newProfiles[slotId] = null;
              return {
                profiles: newProfiles,
                currentProfileId:
                  state.currentProfileId === slotId
                    ? null
                    : state.currentProfileId,
              };
            },
            false,
            'deleteProfile'
          ),
        selectProfile: (slotId: number) => {
          set(
            (state) => {
              if (
                slotId < 0 ||
                slotId >= MAX_PROFILES ||
                !state.profiles[slotId]
              )
                return state;
              const newProfiles = [...state.profiles];
              const profile = newProfiles[slotId]!;
              // Update last played time
              newProfiles[slotId] = {
                ...profile,
                lastPlayed: Date.now(),
              };

              const isNewPlayer =
                ((profile.islandNodeProgress &&
                  profile.islandNodeProgress[0]) ??
                  0) === 0;

              let initialEvents: GameEvent[] = [];

              if (isNewPlayer) {
                if (profile.creatures.length === 0) {
                  initialEvents = [...NEW_PLAYER_EVENTS];
                } else {
                  initialEvents = [...FIRST_BATTLE_AFTER_GETTING_STARTER];
                }
              } else {
                initialEvents.push({
                  type: 'GO_TO_MAP',
                });
              }

              return {
                profiles: newProfiles,
                currentProfileId: slotId,
                eventQueue: initialEvents,
              };
            },
            false,
            'selectProfile'
          );
          get().processNextEvent();
        },

        addCreatureToProfile: (slotId: number, creature: Creature) =>
          set(
            (state) => {
              if (
                slotId < 0 ||
                slotId >= MAX_PROFILES ||
                !state.profiles[slotId]
              )
                return state;
              const newProfiles = [...state.profiles];
              if (newProfiles[slotId]) {
                newProfiles[slotId] = {
                  ...newProfiles[slotId]!,
                  creatures: [...newProfiles[slotId]!.creatures, creature],
                };
              }
              return { profiles: newProfiles };
            },
            false,
            'addCreatureToProfile'
          ),
        setGameFlag: (flag: GameFlagValue) =>
          set(
            (state) => {
              const profileId = state.currentProfileId;
              if (profileId === null || !state.profiles[profileId])
                return state;
              const profile = state.profiles[profileId]!;
              const flags = profile.gameFlags ?? [];
              if (flags.includes(flag)) return state;
              const newProfiles = [...state.profiles];
              newProfiles[profileId] = {
                ...profile,
                gameFlags: [...flags, flag],
              };
              return { profiles: newProfiles };
            },
            false,
            'setGameFlag'
          ),
        removeGameFlag: (flag: GameFlagValue) =>
          set(
            (state) => {
              const profileId = state.currentProfileId;
              if (profileId === null || !state.profiles[profileId])
                return state;
              const profile = state.profiles[profileId]!;
              const flags = profile.gameFlags ?? [];
              if (!flags.includes(flag)) return state;
              const newProfiles = [...state.profiles];
              newProfiles[profileId] = {
                ...profile,
                gameFlags: flags.filter((f) => f !== flag),
              };
              return { profiles: newProfiles };
            },
            false,
            'removeGameFlag'
          ),
        unlockIsland: (islandId: number) =>
          set(
            (state) => {
              const profileId = state.currentProfileId;
              if (profileId === null || !state.profiles[profileId])
                return state;
              const profile = state.profiles[profileId]!;
              if (islandId <= profile.unlockedIslands) return state;
              const newProfiles = [...state.profiles];
              newProfiles[profileId] = {
                ...profile,
                unlockedIslands: islandId,
              };
              return { profiles: newProfiles };
            },
            false,
            'unlockIsland'
          ),
        advanceNode: (islandId: number, nodeIndex: number) =>
          set(
            (state) => {
              const profileId = state.currentProfileId;
              if (profileId === null || !state.profiles[profileId])
                return state;
              const profile = state.profiles[profileId]!;
              const currentProgress = profile.islandNodeProgress[islandId] ?? 0;
              if (nodeIndex <= currentProgress) return state;
              const newProfiles = [...state.profiles];
              newProfiles[profileId] = {
                ...profile,
                islandNodeProgress: {
                  ...profile.islandNodeProgress,
                  [islandId]: nodeIndex,
                },
              };
              return { profiles: newProfiles };
            },
            false,
            'advanceNode'
          ),
      }),
      {
        name: 'cosmoids-game-state',
        partialize: (state) => ({
          profiles: state.profiles,
        }),
      }
    )
  )
);

if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    (window as any).__GAME_STORE__ = useGameStore;
  }
}
