import React from 'react';
import { ElementType } from '@/types/baseGame';

interface TypeBadgeProps {
  type: ElementType;
}

const TYPE_COLORS: Record<ElementType, string> = {
  [ElementType.WATER]: 'bg-blue-600',
  [ElementType.FIRE]: 'bg-orange-600',
  [ElementType.GRASS]: 'bg-green-600',
  [ElementType.BUG]: 'bg-lime-700',
  [ElementType.ROCK]: 'bg-stone-700',
  [ElementType.STEEL]: 'bg-slate-600',
  [ElementType.POISON]: 'bg-purple-600',
  [ElementType.ELECTRIC]: 'bg-yellow-500',
  [ElementType.NORMAL]: 'bg-gray-500',
  [ElementType.FLYING]: 'bg-sky-400',
};

export const TypeBadge: React.FC<TypeBadgeProps> = ({ type }) => {
  const colorClass = TYPE_COLORS[type] || 'bg-gray-500';

  return (
    <div
      className={`${colorClass} px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider shadow-sm border border-white/20`}
    >
      {type}
    </div>
  );
};
