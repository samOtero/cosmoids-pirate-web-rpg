"use client";
import { lazy, Suspense } from "react";
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
  } = useGameStore();

  if (currentScreen === Screens.START) {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <StartScreen onStart={() => setScreen(Screens.PROFILES)} />
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
    const { sequence, backgroundImageKey, next } = resolveDialog(
      dialogContext,
      dialogContextData
    );

    const handleDialogAction = (action: DialogAction) => {
      switch (action.type) {
        case "CHANGE_SCREEN":
          if (action.payload?.screen) {
            setScreen(
              action.payload.screen as Screens,
              action.payload?.context as DialogContext
            );
          }
          break;
        case "START_BATTLE":
          // TODO: Implement battle start logic
          console.log("Starting battle with payload:", action.payload);
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
