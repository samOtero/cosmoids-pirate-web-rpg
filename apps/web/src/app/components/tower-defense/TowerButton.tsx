import React from 'react';
import { PlayerCreature } from '@/types/baseGame';

export function TowerButton({
  creature,
  name,
  spriteUrl,
  isActive,
  displayLevel,
  displayXp,
  displayHp,
  displayMaxHp,
  deploymentStatus,
  onClick,
  onPointerDown,
}: {
  creature: PlayerCreature;
  name: string;
  spriteUrl: string;
  isActive: boolean;
  displayLevel: number;
  displayXp: number;
  displayHp?: number;
  displayMaxHp?: number;
  deploymentStatus?: string;
  onClick?: () => void;
  draggable?: boolean;
  onPointerDown?: (e: React.PointerEvent<HTMLButtonElement>) => void;
}) {
  const hasLife = displayHp !== undefined && displayMaxHp !== undefined;
  const lifeRatio = hasLife && displayMaxHp > 0 ? displayHp / displayMaxHp : 1;
  const lifeColor =
    lifeRatio < 0.2
      ? 'text-red-400'
      : lifeRatio < 0.5
        ? 'text-yellow-400'
        : 'text-green-400';

  return (
    <button
      disabled={!!deploymentStatus}
      onClick={onClick}
      onPointerDown={onPointerDown}
      className={`relative flex h-16 w-16 shrink-0 touch-none flex-col items-center justify-center rounded p-0.5 transition-all disabled:cursor-default disabled:opacity-60 lg:h-24 lg:w-24 lg:p-1 ${
        onPointerDown
          ? 'cursor-grab hover:scale-105 active:cursor-grabbing'
          : 'cursor-default'
      } ${
        isActive
          ? 'border-2 border-cyan-300 bg-cyan-800 shadow-[0_0_15px_rgba(34,211,238,0.6)] hover:bg-cyan-700'
          : 'border-2 border-transparent bg-slate-700 hover:bg-slate-500'
      }`}
    >
      <img
        src={spriteUrl}
        alt={name}
        className="pointer-events-none h-7 w-7 object-contain lg:h-10 lg:w-10"
      />
      <div className="pointer-events-none mt-0.5 flex w-full flex-col items-center lg:mt-1">
        <span
          className={`w-full truncate text-center text-[7px] leading-tight font-bold uppercase lg:text-[9px] ${isActive ? 'text-cyan-100' : 'text-white'}`}
        >
          {name}
        </span>

        <div className="mt-0.5 flex w-full items-center justify-between px-0.5 lg:px-1">
          <span className="text-[6px] leading-none text-gray-300 lg:text-[8px]">
            Lv.{displayLevel}
          </span>
          {hasLife && (
            <span
              className={`text-[6px] leading-none font-bold lg:text-[8px] ${lifeColor}`}
              title={`HP ${displayHp} / ${displayMaxHp}`}
            >
              HP {displayHp}/{displayMaxHp}
            </span>
          )}
        </div>

        <div className="mt-0.5 w-full px-0.5 lg:px-1">
          <div className="h-1 w-full overflow-hidden rounded-full border border-gray-600 bg-gray-900 lg:h-1.5">
            <div
              className="h-full bg-cyan-400 transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.max(0, (displayXp / ((displayLevel + 1) ** 3 - displayLevel ** 3)) * 100))}%`,
              }}
            />
          </div>
        </div>
        {deploymentStatus && (
          <span className="text-[7px] leading-tight font-bold text-cyan-200 lg:text-[9px]">
            {deploymentStatus}
          </span>
        )}
      </div>
    </button>
  );
}
