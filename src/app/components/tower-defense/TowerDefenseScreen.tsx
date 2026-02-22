'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  STARTER_CRAB,
  STARTER_IGUANA,
  STARTER_MONKEY,
} from '@/constants/creatures';
import { TowerDefenseEngine } from '@/engine/tower-defense/TowerDefenseEngine';
import PixiBattlefield from './PixiBattlefield';

const PLAYER_CREATURES = [STARTER_CRAB, STARTER_IGUANA, STARTER_MONKEY];

export default function TowerDefenseScreen({
  onClose,
}: {
  onClose: () => void;
}) {
  const engineRef = useRef(new TowerDefenseEngine());

  const [uiMoney, setUiMoney] = useState(engineRef.current.money);
  const [uiLives, setUiLives] = useState(engineRef.current.lives);
  const [isPlaying, setIsPlaying] = useState(false);

  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);

  // The Game Loop
  const animate = (time: number) => {
    if (previousTimeRef.current != null && isPlaying) {
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
      if (engineRef.current.money !== uiMoney) {
        setUiMoney(engineRef.current.money);
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
  }, [isPlaying, uiLives, uiMoney]); // Dependencies for state sync closure

  const handleMapDrop = (defId: string, x: number, y: number) => {
    const success = engineRef.current.addTower(defId, x, y);
    if (success) {
      setUiMoney(engineRef.current.money);
    }
  };

  return (
    <div className="fixed inset-0 z-9998 bg-slate-900 flex flex-col">
      <div className="bg-slate-800 p-4 shrink-0 flex items-center justify-between border-b border-cyan-800">
        <h2 className="text-xl font-bold text-cyan-400">Tower Defense</h2>
        <div className="flex items-center gap-4 text-white">
          <span>Money: ${uiMoney}</span>
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

      <PixiBattlefield engine={engineRef.current} onMapDrop={handleMapDrop} />

      <div className="bg-slate-800 p-4 shrink-0 flex items-center justify-center gap-4 overflow-x-auto border-t border-cyan-800">
        <div className="text-slate-400 mr-4 font-bold uppercase text-sm">
          Drag Creature to Place ($50):
        </div>
        {PLAYER_CREATURES.map((creature) => (
          <button
            key={creature.id}
            draggable
            onDragStart={(e) => {
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
            className="w-24 h-24 p-2 rounded flex flex-col items-center justify-center transition-all bg-slate-700 hover:bg-slate-500 cursor-grab active:cursor-grabbing hover:scale-105"
          >
            <img
              src={creature.spriteUrl}
              alt={creature.name}
              className="w-12 h-12 object-contain pointer-events-none"
            />
            <span className="text-[10px] text-white mt-1 uppercase text-center leading-tight pointer-events-none">
              {creature.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
