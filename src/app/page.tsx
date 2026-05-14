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
  StoryProgression,
  TDLevelContext,
} from '@/types/baseGame';
import { TD_LEVELS } from '@/constants/tdLevels';
import {
  resolvePlayerCreature,
  resolvePlayerCreatures,
} from '@/utils/resolvePlayerCreature';
import { resolveDialog } from '@/utils/dialogResolver';

const StartScreen = lazy(() => import('@/app/components/startScreen'));
const ProfileScreen = lazy(() => import('@/app/components/profileScreen'));
const DialogScreen = lazy(() => import('@/app/components/dialogScreen'));
const BattleScreen = lazy(() => import('@/app/components/battleScreen'));
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
    currentTdLevel,
  } = useGameStore();

  // Deduced state
  const currentProfile =
    currentProfileId !== null ? profiles[currentProfileId] : null;

  useEffect(() => {
    // Handle redirects based on state validity
    if (currentScreen === Screens.BATTLE) {
      if (!currentProfile || !currentEnemy) {
        setScreen(Screens.LEVEL_SELECT);
      } else if (!currentProfile.creatures[0]) {
        setScreen(Screens.LEVEL_SELECT);
      }
    } else if (currentScreen === Screens.LEVEL_SELECT) {
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
          onBack={() => setScreen(Screens.LEVEL_SELECT)}
          onReorder={reorderCreatures}
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
          levelData={currentTdLevel.levelData}
          onClose={() =>
            enqueueAndProcessEvents([
              {
                type: currentTdLevel.levelData.isChallengeLevel
                  ? 'GO_TO_CHALLENGE_SELECT'
                  : 'GO_TO_LEVEL_SELECT',
              },
            ])
          }
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

            enqueueAndProcessEvents([
              ...introEvents,
              {
                type: 'GO_TO_TOWER_DEFENSE',
                payload: { context },
              },
            ]);
          }}
          onBack={() => setScreen(Screens.MODE_SELECT)}
          onUseItem={useItem}
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
          onBack={() => setScreen(Screens.PROFILES)}
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
