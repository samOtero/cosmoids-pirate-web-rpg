import React from 'react';
import { Creature } from '@/types/baseGame';
import { HealthBar } from '@/app/components/ui/HealthBar';
import { TypeBadge } from '@/app/components/ui/TypeBadge';

interface CreatureBattleStatsProps {
  creature: Creature;
  className?: string;
  variant?: 'friend' | 'enemy';
}

export const CreatureBattleStats: React.FC<CreatureBattleStatsProps> = ({
  creature,
  className = '',
  variant = 'friend',
}) => {
  return (
    <div
      className={`p-2 flex flex-col gap-1 bg-[#3E2723] text-[#FFE0B2] border-2 border-[#8B4513] rounded-lg shadow-lg w-48 md:w-56 ${className}`}
    >
      {/* Name and Level */}
      <div className="flex justify-between items-baseline gap-2">
        <h3 className="font-bold text-sm md:text-base leading-tight truncate text-white shadow-black drop-shadow-sm">
          {creature.name}
        </h3>
        <span className="text-[10px] md:text-xs opacity-70 shrink-0">
          lvl {creature.level}
        </span>
      </div>

      {/* HP Section */}
      <div className="flex flex-col gap-0.5">
        <div className="flex justify-between items-end mb-0.5">
          <span className="text-[10px] uppercase font-bold text-[#D7CCC8]">
            HP
          </span>
        </div>
        <HealthBar
          current={creature.currentHp}
          max={creature.maxHp}
          className="h-2 rounded-full border border-[#5D4037]"
        />
        <div className="flex justify-between items-center mt-1">
          <span className="text-[10px] font-mono opacity-80">
            {creature.currentHp} / {creature.maxHp}
          </span>
        </div>
      </div>

      {/* Energy Section - Visual Only */}
      <div className="flex flex-col gap-0.5 mt-2">
        <div className="flex justify-between items-end mb-0.5">
          <span className="text-[10px] uppercase font-bold text-[#D7CCC8]">
            Energy
          </span>
        </div>
        <div className="w-full h-2 bg-gray-800 rounded-full border border-[#5D4037] overflow-hidden relative">
          <div
            className="h-full bg-yellow-400"
            style={{ width: `${(creature.currentEnergy / 100) * 100}%` }}
          />
          {/* Shine effect */}
          <div className="absolute top-0 left-0 w-full h-1/3 bg-white opacity-20"></div>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-[10px] font-mono opacity-80">
            {creature.currentEnergy} / 100
          </span>
        </div>
      </div>
    </div>
  );
};
