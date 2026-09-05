'use client';
import { lazy, Suspense, useEffect, useSyncExternalStore } from 'react';

import { useGameStore } from '@/store/gameStore';
import {
  Screens,
  DialogAction,
  DialogContext,
  BackgroundImageKey,
  Creature,
  StoryProgression,
  TDLevelContext,
} from '@/types/baseGame';
import { TD_LEVELS } from '@/constants/tdLevels';
import {
  resolvePlayerCreature,
  resolvePlayerCreatures,
} from '@/utils/resolvePlayerCreature';
import { resolveDialog } from '@/utils/dialogResolver';
import { TEST_PROFILE_TEMPLATE_OPTIONS } from '@/constants/testProfileTemplates';
import { isTestProfileOverrideEnabled } from '@/utils/testProfileAccess';

const StartScreen = lazy(() => import('@/app/components/startScreen'));
const ProfileScreen = lazy(() => import('@/app/components/profileScreen'));
const DialogScreen = lazy(() => import('@/app/components/dialogScreen'));
const PartyScreen = lazy(() => import('@/app/components/PartyScreen'));
const LevelSelectScreen = lazy(
  () => import('@/app/components/LevelSelectScreen')
);
const ModeSelectScreen = lazy(
  () => import('@/app/components/ModeSelectScreen')
);
const TowerDefenseScreen = lazy(
  () => import('@/app/components/tower-defense/TowerDefenseScreen')
);
const ChallengeSelectScreen = lazy(
  () => import('@/app/components/ChallengeSelectScreen')
);
const CosmoidCodexScreen = lazy(
  () => import('@/app/components/CosmoidCodexScreen')
);

const subscribeToHostname = () => () => {};
const getClientTestProfileOverrideEnabled = () =>
  isTestProfileOverrideEnabled(window.location.hostname);
const getServerTestProfileOverrideEnabled = () =>
  isTestProfileOverrideEnabled();

