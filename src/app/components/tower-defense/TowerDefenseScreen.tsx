'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import PixiBattlefield from './PixiBattlefield';
import { FIRST_LEVEL } from '@/constants/tdLevels';

export default function TowerDefenseScreen({
  onClose,
}: {
  onClose: () => void;
}) {
  const engineRef = useRef(new TowerDefenseEngine(FIRST_LEVEL));

  const profiles = useGameStore((state) => state.profiles);
  const currentProfileId = useGameStore((state) => state.currentProfileId);
  const addCreatureToProfile = useGameStore(
    (state) => state.addCreatureToProfile
  );
  const profile = currentProfileId !== null ? profiles[currentProfileId] : null;
  const playerCreatures = profile?.creatures || [];

  const [uiLives, setUiLives] = useState(engineRef.current.lives);
  const [activeTowerIds, setActiveTowerIds] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uiUpdateToggle, setUiUpdateToggle] = useState(false);
  const isDraggingRef = useRef(false);

  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);

  // Subscribe to engine events that require a UI re-render
  useEffect(() => {
    const unsub = engineRef.current.events.subscribe((event) => {
      switch (event.type) {
        case 'TOWER_XP_GAINED':
        case 'TOWER_LEVELED_UP':
        case 'TOWER_EVOLVED':
          setUiUpdateToggle((prev) => !prev);
          break;
      }
    });
    return unsub;
  }, []);

  // The Game Loop
  const animate = (time: number) => {
    if (
      previousTimeRef.current != null &&
      isPlaying &&
      !isDraggingRef.current
    ) {
      // Clamp delta time to 50ms max to prevent huge jumps when tab is in background
      const deltaTime = Math.min(time - previousTimeRef.current, 50);

      // 1. Tick the engine simulation
      engineRef.current.tick(time, deltaTime);

      // 2. Sync essential UI state (could throttle this for more perf)
      if (engineRef.current.lives !== uiLives) {
        setUiLives(engineRef.current.lives);
        if (engineRef.current.lives <= 0) {
          setIsPlaying(false);
          alert('Game Over!');
        }
      }
    }
    previousTimeRef.current = time;
    if (isPlaying) {
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
    const creature = playerCreatures.find((c) => c.id === creatureId);
    if (!creature) return;
    engineRef.current.placeTower(creature, x, y);
    setActiveTowerIds(engineRef.current.towers.map((t: any) => t.creatureId));
  };

  const handleMapRemove = (creatureId: string) => {
    engineRef.current.removeTower(creatureId);
    setActiveTowerIds(engineRef.current.towers.map((t: any) => t.creatureId));
  };

  const handleEnemyCaptured = (enemyId: string) => {
    const capturedCreature = engineRef.current.captureEnemy(enemyId);
    if (capturedCreature && currentProfileId !== null) {
      addCreatureToProfile(currentProfileId, capturedCreature);
      // Optional: Show some success feedback
    }
  };

  return (
    <div className="fixed inset-0 z-9998 bg-slate-900 flex flex-col">
      <div className="bg-slate-800 p-4 shrink-0 flex items-center justify-between border-b border-cyan-800">
        <h2 className="text-xl font-bold text-cyan-400">Tower Defense</h2>
        <div className="flex items-center gap-4 text-white">
          <span>Lives: {uiLives}</span>
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
        engine={engineRef.current}
        onMapDrop={handleMapDrop}
        onMapRemove={handleMapRemove}
        onEnemyCaptured={handleEnemyCaptured}
        onDragStateChange={(isDragging) => {
          isDraggingRef.current = isDragging;
        }}
      />

      <div className="bg-slate-800 p-4 shrink-0 flex items-center justify-center gap-4 overflow-x-auto border-t border-cyan-800">
        <div className="text-slate-400 mr-4 font-bold uppercase text-sm">
          Drag Creature to Place:
        </div>
        {playerCreatures.map((creature) => {
          const isActive = activeTowerIds.includes(creature.id);

          let displayLevel = creature.level;
          let displayXp = creature.xp;

          if (isActive) {
            const activeTower = engineRef.current.towers.find(
              (t) => t.creatureId === creature.id
            );
            if (activeTower) {
              displayLevel = activeTower.level;
              displayXp = activeTower.xp;
            }
          }

          return (
            <button
              key={creature.id}
              draggable={true}
              onDragStart={(e) => {
                isDraggingRef.current = true;
                e.dataTransfer.setData(
                  'application/tower-id',
                  creature.id.toString()
                );
                e.dataTransfer.effectAllowed = 'copy';
                const imgEl = e.currentTarget.querySelector('img');
                if (imgEl) {
                  // Approximate center of a 48x48 element
                  e.dataTransfer.setDragImage(imgEl, 24, 24);
                }
              }}
              onDragEnd={() => {
                isDraggingRef.current = false;
              }}
              className={`relative w-24 h-24 p-1 rounded flex flex-col items-center justify-center transition-all cursor-grab active:cursor-grabbing hover:scale-105 shrink-0 ${
                isActive
                  ? 'bg-cyan-800 border-2 border-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.6)] hover:bg-cyan-700'
                  : 'bg-slate-700 border-2 border-transparent hover:bg-slate-500'
              }`}
            >
              <img
                src={creature.spriteUrl}
                alt={creature.name}
                className="w-10 h-10 object-contain pointer-events-none"
              />
              <div className="flex flex-col items-center w-full mt-1 pointer-events-none">
                <span
                  className={`text-[9px] uppercase font-bold truncate w-full text-center leading-tight ${isActive ? 'text-cyan-100' : 'text-white'}`}
                >
                  {creature.name}
                </span>

                <div className="w-full flex items-center justify-between px-1 mt-0.5">
                  <span className="text-[8px] text-gray-300 leading-none">
                    Lv.{displayLevel}
                  </span>
                </div>

                <div className="w-full px-1 mt-0.5">
                  <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden border border-gray-600">
                    <div
                      className="h-full bg-cyan-400 transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(0, (displayXp / (displayLevel * 100)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </button>
          );
        })}

        {/* Permanent Capture Device Tool */}
        <div className="w-px h-16 bg-cyan-800 mx-2 flex-shrink-0" />
        <button
          draggable={true}
          onDragStart={(e) => {
            isDraggingRef.current = true;
            e.dataTransfer.setData('application/capture-device', 'true');
            e.dataTransfer.effectAllowed = 'copy';
            const imgEl = e.currentTarget.querySelector('img');
            if (imgEl) {
              e.dataTransfer.setDragImage(imgEl, 24, 24);
            }
          }}
          onDragEnd={() => {
            isDraggingRef.current = false;
          }}
          className="w-24 h-24 p-2 rounded flex flex-col items-center justify-center transition-all cursor-grab active:cursor-grabbing hover:scale-105 bg-purple-900 border-2 border-purple-500 hover:bg-purple-800 shrink-0"
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
      </div>
    </div>
  );
}
