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

  // If overriding, assume we want to play once (like a hit reaction)
  const animStyle: React.CSSProperties = animationOverride
    ? { animationIterationCount: 1 }
    : {};

  // Build img transform: combine flip + scale into one inline style
  const imgTransformParts: string[] = [];
  if (isEnemy) imgTransformParts.push('scaleX(-1)');
  if (scale && scale !== 1) imgTransformParts.push(`scale(${scale})`);

  const imgStyle: React.CSSProperties = {
    ...(imgTransformParts.length > 0 && {
      transform: imgTransformParts.join(' '),
      transformOrigin: 'bottom center',
    }),
  };

  return (
    <div className={`${animClass} inline-block`} style={animStyle}>
      <img
        src={
          creature.battleSpriteUrl ||
          creature.spriteUrl ||
          '/iguana_starter_fire_battle_skin_2_actual.png'
        }
        alt={creature.name}
        className={`object-contain drop-shadow-xl ${className}`}
        style={imgStyle}
        draggable={false}
      />
    </div>
  );
};