export default function Home() {
  const {
    currentScreen,
    setScreen,
    profiles,
    currentProfileId,
    createProfile,
    deleteProfile,
    selectProfile,
    applyTestProfileTemplate,
    dialogContext,
    dialogContextData,
    eventQueue,
    processNextEvent,
    enqueueEvent,
    enqueueAndProcessEvents,
    pushEventToFront,
    updateCreatures,
    updateCreatureAttacks,
    reorderCreatures,
    currentTdLevel,
    clearQueue,
    markJournalOpened,
  } = useGameStore();

  const testProfileOverrideEnabled = useSyncExternalStore(
    subscribeToHostname,
    getClientTestProfileOverrideEnabled,
    getServerTestProfileOverrideEnabled
  );

  // Deduced state
  const currentProfile =
    currentProfileId !== null ? profiles[currentProfileId] : null;

  useEffect(() => {
    // Handle redirects based on state validity
    if (currentScreen === Screens.LEVEL_SELECT) {
      if (!currentProfile) {
        setScreen(Screens.PROFILES);
      }
    }
  }, [currentScreen, currentProfile, setScreen]);

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
          onBack={() => setScreen(Screens.START)}
          testProfileTemplates={
            testProfileOverrideEnabled
              ? TEST_PROFILE_TEMPLATE_OPTIONS
              : undefined
          }
          onApplyTestTemplate={
            testProfileOverrideEnabled ? applyTestProfileTemplate : undefined
          }
        />
      </Suspense>
    );
  }

  if (currentScreen === Screens.PARTY) {
    if (!currentProfile) {
      return null;
    }

    // If there are events queued (e.g. pending level navigation), show the continue button
    const hasPendingEvents = eventQueue.length > 0;
    const showTutorial =
      currentProfile.storyProgression < StoryProgression.DEFEAT_FIRST_BATTLE;

    return (
      <Suspense fallback={<div>Loading Team...</div>}>
        <PartyScreen
          creatures={resolvePlayerCreatures(currentProfile.creatures)}
          storageCreatures={resolvePlayerCreatures(
            currentProfile.storageCreatures
          )}
          onBack={() => {
            if (hasPendingEvents) {
              // Clear the pending level events when going back
              clearQueue();
            }
            setScreen(Screens.LEVEL_SELECT);
          }}
          onReorder={reorderCreatures}
          onContinue={hasPendingEvents ? () => processNextEvent() : undefined}
          onUpdateAttacks={updateCreatureAttacks}
          getCreatureActiveAttackIndex={(creatureId) => {
            const pc =
              currentProfile.creatures.find((c) => c.id === creatureId) ||
              currentProfile.storageCreatures.find((c) => c.id === creatureId);
            return pc?.activeAttackIndex ?? 0;
          }}
          showTutorial={showTutorial}
        />
      </Suspense>
    );
  }

  if (currentScreen === Screens.TOWER_DEFENSE) {
    if (!currentProfile || !currentTdLevel) {
      return null;
    }

    return (
      <Suspense fallback={<div>Loading Tower Defense...</div>}>
        <TowerDefenseScreen
          levelId={
            Object.entries(TD_LEVELS).find(
              ([, config]) => config.levelData === currentTdLevel.levelData
            )?.[0]
          }
          levelData={currentTdLevel.levelData}
          onClose={() => {
            if (currentTdLevel.levelData.isChallengeLevel) {
              enqueueAndProcessEvents([{ type: 'GO_TO_CHALLENGE_SELECT' }]);
            } else {
              enqueueAndProcessEvents(currentTdLevel.loseEvents);
            }
          }}
          onWin={() => enqueueAndProcessEvents(currentTdLevel.winEvents)}
          onLose={() => enqueueAndProcessEvents(currentTdLevel.loseEvents)}
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
        processNextEvent();
        return;
      }

      if (next) {
        setScreen(next.screen, next.context, next.contextData);
      } else {
        setScreen(Screens.MODE_SELECT);
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

  if (currentScreen === Screens.LEVEL_SELECT) {
    if (!currentProfile) return null;

    return (
      <Suspense fallback={<div>Loading Levels...</div>}>
        <LevelSelectScreen
          profile={currentProfile}
          onLevelSelect={(context: TDLevelContext) => {
            const levelConfig = TD_LEVELS[context];
            const introEvents = levelConfig?.introEvents || [];

            // Story levels route through Party Screen first
            enqueueAndProcessEvents([
              { type: 'GO_TO_PARTY' },
              ...introEvents,
              {
                type: 'GO_TO_TOWER_DEFENSE',
                payload: { context },
              },
            ]);
          }}
          onBack={() => setScreen(Screens.MODE_SELECT)}
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
              setScreen(Screens.LEVEL_SELECT);
            }
          }}
          onDialogAction={(action) => {
            if (action.type === 'PROCESS_EVENT' && action.payload?.event) {
              pushEventToFront(action.payload.event);
              processNextEvent();
            }
          }}
        />
      </Suspense>
    );
  }

  if (currentScreen === Screens.MODE_SELECT) {
    if (!currentProfile) return null;

    return (
      <Suspense fallback={<div>Loading...</div>}>
        <ModeSelectScreen
          profile={currentProfile}
          onSelectStory={() => setScreen(Screens.LEVEL_SELECT)}
          onSelectChallenge={() => setScreen(Screens.CHALLENGE_SELECT)}
          onSelectCodex={() => {
            markJournalOpened();
            setScreen(Screens.COSMOID_CODEX);
          }}
          onBack={() => setScreen(Screens.PROFILES)}
        />
      </Suspense>
    );
  }

  if (currentScreen === Screens.COSMOID_CODEX) {
    if (!currentProfile) return null;

    return (
      <Suspense fallback={<div>Opening Kip&apos;s Journal...</div>}>
        <CosmoidCodexScreen
          profile={currentProfile}
          onBack={() => setScreen(Screens.MODE_SELECT)}
        />
      </Suspense>
    );
  }

  if (currentScreen === Screens.CHALLENGE_SELECT) {
    if (!currentProfile) return null;

    return (
      <Suspense fallback={<div>Loading Challenges...</div>}>
        <ChallengeSelectScreen
          profile={currentProfile}
          onLevelSelect={(context: TDLevelContext) => {
            const levelConfig = TD_LEVELS[context];
            const introEvents = levelConfig?.introEvents || [];

            enqueueAndProcessEvents([
              ...introEvents,
              {
                type: 'GO_TO_TOWER_DEFENSE',
                payload: { context },
              },
            ]);
          }}
          onBack={() => setScreen(Screens.MODE_SELECT)}
        />
      </Suspense>
    );
  }

  return null;
}
