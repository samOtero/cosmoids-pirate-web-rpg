"use client";
import { lazy, Suspense } from "react";
import { useGameStore } from "@/store/gameStore";
import { Screens } from "@/types/baseGames";

const StartScreen = lazy(() => import("@/app/components/startScreen"));
const ProfileScreen = lazy(() => import("@/app/components/profileScreen"));

export default function Home() {
  const { currentScreen, setScreen } = useGameStore();

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
          profiles={[]}
          onSelect={() => {}}
          onCreate={() => {}}
          onDelete={() => {}}
        />
      </Suspense>
    );
  }

  return null;
}
