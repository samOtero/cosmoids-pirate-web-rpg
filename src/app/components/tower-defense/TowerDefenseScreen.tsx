'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
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
      type: 'LEARNED_ATTACK';
      towerId: string;
      attackDefId: string;
    }
  | {
      type: 'ASK_REPLACE_ATTACK';
      towerId: string;
      newAttackDefId: string;
    }
  | {
      type: 'CAPTURED_CREATURE';
      speciesId: string;
      wasSentToStorage: boolean;
    }
  | {
      type: 'SHINY_APPEARED';
      speciesId: string;
    }
  | {
      type: 'ASK_EVOLUTION';
      towerId: string;
      oldDefinitionId: string;
      newDefinitionId: string;
    };

const sortModalQueue = (queue: QueuedModal[]): QueuedModal[] => {
  const typePriority = {
    SHINY_APPEARED: -1,
    CAPTURED_CREATURE: 0,
    ASK_EVOLUTION: 1,
    LEARNED_ATTACK: 2,
    ASK_REPLACE_ATTACK: 3,
  };
  return [...queue].sort((a, b) => {
    if (a.type !== b.type) {
      const prioA = typePriority[a.type] ?? 99;
      const prioB = typePriority[b.type] ?? 99;
      return prioA - prioB;
    }
    const idA =
      'towerId' in a ? a.towerId : 'speciesId' in a ? a.speciesId : '';
    const idB =
      'towerId' in b ? b.towerId : 'speciesId' in b ? b.speciesId : '';
    return idA.localeCompare(idB);
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
  const [introState, setIntroState] = useState<
    'cameraPan' | 'ready' | 'go' | 'none'
  >(levelData.openingPan ? 'cameraPan' : 'ready');
  const [outroState, setOutroState] = useState<'none' | 'win' | 'lose'>('none');
  const isOutroReady = outroState !== 'none' && modalQueue.length === 0;

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
    // Progression decisions raised by the final enemy must finish before the
    // battle result is shown or handed back to the story event queue.
    if (!isOutroReady) return;

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
  }, [isOutroReady, outroState, onWin, onLose]);

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
          setUiUpdateToggle((prev) => !prev);
          break;
        case 'TOWER_ASK_EVOLUTION':
          setModalQueue((prev) => {
            const added: QueuedModal = {
              type: 'ASK_EVOLUTION',
              towerId: event.towerId,
              oldDefinitionId: event.oldDefinitionId,
              newDefinitionId: event.newDefinitionId,
            };
            return sortModalQueue([...prev, added]);
          });
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
        case 'SHINY_ENEMY_SPAWNED':
          setTimeout(() => {
            setModalQueue((prev) => {
              const added: QueuedModal = {
                type: 'SHINY_APPEARED',
                speciesId: event.enemyDefinitionId,
              };
              return sortModalQueue([...prev, added]);
            });
            setUiUpdateToggle((prev) => !prev);
          }, 500);
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
    const enemy = engineRef.current.enemies.find((e) => e.id === enemyId);
    if (!enemy) return;

    const speciesId = enemy.definitionId;
    const wasSentToStorage = profile ? profile.creatures.length >= 6 : false;

    const capturedCreature = engineRef.current.captureEnemy(enemyId);
    if (capturedCreature) {
      if (currentProfileId !== null && !isPremadeLevel) {
        addCreatureToProfile(currentProfileId, capturedCreature);
      }

      setModalQueue((prev) => {
        const added: QueuedModal = {
          type: 'CAPTURED_CREATURE',
          speciesId,
          wasSentToStorage,
        };
        return sortModalQueue([...prev, added]);
      });
      setUiUpdateToggle((prev) => !prev);
    }
  };

  return (
    <div
      className="fixed inset-0 z-9998 flex touch-none flex-col bg-slate-900"
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
              globalDrag.type,
              globalDrag.type === 'tower' ? globalDrag.id : undefined
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
      {(introState === 'ready' || introState === 'go') && (
        <div className="pointer-events-none fixed inset-0 z-10000 flex items-center justify-center bg-black/60">
          <div className="animate-bounce bg-linear-to-br from-yellow-300 to-red-500 bg-clip-text pr-8 pb-4 text-7xl font-black text-transparent uppercase italic drop-shadow-[0_0_25px_rgba(255,165,0,0.8)] md:text-9xl">
            {introState === 'ready' ? 'Ready!' : 'GO!'}
          </div>
        </div>
      )}

      {isOutroReady && (
        <div className="pointer-events-none fixed inset-0 z-10000 flex items-center justify-center bg-black/80 transition-opacity duration-1000">
          {outroState === 'win' ? (
            <div className="animate-bounce bg-linear-to-br from-green-400 to-blue-500 bg-clip-text pr-8 pb-4 text-7xl font-black text-transparent uppercase italic drop-shadow-[0_0_25px_rgba(0,255,128,0.8)] md:text-9xl">
              You Win!
            </div>
          ) : (
            <div className="animate-pulse pr-8 pb-4 text-7xl font-black tracking-widest text-red-600 uppercase drop-shadow-[0_0_35px_rgba(255,0,0,1)] md:text-9xl">
              Defeat!
            </div>
          )}
        </div>
      )}

      <div
        className={`flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-cyan-800 bg-slate-800 p-2 lg:p-4 ${
          introState === 'cameraPan' ? 'invisible' : ''
        }`}
      >
        <h2 className="hidden text-lg font-bold text-cyan-400 lg:block lg:text-xl">
          Tower Defense
        </h2>
        <div className="flex w-full items-center justify-between gap-2 text-white lg:w-auto lg:justify-end lg:gap-4">
          {engineRef.current.surviveUntil &&
            engineRef.current.surviveUntil > 0 &&
            hasStarted && (
              <span className="rounded border border-yellow-700/50 bg-slate-900 px-2 py-1 font-mono text-sm text-yellow-400 shadow-inner lg:px-3 lg:py-1 lg:text-base">
                Time:{' '}
                {Math.max(0, engineRef.current.surviveUntil - uiElapsedSeconds)}
                s
              </span>
            )}
          <span className="flex-1 rounded border border-red-900/50 bg-slate-900 px-2 py-1 text-center font-mono text-sm text-red-400 shadow-inner lg:flex-none lg:px-3 lg:py-1 lg:text-base">
            Lives: {uiLives}
          </span>
          <button
            onClick={() => {
              if (introState === 'none') setIsPlaying(!isPlaying);
            }}
            disabled={introState !== 'none'}
            className="rounded bg-cyan-700 px-3 py-1 text-sm font-bold hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50 lg:px-4 lg:py-2 lg:text-base"
          >
            {isPlaying ? 'Pause' : 'Start'}
          </button>
          <button
            onClick={onClose}
            className="rounded bg-red-600 px-3 py-1 text-sm font-bold hover:bg-red-500 lg:px-4 lg:py-2 lg:text-base"
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
        initialView={levelData.initialView}
        openingPan={levelData.openingPan}
        hideUi={introState === 'cameraPan'}
        onOpeningPanComplete={() => {
          setIntroState((current) =>
            current === 'cameraPan' ? 'ready' : current
          );
        }}
        onMapDrop={handleMapDrop}
        onMapRemove={handleMapRemove}
        onEnemyCaptured={handleEnemyCaptured}
        onDragStateChange={(isDragging) => {
          dragStateRef.current = isDragging ? 'tower' : false;
        }}
        getDragState={() => dragStateRef.current}
      />

      <div
        className={`relative flex min-h-[90px] shrink-0 items-center justify-start gap-2 overflow-x-auto border-t border-cyan-800 bg-slate-800 p-2 lg:min-h-[140px] lg:justify-center lg:gap-4 lg:p-4 ${
          introState === 'cameraPan' ? 'invisible' : ''
        }`}
      >
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

              const equippedAttacks = TowerDefenseEngine.getEquippedAttacks(
                tower ? tower.creature : creature
              );

              const activeAttackIndex = tower
                ? tower.selectedAttackIndex
                : engineRef.current.playerSelectedAttacks[creature.id] || 0;

              const activeTargetingMode = tower
                ? tower.targetingMode || 'first'
                : engineRef.current.playerSelectedTargetingModes[creature.id] ||
                  'first';

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
                  activeTargetingMode={activeTargetingMode}
                  onSelectTargetingMode={(mode) => {
                    engineRef.current.setTowerTargetingMode(
                      selectedCreatureId!,
                      mode
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

        <div className="mr-2 hidden shrink-0 text-xs font-bold text-slate-400 uppercase lg:mr-4 lg:block lg:text-sm">
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
            <div className="mr-2 ml-auto h-16 w-px shrink-0 bg-cyan-800 lg:ml-2" />
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
              className="relative z-0 flex h-16 w-16 shrink-0 cursor-grab touch-none flex-col items-center justify-center rounded border-2 border-purple-500 bg-purple-900 p-1 transition-all hover:scale-105 hover:bg-purple-800 active:cursor-grabbing lg:h-24 lg:w-24 lg:p-2"
            >
              {/* We'll use a placeholder icon or color for the capture device */}
              <div className="pointer-events-none relative mb-0 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-[3px] border-white bg-red-500 shadow-lg lg:mb-1 lg:h-12 lg:w-12 lg:border-4">
                <div className="absolute top-1/2 left-0 -mt-[1px] h-1 w-full bg-black lg:-mt-[2px]" />
                <div className="z-10 h-3 w-3 rounded-full border-2 border-black bg-white lg:h-4 lg:w-4" />
              </div>
              <span className="pointer-events-none mt-0.5 text-center text-[8px] leading-tight font-bold text-purple-200 uppercase lg:mt-1 lg:text-[10px]">
                Capture
              </span>
            </button>
          </React.Fragment>
        )}
      </div>

      {/* Unified In-Level Modals Queue */}
      {modalQueue.length > 0 &&
        (() => {
          const activeModal = modalQueue[0];

          if (activeModal.type === 'SHINY_APPEARED') {
            const { name, spriteUrl } = resolveSpeciesVisuals(
              activeModal.speciesId
            );
            return (
              <div className="fixed inset-0 z-9999 flex animate-[fadeIn_0.25s_ease-out] items-center justify-center bg-black/85 p-2 lg:p-4">
                <div className="flex w-full max-w-xs flex-row items-center gap-3 rounded-2xl border-2 border-amber-400 bg-slate-900/95 px-4 py-3 text-left shadow-[0_0_30px_rgba(245,158,11,0.55)] backdrop-blur-md lg:max-w-md lg:gap-5 lg:px-6 lg:py-4">
                  {/* Visuals on the Left for Mobile Landscape */}
                  <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-amber-500/30 bg-slate-800/80 p-1 shadow-inner lg:h-28 lg:w-28">
                    <div className="pointer-events-none absolute inset-0 bg-radial from-amber-500/20 to-transparent" />
                    {spriteUrl ? (
                      <img
                        src={spriteUrl}
                        alt={name}
                        className="z-10 h-14 w-14 scale-110 transform object-contain drop-shadow-[0_0_12px_rgba(245,158,11,0.6)] lg:h-20 lg:w-20"
                      />
                    ) : (
                      <div className="text-xs text-slate-500">No sprite</div>
                    )}
                    {/* CSS sparkles around the icon */}
                    <span className="absolute top-1 right-2 animate-pulse text-xs lg:text-sm">
                      ✨
                    </span>
                    <span className="absolute bottom-1 left-2 animate-pulse text-xs lg:text-sm">
                      ✨
                    </span>
                  </div>

                  {/* Text & Button on the Right */}
                  <div className="flex h-full min-h-[85px] flex-1 flex-col justify-between lg:min-h-[112px]">
                    <div>
                      <h3 className="mb-0.5 flex items-center gap-1 bg-linear-to-r from-amber-400 via-yellow-400 to-orange-400 bg-clip-text text-xs leading-tight font-black tracking-wider text-transparent uppercase lg:text-lg">
                        Shiny Cosmoids Appeared! ✨
                      </h3>
                      <p className="text-[10px] leading-snug text-slate-200 lg:text-sm">
                        A wild shiny{' '}
                        <span className="text-xs font-extrabold text-amber-300 lg:text-base">
                          {name}
                        </span>{' '}
                        has shown up on the map! Keep it weakened to capture it!
                      </p>
                    </div>

                    <button
                      className="mt-1.5 w-full cursor-pointer rounded-xl border border-amber-400/20 bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1 text-center text-[10px] font-bold text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:from-amber-400 hover:to-orange-400 hover:shadow-amber-500/25 active:scale-[0.98] lg:px-6 lg:py-2 lg:text-sm"
                      onClick={closeActiveModal}
                    >
                      Let's Catch It!
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          if (activeModal.type === 'CAPTURED_CREATURE') {
            const { name, spriteUrl } = resolveSpeciesVisuals(
              activeModal.speciesId
            );
            return (
              <div className="fixed inset-0 z-9999 flex animate-[fadeIn_0.25s_ease-out] items-center justify-center bg-black/85 p-2 lg:p-4">
                <div className="flex w-full max-w-xs flex-col items-center rounded-2xl border-2 border-purple-500 bg-slate-900/95 px-4 py-3 text-center shadow-[0_0_30px_rgba(168,85,247,0.4)] backdrop-blur-md lg:max-w-sm lg:px-6 lg:py-5">
                  <h3 className="mb-1 bg-linear-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-lg font-black tracking-wider text-transparent uppercase lg:mb-3 lg:text-2xl">
                    Cosmoid Captured!
                  </h3>

                  <div className="relative my-1 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-purple-500/30 bg-slate-800/80 p-1.5 shadow-inner lg:my-2 lg:h-24 lg:w-24">
                    <div className="pointer-events-none absolute inset-0 bg-radial from-purple-500/20 to-transparent" />
                    {spriteUrl ? (
                      <img
                        src={spriteUrl}
                        alt={name}
                        className="z-10 h-12 w-12 transform object-contain drop-shadow-[0_4px_10px_rgba(168,85,247,0.5)] transition-transform duration-300 hover:scale-110 lg:h-18 lg:w-18"
                      />
                    ) : (
                      <div className="text-xs text-slate-500">No sprite</div>
                    )}
                  </div>

                  <div className="mt-1 text-center lg:mt-2">
                    <p className="text-xs text-slate-200 lg:text-base">
                      You captured a{' '}
                      <span className="text-sm font-extrabold text-cyan-400 lg:text-lg">
                        {name}
                      </span>
                      !
                    </p>
                    {activeModal.wasSentToStorage ? (
                      <p className="mt-1 inline-block rounded-full border border-purple-800/50 bg-purple-950/60 px-2.5 py-0.5 text-[10px] font-semibold text-purple-300 shadow-sm lg:px-3 lg:py-1 lg:text-xs">
                        Sent to your storage box
                      </p>
                    ) : (
                      <p className="mt-1 inline-block rounded-full border border-green-800/30 bg-green-950/40 px-2.5 py-0.5 text-[10px] font-semibold text-green-400 lg:px-3 lg:py-1 lg:text-xs">
                        Added to your active party
                      </p>
                    )}
                  </div>

                  <button
                    className="mt-3 w-full cursor-pointer rounded-xl border border-purple-400/20 bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-1.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-500/25 active:scale-[0.98] lg:mt-5 lg:px-6 lg:py-2 lg:text-base"
                    onClick={closeActiveModal}
                  >
                    Awesome!
                  </button>
                </div>
              </div>
            );
          }

          if (activeModal.type === 'ASK_EVOLUTION') {
            const current = resolveSpeciesVisuals(activeModal.oldDefinitionId);
            const evolution = resolveSpeciesVisuals(activeModal.newDefinitionId);

            const acceptEvolution = () => {
              const evolved = engineRef.current.evolveTower(
                activeModal.towerId,
                activeModal.newDefinitionId
              );
              if (evolved) saveTowerProgress();
              setUiUpdateToggle((prev) => !prev);
              closeActiveModal();
            };

            const cancelEvolution = () => {
              engineRef.current.cancelTowerEvolution(activeModal.towerId);
              closeActiveModal();
            };

            return (
              <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/85 p-3">
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="evolution-title"
                  className="w-full max-w-md rounded-2xl border-2 border-emerald-400 bg-slate-900 p-5 text-center shadow-[0_0_35px_rgba(52,211,153,0.35)]"
                >
                  <h3
                    id="evolution-title"
                    className="text-2xl font-black text-emerald-300"
                  >
                    Evolution!
                  </h3>
                  <p className="mt-2 text-sm text-slate-200 sm:text-base">
                    {current.name} is ready to evolve into {evolution.name}.
                  </p>
                  <div className="my-5 flex items-center justify-center gap-4">
                    {[current, evolution].map((creature, index) => (
                      <React.Fragment key={creature.name}>
                        {index === 1 && (
                          <span className="text-2xl text-emerald-300" aria-hidden="true">
                            →
                          </span>
                        )}
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-emerald-500/40 bg-slate-800 p-2">
                            {creature.spriteUrl && (
                              <Image
                                src={creature.spriteUrl}
                                alt={creature.name}
                                width={72}
                                height={72}
                                className="h-full w-full object-contain"
                              />
                            )}
                          </div>
                          <span className="text-xs font-bold text-white sm:text-sm">
                            {creature.name}
                          </span>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button
                      className="flex-1 rounded-lg bg-slate-600 px-4 py-2 font-bold text-white hover:bg-slate-500"
                      onClick={cancelEvolution}
                    >
                      Cancel
                    </button>
                    <button
                      className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-500"
                      onClick={acceptEvolution}
                    >
                      Evolve!
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          if (activeModal.type === 'LEARNED_ATTACK') {
            const newDef = ATTACK_DEFS[activeModal.attackDefId];
            const tower = engineRef.current.towers.find(
              (candidate) => candidate.id === activeModal.towerId
            );
            const creatureVisuals = tower
              ? resolveSpeciesVisuals(tower.creature.speciesId)
              : { name: 'Your Cosmoid', spriteUrl: '' };
            const learnedAttackIndex =
              tower?.creature.equippedAttacks.findIndex(
                (attackId) => attackId === activeModal.attackDefId
              ) ?? -1;
            const isLearnedAttackActive =
              tower?.selectedAttackIndex === learnedAttackIndex;

            const makeLearnedAttackActive = () => {
              if (tower && learnedAttackIndex >= 0) {
                engineRef.current.setTowerAttack(
                  tower.creature.id,
                  learnedAttackIndex
                );
                setUiUpdateToggle((prev) => !prev);
              }
              closeActiveModal();
            };

            return (
              <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/80 p-2 sm:p-4">
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="learned-attack-title"
                  className="max-h-[calc(100dvh-1rem)] w-full max-w-xs overflow-y-auto rounded-xl border-2 border-cyan-500 bg-slate-800 p-3 text-center shadow-lg sm:p-5"
                >
                  <h3
                    id="learned-attack-title"
                    className="text-lg leading-tight font-bold text-cyan-400 sm:text-xl"
                  >
                    New Attack Learned!
                  </h3>
                  <div className="mt-2 flex items-center justify-center gap-2">
                    {creatureVisuals.spriteUrl && (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-cyan-500/40 bg-slate-900 p-1">
                        <Image
                          src={creatureVisuals.spriteUrl}
                          alt={`${creatureVisuals.name} icon`}
                          width={32}
                          height={32}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    )}
                    <p className="text-left text-sm leading-tight text-slate-200">
                      <span className="font-bold text-white">
                        {creatureVisuals.name}
                      </span>
                      <br />
                      learned
                    </p>
                  </div>
                  <div className="my-3 rounded-lg bg-slate-900 p-2.5 sm:p-3">
                    <span className="text-lg font-bold text-yellow-400 sm:text-xl">
                      {newDef?.name || activeModal.attackDefId}
                    </span>
                    <p className="mt-1 text-xs text-slate-300 sm:text-sm">
                      Power: {newDef?.power} · Cooldown:{' '}
                      {(newDef?.cooldownMs ?? 1000) / 1000}s
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="min-w-0 flex-1 cursor-pointer rounded-lg bg-slate-600 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-slate-500"
                      onClick={closeActiveModal}
                    >
                      Later
                    </button>
                    <button
                      className="min-w-0 flex-1 cursor-pointer rounded-lg bg-cyan-600 px-3 py-2 text-sm font-bold text-white transition-transform hover:scale-[1.02] hover:bg-cyan-500 active:scale-[0.98] disabled:cursor-default disabled:bg-cyan-800 disabled:text-cyan-200 disabled:hover:scale-100"
                      onClick={makeLearnedAttackActive}
                      disabled={!tower || learnedAttackIndex < 0}
                    >
                      {isLearnedAttackActive ? 'Already Active' : 'Make Active'}
                    </button>
                  </div>
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
              <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/80 p-4">
                <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border-2 border-purple-500 bg-slate-800 p-6 shadow-lg">
                  <h3 className="mb-2 text-2xl font-bold text-purple-400">
                    Maximum Attacks Reached!
                  </h3>
                  <p className="mb-6 text-slate-300">
                    This creature wants to learn{' '}
                    <span className="font-bold text-yellow-400">
                      {newDef?.name}
                    </span>
                    , but already knows 4 attacks. Choose an attack to forget,
                    or cancel.
                  </p>

                  <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
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
                            className="group flex cursor-pointer flex-col rounded border border-slate-600 bg-slate-700 p-3 text-left transition-colors hover:border-red-500 hover:bg-red-900/50"
                          >
                            <span className="font-bold text-slate-200 group-hover:text-red-400">
                              Forget {def?.name}
                            </span>
                            <span className="mt-1 line-clamp-2 text-xs text-slate-400">
                              Power: {def?.power}
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>

                  {/* New Attack Info & Cancel */}
                  <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-700 pt-4 lg:flex-row">
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
                      className="cursor-pointer rounded bg-slate-600 px-6 py-2 font-bold whitespace-nowrap text-white transition-transform hover:scale-[1.02] hover:bg-slate-500 active:scale-[0.98]"
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
          className="pointer-events-none fixed z-[10001]"
          style={{
            left: globalDrag.x - globalDrag.offsetX,
            top: globalDrag.y - globalDrag.offsetY,
          }}
        >
          {globalDrag.type === 'tower' ? (
            <div className="flex h-16 w-16 scale-105 flex-col items-center justify-center rounded border-2 border-cyan-300 bg-cyan-800 p-1 opacity-80 shadow-[0_0_15px_rgba(34,211,238,0.6)] lg:h-24 lg:w-24">
              {globalDrag.imageUrl && (
                <img
                  src={globalDrag.imageUrl}
                  alt={globalDrag.name}
                  className="pointer-events-none h-8 w-8 object-contain lg:h-10 lg:w-10"
                />
              )}
              <span className="mt-1 w-full truncate text-center text-[7px] leading-tight font-bold text-cyan-100 uppercase lg:text-[9px]">
                {globalDrag.name}
              </span>
            </div>
          ) : (
            <div className="flex h-16 w-16 scale-105 flex-col items-center justify-center rounded border-2 border-purple-500 bg-purple-900 p-1 opacity-80 lg:h-24 lg:w-24 lg:p-2">
              <div className="pointer-events-none relative mb-0 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-[3px] border-white bg-red-500 shadow-lg lg:mb-1 lg:h-12 lg:w-12 lg:border-4">
                <div className="absolute top-1/2 left-0 -mt-[1px] h-1 w-full bg-black lg:-mt-[2px]" />
                <div className="z-10 h-3 w-3 rounded-full border-2 border-black bg-white lg:h-4 lg:w-4" />
              </div>
              <span className="mt-0.5 text-center text-[8px] leading-tight font-bold text-purple-200 uppercase lg:mt-1 lg:text-[10px]">
                Capture
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
