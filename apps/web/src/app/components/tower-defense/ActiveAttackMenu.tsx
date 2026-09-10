import React from 'react';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { TowerButton } from './TowerButton';
import { PlayerCreature } from '@/types/baseGame';
import { TowerTargetingMode } from '@/engine/tower-defense/types';

export function ActiveAttackMenu({
  creature,
  name,
  spriteUrl,
  isActive,
  displayLevel,
  displayXp,
  displayHp,
  displayMaxHp,
  equippedAttacks,
  activeAttackIndex,
  onSelectAttack,
  activeTargetingMode = 'first',
  onSelectTargetingMode,
  onClose,
}: {
  creature: PlayerCreature;
  name: string;
  spriteUrl: string;
  isActive: boolean;
  displayLevel: number;
  displayXp: number;
  displayHp?: number;
  displayMaxHp?: number;
  equippedAttacks: string[];
  activeAttackIndex: number;
  onSelectAttack: (index: number) => void;
  activeTargetingMode?: TowerTargetingMode;
  onSelectTargetingMode?: (mode: TowerTargetingMode) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 bg-slate-900/95 z-50 flex flex-col items-center justify-center p-1 lg:p-2 backdrop-blur-sm">
      <div className="flex items-center justify-start lg:justify-center gap-2 lg:gap-6 w-full px-2 lg:px-4 pb-2 overflow-x-auto min-h-[90px] lg:min-h-[120px]">
        {/* Tower Identity Side */}
        <div className="flex flex-col items-center shrink-0">
          <TowerButton
            creature={creature}
            name={name}
            spriteUrl={spriteUrl}
            isActive={isActive}
            displayLevel={displayLevel}
            displayXp={displayXp}
            displayHp={displayHp}
            displayMaxHp={displayMaxHp}
          />
          <span className="text-[8px] lg:text-xs text-slate-400 mt-1 lg:mt-2 font-bold uppercase tracking-wider hidden lg:block">
            Selected
          </span>
        </div>

        <div className="w-px h-16 lg:h-24 bg-cyan-900/50 shrink-0"></div>

        {/* Attacks Side */}
        <div className="flex gap-2 lg:gap-4 overflow-x-auto py-2">
          {equippedAttacks.map((attackId, index) => {
            const def = ATTACK_DEFS[attackId];
            if (!def) return null;

            const isSelected = activeAttackIndex === index;

            return (
              <button
                key={`${attackId}-${index}`}
                title={def.description}
                onClick={() => onSelectAttack(index)}
                className={`flex flex-col items-center p-1.5 lg:p-3 rounded border-2 transition-all min-w-[90px] lg:min-w-[120px] shrink-0 ${
                  isSelected
                    ? 'bg-cyan-900/50 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)] scale-105'
                    : 'bg-slate-800 border-slate-600 hover:border-cyan-600 hover:bg-slate-700'
                }`}
              >
                <span
                  className={`font-bold mb-0.5 lg:mb-1 text-[10px] lg:text-base ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}
                >
                  {def.name}
                </span>
                <div className="flex gap-1 lg:gap-2 text-[8px] lg:text-xs">
                  <span className="text-red-400">Pwr: {def.power}{def.constriction ? '/pulse' : ''}</span>
                  <span className="text-blue-400">
                    CD: {def.cooldownMs / 1000}s
                  </span>
                </div>
                {def.supportBuff && (
                  <span className="mt-1 text-[8px] lg:text-xs text-amber-200">
                    +{Math.round((def.supportBuff.attackSpeedMultiplier - 1) * 100)}% attack speed · {def.supportBuff.durationMs / 1000}s
                  </span>
                )}
                {def.constriction && (
                  <span className="mt-1 text-[8px] lg:text-xs text-cyan-200">
                    Hold {def.constriction.durationMs / 1000}s · Resist {def.constriction.resistanceMs / 1000}s
                  </span>
                )}
                {isSelected && (
                  <span className="mt-1 lg:mt-2 text-[8px] lg:text-[10px] font-bold text-black bg-cyan-400 px-1.5 lg:px-2 py-0.5 rounded-full uppercase">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Targeting Side */}
        <div className="w-px h-16 lg:h-24 bg-cyan-900/50 shrink-0"></div>

        <div className="flex flex-col justify-center items-center shrink-0 min-w-[100px] lg:min-w-[140px] px-1 lg:px-2">
          <span className="text-[8px] lg:text-[10px] font-bold text-cyan-400 mb-1 uppercase tracking-wider">
            Targeting
          </span>
          <div className="relative w-full">
            <select
              value={activeTargetingMode}
              onChange={(e) => onSelectTargetingMode?.(e.target.value as TowerTargetingMode)}
              className="w-full appearance-none bg-slate-800 border-2 border-slate-600 hover:border-cyan-500 rounded px-2.5 py-1 lg:px-3 lg:py-2 text-slate-200 hover:text-white text-[9px] lg:text-xs font-bold transition-all text-center uppercase tracking-wide cursor-pointer focus:outline-none focus:border-cyan-400 pr-6"
            >
              <option value="first">First</option>
              <option value="last">Last</option>
              <option value="closest">Closest</option>
              <option value="strongest">Strongest</option>
              <option value="weakest">Weakest</option>
              <option value="lowest-hp-percent">Lowest HP %</option>
              <option value="highest-hp-percent">Highest HP %</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-1 lg:right-2 flex items-center text-slate-400">
              <svg className="fill-current h-3 w-3" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Close Button Side */}
        <div className="w-px h-16 lg:h-24 bg-cyan-900/50 shrink-0"></div>
        <div className="flex flex-col items-center justify-center shrink-0 h-16 lg:h-24">
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg px-3 lg:px-6 py-1 lg:py-2 text-[10px] lg:text-sm font-bold transition-colors h-full flex items-center justify-center border-2 border-slate-600 hover:border-red-500/50 group"
          >
            <span className="group-hover:text-red-400 transition-colors uppercase tracking-wider">
              Close
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
