'use client';
import { lazy, Suspense, useEffect } from 'react';

import { useGameStore } from '@/store/gameStore';
import {
  Screens,
  DialogAction,
  DialogContext,
  BattleContext,
  BackgroundImageKey,
} from '@/types/baseGame';
import { resolveDialog } from '@/utils/dialogResolver';
import {
  STARTER_CRAB,
  STARTER_IGUANA,
  STARTER_MONKEY,
} from '@/constants/dialogs';

const StartScreen = lazy(() => import('@/app/components/startScreen'));
const ProfileScreen = lazy(() => import('@/app/components/profileScreen'));
const DialogScreen = lazy(() => import('@/app/components/dialogScreen'));
const MapScreen = lazy(() => import('@/app/components/mapScreen'));
const BattleScreen = lazy(() => import('@/app/components/battleScreen'));

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
    addCreatureToProfile,
    currentBattle,
    currentEnemy,
    clearCurrentEnemy,
    completeIntroduction,
    eventQueue,
    processNextEvent,
    enqueueEvent,
    enqueueAndProcessEvents,
    pushEventToFront,
    handleBattleWin,
    handleBattleLose,
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
    const playerCreature = currentProfile.creatures[0];
    if (!playerCreature) {
      return null;
    }

    return (
      <Suspense fallback={<div>Loading Battle...</div>}>
        <BattleScreen
          playerCreature={playerCreature}
          enemyCreature={currentEnemy}
          inventory={[]}
          onBattleEnd={(won) => {
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
          onStartEvents={() => {
            if (!currentBattle?.afterStartEvents?.length) return;
            enqueueAndProcessEvents(currentBattle.afterStartEvents);
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
        // Handle creature selection from starter dialogs
        if (next.contextData?.creatureId && currentProfileId !== null) {
          const creatureMap: Record<string, typeof STARTER_CRAB> = {
            starter_crab: STARTER_CRAB,
            starter_iguana: STARTER_IGUANA,
            starter_monkey: STARTER_MONKEY,
          };
          const creature = creatureMap[next.contextData.creatureId];
          if (creature) {
            addCreatureToProfile(currentProfileId, { ...creature });
          }
        }

        if (next.screen === Screens.MAP) {
          completeIntroduction();
        }
        setScreen(next.screen, next.context, next.contextData);
      } else {
        completeIntroduction();
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
          onTravel={() => {
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
          onOpenMenu={function (): void {
            throw new Error('Function not implemented.');
          }}
        />
      </Suspense>
    );
  }

  return null;
}
