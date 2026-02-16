import React from 'react';
import { Creature } from '@/types/baseGame';

interface BattleCreatureProps {
  creature: Creature;
  isEnemy?: boolean;
  className?: string;
  animationOverride?: string;
  scale?: number;
}

export const BattleCreature: React.FC<BattleCreatureProps> = ({
  creature,
  isEnemy,
  className = '',
  animationOverride,
  scale,
}) => {
  const getAnimationClass = (movementId?: string) => {
    return movementId ? `animate-${movementId}` : '';
  };

  const activeAnimationId = animationOverride || creature.movementId;
  const animClass = getAnimationClass(activeAnimationId);
  const flipClass = isEnemy ? 'scale-x-[-1]' : '';

  // If overriding, assume we want to play once (like a hit reaction)
  const animStyle: React.CSSProperties = animationOverride
    ? { animationIterationCount: 1 }
    : {};

  const scaleStyle: React.CSSProperties = scale
    ? { transform: `scale(${scale})`, transformOrigin: 'bottom center' }
    : {};

  return (
    <div
      className={`${animClass} inline-block`}
      style={{ ...animStyle, ...scaleStyle }}
    >
      <img
        src={
          creature.battleSpriteUrl ||
          creature.spriteUrl ||
          '/iguana_starter_fire_battle_skin_2_actual.png'
        }
        alt={creature.name}
        className={`object-contain drop-shadow-xl ${flipClass} ${className}`}
        draggable={false}
      />
    </div>
  );
};
