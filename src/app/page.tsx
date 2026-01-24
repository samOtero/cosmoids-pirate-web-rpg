"use client";
import { lazy, Suspense, useEffect } from "react";

import { useGameStore } from "@/store/gameStore";
import { Screens, DialogAction, DialogContext } from "@/types/baseGame";
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
    setCurrentEnemy,
    currentEnemy,
    clearCurrentEnemy,
    completeIntroduction,
    eventQueue,
    processNextEvent,
    enqueueEvent,
  } = useGameStore();

  // Auto-process queue if we are in a transition state or just starting
  useEffect(() => {
    return; // temp disabled
    // If we have a profile selected, events in the queue, and we are on the PROFILES screen (just selected),
    // kick off the event loop.
    if (currentProfileId !== null && eventQueue.length > 0 && currentScreen === Screens.PROFILES) {
        processNextEvent();
    }
  }, [currentProfileId, eventQueue, currentScreen, processNextEvent]);

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
                 // Could go to a victory dialog
                 setScreen(Screens.MAP); 
             } else {
                 setScreen(Screens.MAP);
             }
             clearCurrentEnemy();
          }}
        />
      </Suspense>
    );
  }

  if (currentScreen === Screens.START) {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <StartScreen onStart={() => { enqueueEvent({ type: "GO_TO_PROFILES" });
        processNextEvent();}} />
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

    const handleDialogAction = (action: DialogAction) => {
      switch (action.type) {
        case "CHANGE_SCREEN":
          if (action.payload?.screen) {
            if (action.payload.screen === Screens.MAP) {
                completeIntroduction();
            }
            setScreen(
              action.payload.screen as Screens,
              action.payload?.context as DialogContext
            );
          }
          break;
        case "PICK_STARTER":
          if (action.payload?.creatureId && currentProfileId !== null) {
            const creatureMap: Record<string, typeof STARTER_CRAB> = {
              starter_grass: STARTER_CRAB,
              starter_fire: STARTER_IGUANA,
              starter_water: STARTER_MONKEY,
            };
            const creature = creatureMap[action.payload?.creatureId];
            if (creature) {
              addCreatureToProfile(currentProfileId, { ...creature });
            }
          } else {
            throw new Error(
              "Invalid starter selection or no profile selected."
            );
          }
          break;
        case "START_BATTLE":
          if (action.payload?.creatureId) {
             // Temporary lookup for enemies until we have a real DB/store for them
             // Using starter creatures as placeholder enemies for now + maybe some extras
             const enemyMap: Record<string, any> = {
                // We'll reuse starters for now or define new ones. 
                // Let's create a quick "wild" version of them or just use them directly.
                wild_crab: { ...STARTER_CRAB, id: 'wild_crab_' + Date.now(), currentHp: 15, maxHp: 15, level: 3 },
                wild_iguana: { ...STARTER_IGUANA, id: 'wild_iguana_' + Date.now(), currentHp: 15, maxHp: 15, level: 3 },
                wild_monkey: { ...STARTER_MONKEY, id: 'wild_monkey_' + Date.now(), currentHp: 15, maxHp: 15, level: 3 },
             };
             
             const enemyId = action.payload.creatureId;
             const enemy = enemyMap[enemyId];

             if (enemy) {
                 setCurrentEnemy(enemy);
                 setScreen(Screens.BATTLE);
             } else {
                 console.warn("Enemy not found:", enemyId);
             }
          }
          break;
        case "CUSTOM":
          // TODO: Handle custom actions
          console.log("Custom action:", action.payload);
          break;
        default:
          console.warn("Unknown action type:", action.type);
      }
    };

    const handleContinue = () => {
      if (sequence.length > 0) {
          // Verify if we are at the end? 
          // DialogScreen calls onContinue when the sequence is DONE (or skipped).
          // But wait, DialogScreen handles the inner sequence. 
          // So onContinue means "This dialog config is finished".
      }

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
            throw new Error("Function not implemented.");
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
