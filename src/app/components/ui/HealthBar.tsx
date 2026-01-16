import React from 'react';

interface HealthBarProps {
  current: number;
  max: number;
  label?: string;
}

export const HealthBar: React.FC<HealthBarProps> = ({ current, max, label }) => {
  const percent = Math.max(0, Math.min(100, (current / max) * 100));
  
  // Color based on percentage
  let barColor = 'bg-green-500';
  if (percent < 20) barColor = 'bg-red-500';
  else if (percent < 50) barColor = 'bg-yellow-500';

  return (
    <div className="w-full">
      {label && <div className="text-xs font-bold mb-0.5 text-sand uppercase">{label}</div>}
      <div className="h-4 bg-gray-800 rounded-full border-2 border-gray-600 overflow-hidden relative">
        <div 
          className={`h-full ${barColor} transition-all duration-500 ease-out`}
          style={{ width: `${percent}%` }}
        />
        {/* Shine effect */}
        <div className="absolute top-0 left-0 w-full h-1/3 bg-white opacity-20"></div>
      </div>
    </div>
  );
};
