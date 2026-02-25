'use client';

import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useGameStore } from '@/store/gameStore';
import {
  STARTER_CRAB,
  STARTER_IGUANA,
  STARTER_MONKEY,
  BUG_STAGE_1,
} from '@/constants/creatures';

const DialogEditor = lazy(() => import('./DialogEditor'));
const AnimationEditor = lazy(() => import('./AnimationEditor'));
const BattleDebug = lazy(() => import('./BattleDebug'));
const MapEditor = lazy(() => import('./MapEditor'));
const CreaturePositionEditor = lazy(() => import('./CreaturePositionEditor'));
const TowerDefenseScreen = lazy(
  () => import('@/app/components/tower-defense/TowerDefenseScreen')
);
const TDLevelEditor = lazy(() => import('./TDLevelEditor'));

type ToolType =
  | 'DIALOG'
  | 'ANIMATION'
  | 'BATTLE'
  | 'MAP'
  | 'CREATURE_POSITION'
  | 'TOWER_DEFENSE'
  | 'TD_LEVEL_EDITOR'
  | null;

export default function DevTools() {
  const [activeTool, setActiveTool] = useState<ToolType>(null);
  const [showMenu, setShowMenu] = useState(false);
  const overwriteProfileCreatures = useGameStore(
    (state) => state.overwriteProfileCreatures
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        setShowMenu((prev) => !prev);
        setActiveTool(null); // Reset on toggle? Or just hide menu
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!showMenu && !activeTool) return null;

  return (
    <>
      {showMenu && !activeTool && (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
          <div className="bg-black/90 text-white p-3 rounded border border-slate-700 shadow-xl">
            <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">
              Dev Tools (Ctrl+D)
            </h3>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => {
                  setActiveTool('DIALOG');
                  setShowMenu(false);
                }}
                className="text-sm bg-slate-800 hover:bg-cyan-700 px-3 py-2 rounded text-left"
              >
                Dialog Editor
              </button>
              <button
                onClick={() => {
                  setActiveTool('ANIMATION');
                  setShowMenu(false);
                }}
                className="text-sm bg-slate-800 hover:bg-cyan-700 px-3 py-2 rounded text-left"
              >
                Animation Editor
              </button>
              <button
                onClick={() => {
                  setActiveTool('BATTLE');
                  setShowMenu(false);
                }}
                className="text-sm bg-slate-800 hover:bg-cyan-700 px-3 py-2 rounded text-left"
              >
                Battle Debug
              </button>
              <button
                onClick={() => {
                  setActiveTool('MAP');
                  setShowMenu(false);
                }}
                className="text-sm bg-slate-800 hover:bg-cyan-700 px-3 py-2 rounded text-left"
              >
                Map Editor
              </button>
              <button
                onClick={() => {
                  setActiveTool('CREATURE_POSITION');
                  setShowMenu(false);
                }}
                className="text-sm bg-slate-800 hover:bg-cyan-700 px-3 py-2 rounded text-left"
              >
                Creature Position Editor
              </button>
              <button
                onClick={() => {
                  setActiveTool('TOWER_DEFENSE');
                  setShowMenu(false);
                }}
                className="text-sm bg-slate-800 hover:bg-cyan-700 px-3 py-2 rounded text-left"
              >
                Tower Defense Map
              </button>
              <button
                onClick={() => {
                  setActiveTool('TD_LEVEL_EDITOR');
                  setShowMenu(false);
                }}
                className="text-sm bg-slate-800 hover:bg-cyan-700 px-3 py-2 rounded text-left"
              >
                TD Level Editor
              </button>
              <button
                onClick={() => {
                  const level1Starters = [
                    STARTER_CRAB,
                    STARTER_IGUANA,
                    STARTER_MONKEY,
                    BUG_STAGE_1,
                  ].map((c) => ({
                    ...c,
                    level: 1,
                    currentHp: c.maxHp,
                    xp: 0,
                  }));
                  overwriteProfileCreatures(level1Starters);
                  setShowMenu(false);
                }}
                className="text-sm bg-purple-900 border border-purple-500 hover:bg-purple-700 px-3 py-2 rounded text-left font-bold"
              >
                Set LVL 1 Starters + Bug
              </button>
              <button
                onClick={() => {
                  const thirtyCreatures = Array.from({ length: 30 }).map(
                    (_, i) => ({
                      ...STARTER_CRAB,
                      id: crypto.randomUUID(),
                      speciesId: STARTER_CRAB.id,
                      level: 10,
                      currentHp: STARTER_CRAB.maxHp,
                      xp: 0,
                      name: `Crab ${i + 1}`,
                    })
                  );
                  overwriteProfileCreatures(thirtyCreatures);
                  setShowMenu(false);
                }}
                className="text-sm bg-purple-900 border border-purple-500 hover:bg-purple-700 px-3 py-2 rounded text-left font-bold"
              >
                Populate 30 Creatures
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTool && (
        <Suspense
          fallback={
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black text-white px-4 py-2 rounded">
              Loading...
            </div>
          }
        >
          {activeTool === 'DIALOG' && (
            <DialogEditor onClose={() => setActiveTool(null)} />
          )}
          {activeTool === 'ANIMATION' && (
            <AnimationEditor onClose={() => setActiveTool(null)} />
          )}
          {activeTool === 'BATTLE' && (
            <BattleDebug onClose={() => setActiveTool(null)} />
          )}
          {activeTool === 'MAP' && (
            <MapEditor onClose={() => setActiveTool(null)} />
          )}
          {activeTool === 'CREATURE_POSITION' && (
            <CreaturePositionEditor onClose={() => setActiveTool(null)} />
          )}
          {activeTool === 'TOWER_DEFENSE' && (
            <TowerDefenseScreen
              onClose={() => setActiveTool(null)}
              onWin={() => alert('You win!')}
              onLose={() => alert('You lose!?')}
            />
          )}
          {activeTool === 'TD_LEVEL_EDITOR' && (
            <TDLevelEditor onClose={() => setActiveTool(null)} />
          )}
        </Suspense>
      )}
    </>
  );
}
