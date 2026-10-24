import { AttackId, SpeciesId } from '@/types/definitionIds';
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import {
  Screens,
  Profile,
  DialogContext,
  DialogContextData,
  CosmoidTemplate,
  PlayerCreature,
  AddCreatureToProfileEventPayload,
  GameFlagValue,
  TDLevelConfig,
} from '@/types/baseGame';
import {
  MAX_PROFILES,
  CURRENT_PROFILE_VERSION,
  MAX_PARTY_SIZE,
} from '@/constants/game';
import { ITEMS } from '@/constants/items';
import {
  GameEvent,
  ShowDialogEventPayload,
  ShowLevelSelectDialogEventPayload,
  SetFlagEventPayload,
  RemoveFlagEventPayload,
  SetStoryProgressionEventPayload,
  StoryProgression,
  GameFlag,
  GainItemEventPayload,
  ReorderCreaturesEventPayload,
  GoToTowerDefenseEventPayload,
} from '@/types/baseGame';
import { TD_LEVELS } from '@/constants/tdLevels';
import { NEW_PLAYER_EVENTS } from '@/constants/events';
import {
  STARTER_CRAB,
  STARTER_IGUANA,
  STARTER_MONKEY,
} from '@/constants/creatures';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { createTestProfileFromTemplate } from '@/constants/testProfileTemplates';
import { isTestProfileOverrideEnabled } from '@/utils/testProfileAccess';
import { generateCreatureGender } from '@/utils/creatureGender';
import { createNewProfile } from '@/utils/createProfile';
import {
  createProfileSessionSlice,
  type ProfileSessionSlice,
} from './profileSession';
import {
  GUEST_OWNER_ID,
  recordCreatureOwnership,
  type AcquiredCreature,
} from '@/utils/creatureOwnership';

function mergeCapturedSpeciesIds(
  profile: Profile,
  speciesIds: Iterable<SpeciesId> = []
): SpeciesId[] {
  return Array.from(
    new Set([
      ...(profile.capturedSpeciesIds ?? []),
      ...profile.creatures.map((creature) => creature.speciesId),
      ...profile.storageCreatures.map((creature) => creature.speciesId),
      ...speciesIds,
    ])
  );
}

/**
 * Repairs profiles created by older party-management behavior without losing
 * any creatures. The first six remain active and overflow is appended to the
 * existing storage box in its original order.
 */
export function enforcePartySize(profile: Profile): Profile {
  if (profile.creatures.length <= MAX_PARTY_SIZE) return profile;

  return {
    ...profile,
    creatures: profile.creatures.slice(0, MAX_PARTY_SIZE),
    storageCreatures: [
      ...profile.storageCreatures,
      ...profile.creatures.slice(MAX_PARTY_SIZE),
    ],
  };
}

