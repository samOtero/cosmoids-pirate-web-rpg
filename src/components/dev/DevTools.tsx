'use client';

import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useGameStore } from '@/store/gameStore';
import {
  STARTER_CRAB,
  STARTER_IGUANA,
  STARTER_MONKEY,
  BUG_STAGE_1,
} from '@/constants/creatures';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import { TD_LEVELS } from '@/constants/tdLevels';
import { TDLevelContext } from '@/types/baseGame';

const DialogEditor = lazy(() => import('./DialogEditor'));
const AnimationEditor = lazy(() => import('./AnimationEditor'));
const TDTowerSizeEditor = lazy(() => import('./TDTowerSizeEditor'));
const TowerDefenseScreen = lazy(
  () => import('@/app/components/tower-defense/TowerDefenseScreen')
);
const TDLevelEditor = lazy(() => import('./TDLevelEditor'));

type ToolType =
  | 'DIALOG'
  | 'ANIMATION'
  | 'TOWER_DEFENSE'
  | 'TD_LEVEL_EDITOR'
  | 'TD_TOWER_SIZE_EDITOR'
  | null;

export default function DevTools() {
  const [activeTool, setActiveTool] = useState<ToolType>(null);
  const [showMenu, setShowMenu] = useState(false);
  const overwriteProfileCreatures = useGameStore(
    (state) => state.overwriteProfileCreatures
  );
  const enqueueAndProcessEvents = useGameStore(
    (state) => state.enqueueAndProcessEvents
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
        <div className="fixed bottom-4 right-4 z-9999 flex flex-col gap-2">
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
                  setActiveTool('TOWER_DEFENSE');
                  setShowMenu(false);
                }}
                className="text-sm bg-slate-800 hover:bg-cyan-700 px-3 py-2 rounded text-left"
              >
                Tower Defense Map
              </button>
              <button
                onClick={() => {
                  setActiveTool('TD_TOWER_SIZE_EDITOR');
                  setShowMenu(false);
                }}
                className="text-sm bg-indigo-900 hover:bg-indigo-700 px-3 py-2 rounded text-left"
              >
                TD Tower Size Editor
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
                    id: c.id,
                    speciesId: c.id,
                    level: 1,
                    xp: 0,
                    equippedAttacks: TowerDefenseEngine.getDefaultAttacks(c.id),
                    isShiny: false,
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
                  const level1Starters = [
                    STARTER_CRAB,
                    STARTER_IGUANA,
                    STARTER_MONKEY,
                    BUG_STAGE_1,
                  ].map((c) => ({
                    id: c.id,
                    speciesId: c.id,
                    level: 1,
                    xp: 0,
                    equippedAttacks: TowerDefenseEngine.getDefaultAttacks(c.id),
                    isShiny: true,
                  }));
                  overwriteProfileCreatures(level1Starters);
                  setShowMenu(false);
                }}
                className="text-sm bg-amber-950 border border-amber-500 hover:bg-amber-700 px-3 py-2 rounded text-left font-bold text-amber-300 animate-pulse"
              >
                Set Shiny Starters + Bug ✨
              </button>
              <button
                onClick={() => {
                  const thirtyCreatures = Array.from({ length: 30 }).map(
                    (_, i) => ({
                      id: STARTER_CRAB.id,
                      speciesId: STARTER_CRAB.id,
                      level: 10,
                      xp: 0,
                      equippedAttacks: TowerDefenseEngine.getDefaultAttacks(
                        STARTER_CRAB.id
                      ),
                      isShiny: false,
                    })
                  );
                  overwriteProfileCreatures(thirtyCreatures);
                  setShowMenu(false);
                }}
                className="text-sm bg-purple-900 border border-purple-500 hover:bg-purple-700 px-3 py-2 rounded text-left font-bold"
              >
                Populate 30 Creatures
              </button>
              <button
                onClick={() => {
                  enqueueAndProcessEvents([
                    {
                      type: 'GO_TO_TOWER_DEFENSE',
                      payload: {
                        context: TDLevelContext.FIRST_LEVEL,
                      },
                    },
                    {
                      type: 'EXECUTE_TD_ACTION',
                      payload: {
                        action: {
                          type: 'SPAWN_ENVIRONMENT_UNIT',
                          unitId: 'test_caleb',
                          tdConfigId: 'caleb_battle',
                          position: { x: 50, y: -20 }, // Off screen top
                          speed: 30, // 30% per second
                          facingDirection: 'down',
                        },
                      },
                    },
                    {
                      type: 'EXECUTE_TD_ACTION',
                      payload: {
                        action: {
                          type: 'MOVE_ENVIRONMENT_UNIT',
                          unitId: 'test_caleb',
                          path: [
                            { x: 50, y: 50 },
                            { x: 80, y: 50 },
                            { x: 80, y: 120 }, // Off screen bottom
                          ],
                        },
                      },
                    },
                  ]);
                  setShowMenu(false);
                }}
                className="text-sm bg-red-900 border border-red-500 hover:bg-red-700 px-3 py-2 rounded text-left font-bold"
              >
                Test TD Scripting
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

          {activeTool === 'TD_TOWER_SIZE_EDITOR' && (
            <TDTowerSizeEditor onClose={() => setActiveTool(null)} />
          )}
          {activeTool === 'TOWER_DEFENSE' && (
            <TowerDefenseScreen
              levelData={TD_LEVELS[TDLevelContext.FIRST_LEVEL].levelData}
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
