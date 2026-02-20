import { Profile } from '@/types/baseGame';
import Panel from '@/app/components/ui/Panel';
import { useState } from 'react';
import { Button } from '@/app/components/ui/Button';
import { ISLANDS } from '@/constants/game';
import InventoryModal from '@/app/components/inventory/InventoryModal'; // Added import

interface MapScreenProps {
  profile: Profile;
  onTravel: (islandId: number) => void;
  onEnterIsland: (islandId: number) => void;
  onOpenMenu: () => void;
  onUseItem: (itemId: string, targetCreatureId?: string) => void;
}
export default function MapScreen({
  profile,
  onTravel,
  onEnterIsland,
  onOpenMenu,
  onUseItem,
}: MapScreenProps) {
  const [hoverIsland, setHoverIsland] = useState<number | null>(null);
  const [showInventory, setShowInventory] = useState(false);
  const potionCount =
    profile.inventory.find((i) => i.id === 'potion')?.count || 0;

  return (
    <div className="relative w-full h-full bg-ocean overflow-hidden">
      {/* Background Grid */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      ></div>

      {/* Top Left Panel - Party Info */}
      <div className="absolute top-4 left-4 z-20">
        <Panel className="p-3 flex flex-col gap-2 bg-ocean-dark/90 min-w-[150px]">
          <div className="font-bold text-sand text-sm border-b border-wood pb-1 mb-1 flex justify-between">
            <span>{profile.name}</span>
            <span className="text-cyan-400">
              Lv {profile.creatures[0]?.level}
            </span>
          </div>

          {/* Creatures */}
          <div className="flex gap-2">
            {profile.creatures.map((c, i) => (
              <div key={c.id} className="relative group cursor-help">
                <img
                  src={c.spriteUrl}
                  className="w-12 h-12 border-2 border-wood rounded bg-black/40 hover:border-cyan-400 transition-colors"
                />
                <div
                  className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-black"
                  title="Health"
                ></div>
                {/* Tooltip */}
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-black/90 p-2 rounded text-xs whitespace-nowrap z-50 pointer-events-none">
                  <div className="font-bold text-cyan-300">{c.name}</div>
                  <div>
                    HP: {c.currentHp}/{c.maxHp}
                  </div>
                </div>
              </div>
            ))}
            {Array.from({
              length: Math.max(0, 3 - profile.creatures.length),
            }).map((_, i) => (
              <div
                key={i}
                className="w-12 h-12 border-2 border-wood/50 rounded bg-black/20 flex items-center justify-center text-white/10 text-xl"
              >
                +
              </div>
            ))}
          </div>

          {/* Mini Inventory View */}
          <div className="mt-2 text-xs text-sand/70 font-mono">
            <div>POTIONS: {potionCount}</div>
          </div>
        </Panel>
      </div>

      <div className="absolute bottom-4 right-4 z-20 flex gap-2">
        <Button variant="wood" onClick={onOpenMenu}>
          Full Menu
        </Button>
        <Button variant="wood" onClick={() => setShowInventory(true)}>
          Bag
        </Button>
      </div>

      {/* Map Content */}
      <div className="relative w-full h-full">
        {/* Draw paths first */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {ISLANDS.map((island, idx) => {
            if (idx === 0) return null;
            const prev = ISLANDS[idx - 1];
            const isUnlocked = profile.unlockedIslands >= idx;
            return (
              <line
                key={island.id}
                x1={`${prev.coordinates.x}%`}
                y1={`${prev.coordinates.y}%`}
                x2={`${island.coordinates.x}%`}
                y2={`${island.coordinates.y}%`}
                stroke={isUnlocked ? '#f4e4bc' : '#334'}
                strokeWidth="2"
                strokeDasharray={isUnlocked ? '0' : '5,5'}
              />
            );
          })}
        </svg>

        {ISLANDS.map((island) => {
          const isUnlocked = profile.unlockedIslands >= island.id;
          const isCurrent = profile.currentIslandId === island.id;
          const isHover = hoverIsland === island.id;

          return (
            <div
              key={island.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer transition-all duration-300"
              style={{
                left: `${island.coordinates.x}%`,
                top: `${island.coordinates.y}%`,
              }}
              onMouseEnter={() => setHoverIsland(island.id)}
              onMouseLeave={() => setHoverIsland(null)}
              onClick={() => {
                if (isCurrent) {
                  onEnterIsland(island.id);
                } else if (isUnlocked) {
                  onTravel(island.id);
                }
              }}
            >
              {/* Island Node */}
              <div
                className={`w-12 h-12 md:w-16 md:h-16 rounded-full border-4 flex items-center justify-center shadow-xl relative
                   ${
                     isCurrent
                       ? 'bg-cyan-600 border-white scale-110'
                       : isUnlocked
                         ? 'bg-wood hover:bg-wood-light border-sand'
                         : 'bg-gray-800 border-gray-600 cursor-not-allowed'
                   }
                `}
              >
                {/* Boat Icon if current */}
                {isCurrent && (
                  <span className="text-2xl animate-bounce">⛵</span>
                )}
                {!isCurrent && isUnlocked && (
                  <span className="text-xl">🏝️</span>
                )}
                {!isUnlocked && <span className="text-xl opacity-50">🔒</span>}
              </div>

              {/* Tooltip */}
              {(isHover || isCurrent) && (
                <div
                  className={`mt-2 bg-black/80 text-sand p-2 rounded text-center whitespace-nowrap z-10 pointer-events-none ${
                    isCurrent ? 'border border-cyan-500' : ''
                  }`}
                >
                  <div className="font-bold">{island.name}</div>
                  {isUnlocked && (
                    <div className="text-[10px] text-gray-400">
                      {island.description}
                    </div>
                  )}
                  {!isUnlocked && (
                    <div className="text-[10px] text-red-400">Locked</div>
                  )}
                  {isCurrent && (
                    <div className="text-[10px] text-cyan-300 mt-1">
                      Click to Enter
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showInventory && (
        <InventoryModal
          inventory={profile.inventory}
          creatures={profile.creatures}
          onClose={() => setShowInventory(false)}
          onUseItem={onUseItem}
        />
      )}
    </div>
  );
}
