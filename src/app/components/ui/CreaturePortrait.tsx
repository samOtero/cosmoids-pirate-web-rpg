import React from 'react';
import { Creature } from '@/types/baseGame';
import { HealthBar } from '@/app/components/ui/HealthBar';
import { TypeBadge } from '@/app/components/ui/TypeBadge';

interface CreaturePortraitProps {
  creature: Creature;
  variant: 'friend' | 'enemy';
  className?: string; // Add className prop
}

export const CreaturePortrait: React.FC<CreaturePortraitProps> = ({
  creature,
  variant,
  className = '',
}) => {
  // Specific adjustments for friend vs enemy if needed (e.g. facing)
  // Provide a fallback if battleSpriteUrl is missing
  const spriteUrl =
    creature.battleSpriteUrl ||
    creature.spriteUrl ||
    '/iguana_starter_fire_battle_skin_2_actual.png';

  return (
    <div
      className={`relative border-[10px] border-[#8B4513] rounded-lg bg-[#2a2a2a] flex flex-col shadow-lg overflow-hidden ${className}`}
    >
      {/* Portrait Section */}
      <div className="bg-[#87CEEB] relative overflow-hidden flex items-center justify-center border-b-[3px] border-[#8B4513]">
        {/* Background clouds or simple gradient could go here */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#87CEEB] to-[#E0F7FA] opacity-50"></div>

        <img
          src={spriteUrl}
          alt={creature.name}
          className="relative z-10 w-auto object-contain drop-shadow-md"
        />
      </div>

      {/* Info Section */}
      <div className="p-2 flex flex-col gap-1 bg-[#3E2723] text-[#FFE0B2]">
        {/* Name and Level */}
        <div className="flex justify-between items-baseline">
          <h3 className="font-bold text-sm md:text-base leading-tight truncate text-white shadow-black drop-shadow-sm">
            {creature.name}
          </h3>
          <span className="text-[10px] md:text-xs opacity-70">
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
            <div className="scale-75 origin-right">
              <TypeBadge type={creature.type} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
