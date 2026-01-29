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
          className="object-cover"
          unoptimized
          priority
        />
      </div>

      {/* Overlay for consistency/darkening if needed */}
      <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
    </div>
  );
};

export default BattleBackground;
