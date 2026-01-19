import React from 'react';
import { Creature } from '@/types/baseGame';
import Panel from '@/app/components/ui/Panel';
import { HealthBar } from '@/app/components/ui/HealthBar';
import { TypeBadge } from '@/app/components/ui/TypeBadge';

interface CreatureStatusProps {
  creature: Creature;
  variant: 'friend' | 'enemy';
  showHpValues?: boolean;
}

export const CreatureStatus: React.FC<CreatureStatusProps> = ({ 
  creature, 
  variant, 
  showHpValues = false 
}) => {
  const borderColor = variant === 'enemy' ? 'border-red-900/50' : 'border-blue-900/50';
  const containerAlignment = variant === 'enemy' ? 'self-end items-end' : 'self-start items-start';
  const margin = variant === 'enemy' ? 'mb-4' : 'mt-4';

  return (
    <div className={`${containerAlignment} w-full max-w-md flex flex-col ${margin}`}>
      <Panel className={`bg-black/60 border-2 ${borderColor} w-full ${variant === 'enemy' ? 'mb-2' : ''}`}>
        <div className="flex justify-between items-baseline mb-1">
          <span className="font-bold text-lg text-sand">{creature.name}</span>
          <span className="text-xs text-gray-400">Lvl {creature.level}</span>
        </div>
        
        <HealthBar 
          current={creature.currentHp} 
          max={creature.maxHp} 
          label={showHpValues ? "HP" : undefined} 
        />
        
        <div className={`mt-1 flex ${showHpValues ? 'justify-between' : 'justify-end'} text-xs text-sand/60 font-mono`}>
          {showHpValues && (
            <span>{creature.currentHp} / {creature.maxHp}</span>
          )}
          <TypeBadge type={creature.type} />
        </div>
      </Panel>
    </div>
  );
};
