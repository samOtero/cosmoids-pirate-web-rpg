import type { AttackId } from '@/types/definitionIds';

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
  equippedAttacks: AttackId[];
  activeAttackIndex: number;
  onSelectAttack: (index: number) => void;
  activeTargetingMode?: TowerTargetingMode;
  onSelectTargetingMode?: (mode: TowerTargetingMode) => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/95 p-1 backdrop-blur-sm lg:p-2">
      <div className="flex min-h-[90px] w-full items-center justify-start gap-2 overflow-x-auto px-2 pb-2 lg:min-h-[120px] lg:justify-center lg:gap-6 lg:px-4">
        {/* Tower Identity Side */}
        <div className="flex shrink-0 flex-col items-center">
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
          <span className="mt-1 hidden text-[8px] font-bold tracking-wider text-slate-400 uppercase lg:mt-2 lg:block lg:text-xs">
            Selected
          </span>
        </div>

        <div className="h-16 w-px shrink-0 bg-cyan-900/50 lg:h-24"></div>

        {/* Attacks Side */}
        <div className="flex gap-2 overflow-x-auto py-2 lg:gap-4">
          {equippedAttacks.map((attackId, index) => {
            const def = ATTACK_DEFS[attackId];
            if (!def) return null;

            const isSelected = activeAttackIndex === index;

            return (
              <button
                key={`${attackId}-${index}`}
                title={def.description}
                onClick={() => onSelectAttack(index)}
                className={`flex min-w-[90px] shrink-0 flex-col items-center rounded border-2 p-1.5 transition-all lg:min-w-[120px] lg:p-3 ${
                  isSelected
                    ? 'scale-105 border-cyan-400 bg-cyan-900/50 shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                    : 'border-slate-600 bg-slate-800 hover:border-cyan-600 hover:bg-slate-700'
                }`}
              >
                <span
                  className={`mb-0.5 text-[10px] font-bold lg:mb-1 lg:text-base ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}
                >
                  {def.name}
                </span>
                <div className="flex gap-1 text-[8px] lg:gap-2 lg:text-xs">
                  <span className="text-red-400">
                    Pwr: {def.power}
                    {def.constriction ? '/pulse' : ''}
                  </span>
                  <span className="text-blue-400">
                    CD: {def.cooldownMs / 1000}s
                  </span>
                </div>
                {def.supportBuff && (
                  <span className="mt-1 text-[8px] text-amber-200 lg:text-xs">
                    +
                    {Math.round(
                      (def.supportBuff.attackSpeedMultiplier - 1) * 100
                    )}
                    % attack speed · {def.supportBuff.durationMs / 1000}s
                  </span>
                )}
                {def.constriction && (
                  <span className="mt-1 text-[8px] text-cyan-200 lg:text-xs">
                    Hold {def.constriction.durationMs / 1000}s · Resist{' '}
                    {def.constriction.resistanceMs / 1000}s
                  </span>
                )}
                {isSelected && (
                  <span className="mt-1 rounded-full bg-cyan-400 px-1.5 py-0.5 text-[8px] font-bold text-black uppercase lg:mt-2 lg:px-2 lg:text-[10px]">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Targeting Side */}
        <div className="h-16 w-px shrink-0 bg-cyan-900/50 lg:h-24"></div>

        <div className="flex min-w-[100px] shrink-0 flex-col items-center justify-center px-1 lg:min-w-[140px] lg:px-2">
          <span className="mb-1 text-[8px] font-bold tracking-wider text-cyan-400 uppercase lg:text-[10px]">
            Targeting
          </span>
          <div className="relative w-full">
            <select
              value={activeTargetingMode}
              onChange={(e) =>
                onSelectTargetingMode?.(e.target.value as TowerTargetingMode)
              }
              className="w-full cursor-pointer appearance-none rounded border-2 border-slate-600 bg-slate-800 px-2.5 py-1 pr-6 text-center text-[9px] font-bold tracking-wide text-slate-200 uppercase transition-all hover:border-cyan-500 hover:text-white focus:border-cyan-400 focus:outline-none lg:px-3 lg:py-2 lg:text-xs"
            >
              <option value="first">First</option>
              <option value="last">Last</option>
              <option value="closest">Closest</option>
              <option value="strongest">Strongest</option>
              <option value="weakest">Weakest</option>
              <option value="lowest-hp-percent">Lowest HP %</option>
              <option value="highest-hp-percent">Highest HP %</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center text-slate-400 lg:right-2">
              <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Close Button Side */}
        <div className="h-16 w-px shrink-0 bg-cyan-900/50 lg:h-24"></div>
        <div className="flex h-16 shrink-0 flex-col items-center justify-center lg:h-24">
          <button
            onClick={onClose}
            className="group flex h-full items-center justify-center rounded-lg border-2 border-slate-600 bg-slate-800 px-3 py-1 text-[10px] font-bold text-slate-400 transition-colors hover:border-red-500/50 hover:bg-slate-700 hover:text-white lg:px-6 lg:py-2 lg:text-sm"
          >
            <span className="tracking-wider uppercase transition-colors group-hover:text-red-400">
              Close
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
