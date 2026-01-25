"use client";
import { lazy, Suspense, useEffect } from "react";

import { useGameStore } from "@/store/gameStore";
import { Screens, DialogAction, DialogContext, BattleContext } from "@/types/baseGame";
import { resolveDialog } from "@/utils/dialogResolver";
import {
  STARTER_CRAB,
  STARTER_IGUANA,
  STARTER_MONKEY,
} from "@/constants/dialogs";

const StartScreen = lazy(() => import("@/app/components/startScreen"));
const ProfileScreen = lazy(() => import("@/app/components/profileScreen"));
const DialogScreen = lazy(() => import("@/app/components/dialogScreen"));
const MapScreen = lazy(() => import("@/app/components/mapScreen"));
const BattleScreen = lazy(() => import("@/app/components/battleScreen"));

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
    currentEnemy,
    clearCurrentEnemy,
    completeIntroduction,
    eventQueue,
    processNextEvent,
    enqueueEvent,
    enqueueAndProcessEvents,
    handleBattleWin,
    handleBattleLose,
  } = useGameStore();

  // Also handle "WAIT" events or similar if implemented in the store processor, 
  // but for now the store updates state immediately for screen changes.

  if (currentScreen === Screens.BATTLE) {
    const currentProfile =
      currentProfileId !== null ? profiles[currentProfileId] : null;

    if (!currentEnemy) {
      setScreen(Screens.MAP);
      return null;
    }

    // Default to first creature if valid
    //const playerCreature = currentProfile.creatures[0];
    //if (!playerCreature) {
        // Handle no creatures? Should not happen if game flow is correct
       // setScreen(Screens.MAP);
       // return null;
    //}

    return (
      <Suspense fallback={<div>Loading Battle...</div>}>
        <BattleScreen
          playerCreature={currentEnemy}
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
        />
      </Suspense>
    );
  }

  if (currentScreen === Screens.START) {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <StartScreen onStart={() => enqueueAndProcessEvents([ { type: "GO_TO_PROFILES" }])} />
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

    const {dialogStartIndex = 0 } = dialogContextData || {};

    const handleDialogAction = (action: DialogAction) => {
      switch (action.type) {
        case "PICK_STARTER":
          if (action.payload?.creatureId) {
             enqueueAndProcessEvents([{ 
                 type: "PICK_STARTER", 
                 payload: { creatureId: action.payload.creatureId } 
             }]);
          }
          break;
        default:
          console.warn("Unknown action type:", action.type);
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
          nextEvents.forEach(e => enqueueEvent(e));
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
    const currentProfile =
      currentProfileId !== null ? profiles[currentProfileId] : null;

    if (!currentProfile) {
      setScreen(Screens.PROFILES);
      return null;
    }

    return (
      <Suspense fallback={<div>Loading...</div>}>
        <MapScreen
          profile={currentProfile}
          onTravel={() => {
            enqueueAndProcessEvents([{ type: "SHOW_DIALOG", payload: { context: DialogContext.LEVEL_1_THE_MESSAGE } }, { type: "START_BATTLE", payload: { context: BattleContext.FIRST_BATTLE } }])
          }}
          onOpenMenu={function (): void {
            throw new Error("Function not implemented.");
          }}
        />
      </Suspense>
    );
  }

  return null;
}
