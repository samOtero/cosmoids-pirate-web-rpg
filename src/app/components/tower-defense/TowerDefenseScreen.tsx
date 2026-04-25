'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import {
  TowerDefenseEngine,
  TD_CREATURE_DEFS,
} from '@/engine/tower-defense/TowerDefenseEngine';
import PixiBattlefield, { PixiBattlefieldRef } from './PixiBattlefield';
import { ActiveAttackMenu } from './ActiveAttackMenu';
import { TowerButton } from './TowerButton';
import {
  ExecuteTDActionEventPayload,
  StoryProgression,
} from '@/types/baseGame';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { TDLevelData } from '@/engine/tower-defense/types';

/** Resolve display info (name, spriteUrl) for a creature from its species definition. */
function resolveSpeciesVisuals(speciesId: string): {
  name: string;
  spriteUrl: string;
} {
  const baseDef = TD_CREATURE_DEFS[speciesId]?.baseCreature;
  return {
    name: baseDef?.name ?? speciesId,
    spriteUrl: baseDef?.spriteUrl ?? '',
  };
}

export default function TowerDefenseScreen({
  levelData,
  onClose,
  onWin,
  onLose,
}: {
  levelData: TDLevelData;
  onClose: () => void;
  onWin?: () => void;
  onLose?: () => void;
}) {
  const profiles = useGameStore((state) => state.profiles);
  const currentProfileId = useGameStore((state) => state.currentProfileId);
  const addCreatureToProfile = useGameStore(
    (state) => state.addCreatureToProfile
  );
  const eventQueue = useGameStore((state) => state.eventQueue);
  const processNextEvent = useGameStore((state) => state.processNextEvent);
  const updateCreatures = useGameStore((state) => state.updateCreatures);

  const profile = currentProfileId !== null ? profiles[currentProfileId] : null;

  const hasEndedRef = useRef(false);
  const playerCreatures = (profile?.creatures || []).slice(0, 6);

  const engineRef = useRef<TowerDefenseEngine>(null!);
  if (!engineRef.current) {
    engineRef.current = new TowerDefenseEngine(levelData, playerCreatures);
  }

  const [uiLives, setUiLives] = useState(engineRef.current.lives);
  const [uiElapsedSeconds, setUiElapsedSeconds] = useState(0);
  const lastSecondRef = useRef(0);
  const [activeTowerIds, setActiveTowerIds] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uiUpdateToggle, setUiUpdateToggle] = useState(false);
  const [selectedCreatureId, setSelectedCreatureId] = useState<string | null>(
    null
  );
  const [wasPlayingBeforeMenu, setWasPlayingBeforeMenu] = useState(false);
  const [learningAttack, setLearningAttack] = useState<{
    towerId: string;
    attackDefId: string;
  } | null>(null);
  const [replaceAttackPrompt, setReplaceAttackPrompt] = useState<{
    towerId: string;
    newAttackDefId: string;
  } | null>(null);
  const dragStateRef = useRef<'tower' | 'capture' | false>(false);
  const justDraggedRef = useRef(false);
  const pixiRef = useRef<PixiBattlefieldRef>(null);

  const DRAG_THRESHOLD = 10; // pixels before a pointerdown becomes a drag
  const pendingDragRef = useRef<{
    type: 'tower' | 'capture';
    id?: string;
    imageUrl?: string;
    name?: string;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const [globalDrag, setGlobalDrag] = useState<{
    type: 'tower' | 'capture';
    id?: string;
    imageUrl?: string;
    name?: string;
    offsetX: number;
    offsetY: number;
    x: number;
    y: number;
  } | null>(null);

  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);

  const [hasStarted, setHasStarted] = useState(false);
  const [introState, setIntroState] = useState<'ready' | 'go' | 'none'>(
    'ready'
  );
  const [outroState, setOutroState] = useState<'none' | 'win' | 'lose'>('none');

  const saveTowerProgress = () => {
    if (currentProfileId === null) return;

    if (engineRef.current.roster.length > 0) {
      updateCreatures(engineRef.current.roster);
    }
  };

  useEffect(() => {
    if (introState === 'ready') {
      const t = setTimeout(() => setIntroState('go'), 1000);
      return () => clearTimeout(t);
    } else if (introState === 'go') {
      const t = setTimeout(() => {
        setIntroState('none');
        setIsPlaying(true);
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [introState]);

  useEffect(() => {
    if (outroState === 'win') {
      const t = setTimeout(() => {
        if (onWin) onWin();
      }, 3000);
      return () => clearTimeout(t);
    } else if (outroState === 'lose') {
      const t = setTimeout(() => {
        if (onLose) onLose();
        else alert('Game Over!');
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [outroState, onWin, onLose]);

  useEffect(() => {
    if (isPlaying && !hasStarted) {
      setHasStarted(true);
    }
  }, [isPlaying, hasStarted]);

  // Subscribe to engine events that require a UI re-render
  useEffect(() => {
    const unsub = engineRef.current.events.subscribe((event) => {
      switch (event.type) {
        case 'TOWER_XP_GAINED':
        case 'TOWER_LEVELED_UP':
        case 'TOWER_EVOLVED':
          setUiUpdateToggle((prev) => !prev);
          break;
        case 'TOWER_LEARNED_ATTACK':
          setIsPlaying(false);
          setLearningAttack({
            towerId: event.towerId,
            attackDefId: event.attackDefId,
          });
          setUiUpdateToggle((prev) => !prev);
          break;
        case 'TOWER_ASK_REPLACE_ATTACK':
          setIsPlaying(false);
          setReplaceAttackPrompt({
            towerId: event.towerId,
            newAttackDefId: event.newAttackDefId,
          });
          setUiUpdateToggle((prev) => !prev);
          break;
      }
    });
    return unsub;
  }, []);

  // Listen for global TD action events
  useEffect(() => {
    if (eventQueue.length > 0) {
      const nextEvent = eventQueue[0];
      if (nextEvent.type === 'EXECUTE_TD_ACTION') {
        const payload = nextEvent.payload as ExecuteTDActionEventPayload;
        const action = payload.action;

        switch (action.type) {
          case 'SPAWN_ENVIRONMENT_UNIT':
            engineRef.current.spawnEnvironmentUnit(
              action.unitId,
              action.tdConfigId,
              action.position,
              action.facingDirection,
              action.speed
            );
            break;
          case 'MOVE_ENVIRONMENT_UNIT':
            engineRef.current.moveEnvironmentUnit(
              action.unitId,
              action.path,
              action.speed
            );
            break;
          case 'REMOVE_ENVIRONMENT_UNIT':
            engineRef.current.removeEnvironmentUnit(action.unitId);
            break;
        }

        // Action is executed, move to the next event
        processNextEvent();
      }
    }
  }, [eventQueue, processNextEvent]);

  // The Game Loop
  const animate = (time: number) => {
    if (previousTimeRef.current != null && isPlaying && !dragStateRef.current) {
      // Clamp delta time to 50ms max to prevent huge jumps when tab is in background
      const deltaTime = Math.min(time - previousTimeRef.current, 50);

      // 1. Tick the engine simulation
      engineRef.current.tick(time, deltaTime);

      // 2. Sync essential UI state (could throttle this for more perf)
      if (engineRef.current.lives !== uiLives) {
        setUiLives(engineRef.current.lives);
        if (engineRef.current.lives <= 0 && !hasEndedRef.current) {
          hasEndedRef.current = true;
          setIsPlaying(false);
          saveTowerProgress();
          setOutroState('lose'); // Show defeat screen before callback
        }
      }

      const currentSec = Math.floor(engineRef.current.elapsedTimeMs / 1000);
      if (currentSec !== lastSecondRef.current) {
        lastSecondRef.current = currentSec;
        setUiElapsedSeconds(currentSec);
      }

      // 3. Check win condition
      // Time-based survive win condition
      const surviveWin =
        engineRef.current.surviveUntil &&
        engineRef.current.surviveUntil > 0 &&
        engineRef.current.elapsedTimeMs >=
          engineRef.current.surviveUntil * 1000 &&
        engineRef.current.lives > 0;

      const normalWin =
        engineRef.current.hasFinishedAllWaves &&
        engineRef.current.enemies.length === 0 &&
        engineRef.current.lives > 0;

      if ((surviveWin || normalWin) && !hasEndedRef.current) {
        hasEndedRef.current = true;
        setIsPlaying(false);
        saveTowerProgress();
        setOutroState('win'); // Show win screen before callback
      }
    }
    previousTimeRef.current = time;
    if (isPlaying && !hasEndedRef.current) {
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      previousTimeRef.current = null;
    };
  }, [isPlaying, uiLives]); // Dependencies for state sync closure

  const handleMapDrop = (creatureId: string, x: number, y: number) => {
    engineRef.current.placeTower(creatureId, x, y);
    setActiveTowerIds(engineRef.current.towers.map((t: any) => t.creature.id));
  };

  const handleMapRemove = (creatureId: string) => {
    engineRef.current.removeTower(creatureId);
    setActiveTowerIds(engineRef.current.towers.map((t: any) => t.creature.id));
  };

  const handleEnemyCaptured = (enemyId: string) => {
    const capturedCreature = engineRef.current.captureEnemy(enemyId);
    if (capturedCreature && currentProfileId !== null) {
      addCreatureToProfile(currentProfileId, capturedCreature);
      // Optional: Show some success feedback
    }
  };

  return (
    <div 
      className="fixed inset-0 z-9998 bg-slate-900 flex flex-col touch-none"
      onPointerMove={(e) => {
        // Check if a pending drag should become a real drag
        if (pendingDragRef.current && !globalDrag) {
          const pd = pendingDragRef.current;
          const dx = e.clientX - pd.startX;
          const dy = e.clientY - pd.startY;
          if (Math.sqrt(dx * dx + dy * dy) >= DRAG_THRESHOLD) {
            // Threshold exceeded — activate real drag
            dragStateRef.current = pd.type;
            setGlobalDrag({
              type: pd.type,
              id: pd.id,
              imageUrl: pd.imageUrl,
              name: pd.name,
              offsetX: pd.offsetX,
              offsetY: pd.offsetY,
              x: e.clientX,
              y: e.clientY,
            });
            pendingDragRef.current = null;
          }
          return;
        }
        if (globalDrag) {
          setGlobalDrag((prev) => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
          if (pixiRef.current) {
            pixiRef.current.handleExternalMove(e.clientX, e.clientY, globalDrag.type);
          }
        }
      }}
      onPointerUp={(e) => {
        // Pending drag that never exceeded threshold — treat as a click
        if (pendingDragRef.current) {
          pendingDragRef.current = null;
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
          }
          return;
        }
        // Real drag completed — do the drop
        if (globalDrag) {
          if (pixiRef.current) {
            pixiRef.current.handleExternalDrop(
              e.clientX, 
              e.clientY, 
              globalDrag.type === 'tower' ? (globalDrag.id || null) : null, 
              globalDrag.type === 'capture'
            );
          }
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
          }
          justDraggedRef.current = true;
          dragStateRef.current = false;
          setGlobalDrag(null);
        }
      }}
      onPointerCancel={(e) => {
        // Clear pending drag on cancel
        if (pendingDragRef.current) {
          pendingDragRef.current = null;
        }
        if (globalDrag) {
          if (pixiRef.current) {
            pixiRef.current.handleExternalLeave();
          }
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
          }
          dragStateRef.current = false;
          setGlobalDrag(null);
        }
      }}
    >
      {introState !== 'none' && (
        <div className="fixed inset-0 z-10000 bg-black/60 flex items-center justify-center pointer-events-none">
          <div className="text-7xl md:text-9xl font-black italic text-transparent bg-clip-text bg-linear-to-br from-yellow-300 to-red-500 drop-shadow-[0_0_25px_rgba(255,165,0,0.8)] uppercase animate-bounce pr-8 pb-4">
            {introState === 'ready' ? 'Ready!' : 'GO!'}
          </div>
        </div>
      )}

      {outroState !== 'none' && (
        <div className="fixed inset-0 z-10000 bg-black/80 flex items-center justify-center pointer-events-none transition-opacity duration-1000">
          {outroState === 'win' ? (
            <div className="text-7xl md:text-9xl font-black italic text-transparent bg-clip-text bg-linear-to-br from-green-400 to-blue-500 drop-shadow-[0_0_25px_rgba(0,255,128,0.8)] uppercase animate-bounce pr-8 pb-4">
              You Win!
            </div>
          ) : (
            <div className="text-7xl md:text-9xl font-black text-red-600 drop-shadow-[0_0_35px_rgba(255,0,0,1)] uppercase tracking-widest animate-pulse pr-8 pb-4">
              Defeat!
            </div>
          )}
        </div>
      )}

      <div className="bg-slate-800 p-4 shrink-0 flex items-center justify-between border-b border-cyan-800">
        <h2 className="text-xl font-bold text-cyan-400">Tower Defense</h2>
        <div className="flex items-center gap-4 text-white">
          {engineRef.current.surviveUntil &&
            engineRef.current.surviveUntil > 0 &&
            hasStarted && (
              <span className="font-mono bg-slate-900 px-3 py-1 rounded text-yellow-400 border border-yellow-700/50 shadow-inner">
                Time:{' '}
                {Math.max(0, engineRef.current.surviveUntil - uiElapsedSeconds)}
                s
              </span>
            )}
          <span className="font-mono bg-slate-900 px-3 py-1 rounded text-red-400 border border-red-900/50 shadow-inner">
            Lives: {uiLives}
          </span>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 rounded font-bold"
          >
            {isPlaying ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded font-bold"
          >
            Close
          </button>
        </div>
      </div>

      <PixiBattlefield
        ref={pixiRef}
        engine={engineRef.current}
        backgroundUrl={levelData.backgroundUrl}
        backgroundScale={levelData.backgroundScale}
        onMapDrop={handleMapDrop}
        onMapRemove={handleMapRemove}
        onEnemyCaptured={handleEnemyCaptured}
        onDragStateChange={(isDragging) => {
          dragStateRef.current = isDragging ? 'tower' : false;
        }}
        getDragState={() => dragStateRef.current}
      />

      <div className="bg-slate-800 p-4 shrink-0 flex items-center justify-center gap-4 overflow-x-auto border-t border-cyan-800 relative min-h-[140px]">
        {selectedCreatureId
          ? (() => {
              const creature = engineRef.current.roster.find(
                (c) => c.id === selectedCreatureId
              );
              if (!creature) return null;

              const tower = engineRef.current.towers.find(
                (t: any) => t.creature.id === selectedCreatureId
              );
              const isActive = activeTowerIds.includes(creature.id);
              const displayLevel = tower
                ? tower.creature.level
                : creature.level;
              const displayXp = tower ? tower.creature.xp : creature.xp;

              const equippedAttacks = tower
                ? tower.creature.equippedAttacks
                : TowerDefenseEngine.getDefaultAttacks(creature.speciesId);

              const activeAttackIndex = tower
                ? tower.selectedAttackIndex
                : engineRef.current.playerSelectedAttacks[creature.id] || 0;

              const { name, spriteUrl } = resolveSpeciesVisuals(
                creature.speciesId
              );

              return (
                <ActiveAttackMenu
                  creature={creature}
                  name={name}
                  spriteUrl={spriteUrl}
                  isActive={isActive}
                  displayLevel={displayLevel}
                  displayXp={displayXp}
                  equippedAttacks={equippedAttacks}
                  activeAttackIndex={activeAttackIndex}
                  onSelectAttack={(index) => {
                    engineRef.current.setTowerAttack(
                      selectedCreatureId!,
                      index
                    );
                    setUiUpdateToggle((prev) => !prev);
                  }}
                  onClose={() => {
                    setSelectedCreatureId(null);
                    if (wasPlayingBeforeMenu) setIsPlaying(true);
                  }}
                />
              );
            })()
          : null}

        <div className="text-slate-400 mr-4 font-bold uppercase text-sm">
          Drag Creature to Place:
        </div>
        {engineRef.current.roster.map((creature) => {
          const isActive = activeTowerIds.includes(creature.id);

          let displayLevel = creature.level;
          let displayXp = creature.xp;

          if (isActive) {
            const activeTower = engineRef.current.towers.find(
              (t: any) => t.creature.id === creature.id
            );
            if (activeTower) {
              displayLevel = activeTower.creature.level;
              displayXp = activeTower.creature.xp;
            }
          }

          const { name, spriteUrl } = resolveSpeciesVisuals(creature.speciesId);

          return (
            <TowerButton
              key={creature.id}
              creature={creature}
              name={name}
              spriteUrl={spriteUrl}
              isActive={isActive}
              displayLevel={displayLevel}
              displayXp={displayXp}
              onClick={() => {
                if (justDraggedRef.current) {
                  justDraggedRef.current = false;
                  return;
                }
                if (!dragStateRef.current) {
                  setSelectedCreatureId(creature.id);
                  setWasPlayingBeforeMenu(isPlaying);
                  setIsPlaying(false);
                }
              }}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                const rect = e.currentTarget.getBoundingClientRect();
                pendingDragRef.current = {
                  type: 'tower',
                  id: creature.id.toString(),
                  imageUrl: spriteUrl,
                  name: name,
                  startX: e.clientX,
                  startY: e.clientY,
                  offsetX: e.clientX - rect.left,
                  offsetY: e.clientY - rect.top,
                };
              }}
            />
          );
        })}

        {/* Permanent Capture Device Tool */}
        {!engineRef.current.disableCapture &&
          (profile?.storyProgression ?? 0) >=
            StoryProgression.DEFEAT_FIRST_BATTLE && (
            <React.Fragment>
              <div className="w-px h-16 bg-cyan-800 mx-2 shrink-0" />
              <button
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  const rect = e.currentTarget.getBoundingClientRect();
                  pendingDragRef.current = {
                    type: 'capture',
                    startX: e.clientX,
                    startY: e.clientY,
                    offsetX: e.clientX - rect.left,
                    offsetY: e.clientY - rect.top,
                  };
                }}
                className="relative z-0 w-24 h-24 p-2 rounded flex flex-col items-center justify-center transition-all cursor-grab active:cursor-grabbing hover:scale-105 bg-purple-900 border-2 border-purple-500 hover:bg-purple-800 shrink-0 touch-none"
              >
                {/* We'll use a placeholder icon or color for the capture device */}
                <div className="relative w-12 h-12 rounded-full border-4 border-white bg-red-500 flex items-center justify-center shadow-lg pointer-events-none mb-1 overflow-hidden">
                  <div className="w-full h-1 bg-black absolute top-1/2 -mt-[2px] left-0" />
                  <div className="w-4 h-4 bg-white rounded-full border-2 border-black z-10" />
                </div>
                <span className="text-[10px] mt-1 uppercase text-center leading-tight pointer-events-none text-purple-200 font-bold">
                  Capture
                </span>
              </button>
            </React.Fragment>
          )}
      </div>

      {/* Learning Attack Modal */}
      {learningAttack && (
        <div className="fixed inset-0 z-9999 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-800 p-6 rounded-lg text-center border-2 border-cyan-500 max-w-sm w-full">
            <h3 className="text-2xl font-bold text-cyan-400 mb-4">
              Learned a New Attack!
            </h3>
            <div className="bg-slate-900 p-4 rounded mb-6">
              <span className="font-bold text-xl text-yellow-400">
                {ATTACK_DEFS[learningAttack.attackDefId]?.name ||
                  learningAttack.attackDefId}
              </span>
              <p className="text-sm text-slate-300 mt-2">
                Power: {ATTACK_DEFS[learningAttack.attackDefId]?.power} |
                Cooldown:{' '}
                {(ATTACK_DEFS[learningAttack.attackDefId]?.cooldownMs || 1000) /
                  1000}
                s
              </p>
            </div>
            <button
              className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 rounded font-bold text-white w-full"
              onClick={() => {
                setLearningAttack(null);
                setIsPlaying(true);
              }}
            >
              Awesome!
            </button>
          </div>
        </div>
      )}

      {/* Replace Attack Modal */}
      {replaceAttackPrompt &&
        (() => {
          const tower = engineRef.current.towers.find(
            (t: any) => t.id === replaceAttackPrompt.towerId
          );
          if (!tower) return null;
          const newDef = ATTACK_DEFS[replaceAttackPrompt.newAttackDefId];

          return (
            <div className="fixed inset-0 z-9999 bg-black/80 flex items-center justify-center p-4">
              <div className="bg-slate-800 p-6 rounded-lg border-2 border-purple-500 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-bold text-purple-400 mb-2">
                  Maximum Attacks Reached!
                </h3>
                <p className="text-slate-300 mb-6">
                  This creature wants to learn{' '}
                  <span className="font-bold text-yellow-400">
                    {newDef?.name}
                  </span>
                  , but already knows 4 attacks. Choose an attack to forget, or
                  cancel.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {/* Current Attacks */}
                  {tower.creature.equippedAttacks.map(
                    (atk: string, idx: number) => {
                      const def = ATTACK_DEFS[atk];
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            engineRef.current.replaceTowerAttack(
                              tower.id,
                              idx,
                              replaceAttackPrompt.newAttackDefId
                            );
                            setReplaceAttackPrompt(null);
                            // The engine will emit TOWER_LEARNED_ATTACK, which will show the other modal.
                          }}
                          className="p-3 bg-slate-700 hover:bg-red-900/50 border border-slate-600 hover:border-red-500 rounded text-left transition-colors flex flex-col group"
                        >
                          <span className="font-bold text-slate-200 group-hover:text-red-400">
                            Forget {def?.name}
                          </span>
                          <span className="text-xs text-slate-400 mt-1 line-clamp-2">
                            Power: {def?.power}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>

                {/* New Attack Info & Cancel */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-slate-700 pt-4">
                  <div className="flex-1">
                    <div className="font-bold text-yellow-400">
                      New: {newDef?.name}
                    </div>
                    <div className="text-sm text-slate-300">
                      Power: {newDef?.power} | Cooldown:{' '}
                      {(newDef?.cooldownMs || 1000) / 1000}s
                    </div>
                  </div>
                  <button
                    className="px-6 py-2 bg-slate-600 hover:bg-slate-500 rounded font-bold text-white whitespace-nowrap"
                    onClick={() => {
                      setReplaceAttackPrompt(null);
                      setIsPlaying(true);
                    }}
                  >
                    Do Not Learn
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {globalDrag && (
        <div
          className="fixed pointer-events-none z-[10001]"
          style={{
            left: globalDrag.x - globalDrag.offsetX,
            top: globalDrag.y - globalDrag.offsetY,
          }}
        >
          {globalDrag.type === 'tower' ? (
            <div className="w-24 h-24 p-1 rounded flex flex-col items-center justify-center bg-cyan-800 border-2 border-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.6)] opacity-80 scale-105">
              {globalDrag.imageUrl && (
                <img
                  src={globalDrag.imageUrl}
                  alt={globalDrag.name}
                  className="w-10 h-10 object-contain pointer-events-none"
                />
              )}
              <span className="text-[9px] uppercase font-bold truncate w-full text-center leading-tight text-cyan-100 mt-1">
                {globalDrag.name}
              </span>
            </div>
          ) : (
            <div className="w-24 h-24 p-2 rounded flex flex-col items-center justify-center bg-purple-900 border-2 border-purple-500 opacity-80 scale-105">
              <div className="relative w-12 h-12 rounded-full border-4 border-white bg-red-500 flex items-center justify-center shadow-lg pointer-events-none mb-1 overflow-hidden">
                <div className="w-full h-1 bg-black absolute top-1/2 -mt-[2px] left-0" />
                <div className="w-4 h-4 bg-white rounded-full border-2 border-black z-10" />
              </div>
              <span className="text-[10px] mt-1 uppercase text-center leading-tight text-purple-200 font-bold">
                Capture
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
