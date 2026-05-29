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
import { TDStatSnapshot } from '@/engine/tower-defense/events/TDEventBus';

type QueuedModal =
  | {
      type: 'LEVEL_UP';
      towerId: string;
      speciesId: string;
      prevLevel: number;
      newLevel: number;
      prevStats: TDStatSnapshot;
      newStats: TDStatSnapshot;
    }
  | {
      type: 'LEARNED_ATTACK';
      towerId: string;
      attackDefId: string;
    }
  | {
      type: 'ASK_REPLACE_ATTACK';
      towerId: string;
      newAttackDefId: string;
    };

const sortModalQueue = (queue: QueuedModal[]): QueuedModal[] => {
  const typePriority = {
    'LEVEL_UP': 1,
    'LEARNED_ATTACK': 2,
    'ASK_REPLACE_ATTACK': 3,
  };
  return [...queue].sort((a, b) => {
    if (a.towerId !== b.towerId) {
      return a.towerId.localeCompare(b.towerId);
    }
    const prioA = typePriority[a.type] || 99;
    const prioB = typePriority[b.type] || 99;
    if (prioA !== prioB) {
      return prioA - prioB;
    }
    if (a.type === 'LEVEL_UP' && b.type === 'LEVEL_UP') {
      return a.newLevel - b.newLevel;
    }
    return 0;
  });
};

