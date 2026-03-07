import React from 'react';
import { PlayerCreature } from '@/types/baseGame';

export function TowerButton({
  creature,
  name,
  spriteUrl,
  isActive,
  displayLevel,
  displayXp,
  onClick,
  draggable,
  onDragStart,
  onDragEnd,
}: {
  creature: PlayerCreature;
  name: string;
  spriteUrl: string;
  isActive: boolean;
  displayLevel: number;
  displayXp: number;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLButtonElement>) => void;
  onDragEnd?: () => void;
}) {
  return (
    <button
      draggable={draggable}
      onClick={onClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`relative w-24 h-24 p-1 rounded flex flex-col items-center justify-center transition-all shrink-0 ${
        draggable
          ? 'cursor-grab active:cursor-grabbing hover:scale-105'
          : 'cursor-default'
      } ${
        isActive
          ? 'bg-cyan-800 border-2 border-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.6)] hover:bg-cyan-700'
          : 'bg-slate-700 border-2 border-transparent hover:bg-slate-500'
      }`}
    >
      <img
        src={spriteUrl}
        alt={name}
        className="w-10 h-10 object-contain pointer-events-none"
      />
      <div className="flex flex-col items-center w-full mt-1 pointer-events-none">
        <span
          className={`text-[9px] uppercase font-bold truncate w-full text-center leading-tight ${isActive ? 'text-cyan-100' : 'text-white'}`}
        >
          {name}
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
}
