import React from 'react';
import { Creature } from '@/types/baseGame';
import Panel from '@/app/components/ui/Panel';
import { HealthBar } from '@/app/components/ui/HealthBar';
import { TypeBadge } from '@/app/components/ui/TypeBadge';

interface CreatureStatusProps {
  creature: Creature;
  variant: 'friend' | 'enemy';
  showHpValues?: boolean;
  className?: string;
}

export const CreatureStatus: React.FC<CreatureStatusProps> = ({ 
  creature, 
  variant, 
  showHpValues = false,
  className = ''
}) => {
  const borderColor = variant === 'enemy' ? 'border-red-900/50' : 'border-blue-900/50';
  // Keep internal alignment (text/content alignment) but remove self-* (external positioning)
  const contentAlignment = variant === 'enemy' ? 'items-end' : 'items-start';
  
  return (
    <div className={`w-full max-w-md flex flex-col ${contentAlignment} ${className}`}>
      <Panel className={`bg-black/60 border-2 ${borderColor} w-full`}>
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