/** Resolve display info (name, spriteUrl) for a creature from its species definition. */
function resolveSpeciesVisuals(speciesId: string): {
  name: string;
  spriteUrl: string;
} {
  const baseDef = TD_CREATURE_DEFS[speciesId]?.baseCreature;
  return {
    name: baseDef?.name ?? speciesId,
    spriteUrl: baseDef?.iconImg || baseDef?.spriteUrl || '',
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
  const isPremadeLevel = !!levelData.premadeRoster;
  const playerCreatures = isPremadeLevel
    ? levelData.premadeRoster!
    : (profile?.creatures || []).slice(0, 6);

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
  const [modalQueue, setModalQueue] = useState<QueuedModal[]>([]);
  const [wasPlayingBeforeModals, setWasPlayingBeforeModals] = useState(false);
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
    if (isPremadeLevel) return; // Challenge mode: don't persist progress
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

  // Manage pausing and unpausing of the game loop based on modalQueue state
  useEffect(() => {
    if (modalQueue.length > 0 && isPlaying) {
      setWasPlayingBeforeModals(true);
      setIsPlaying(false);
    }
  }, [modalQueue.length, isPlaying]);

  const closeActiveModal = () => {
    setModalQueue((prev) => {
      const next = prev.slice(1);
      if (next.length === 0) {
        if (wasPlayingBeforeModals) {
          setIsPlaying(true);
          setWasPlayingBeforeModals(false);
        }
      }
      return next;
    });
  };

  // Subscribe to engine events that require a UI re-render
  useEffect(() => {
    const unsub = engineRef.current.events.subscribe((event) => {
      switch (event.type) {
        case 'TOWER_XP_GAINED':
        case 'TOWER_EVOLVED':
          setUiUpdateToggle((prev) => !prev);
          break;
        case 'TOWER_LEVELED_UP':
          setModalQueue((prev) => {
            const existingIdx = prev.findIndex(
              (m) => m.type === 'LEVEL_UP' && m.towerId === event.towerId
            );

            if (existingIdx !== -1) {
              const next = [...prev];
              const existing = next[existingIdx] as Extract<QueuedModal, { type: 'LEVEL_UP' }>;
              next[existingIdx] = {
                ...existing,
                newLevel: event.newLevel,
                newStats: event.newStats,
              };
              return sortModalQueue(next);
            } else {
              const added: QueuedModal = {
                type: 'LEVEL_UP',
                towerId: event.towerId,
                speciesId: event.speciesId,
                prevLevel: event.prevLevel,
                newLevel: event.newLevel,
                prevStats: event.prevStats,
                newStats: event.newStats,
              };
              return sortModalQueue([...prev, added]);
            }
          });
          setUiUpdateToggle((prev) => !prev);
          break;
        case 'TOWER_LEARNED_ATTACK':
          setModalQueue((prev) => {
            const added: QueuedModal = {
              type: 'LEARNED_ATTACK',
              towerId: event.towerId,
              attackDefId: event.attackDefId,
            };
            return sortModalQueue([...prev, added]);
          });
          setUiUpdateToggle((prev) => !prev);
          break;
        case 'TOWER_ASK_REPLACE_ATTACK':
          setModalQueue((prev) => {
            const added: QueuedModal = {
              type: 'ASK_REPLACE_ATTACK',
              towerId: event.towerId,
              newAttackDefId: event.newAttackDefId,
            };
            return sortModalQueue([...prev, added]);
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
    if (capturedCreature && currentProfileId !== null && !isPremadeLevel) {
      addCreatureToProfile(currentProfileId, capturedCreature);
    }
    // In challenge mode, the captured creature is still usable in-level
    // (captureEnemy adds it to the engine roster) but won't persist to profile.
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
          setGlobalDrag((prev) =>
            prev ? { ...prev, x: e.clientX, y: e.clientY } : null
          );
          if (pixiRef.current) {
            pixiRef.current.handleExternalMove(
              e.clientX,
              e.clientY,
              globalDrag.type
            );
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
              globalDrag.type === 'tower' ? globalDrag.id || null : null,
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

      <div className="bg-slate-800 p-2 lg:p-4 shrink-0 flex flex-wrap items-center justify-between border-b border-cyan-800 gap-2">
        <h2 className="text-lg lg:text-xl font-bold text-cyan-400 hidden lg:block">Tower Defense</h2>
        <div className="flex items-center gap-2 lg:gap-4 text-white w-full lg:w-auto justify-between lg:justify-end">
          {engineRef.current.surviveUntil &&
            engineRef.current.surviveUntil > 0 &&
            hasStarted && (
              <span className="font-mono bg-slate-900 px-2 py-1 lg:px-3 lg:py-1 rounded text-yellow-400 border border-yellow-700/50 shadow-inner text-sm lg:text-base">
                Time:{' '}
                {Math.max(0, engineRef.current.surviveUntil - uiElapsedSeconds)}
                s
              </span>
            )}
          <span className="font-mono bg-slate-900 px-2 py-1 lg:px-3 lg:py-1 rounded text-red-400 border border-red-900/50 shadow-inner text-sm lg:text-base flex-1 lg:flex-none text-center">
            Lives: {uiLives}
          </span>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3 py-1 lg:px-4 lg:py-2 bg-cyan-700 hover:bg-cyan-600 rounded font-bold text-sm lg:text-base"
          >
            {isPlaying ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1 lg:px-4 lg:py-2 bg-red-600 hover:bg-red-500 rounded font-bold text-sm lg:text-base"
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

      <div className="bg-slate-800 p-2 lg:p-4 shrink-0 flex items-center justify-start lg:justify-center gap-2 lg:gap-4 overflow-x-auto border-t border-cyan-800 relative min-h-[90px] lg:min-h-[140px]">
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

        <div className="text-slate-400 mr-2 lg:mr-4 font-bold uppercase text-xs lg:text-sm shrink-0 hidden lg:block">
          Drag to Place:
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
        {!engineRef.current.disableCapture && (
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
                className="relative z-0 w-16 h-16 lg:w-24 lg:h-24 p-1 lg:p-2 rounded flex flex-col items-center justify-center transition-all cursor-grab active:cursor-grabbing hover:scale-105 bg-purple-900 border-2 border-purple-500 hover:bg-purple-800 shrink-0 touch-none"
              >
                {/* We'll use a placeholder icon or color for the capture device */}
                <div className="relative w-8 h-8 lg:w-12 lg:h-12 rounded-full border-[3px] lg:border-4 border-white bg-red-500 flex items-center justify-center shadow-lg pointer-events-none mb-0 lg:mb-1 overflow-hidden">
                  <div className="w-full h-1 bg-black absolute top-1/2 -mt-[1px] lg:-mt-[2px] left-0" />
                  <div className="w-3 h-3 lg:w-4 lg:h-4 bg-white rounded-full border-2 border-black z-10" />
                </div>
                <span className="text-[8px] lg:text-[10px] mt-0.5 lg:mt-1 uppercase text-center leading-tight pointer-events-none text-purple-200 font-bold">
                  Capture
                </span>
              </button>
            </React.Fragment>
          )}
      </div>

      {/* Unified In-Level Modals Queue */}
      {modalQueue.length > 0 && (() => {
        const activeModal = modalQueue[0];
        
        if (activeModal.type === 'LEVEL_UP') {
          const { name, spriteUrl } = resolveSpeciesVisuals(activeModal.speciesId);
          const { prevStats, newStats } = activeModal;

          const statsList = [
            { key: 'hp', label: 'HP', color: 'text-red-400' },
            { key: 'attack', label: 'Attack', color: 'text-orange-400' },
            { key: 'defense', label: 'Defense', color: 'text-blue-400' },
            { key: 'specialAttack', label: 'Sp. Attack', color: 'text-purple-400' },
            { key: 'specialDefense', label: 'Sp. Defense', color: 'text-cyan-400' },
          ] as const;

          return (
            <div
              className="fixed inset-0 z-9999 bg-black/80 flex items-center justify-center p-3 backdrop-blur-xs cursor-pointer select-none"
              onClick={closeActiveModal}
            >
              <div
                className="bg-slate-900 border-2 border-yellow-500/80 rounded-xl shadow-[0_0_30px_rgba(234,179,8,0.2)] w-full max-w-md lg:max-w-lg text-white flex flex-col p-3 overflow-hidden"
              >
                {/* Header */}
                <h3 className="text-center text-xl lg:text-3xl font-black italic tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] pb-1 mb-2 border-b border-yellow-500/20 uppercase">
                  Level Up!
                </h3>

                <div className="flex flex-row gap-4 items-center justify-center flex-1">
                  {/* Left Column: Image & Level Badge */}
                  <div className="flex flex-col items-center justify-center w-28 lg:w-36 shrink-0">
                    <div className="relative w-18 h-18 lg:w-24 lg:h-24 bg-gradient-to-b from-yellow-500/10 to-yellow-600/20 rounded-full p-2 border border-yellow-500/30 shadow-inner flex items-center justify-center">
                      {spriteUrl && (
                        <img
                          src={spriteUrl}
                          alt={name}
                          className="w-14 h-14 lg:w-20 lg:h-20 object-contain animate-bounce"
                        />
                      )}
                    </div>
                    <span className="font-black text-xs lg:text-sm text-yellow-400 mt-1.5 uppercase tracking-wide text-center truncate max-w-full">
                      {name}
                    </span>
                    <span className="bg-gradient-to-r from-yellow-500 to-orange-600 text-slate-950 font-extrabold text-[9px] lg:text-[11px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md text-center mt-1 animate-pulse">
                      Lv. {activeModal.prevLevel} ➔ {activeModal.newLevel}
                    </span>
                  </div>

                  {/* Right Column: Stats List */}
                  <div className="flex-1 flex flex-col gap-1 w-full max-w-xs">
                    {statsList.map(({ key, label, color }) => {
                      const prevVal = prevStats[key];
                      const newVal = newStats[key];
                      const diff = newVal - prevVal;
                      return (
                        <div
                          key={key}
                          className="bg-slate-800/60 hover:bg-slate-800/80 border border-slate-700/50 rounded-lg py-1 px-2.5 flex items-center justify-between text-[11px] lg:text-xs transition-colors"
                        >
                          <span className={`font-bold uppercase tracking-wider ${color}`}>
                            {label}
                          </span>
                          <div className="flex items-center font-mono">
                            <span className="text-slate-400">{prevVal}</span>
                            <span className="mx-1.5 text-yellow-500/80 text-[10px]">➔</span>
                            <span className="text-white font-bold">{newVal}</span>
                            <span className="ml-2 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 font-extrabold px-1.5 py-0.2 rounded text-[9px] lg:text-[10px] min-w-[24px] text-center">
                              +{diff}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer hint */}
                <div className="text-center text-[9px] lg:text-[10px] text-slate-500 animate-pulse mt-2 pt-1 border-t border-slate-800 uppercase tracking-widest font-semibold">
                  Tap anywhere to continue
                </div>
              </div>
            </div>
          );
        }

        if (activeModal.type === 'LEARNED_ATTACK') {
          const newDef = ATTACK_DEFS[activeModal.attackDefId];
          return (
            <div className="fixed inset-0 z-9999 bg-black/80 flex items-center justify-center p-4">
              <div className="bg-slate-800 p-6 rounded-lg text-center border-2 border-cyan-500 max-w-sm w-full shadow-lg">
                <h3 className="text-2xl font-bold text-cyan-400 mb-4">
                  Learned a New Attack!
                </h3>
                <div className="bg-slate-900 p-4 rounded mb-6">
                  <span className="font-bold text-xl text-yellow-400">
                    {newDef?.name || activeModal.attackDefId}
                  </span>
                  <p className="text-sm text-slate-300 mt-2">
                    Power: {newDef?.power} | Cooldown:{' '}
                    {(newDef?.cooldownMs || 1000) / 1000}s
                  </p>
                </div>
                <button
                  className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 rounded font-bold text-white w-full cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform"
                  onClick={closeActiveModal}
                >
                  Awesome!
                </button>
              </div>
            </div>
          );
        }

        if (activeModal.type === 'ASK_REPLACE_ATTACK') {
          const tower = engineRef.current.towers.find(
            (t: any) => t.id === activeModal.towerId
          );
          if (!tower) return null;
          const newDef = ATTACK_DEFS[activeModal.newAttackDefId];

          return (
            <div className="fixed inset-0 z-9999 bg-black/80 flex items-center justify-center p-4">
              <div className="bg-slate-800 p-6 rounded-lg border-2 border-purple-500 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg">
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
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
                              activeModal.newAttackDefId
                            );
                            closeActiveModal();
                          }}
                          className="p-3 bg-slate-700 hover:bg-red-900/50 border border-slate-600 hover:border-red-500 rounded text-left transition-colors flex flex-col group cursor-pointer"
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
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between border-t border-slate-700 pt-4">
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
                    className="px-6 py-2 bg-slate-600 hover:bg-slate-500 rounded font-bold text-white whitespace-nowrap cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform"
                    onClick={closeActiveModal}
                  >
                    Do Not Learn
                  </button>
                </div>
              </div>
            </div>
          );
        }

        return null;
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
            <div className="w-16 h-16 lg:w-24 lg:h-24 p-1 rounded flex flex-col items-center justify-center bg-cyan-800 border-2 border-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.6)] opacity-80 scale-105">
              {globalDrag.imageUrl && (
                <img
                  src={globalDrag.imageUrl}
                  alt={globalDrag.name}
                  className="w-8 h-8 lg:w-10 lg:h-10 object-contain pointer-events-none"
                />
              )}
              <span className="text-[7px] lg:text-[9px] uppercase font-bold truncate w-full text-center leading-tight text-cyan-100 mt-1">
                {globalDrag.name}
              </span>
            </div>
          ) : (
            <div className="w-16 h-16 lg:w-24 lg:h-24 p-1 lg:p-2 rounded flex flex-col items-center justify-center bg-purple-900 border-2 border-purple-500 opacity-80 scale-105">
              <div className="relative w-8 h-8 lg:w-12 lg:h-12 rounded-full border-[3px] lg:border-4 border-white bg-red-500 flex items-center justify-center shadow-lg pointer-events-none mb-0 lg:mb-1 overflow-hidden">
                <div className="w-full h-1 bg-black absolute top-1/2 -mt-[1px] lg:-mt-[2px] left-0" />
                <div className="w-3 h-3 lg:w-4 lg:h-4 bg-white rounded-full border-2 border-black z-10" />
              </div>
              <span className="text-[8px] lg:text-[10px] mt-0.5 lg:mt-1 uppercase text-center leading-tight text-purple-200 font-bold">
                Capture
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
