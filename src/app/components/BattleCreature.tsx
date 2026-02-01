import React from 'react';
import { Creature } from '@/types/baseGame';

interface BattleCreatureProps {
  creature: Creature;
  isEnemy?: boolean;
  className?: string;
}

export const BattleCreature: React.FC<BattleCreatureProps> = ({
  creature,
  isEnemy,
  className = '',
}) => {
  const getAnimationClass = (movementId?: string) => {
    return movementId ? `animate-${movementId}` : '';
  };

  const animClass = getAnimationClass(creature.movementId);
  const flipClass = isEnemy ? 'scale-x-[-1]' : '';

  return (
    <div className={`${animClass} inline-block`}>
      <img
        src={
          creature.battleSpriteUrl ||
          creature.spriteUrl ||
          '/iguana_starter_fire_battle_skin_2_actual.png'
        }
        alt={creature.name}
        className={`object-contain drop-shadow-xl ${flipClass} ${className}`}
      />
    </div>
  );
};
