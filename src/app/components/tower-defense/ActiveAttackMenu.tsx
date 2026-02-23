import React from 'react';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import { TowerButton } from './TowerButton';
import { Creature } from '@/types/baseGame';

export function ActiveAttackMenu({
  creature,
  isActive,
  displayLevel,
  displayXp,
  equippedAttacks,
  activeAttackIndex,
  onSelectAttack,
  onClose,
}: {
  creature: Creature;
  isActive: boolean;
  displayLevel: number;
  displayXp: number;
  equippedAttacks: string[];
  activeAttackIndex: number;
  onSelectAttack: (index: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 bg-slate-900/95 z-50 flex flex-col items-center justify-center p-2 backdrop-blur-sm">
      <div className="flex items-center justify-between w-full max-w-2xl text-cyan-400 mb-2 px-4 pb-2 border-b border-cyan-900/50">
        <span className="font-bold text-lg">Select Active Attack</span>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded px-3 py-1 text-sm font-bold transition-colors"
        >
          Close
        </button>
      </div>

      <div className="flex items-center justify-center gap-6 w-full px-4 pb-2 mt-4 overflow-x-auto">
        {/* Tower Identity Side */}
        <div className="flex flex-col items-center shrink-0">
          <TowerButton
            creature={creature}
            isActive={isActive}
            displayLevel={displayLevel}
            displayXp={displayXp}
          />
          <span className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-wider">
            Selected
          </span>
        </div>

        <div className="w-px h-24 bg-cyan-900/50 shrink-0"></div>

        {/* Attacks Side */}
        <div className="flex gap-4 overflow-x-auto py-2">
          {equippedAttacks.map((attackId, index) => {
            const def = ATTACK_DEFS[attackId];
            if (!def) return null;

            const isSelected = activeAttackIndex === index;

            return (
              <button
                key={`${attackId}-${index}`}
                onClick={() => onSelectAttack(index)}
                className={`flex flex-col items-center p-3 rounded border-2 transition-all min-w-[120px] shrink-0 ${
                  isSelected
                    ? 'bg-cyan-900/50 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)] scale-105'
                    : 'bg-slate-800 border-slate-600 hover:border-cyan-600 hover:bg-slate-700'
                }`}
              >
                <span
                  className={`font-bold mb-1 ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}
                >
                  {def.name}
                </span>
                <div className="flex gap-2 text-xs">
                  <span className="text-red-400">Pwr: {def.power}</span>
                  <span className="text-blue-400">
                    CD: {def.cooldownMs / 1000}s
                  </span>
                </div>
                {isSelected && (
                  <span className="mt-2 text-[10px] font-bold text-black bg-cyan-400 px-2 py-0.5 rounded-full uppercase">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
