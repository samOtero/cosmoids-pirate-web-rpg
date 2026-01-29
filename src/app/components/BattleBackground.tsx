import React from 'react';

interface BattleBackgroundProps {
  className?: string;
  playerCreatureUrl?: string;
  enemyCreatureUrl?: string;
}

const BattleBackground: React.FC<BattleBackgroundProps> = ({
  className = '',
  playerCreatureUrl,
  enemyCreatureUrl,
}) => {
  return (
    <div
      className={`absolute inset-0 flex overflow-hidden pointer-events-none ${className}`}
    >
      {/* Background Image 2: Player (Front layer, clipped) */}
      <div className="flex items-center justify-center w-1/2">
        {playerCreatureUrl && (
          <img src={playerCreatureUrl} alt="Battle Player" />
        )}
      </div>

      {/* Background Image 1: Enemy (Back layer, visible where Player is clipped) */}
      <div className="flex items-center justify-center w-1/2">
        {enemyCreatureUrl && (
          <img
            src={enemyCreatureUrl}
            alt="Battle Enemy"
            className="scale-x-[-1]"
          />
        )}
      </div>

      {/* Overlay for consistency/darkening if needed */}
      <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
    </div>
  );
};

export default BattleBackground;
