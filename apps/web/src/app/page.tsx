'use client';
import { lazy, Suspense, useEffect, useSyncExternalStore } from 'react';

import { useGameStore } from '@/store/gameStore';
import {
  Screens,
  DialogAction,
  StoryProgression,
  TDLevelContext,
} from '@/types/baseGame';
import { TD_LEVELS } from '@/constants/tdLevels';
import { isRogueliteEnabled } from '@/constants/featureFlags';
import { resolvePlayerCreatures } from '@/utils/resolvePlayerCreature';
import { resolveDialog } from '@/utils/dialogResolver';
import { TEST_PROFILE_TEMPLATE_OPTIONS } from '@/constants/testProfileTemplates';
import { isTestProfileOverrideEnabled } from '@/utils/testProfileAccess';
import { useAccount } from '@/app/components/auth/AuthProvider';
import { useProfileSession } from '@/app/components/auth/useProfileSession';
import { Button } from '@/app/components/ui/Button';
import CloudSaveBar, {
  useCloudSaveExitWarning,
} from '@/app/components/CloudSaveBar';
import CloudSaveConflictDialog from '@/app/components/CloudSaveConflictDialog';

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
const RogueliteScreen = lazy(
  () => import('@/app/components/roguelite/RogueliteScreen')
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

function GameScreens() {
  const { isPending: isAccountPending, refetch } = useAccount();
  const { waitingForIdentity, identityMismatch, needsSession } =
    useProfileSession();
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
    updateCreatureAttacks,
    reorderCreatures,
    currentTdLevel,
    clearQueue,
    markJournalOpened,
    profileAccountId,
    cloudSlots,
    cloudSlotsStatus,
    cloudSlotsError,
    cloudProfileError,
    loadingProfileSlot,
    failedProfileSlot,
    loadAccountSlots,
    loadAccountProfile,
    createAccountProfile,
    deleteAccountProfile,
    cloudMutation,
    cloudMutationError,
    cloudMutationNeedsRefresh,
    cloudSaveAttempt,
    cloudSaveConflict,
    cancelProfileRequests,
    setProfileAccount,
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

  if (
    currentScreen !== Screens.START &&
    (waitingForIdentity || identityMismatch)
  ) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p role="status">Checking your account…</p>
      </div>
    );
  }

  if (currentScreen === Screens.PROFILES && needsSession) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-4 text-center">
        <p role="alert">
          Log in again to access your cloud profiles. Your current progress is
          still held in this tab.
        </p>
        <Button
          onClick={() => {
            void refetch().then(() =>
              useGameStore.getState().loadAccountSlots()
            );
          }}
        >
          Check account again
        </Button>
        <Button variant="wood" onClick={() => setScreen(Screens.START)}>
          Back to title
        </Button>
      </div>
    );
  }

  if (currentScreen === Screens.START) {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <StartScreen
          onStart={() => enqueueAndProcessEvents([{ type: 'GO_TO_PROFILES' }])}
          onGuestStart={() => {
            setProfileAccount(null);
            enqueueAndProcessEvents([{ type: 'GO_TO_PROFILES' }]);
          }}
        />
      </Suspense>
    );
  }

  if (currentScreen === Screens.PROFILES) {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <ProfileScreen
          key={profileAccountId ?? 'guest'}
          profiles={profiles}
          onSelect={
            profileAccountId
              ? (slot) => {
                  void loadAccountProfile(slot);
                }
              : selectProfile
          }
          onCreate={(slotId) => {
            // Do not label a new save as guest while identity is unresolved.
            if (isAccountPending) return;
            if (profileAccountId) void createAccountProfile(slotId);
            else createProfile(slotId);
          }}
          creationPending={isAccountPending}
          accountSlots={profileAccountId ? cloudSlots : undefined}
          loadStatus={cloudSlotsStatus}
          loadingSlot={loadingProfileSlot}
          loadError={cloudSlotsError ?? cloudProfileError}
          mutation={cloudMutation}
          mutationError={cloudMutationError}
          mutationNeedsRefresh={cloudMutationNeedsRefresh}
          saveBlocked={Boolean(cloudSaveAttempt || cloudSaveConflict)}
          onRefresh={() => {
            void loadAccountSlots();
          }}
          onRetry={() => {
            if (cloudSlotsStatus === 'error') void loadAccountSlots();
            else if (failedProfileSlot !== null)
              void loadAccountProfile(failedProfileSlot);
          }}
          onDelete={(slot, confirmed) => {
            if (profileAccountId) {
              if (confirmed) void deleteAccountProfile(slot, confirmed);
            } else deleteProfile(slot);
          }}
          onBack={() => {
            cancelProfileRequests();
            setScreen(Screens.START);
          }}
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

  if (
    currentScreen === Screens.MODE_SELECT ||
    (currentScreen === Screens.ROGUELITE && !isRogueliteEnabled())
  ) {
    if (!currentProfile) return null;

    return (
      <Suspense fallback={<div>Loading...</div>}>
        <ModeSelectScreen
          profile={currentProfile}
          onSelectStory={() => setScreen(Screens.LEVEL_SELECT)}
          onSelectChallenge={() => setScreen(Screens.CHALLENGE_SELECT)}
          onSelectRoguelite={() => {
            if (isRogueliteEnabled()) setScreen(Screens.ROGUELITE);
          }}
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

  if (currentScreen === Screens.ROGUELITE) {
    return (
      <Suspense fallback={<div>Loading roguelite...</div>}>
        <RogueliteScreen onBack={() => setScreen(Screens.MODE_SELECT)} />
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

export default function Home() {
  useCloudSaveExitWarning();
  const mutation = useGameStore((s) => s.cloudMutation);
  const conflict = useGameStore((s) => s.cloudSaveConflict);
  const blocked =
    mutation?.kind === 'save' ||
    mutation?.kind === 'check' ||
    Boolean(conflict);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <CloudSaveBar />
      <div className="min-h-0 flex-1" inert={blocked}>
        <GameScreens />
      </div>
      <CloudSaveConflictDialog />
    </div>
  );
}
