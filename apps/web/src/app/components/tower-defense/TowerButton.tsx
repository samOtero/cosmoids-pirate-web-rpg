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
  onPointerDown,
}: {
  creature: PlayerCreature;
  name: string;
  spriteUrl: string;
  isActive: boolean;
  displayLevel: number;
  displayXp: number;
  onClick?: () => void;
  draggable?: boolean;
  onPointerDown?: (e: React.PointerEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      onClick={onClick}
      onPointerDown={onPointerDown}
      className={`relative w-16 h-16 lg:w-24 lg:h-24 p-0.5 lg:p-1 rounded flex flex-col items-center justify-center transition-all shrink-0 touch-none ${
        onPointerDown
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
        className="w-7 h-7 lg:w-10 lg:h-10 object-contain pointer-events-none"
      />
      <div className="flex flex-col items-center w-full mt-0.5 lg:mt-1 pointer-events-none">
        <span
          className={`text-[7px] lg:text-[9px] uppercase font-bold truncate w-full text-center leading-tight ${isActive ? 'text-cyan-100' : 'text-white'}`}
        >
          {name}
        </span>

        <div className="w-full flex items-center justify-between px-0.5 lg:px-1 mt-0.5">
          <span className="text-[6px] lg:text-[8px] text-gray-300 leading-none">
            Lv.{displayLevel}
          </span>
        </div>

        <div className="w-full px-0.5 lg:px-1 mt-0.5">
          <div className="w-full h-1 lg:h-1.5 bg-gray-900 rounded-full overflow-hidden border border-gray-600">
            <div
              className="h-full bg-cyan-400 transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.max(0, (displayXp / ((displayLevel + 1) ** 3 - displayLevel ** 3)) * 100))}%`,
              }}
            />
          </div>
        </div>
      </div>
    </button>
  );
}
