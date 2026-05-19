import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import {
  Screens,
  Profile,
  DialogContext,
  DialogContextData,
  Creature,
  PlayerCreature,
  BattleConfig,
  StartBattleEventPayload,
  BattleContext,
  AddCreatureToProfileEventPayload,
  GameFlagValue,
  TDLevelConfig,
  TDLevelContext,
} from '@/types/baseGame';
import { MAX_PROFILES, CURRENT_PROFILE_VERSION } from '@/constants/game';
import { ITEMS } from '@/constants/items';
import {
  GameEvent,
  ShowDialogEventPayload,
  ShowBattleDialogEventPayload,
  ShowLevelSelectDialogEventPayload,
  SetFlagEventPayload,
  RemoveFlagEventPayload,
  SetStoryProgressionEventPayload,
  StoryProgression,
  UnlockIslandEventPayload,
  GameFlag,
  GainItemEventPayload,
  ReorderCreaturesEventPayload,
  ExecuteTDActionEventPayload,
  GoToTowerDefenseEventPayload,
} from '@/types/baseGame';
import { BATTLES } from '@/constants/battles';
import { TD_LEVELS } from '@/constants/tdLevels';
import { NEW_PLAYER_EVENTS } from '@/constants/events';
import {
  STARTER_CRAB,
  STARTER_IGUANA,
  STARTER_MONKEY,
} from '@/constants/creatures';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';

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
  addCreatureToProfile: (slotId: number, creature: PlayerCreature) => void;
  updateCreatures: (creatures: PlayerCreature[]) => void;
  overwriteProfileCreatures: (creatures: PlayerCreature[]) => void;
  reorderCreatures: (startIndex: number, endIndex: number) => void;
  useItem: (itemId: string, targetCreatureId?: string) => boolean | void;

  // Progression
  setStoryProgression: (progression: number) => void;
  setGameFlag: (flag: GameFlagValue) => void;
  removeGameFlag: (flag: GameFlagValue) => void;
  unlockIsland: (islandId: number) => void;
  setIslandPosition: (islandId: number, nodeId: number) => void;
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
  // TD Config
  currentTdLevel: TDLevelConfig | null;
  setTdLevel: (config: TDLevelConfig | null) => void;
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
        currentTdLevel: null,
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
                  case 'SHOW_LEVEL_SELECT_DIALOG': {
                    const dialogPayload =
                      currentEvent.payload as ShowLevelSelectDialogEventPayload;
                    state.setScreen(
                      Screens.LEVEL_SELECT,
                      dialogPayload.context || null,
                      dialogPayload.contextData || undefined
                    );
                    break;
                  }
                  case 'GO_TO_LEVEL_SELECT': {
                    state.setScreen(Screens.LEVEL_SELECT);
                    break;
                  }
                  case 'GO_TO_CHALLENGE_SELECT': {
                    state.setScreen(Screens.CHALLENGE_SELECT);
                    break;
                  }
                  case 'GO_TO_MODE_SELECT': {
                    state.setScreen(Screens.MODE_SELECT);
                    break;
                  }
                  case 'GO_TO_PROFILES': {
                    state.setScreen(Screens.PROFILES);
                    break;
                  }
                  case 'GO_TO_PARTY': {
                    state.setScreen(Screens.PARTY);
                    break;
                  }
                  case 'GO_TO_TOWER_DEFENSE': {
                    const payload =
                      currentEvent.payload as GoToTowerDefenseEventPayload;
                    if (payload && payload.context) {
                      const tdConfig = TD_LEVELS[payload.context];
                      if (tdConfig) {
                        state.setTdLevel(tdConfig);
                      }
                    } else {
                      console.error('No TD context provided');
                    }
                    state.setScreen(Screens.TOWER_DEFENSE);
                    break;
                  }
                  case 'EXECUTE_TD_ACTION': {
                    // This is consumed by TowerDefenseScreen actively when it is open.
                    // If the TD screen isn't open, we should probably ignore it or log a warning.
                    if (state.currentScreen !== Screens.TOWER_DEFENSE) {
                      console.warn(
                        'Attempted to execute TD action while not in TD screen.'
                      );
                    } else {
                      // We don't advance the state here. We expect TowerDefenseScreen to process it.
                      shouldContinue = false;
                      // And autoProceed must not skip it here
                      currentEvent = { ...currentEvent, autoProceed: false };
                    }
                    break;
                  }
                  case 'REORDER_CREATURES': {
                    const payload =
                      currentEvent.payload as ReorderCreaturesEventPayload;
                    state.reorderCreatures(
                      payload.startIndex,
                      payload.endIndex
                    );
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
                        const starterPlayerCreature: PlayerCreature = {
                          id: creature.id, // will be replaced with UUID in addCreatureToProfile
                          speciesId: creature.id,
                          level: creature.level,
                          xp: creature.xp,
                          equippedAttacks: TowerDefenseEngine.getDefaultAttacks(
                            creature.id
                          ),
                        };
                        state.addCreatureToProfile(
                          currentProfileId,
                          starterPlayerCreature
                        );
                        state.setStoryProgression(
                          StoryProgression.PICK_STARTER
                        );
                      }
                    }
                    break;
                  }
                  case 'ADD_CREATURE_TO_PROFILE': {
                    const payload =
                      currentEvent.payload as AddCreatureToProfileEventPayload;
                    const c = payload.creature;
                    const playerCreature: PlayerCreature = {
                      id: c.id,
                      speciesId: c.speciesId || c.id,
                      level: c.level,
                      xp: c.xp,
                      equippedAttacks: TowerDefenseEngine.getDefaultAttacks(
                        c.speciesId || c.id
                      ),
                    };
                    state.addCreatureToProfile(
                      payload.profileId,
                      playerCreature
                    );
                    break;
                  }
                  case 'SET_STORY_PROGRESSION': {
                    const payload =
                      currentEvent.payload as SetStoryProgressionEventPayload;
                    state.setStoryProgression(payload.progression);
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
                  case 'GAIN_ITEM': {
                    const payload =
                      currentEvent.payload as GainItemEventPayload;
                    const profileId = state.currentProfileId;
                    if (profileId !== null && state.profiles[profileId]) {
                      const profile = state.profiles[profileId]!;
                      const inventory = [...profile.inventory];
                      const existingItemIndex = inventory.findIndex(
                        (i) => i.id === payload.itemId
                      );

                      if (existingItemIndex >= 0) {
                        inventory[existingItemIndex] = {
                          ...inventory[existingItemIndex],
                          count:
                            inventory[existingItemIndex].count + payload.count,
                        };
                      } else {
                        const itemDef = ITEMS[payload.itemId];
                        if (itemDef) {
                          inventory.push({ ...itemDef, count: payload.count });
                        }
                      }

                      const newProfiles = [...state.profiles];
                      newProfiles[profileId] = {
                        ...profile,
                        inventory,
                      };
                      updates = { ...updates, profiles: newProfiles };
                    }
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
            const extraEvents: GameEvent[] = [];
            // Handle Drops
            if (state.currentBattle.drops) {
              state.currentBattle.drops.forEach((drop) => {
                if (Math.random() <= drop.chance) {
                  const count =
                    Math.floor(Math.random() * (drop.max - drop.min + 1)) +
                    drop.min;
                  extraEvents.push({
                    type: 'SHOW_DIALOG',
                    payload: {
                      context: DialogContext.FOUND_ITEM,
                    },
                  });
                  extraEvents.push({
                    type: 'GAIN_ITEM',
                    payload: {
                      itemId: drop.itemId,
                      count,
                    },
                    autoProceed: true,
                  });
                }
              });
            }

            state.enqueueAndProcessEvents([
              ...extraEvents,
              ...state.currentBattle.winEvents,
            ]);
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
        setTdLevel: (config: TDLevelConfig | null) =>
          set({ currentTdLevel: config }, false, 'setTdLevel'),
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
                gameFlags: [],
                islandPositions: { 0: 0 },
                storyProgression: 0,
                version: CURRENT_PROFILE_VERSION,
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

              // Version migration: if the profile is outdated, wipe and reset it
              if (
                !profile.version ||
                profile.version < CURRENT_PROFILE_VERSION
              ) {
                console.warn(
                  `[Profile] Slot ${slotId} is version ${profile.version ?? 'unset'}, current is ${CURRENT_PROFILE_VERSION}. Resetting.`
                );
                newProfiles[slotId] = {
                  id: slotId,
                  name: profile.name,
                  lastPlayed: Date.now(),
                  creatures: [],
                  inventory: [],
                  unlockedIslands: 0,
                  currentIslandId: 0,
                  gameFlags: [],
                  islandPositions: { 0: 0 },
                  storyProgression: 0,
                  version: CURRENT_PROFILE_VERSION,
                };
                return {
                  profiles: newProfiles,
                  currentProfileId: slotId,
                  eventQueue: [...NEW_PLAYER_EVENTS],
                };
              }

              // Update last played time
              newProfiles[slotId] = {
                ...profile,
                lastPlayed: Date.now(),
              };

              let initialEvents: GameEvent[] = [];

              if (profile.storyProgression === StoryProgression.NEW_GAME) {
                initialEvents = [...NEW_PLAYER_EVENTS];
              } else {
                initialEvents = [{ type: 'GO_TO_MODE_SELECT' }];
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

        addCreatureToProfile: (slotId: number, creature: PlayerCreature) =>
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
                const newCreatureInstance: PlayerCreature = {
                  ...creature,
                  id: crypto.randomUUID(),
                };
                newProfiles[slotId] = {
                  ...newProfiles[slotId]!,
                  creatures: [
                    ...newProfiles[slotId]!.creatures,
                    newCreatureInstance,
                  ],
                };
              }
              return { profiles: newProfiles };
            },
            false,
            'addCreatureToProfile'
          ),
        updateCreatures: (creatures: PlayerCreature[]) =>
          set(
            (state) => {
              const profileId = state.currentProfileId;
              if (profileId === null || !state.profiles[profileId])
                return state;
              const profile = state.profiles[profileId]!;
              const newCreatures = [...profile.creatures];

              let hasUpdates = false;
              creatures.forEach((updatedCreature) => {
                const index = newCreatures.findIndex(
                  (c) => c.id === updatedCreature.id
                );
                if (index !== -1) {
                  newCreatures[index] = updatedCreature;
                  hasUpdates = true;
                }
              });

              if (!hasUpdates) return state;

              const newProfiles = [...state.profiles];
              newProfiles[profileId] = {
                ...profile,
                creatures: newCreatures,
              };
              return { profiles: newProfiles };
            },
            false,
            'updateCreatures'
          ),
        overwriteProfileCreatures: (creatures: PlayerCreature[]) =>
          set(
            (state) => {
              const profileId = state.currentProfileId;
              if (profileId === null || !state.profiles[profileId])
                return state;

              const newProfiles = [...state.profiles];
              newProfiles[profileId] = {
                ...newProfiles[profileId]!,
                creatures: creatures.map((c) => ({
                  ...c,
                  id: crypto.randomUUID(),
                })),
              };
              return { profiles: newProfiles };
            },
            false,
            'overwriteProfileCreatures'
          ),
        reorderCreatures: (startIndex: number, endIndex: number) =>
          set(
            (state) => {
              const profileId = state.currentProfileId;
              if (profileId === null || !state.profiles[profileId])
                return state;

              const profile = state.profiles[profileId]!;
              const newCreatures = [...profile.creatures];

              if (startIndex < 0 || startIndex >= newCreatures.length) {
                return state;
              }

              // Clamp endIndex to be within bounds [0, length - 1] so dragging to empty slots places it at the end
              const clampedEndIndex = Math.max(
                0,
                Math.min(endIndex, newCreatures.length - 1)
              );

              const [removed] = newCreatures.splice(startIndex, 1);
              newCreatures.splice(clampedEndIndex, 0, removed);

              const newProfiles = [...state.profiles];
              newProfiles[profileId] = {
                ...profile,
                creatures: newCreatures,
              };
              return { profiles: newProfiles };
            },
            false,
            'reorderCreatures'
          ),
        useItem: (itemId: string, targetCreatureId?: string) => {
          let catchSuccess = false;
          set(
            (state) => {
              const profileId = state.currentProfileId;
              if (profileId === null || !state.profiles[profileId])
                return state;
              const profile = state.profiles[profileId]!;
              const inventory = [...profile.inventory];
              const itemIndex = inventory.findIndex((i) => i.id === itemId);
              if (itemIndex === -1) {
                return state;
              }
              const item = inventory[itemIndex];

              if (item.count <= 0) return state;

              // Apply Effect
              let newCreatures = [...profile.creatures];

              if (item.effect === 'HEAL' && targetCreatureId) {
                // Note: PlayerCreature does not store currentHp — HEAL items are for the turn-based battle system
                // which uses a different Creature type. Skip silently if no hp fields.
                return state;
              } else if (item.effect === 'CATCH') {
                const enemy = state.currentEnemy;
                if (!enemy) return state; // Only works in battle with enemy

                catchSuccess = Math.random() <= item.value;

                if (catchSuccess) {
                  // Convert caught Creature to PlayerCreature
                  const caught: PlayerCreature = {
                    id: enemy.id,
                    speciesId: enemy.speciesId || enemy.id,
                    level: enemy.level,
                    xp: enemy.xp,
                    equippedAttacks: enemy.moves || [],
                  };
                  newCreatures = [...newCreatures, caught];
                }
              }

              // Decrement count
              const newItem = { ...item, count: item.count - 1 };
              if (newItem.count <= 0) {
                inventory.splice(itemIndex, 1);
              } else {
                inventory[itemIndex] = newItem;
              }

              const newProfiles = [...state.profiles];
              newProfiles[profileId] = {
                ...profile,
                creatures: newCreatures,
                inventory,
              };

              return { profiles: newProfiles };
            },
            false,
            'useItem'
          );
          return catchSuccess;
        },
        setStoryProgression: (progression: number) =>
          set(
            (state) => {
              const profileId = state.currentProfileId;
              if (profileId === null || !state.profiles[profileId])
                return state;
              const profile = state.profiles[profileId]!;
              if (profile.storyProgression >= progression) return state; // Only advance
              const newProfiles = [...state.profiles];
              newProfiles[profileId] = {
                ...profile,
                storyProgression: progression,
              };
              return { profiles: newProfiles };
            },
            false,
            'setStoryProgression'
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
        setIslandPosition: (islandId: number, nodeId: number) =>
          set(
            (state) => {
              const profileId = state.currentProfileId;
              if (profileId === null || !state.profiles[profileId])
                return state;
              const profile = state.profiles[profileId]!;
              const newProfiles = [...state.profiles];
              newProfiles[profileId] = {
                ...profile,
                islandPositions: {
                  ...profile.islandPositions,
                  [islandId]: nodeId,
                },
              };
              return { profiles: newProfiles };
            },
            false,
            'setIslandPosition'
          ),
      }),
      {
        name: 'cosmoids-game-state',
        partialize: (state) => ({
          profiles: state.profiles,
        }),
        onRehydrateStorage: () => (state) => {
          if (!state) return;
          // Reset any profiles that are below the current version
          const migratedProfiles = state.profiles.map((profile) => {
            if (!profile) return null;
            if (!profile.version || profile.version < CURRENT_PROFILE_VERSION) {
              console.warn(
                `[Profile] Slot ${profile.id} is version ${profile.version ?? 'unset'}, current is ${CURRENT_PROFILE_VERSION}. Resetting.`
              );
              return {
                id: profile.id,
                name: profile.name,
                lastPlayed: Date.now(),
                creatures: [],
                inventory: [],
                unlockedIslands: 0,
                currentIslandId: 0,
                gameFlags: [],
                islandPositions: { 0: 0 },
                storyProgression: 0,
                version: CURRENT_PROFILE_VERSION,
              };
            }
            return profile;
          });
          state.profiles = migratedProfiles;
        },
      }
    )
  )
);

if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    (window as any).__GAME_STORE__ = useGameStore;
  }
}