interface GameState extends ProfileSessionSlice {
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
  createProfile: (slotId: number, ownerId?: string) => void;
  deleteProfile: (slotId: number) => void;
  selectProfile: (slotId: number) => void;
  applyTestProfileTemplate: (templateId: string) => void;
  addCreatureToProfile: (
    slotId: number,
    creature: AcquiredCreature,
    forceStorage?: boolean
  ) => void;
  updateCreatures: (creatures: PlayerCreature[]) => void;
  overwriteProfileCreatures: (creatures: AcquiredCreature[]) => void;
  reorderCreatures: (startIndex: number, endIndex: number) => void;
  updateCreatureAttacks: (
    creatureId: string,
    equippedAttacks: AttackId[],
    activeAttackIndex: number
  ) => void;
  // Progression
  setStoryProgression: (progression: number) => void;
  markJournalUnlockShown: () => void;
  markJournalOpened: () => void;
  setGameFlag: (flag: GameFlagValue) => void;
  removeGameFlag: (flag: GameFlagValue) => void;
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
        ...createProfileSessionSlice(
          (state) => set(state, false, 'profileSession'),
          get
        ),
        currentScreen: Screens.START,
        dialogContext: null,
        dialogContextData: null,
        eventQueue: [],
        profiles: Array(MAX_PROFILES).fill(null),
        currentProfileId: null,
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
                      const creatureMap: Record<
                        GameFlagValue,
                        CosmoidTemplate
                      > = {
                        [GameFlag.STARTER_PALMIT]: STARTER_CRAB,
                        [GameFlag.STARTER_FUEGUANA]: STARTER_IGUANA,
                        [GameFlag.STARTER_MONKEG]: STARTER_MONKEY,
                      };
                      const creature = creatureMap[payload.flag];
                      if (creature) {
                        state.setGameFlag(payload.flag);
                        const starterPlayerCreature: PlayerCreature = {
                          id: crypto.randomUUID(),
                          originalOwnerId: GUEST_OWNER_ID,
                          speciesId: creature.id,
                          gender: generateCreatureGender(creature.id),
                          level: 5, // Starter starts at level 5
                          xp: 0,
                          equippedAttacks: TowerDefenseEngine.getDefaultAttacks(
                            creature.id
                          ),
                          isShiny: false,
                        };
                        state.addCreatureToProfile(
                          currentProfileId,
                          starterPlayerCreature,
                          true
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
                      originalOwnerId: c.originalOwnerId ?? GUEST_OWNER_ID,
                      speciesId: c.speciesId,
                      gender: c.gender,
                      level: c.level,
                      xp: c.xp,
                      equippedAttacks: TowerDefenseEngine.getDefaultAttacks(
                        c.speciesId
                      ),
                      isShiny: c.isShiny ?? false,
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
        setTdLevel: (config: TDLevelConfig | null) =>
          set({ currentTdLevel: config }, false, 'setTdLevel'),
        createProfile: (slotId: number, ownerId = GUEST_OWNER_ID) => {
          if (get().profileAccountId) return;
          set(
            (state) => {
              if (
                state.profileAccountId ||
                slotId < 0 ||
                slotId >= MAX_PROFILES
              )
                return state;
              const newProfiles = [...state.profiles];
              newProfiles[slotId] = createNewProfile(slotId, ownerId);
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
              if (
                state.profileAccountId ||
                slotId < 0 ||
                slotId >= MAX_PROFILES
              )
                return state;
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
        applyTestProfileTemplate: (templateId: string) => {
          if (get().profileAccountId) return;
          const hostname =
            typeof window === 'undefined'
              ? undefined
              : window.location.hostname;
          if (!isTestProfileOverrideEnabled(hostname)) return;

          const profile = createTestProfileFromTemplate(templateId);
          set(
            (state) => {
              const newProfiles = [...state.profiles];
              newProfiles[2] = profile;
              return {
                profiles: newProfiles,
                currentProfileId:
                  state.currentProfileId === 2 ? null : state.currentProfileId,
                eventQueue: [],
                currentTdLevel: null,
              };
            },
            false,
            'applyTestProfileTemplate'
          );
        },
        selectProfile: (slotId: number) => {
          const state = get();
          if (state.profileAccountId && !state.cloudProfiles[slotId]) return;
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
                  ownerId: profile.ownerId || GUEST_OWNER_ID,
                  name: profile.name,
                  lastPlayed: Date.now(),
                  creatures: [],
                  storageCreatures: [],
                  capturedSpeciesIds: [],
                  inventory: [],
                  gameFlags: [],
                  storyProgression: 0,
                  journalUnlockShown: false,
                  journalOpened: false,
                  version: CURRENT_PROFILE_VERSION,
                };
                return {
                  profiles: newProfiles,
                  currentProfileId: slotId,
                  eventQueue: [...NEW_PLAYER_EVENTS],
                };
              }

              const normalizedProfile = enforcePartySize(profile);

              // Update last played time
              newProfiles[slotId] = {
                ...normalizedProfile,
                lastPlayed: Date.now(),
                capturedSpeciesIds: mergeCapturedSpeciesIds(normalizedProfile),
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

        addCreatureToProfile: (
          slotId: number,
          creature: AcquiredCreature,
          forceStorage?: boolean
        ) =>
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
                const profile = enforcePartySize(newProfiles[slotId]!);
                const newCreatureInstance: PlayerCreature = {
                  ...recordCreatureOwnership(
                    creature,
                    profile.ownerId || GUEST_OWNER_ID
                  ),
                  id: creature.id || crypto.randomUUID(),
                };
                // Add to party if it has room and is not forced to storage.
                if (
                  profile.creatures.length < MAX_PARTY_SIZE &&
                  !forceStorage
                ) {
                  newProfiles[slotId] = {
                    ...profile,
                    creatures: [...profile.creatures, newCreatureInstance],
                    capturedSpeciesIds: mergeCapturedSpeciesIds(profile, [
                      creature.speciesId,
                    ]),
                  };
                } else {
                  newProfiles[slotId] = {
                    ...profile,
                    storageCreatures: [
                      ...profile.storageCreatures,
                      newCreatureInstance,
                    ],
                    capturedSpeciesIds: mergeCapturedSpeciesIds(profile, [
                      creature.speciesId,
                    ]),
                  };
                }
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
              const profile = enforcePartySize(state.profiles[profileId]!);
              const newCreatures = [...profile.creatures];
              const updatedSpeciesIds: SpeciesId[] = [];

              let hasUpdates = false;
              creatures.forEach((updatedCreature) => {
                const partyIndex = newCreatures.findIndex(
                  (c) => c.id === updatedCreature.id
                );
                if (partyIndex !== -1) {
                  // Battle snapshots must never rewrite or erase provenance.
                  newCreatures[partyIndex] = {
                    ...updatedCreature,
                    originalOwnerId:
                      newCreatures[partyIndex].originalOwnerId ||
                      profile.ownerId ||
                      GUEST_OWNER_ID,
                  };
                  updatedSpeciesIds.push(updatedCreature.speciesId);
                  hasUpdates = true;
                }
              });

              if (!hasUpdates) return state;

              const newProfiles = [...state.profiles];
              newProfiles[profileId] = {
                ...profile,
                creatures: newCreatures,
                capturedSpeciesIds: mergeCapturedSpeciesIds(
                  profile,
                  updatedSpeciesIds
                ),
              };
              return { profiles: newProfiles };
            },
            false,
            'updateCreatures'
          ),
        overwriteProfileCreatures: (creatures: AcquiredCreature[]) =>
          set(
            (state) => {
              const profileId = state.currentProfileId;
              if (profileId === null || !state.profiles[profileId])
                return state;

              const newProfiles = [...state.profiles];
              const profile = enforcePartySize(newProfiles[profileId]!);
              const newCreatures = creatures.map((c) => ({
                ...recordCreatureOwnership(
                  c,
                  profile.ownerId || GUEST_OWNER_ID
                ),
                id: crypto.randomUUID(),
                isShiny: c.isShiny ?? false,
              }));
              newProfiles[profileId] = {
                ...profile,
                creatures: newCreatures.slice(0, MAX_PARTY_SIZE),
                storageCreatures: [
                  ...profile.storageCreatures,
                  ...newCreatures.slice(MAX_PARTY_SIZE),
                ],
                capturedSpeciesIds: mergeCapturedSpeciesIds(
                  profile,
                  creatures.map((creature) => creature.speciesId)
                ),
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

              const profile = enforcePartySize(state.profiles[profileId]!);
              const newParty = [...profile.creatures];
              const newStorage = [...profile.storageCreatures];

              // Determine which array+local-index the global index maps to
              const resolve = (globalIdx: number) => {
                if (globalIdx < MAX_PARTY_SIZE) {
                  return { arr: 'party' as const, localIdx: globalIdx };
                }
                return {
                  arr: 'storage' as const,
                  localIdx: globalIdx - MAX_PARTY_SIZE,
                };
              };

              const src = resolve(startIndex);
              const dst = resolve(endIndex);

              const srcArr = src.arr === 'party' ? newParty : newStorage;

              // Source must exist
              if (src.localIdx < 0 || src.localIdx >= srcArr.length) {
                return state;
              }

              const dstArr = dst.arr === 'party' ? newParty : newStorage;

              if (
                src.arr !== dst.arr &&
                dst.localIdx >= 0 &&
                dst.localIdx < dstArr.length
              ) {
                // Crossing between party and storage onto an occupied slot is
                // a true exchange; neither list shifts or changes length.
                const destinationCreature = dstArr[dst.localIdx];
                dstArr[dst.localIdx] = srcArr[src.localIdx];
                srcArr[src.localIdx] = destinationCreature;
              } else {
                // Empty cross-list slots and same-list reordering retain the
                // existing remove-and-insert behavior.
                const [removed] = srcArr.splice(src.localIdx, 1);
                const clampedDstIdx = Math.max(
                  0,
                  Math.min(dst.localIdx, dstArr.length)
                );
                dstArr.splice(clampedDstIdx, 0, removed);
              }

              const newProfiles = [...state.profiles];
              newProfiles[profileId] = {
                ...profile,
                creatures: newParty,
                storageCreatures: newStorage,
              };
              return { profiles: newProfiles };
            },
            false,
            'reorderCreatures'
          ),
        updateCreatureAttacks: (
          creatureId: string,
          equippedAttacks: AttackId[],
          activeAttackIndex: number
        ) =>
          set(
            (state) => {
              const profileId = state.currentProfileId;
              if (profileId === null || !state.profiles[profileId])
                return state;
              const profile = state.profiles[profileId]!;

              // Search in party first
              let isParty = true;
              let creatureIdx = profile.creatures.findIndex(
                (c) => c.id === creatureId
              );

              if (creatureIdx === -1) {
                // Search in storage box
                isParty = false;
                creatureIdx = profile.storageCreatures.findIndex(
                  (c) => c.id === creatureId
                );
              }

              if (creatureIdx === -1) return state; // Creature not found

              const newProfiles = [...state.profiles];
              const updatedProfile = { ...profile };

              if (isParty) {
                const newParty = [...profile.creatures];
                newParty[creatureIdx] = {
                  ...newParty[creatureIdx],
                  equippedAttacks,
                  activeAttackIndex,
                };
                updatedProfile.creatures = newParty;
              } else {
                const newStorage = [...profile.storageCreatures];
                newStorage[creatureIdx] = {
                  ...newStorage[creatureIdx],
                  equippedAttacks,
                  activeAttackIndex,
                };
                updatedProfile.storageCreatures = newStorage;
              }

              newProfiles[profileId] = updatedProfile;
              return { profiles: newProfiles };
            },
            false,
            'updateCreatureAttacks'
          ),
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
        markJournalOpened: () =>
          set(
            (state) => {
              const profileId = state.currentProfileId;
              if (profileId === null || !state.profiles[profileId])
                return state;
              const profile = state.profiles[profileId]!;
              if (profile.journalOpened) return state;
              const newProfiles = [...state.profiles];
              newProfiles[profileId] = {
                ...profile,
                journalOpened: true,
              };
              return { profiles: newProfiles };
            },
            false,
            'markJournalOpened'
          ),
        markJournalUnlockShown: () =>
          set(
            (state) => {
              const profileId = state.currentProfileId;
              if (profileId === null || !state.profiles[profileId])
                return state;
              const profile = state.profiles[profileId]!;
              if (profile.journalUnlockShown) return state;
              const newProfiles = [...state.profiles];
              newProfiles[profileId] = {
                ...profile,
                journalUnlockShown: true,
              };
              return { profiles: newProfiles };
            },
            false,
            'markJournalUnlockShown'
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
      }),
      {
        name: 'cosmoids-game-state',
        partialize: (state) => ({
          profiles: state.profileAccountId
            ? state.guestProfiles
            : state.profiles,
        }),
        merge: (persisted, state) => {
          const saved = persisted as
            | { profiles?: (Profile | null)[] }
            | undefined;
          if (!Array.isArray(saved?.profiles)) return state;
          const profiles = Array.from(
            { length: MAX_PROFILES },
            (_, slot) => saved.profiles![slot] ?? null
          );
          return state.profileAccountId
            ? { ...state, guestProfiles: profiles }
            : { ...state, profiles };
        },
        onRehydrateStorage: () => (state) => {
          if (!state) return;
          // Reset any profiles that are below the current version
          const migratedProfiles = (
            state.profileAccountId ? state.guestProfiles : state.profiles
          ).map((profile) => {
            if (!profile) return null;
            if (!profile.version || profile.version < CURRENT_PROFILE_VERSION) {
              console.warn(
                `[Profile] Slot ${profile.id} is version ${profile.version ?? 'unset'}, current is ${CURRENT_PROFILE_VERSION}. Resetting.`
              );
              return {
                id: profile.id,
                ownerId: profile.ownerId || GUEST_OWNER_ID,
                name: profile.name,
                lastPlayed: Date.now(),
                creatures: [],
                storageCreatures: [],
                capturedSpeciesIds: [],
                inventory: [],
                gameFlags: [],
                storyProgression: 0,
                journalUnlockShown: false,
                journalOpened: false,
                version: CURRENT_PROFILE_VERSION,
              };
            }
            const migratedProfile = {
              ...profile,
              // Older current-version saves predate these UI acknowledgement
              // fields. Completed Level 3 profiles have already earned the
              // Journal, so do not replay its first-win card for them.
              journalUnlockShown:
                profile.journalUnlockShown ??
                profile.storyProgression >= StoryProgression.DEFEAT_BUG_STAGE_2,
              journalOpened: profile.journalOpened ?? false,
              capturedSpeciesIds: mergeCapturedSpeciesIds(profile),
            };
            return enforcePartySize(migratedProfile);
          });
          if (state.profileAccountId) state.guestProfiles = migratedProfiles;
          else state.profiles = migratedProfiles;
        },
      }
    )
  )
);

if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    (
      window as typeof window & {
        __GAME_STORE__?: typeof useGameStore;
      }
    ).__GAME_STORE__ = useGameStore;
  }
}
