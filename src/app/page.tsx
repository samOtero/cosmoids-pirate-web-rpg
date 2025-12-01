"use client";
import { lazy, Suspense } from "react";
import { useGameStore } from "@/store/gameStore";
import { Profile, Screens } from "@/types/baseGame";

const StartScreen = lazy(() => import("@/app/components/startScreen"));
const ProfileScreen = lazy(() => import("@/app/components/profileScreen"));
const MapScreen = lazy(() => import("@/app/components/mapScreen"));

export default function Home() {
  const {
    currentScreen,
    setScreen,
    profiles,
    createProfile,
    deleteProfile,
    selectProfile,
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

  if (currentScreen === Screens.MAP) {
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <MapScreen
          profile={profiles[0] as Profile}
          onTravel={function (islandId: number): void {
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
