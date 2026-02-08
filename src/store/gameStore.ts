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
} from '@/types/baseGame';
import { MAX_PROFILES } from '@/constants/game';
import {
  GameEvent,
  ShowDialogEventPayload,
  ShowBattleDialogEventPayload,
  PickStarterEventPayload,
} from '@/types/baseGame';
import { BATTLES } from '@/constants/battles';
import {
  STARTER_CRAB,
  STARTER_IGUANA,
  STARTER_MONKEY,
} from '@/constants/dialogs';

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
  setStarterCreature: (slotId: number, creatureId: string) => void;
  completeIntroduction: () => void;
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
                    const payload =
                      currentEvent.payload as PickStarterEventPayload;
                    const currentProfileId =
                      updates.currentProfileId ?? state.currentProfileId; // Use ?? because id can be 0 or null

                    if (currentProfileId !== null && payload.creatureId) {
                      const creatureMap: Record<string, Creature> = {
                        starter_grass: STARTER_CRAB,
                        starter_fire: STARTER_IGUANA,
                        starter_water: STARTER_MONKEY,
                      };
                      const creature = creatureMap[payload.creatureId];
                      if (creature) {
                        state.setStarterCreature(currentProfileId, creature.id);
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
                isNew: true,
                creatures: [],
                inventory: [],
                unlockedIslands: 0,
                currentIslandId: 0,
                islandNodeProgress: { 0: 0 },
                starterCreatureId: null,
              };
              return {
                profiles: newProfiles,
                currentProfileId: slotId,
                eventQueue: [
                  {
                    type: 'SHOW_DIALOG',
                    payload: {
                      context: DialogContext.NEW_PLAYER_WELCOME_DIALOG,
                    },
                  },
                  {
                    type: 'SHOW_DIALOG',
                    payload: {
                      context: DialogContext.LEVEL_1_INTRO,
                      contextData: { dialogStartIndex: 1 },
                    },
                  },
                  {
                    type: 'START_BATTLE',
                    payload: { context: BattleContext.FIRST_BATTLE },
                  },
                ],
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

              const isNewPlayer = profile.isNew;

              let initialEvents: GameEvent[] = [];

              if (isNewPlayer) {
                if (profile.creatures.length === 0) {
                  initialEvents.push({
                    type: 'SHOW_DIALOG',
                    payload: {
                      context: DialogContext.NEW_PLAYER_WELCOME_DIALOG,
                      contextData: { dialogStartIndex: 0 },
                    },
                  });
                } else {
                  initialEvents.push({
                    type: 'SHOW_DIALOG',
                    payload: { context: DialogContext.LEVEL_1_INTRO },
                  });
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
        completeIntroduction: () =>
          set(
            (state) => {
              if (state.currentProfileId === null) return state;
              const newProfiles = [...state.profiles];
              if (newProfiles[state.currentProfileId]) {
                newProfiles[state.currentProfileId] = {
                  ...newProfiles[state.currentProfileId]!,
                  isNew: false,
                };
              }
              return { profiles: newProfiles };
            },
            false,
            'completeIntroduction'
          ),
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
        setStarterCreature: (slotId: number, creatureId: string) =>
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
                  starterCreatureId: creatureId,
                };
              }
              return { profiles: newProfiles };
            },
            false,
            'setStarterCreature'
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
