'use client';
import { generateCreatureGender } from '@/utils/creatureGender';

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
const TDEffectEditor = lazy(() => import('./TDEffectEditor'));
const TDAttackPreview = lazy(() => import('./TDAttackPreview'));

type ToolType =
  | 'DIALOG'
  | 'ANIMATION'
  | 'TOWER_DEFENSE'
  | 'TD_LEVEL_EDITOR'
  | 'TD_TOWER_SIZE_EDITOR'
  | 'TD_EFFECT_EDITOR'
  | 'TD_ATTACK_PREVIEW'
  | null;

export default function DevTools() {
  const [activeTool, setActiveTool] = useState<ToolType>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [forceShiny, setForceShiny] = useState(
    typeof window !== 'undefined' ? TowerDefenseEngine.forceShinySpawns : false
  );
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
        <div className="fixed right-4 bottom-20 z-9999 flex flex-col gap-2">
          <div className="rounded border border-slate-700 bg-black/90 p-3 text-white shadow-xl">
            <h3 className="mb-2 text-xs font-bold text-slate-400 uppercase">
              Dev Tools (Ctrl+D)
            </h3>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => {
                  setActiveTool('DIALOG');
                  setShowMenu(false);
                }}
                className="rounded bg-slate-800 px-3 py-2 text-left text-sm hover:bg-cyan-700"
              >
                Dialog Editor
              </button>
              <button
                onClick={() => {
                  setActiveTool('ANIMATION');
                  setShowMenu(false);
                }}
                className="rounded bg-slate-800 px-3 py-2 text-left text-sm hover:bg-cyan-700"
              >
                Animation Editor
              </button>

              <button
                onClick={() => {
                  setActiveTool('TOWER_DEFENSE');
                  setShowMenu(false);
                }}
                className="rounded bg-slate-800 px-3 py-2 text-left text-sm hover:bg-cyan-700"
              >
                Tower Defense Map
              </button>
              <button
                onClick={() => {
                  setActiveTool('TD_ATTACK_PREVIEW');
                  setShowMenu(false);
                }}
                className="rounded bg-emerald-950 px-3 py-2 text-left text-sm font-bold text-emerald-200 hover:bg-emerald-800"
              >
                Attack &amp; Ability Lab
              </button>
              <button
                onClick={() => {
                  setActiveTool('TD_TOWER_SIZE_EDITOR');
                  setShowMenu(false);
                }}
                className="rounded bg-indigo-900 px-3 py-2 text-left text-sm hover:bg-indigo-700"
              >
                TD Tower Size Editor
              </button>
              <button
                onClick={() => {
                  setActiveTool('TD_LEVEL_EDITOR');
                  setShowMenu(false);
                }}
                className="rounded bg-slate-800 px-3 py-2 text-left text-sm hover:bg-cyan-700"
              >
                TD Level Editor
              </button>
              <button
                onClick={() => {
                  setActiveTool('TD_EFFECT_EDITOR');
                  setShowMenu(false);
                }}
                className="rounded bg-slate-800 px-3 py-2 text-left text-sm hover:bg-cyan-700"
              >
                VFX Effect Editor
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
                    gender: generateCreatureGender(c.id),
                    level: 1,
                    xp: 0,
                    equippedAttacks: TowerDefenseEngine.getDefaultAttacks(c.id),
                    isShiny: false,
                  }));
                  overwriteProfileCreatures(level1Starters);
                  setShowMenu(false);
                }}
                className="rounded border border-purple-500 bg-purple-900 px-3 py-2 text-left text-sm font-bold hover:bg-purple-700"
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
                    gender: generateCreatureGender(c.id),
                    level: 1,
                    xp: 0,
                    equippedAttacks: TowerDefenseEngine.getDefaultAttacks(c.id),
                    isShiny: true,
                  }));
                  overwriteProfileCreatures(level1Starters);
                  setShowMenu(false);
                }}
                className="animate-pulse rounded border border-amber-500 bg-amber-950 px-3 py-2 text-left text-sm font-bold text-amber-300 hover:bg-amber-700"
              >
                Set Shiny Starters + Bug ✨
              </button>
              <button
                onClick={() => {
                  const thirtyCreatures = Array.from({ length: 30 }).map(
                    () => ({
                      id: STARTER_CRAB.id,
                      speciesId: STARTER_CRAB.id,
                      gender: generateCreatureGender(STARTER_CRAB.id),
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
                className="rounded border border-purple-500 bg-purple-900 px-3 py-2 text-left text-sm font-bold hover:bg-purple-700"
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
                className="rounded border border-red-500 bg-red-900 px-3 py-2 text-left text-sm font-bold hover:bg-red-700"
              >
                Test TD Scripting
              </button>
              <button
                onClick={() => {
                  const val = !TowerDefenseEngine.forceShinySpawns;
                  TowerDefenseEngine.forceShinySpawns = val;
                  setForceShiny(val);
                }}
                className={`rounded border px-3 py-2 text-left text-sm font-bold transition-colors ${
                  forceShiny
                    ? 'border-amber-500 bg-amber-950 text-amber-300 hover:bg-amber-700'
                    : 'border-slate-700 bg-slate-800 text-slate-300'
                }`}
              >
                Force Shiny Spawns: {forceShiny ? 'ON ✨' : 'OFF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTool && (
        <Suspense
          fallback={
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded bg-black px-4 py-2 text-white">
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
          {activeTool === 'TD_EFFECT_EDITOR' && (
            <TDEffectEditor onClose={() => setActiveTool(null)} />
          )}
          {activeTool === 'TD_ATTACK_PREVIEW' && (
            <TDAttackPreview onClose={() => setActiveTool(null)} />
          )}
        </Suspense>
      )}
    </>
  );
}
