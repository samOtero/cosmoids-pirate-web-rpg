'use client';
import { lazy, Suspense, useEffect } from 'react';

import { useGameStore } from '@/store/gameStore';
import {
  Screens,
  DialogAction,
  DialogContext,
  BattleContext,
  BackgroundImageKey,
  Creature,
} from '@/types/baseGame';
import {
  resolvePlayerCreature,
  resolvePlayerCreatures,
} from '@/utils/resolvePlayerCreature';
import { resolveDialog } from '@/utils/dialogResolver';
import { ISLANDS } from '@/constants/game';

const StartScreen = lazy(() => import('@/app/components/startScreen'));
const ProfileScreen = lazy(() => import('@/app/components/profileScreen'));
const DialogScreen = lazy(() => import('@/app/components/dialogScreen'));
const MapScreen = lazy(() => import('@/app/components/mapScreen'));
const BattleScreen = lazy(() => import('@/app/components/battleScreen'));
const IslandMapScreen = lazy(() => import('@/app/components/IslandMapScreen'));
const PartyScreen = lazy(() => import('@/app/components/PartyScreen'));

export default function Home() {
  const {
    currentScreen,
    setScreen,
    profiles,
    currentProfileId,
    createProfile,
    deleteProfile,
    selectProfile,
    dialogContext,
    dialogContextData,
    currentBattle,
    currentEnemy,
    clearCurrentEnemy,
    eventQueue,
    processNextEvent,
    enqueueEvent,
    enqueueAndProcessEvents,
    pushEventToFront,
    handleBattleWin,
    handleBattleLose,
    useItem,
    updateCreatures,
    reorderCreatures,
  } = useGameStore();

  // Also handle "WAIT" events or similar if implemented in the store processor,
  // but for now the store updates state immediately for screen changes.

  // Deduced state
  const currentProfile =
    currentProfileId !== null ? profiles[currentProfileId] : null;

  useEffect(() => {
    // Handle redirects based on state validity
    if (currentScreen === Screens.BATTLE) {
      if (!currentProfile || !currentEnemy) {
        setScreen(Screens.MAP);
      } else if (!currentProfile.creatures[0]) {
        setScreen(Screens.MAP);
      }
    } else if (currentScreen === Screens.MAP) {
      if (!currentProfile) {
        setScreen(Screens.PROFILES);
      }
    }
  }, [currentScreen, currentProfile, currentEnemy, setScreen, profiles]);

  if (currentScreen === Screens.BATTLE) {
    if (!currentProfile || !currentEnemy) {
      return null;
    }

    // Default to first creature if valid
    const playerCreature = resolvePlayerCreature(currentProfile.creatures[0]);
    if (!playerCreature) {
      return null;
    }

    return (
      <Suspense fallback={<div>Loading Battle...</div>}>
        <BattleScreen
          playerCreature={playerCreature}
          party={resolvePlayerCreatures(currentProfile.creatures)}
          enemyCreature={currentEnemy}
          inventory={currentProfile.inventory}
          onUseItem={useItem}
          onBattleEnd={(won, modifiedCreatures) => {
            // Battle system returns full Creature[] — we can ignore updates since
            // PlayerCreature doesn't track HP. Stats persist at the species level.

            // For now just go back to map or dialog depending on context?
            // Maybe we need a result screen or dialog

            if (eventQueue.length > 0) {
              processNextEvent();
              clearCurrentEnemy();
              return;
            }

            if (won) {
              handleBattleWin();
            } else {
              handleBattleLose();
            }
          }}
          backgroundImageKey={
            currentBattle?.backgroundImageKey || BackgroundImageKey.DEFAULT
          }
          dialogContext={dialogContext}
          dialogContextData={dialogContextData}
          onDialogContinue={() => {
            const { nextEvents } = resolveDialog(
              dialogContext,
              dialogContextData
            );

            if (nextEvents && nextEvents.length > 0) {
              enqueueAndProcessEvents(nextEvents);
              return;
            }

            if (eventQueue.length > 0) {
              processNextEvent();
            } else {
              // Close dialog
              setScreen(Screens.BATTLE);
            }
          }}
          onDialogAction={(action) => {
            if (action.type === 'PROCESS_EVENT' && action.payload?.event) {
              pushEventToFront(action.payload.event);
              processNextEvent();
            }
          }}
          onTriggerTurnEvent={(turn, phase) => {
            const events = currentBattle?.turnEvents?.[turn]?.[phase];
            if (events && events.length > 0) {
              enqueueAndProcessEvents(events);
              return true;
            }
            return false;
          }}
        />
      </Suspense>
    );
  }

  if (currentScreen === Screens.START) {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <StartScreen
          onStart={() => enqueueAndProcessEvents([{ type: 'GO_TO_PROFILES' }])}
        />
      </Suspense>
    );
  }

  if (currentScreen === Screens.PROFILES) {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <ProfileScreen
          profiles={profiles}
          onSelect={selectProfile}
          onCreate={createProfile}
          onDelete={deleteProfile}
        />
      </Suspense>
    );
  }

  if (currentScreen === Screens.PARTY) {
    if (!currentProfile) {
      return null;
    }

    return (
      <Suspense fallback={<div>Loading Team...</div>}>
        <PartyScreen
          creatures={resolvePlayerCreatures(currentProfile.creatures)}
          onBack={() => setScreen(Screens.MAP)}
          onReorder={reorderCreatures}
        />
      </Suspense>
    );
  }

  if (currentScreen === Screens.DIALOG) {
    const { sequence, backgroundImageKey, next, nextEvents } = resolveDialog(
      dialogContext,
      dialogContextData
    );

    const { dialogStartIndex = 0 } = dialogContextData || {};

    const handleDialogAction = (action: DialogAction) => {
      switch (action.type) {
        case 'PROCESS_EVENT':
          if (action.payload?.event) {
            pushEventToFront(action.payload.event);
            processNextEvent();
          }
          break;
        default:
          console.warn('Unknown action type:', action.type);
      }
    };

    const handleContinue = () => {
      if (eventQueue.length > 0) {
        processNextEvent();
        return;
      }

      // Check for nextEvents from the DialogConfig
      if (nextEvents && nextEvents.length > 0) {
        // Add them to the queue
        nextEvents.forEach((e) => enqueueEvent(e));
        // Process the first one immediately?
        // Or just wait for the next render?
        // We should probably process immediately to avoid a dead frame.
        processNextEvent();
        return;
      }

      if (next) {
        setScreen(next.screen, next.context, next.contextData);
      } else {
        setScreen(Screens.MAP);
      }
    };

    return (
      <Suspense fallback={<div>Loading...</div>}>
        <DialogScreen
          sequence={sequence}
          backgroundImageKey={backgroundImageKey}
          onContinue={handleContinue}
          onDialogAction={handleDialogAction}
          initialLineIndex={dialogStartIndex}
        />
      </Suspense>
    );
  }

  if (currentScreen === Screens.MAP) {
    if (!currentProfile) {
      return null;
    }

    return (
      <Suspense fallback={<div>Loading...</div>}>
        <MapScreen
          profile={currentProfile}
          onTravel={(islandId: number) => {
            // For now, traveling just starts the level 1 intro sequence
            // In a real game, this would update currentIslandId
            enqueueAndProcessEvents([
              {
                type: 'SHOW_DIALOG',
                payload: { context: DialogContext.LEVEL_1_INTRO },
              },
              {
                type: 'START_BATTLE',
                payload: { context: BattleContext.FIRST_BATTLE },
              },
            ]);
          }}
          onEnterIsland={(islandId: number) => {
            enqueueAndProcessEvents([
              {
                type: 'GO_TO_ISLAND_MAP',
                payload: { islandId },
              },
            ]);
          }}
          onOpenMenu={() => {}}
          onUseItem={useItem}
        />
      </Suspense>
    );
  }

  if (currentScreen === Screens.ISLAND_MAP) {
    if (!currentProfile) return null;
    const island = ISLANDS.find((i) => i.id === currentProfile.currentIslandId);

    // Fallback if island not found or logic error
    if (!island) {
      setScreen(Screens.MAP);
      return null;
    }

    return (
      <Suspense fallback={<div>Loading Island...</div>}>
        <IslandMapScreen
          profile={currentProfile}
          island={island}
          onNodeClick={(nodeId) => {
            const node = island.nodes?.find((n) => n.id === nodeId);
            if (node && node.events) {
              enqueueAndProcessEvents(node.events);
            }
          }}
          onBack={() => setScreen(Screens.MAP)}
          onOpenMenu={() => {}}
          dialogContext={dialogContext}
          dialogContextData={dialogContextData}
          onDialogContinue={() => {
            const { nextEvents } = resolveDialog(
              dialogContext,
              dialogContextData
            );

            if (nextEvents && nextEvents.length > 0) {
              enqueueAndProcessEvents(nextEvents);
              return;
            }

            if (eventQueue.length > 0) {
              processNextEvent();
            } else {
              // Close dialog
              setScreen(Screens.ISLAND_MAP);
            }
          }}
          onDialogAction={(action) => {
            if (action.type === 'PROCESS_EVENT' && action.payload?.event) {
              pushEventToFront(action.payload.event);
              processNextEvent();
            }
          }}
          onUseItem={useItem}
        />
      </Suspense>
    );
  }

  return null;
}
