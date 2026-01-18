import React from 'react';

interface BattleBackgroundProps {
  className?: string;
}

const BattleBackground: React.FC<BattleBackgroundProps> = ({ className = '' }) => {
  return (
    <div className={`absolute inset-0 flex overflow-hidden pointer-events-none ${className}`}>
      {/* Background Image 2: Iguana (Front layer, clipped) */}
      <div 
        className="flex items-center justify-center w-1/2"
      >
            <img 
                src="/iguana_starter_fire_battle_skin_2_actual.png" 
                alt="Battle Background Fire" 
            />
      </div>
      
      {/* Background Image 1: Monkey (Back layer, visible where Iguana is clipped) */}
      <div className="flex items-center justify-center w-1/2">
         <img 
            src="/monkey_starter_water_battle_skin_1_actual.png" 
            alt="Battle Background Water" 
            className="scale-x-[-1]"
        />
      </div>
      
      {/* Overlay for consistency/darkening if needed */}
      <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
    </div>
  );
};

export default BattleBackground;
