import React from 'react';
import Image from 'next/image';

interface BattleBackgroundProps {
  className?: string;
  backgroundImageUrl: string;
}

const BattleBackground: React.FC<BattleBackgroundProps> = ({
  className = '',
  backgroundImageUrl,
}) => {
  return (
    <div
      className={`absolute inset-0 flex overflow-hidden pointer-events-none ${className}`}
    >
      <div className="absolute inset-0 bg-black/60 z-0">
        <Image
          src={backgroundImageUrl}
          alt="Battle background"
          fill
          className="object-cover opacity-50 blur-xs"
          unoptimized
          priority
        />
      </div>
    </div>
  );
};

export default BattleBackground;
