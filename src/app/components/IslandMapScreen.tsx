import {
  Profile,
  Island,
  IslandNode,
  DialogContext,
  DialogContextData,
  DialogAction,
} from '@/types/baseGame';
import { BACKGROUND_IMAGES } from '@/constants/game';
import Panel from '@/app/components/ui/Panel';
import { useState } from 'react';
import { Button } from '@/app/components/ui/Button';
import { resolveDialog } from '@/utils/dialogResolver';
import DialogContent from '@/app/components/ui/DialogContent';
import InventoryModal from '@/app/components/inventory/InventoryModal';

interface IslandMapScreenProps {
  profile: Profile;
  island: Island;
  onNodeClick: (nodeId: number) => void;
  onBack: () => void;
  onOpenMenu: () => void;
  onUseItem: (itemId: string, targetCreatureId?: string) => void;
  // Dialog Support
  dialogContext?: DialogContext | null;
  dialogContextData?: DialogContextData | null;
  onDialogContinue?: () => void;
  onDialogAction?: (action: DialogAction) => void;
}

export default function IslandMapScreen({
  profile,
  island,
  onNodeClick,
  onBack,
  onOpenMenu,
  dialogContext,
  dialogContextData,
  onDialogContinue,
  onDialogAction,
  onUseItem,
}: IslandMapScreenProps) {
  const [hoverNode, setHoverNode] = useState<number | null>(null);
  const [showInventory, setShowInventory] = useState(false);

  // Nodes are stored in island.nodes
  // Progress is stored in profile.islandNodeProgress[island.id]
  const maxUnlockedNode = profile.islandNodeProgress[island.id] ?? 0;
  const flags = profile.gameFlags ?? [];

  const isWorldMapUnlocked =
    profile.islandNodeProgress[1] && profile.islandNodeProgress[1] > 0;

  // Check if a node is accessible based on progress index + flag conditions
  const isNodeUnlocked = (node: IslandNode, idx: number) => {
    const withinProgress = idx <= maxUnlockedNode;
    const meetsRequirement =
      !node.requiresFlag || flags.includes(node.requiresFlag);
    const notBlocked =
      !node.blockedByFlag || !flags.includes(node.blockedByFlag);
    return withinProgress && meetsRequirement && notBlocked;
  };

  // Resolve dialog if active
  const resolvedDialog = dialogContext
    ? resolveDialog(dialogContext, dialogContextData || null)
    : null;
  const sequence = resolvedDialog?.sequence || null;
  const dialogStartIndex = dialogContextData?.dialogStartIndex || 0;

  return (
    <>
      <div className="relative w-full h-full bg-[#2c3e50] overflow-hidden">
        {/* Background Grid - slightly different color/style than world map */}
        {island.backgroundImageKey && (
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url(${BACKGROUND_IMAGES[island.backgroundImageKey]})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}

        {/* Background Grid - slightly different color/style than world map */}
        <div
          className="absolute inset-0 opacity-10 z-0"
          style={{
            backgroundImage:
              'linear-gradient(#f4e4bc 1px, transparent 1px), linear-gradient(90deg, #f4e4bc 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        ></div>

        {/* Top Left Panel - Island Info */}
        <div className="absolute top-4 left-4 z-20">
          <Panel className="p-3 flex flex-col gap-2 bg-wood/90 min-w-[200px]">
            <div className="font-bold text-sand text-lg border-b border-black/20 pb-1 mb-1">
              {island.name}
            </div>
            <div className="text-xs text-sand/80 italic">
              {island.description}
            </div>
          </Panel>
        </div>

        <div className="absolute bottom-4 right-4 z-20 flex gap-2">
          {isWorldMapUnlocked && (
            <Button variant="wood" onClick={onBack}>
              World Map
            </Button>
          )}
          <Button variant="wood" onClick={onOpenMenu}>
            Menu
          </Button>
          <Button variant="wood" onClick={() => setShowInventory(true)}>
            Bag
          </Button>
        </div>

        {/* Map Content */}
        <div className="relative w-full h-full">
          {/* Draw paths first */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {island.nodes?.map((node, idx) => {
              if (idx === 0) return null;
              const prev = island.nodes![idx - 1];
              const isUnlocked = isNodeUnlocked(island.nodes![idx], idx);

              // Only draw line if previous node exists
              if (!prev) return null;

              return (
                <line
                  key={`path-${node.id}`}
                  x1={`${prev.coordinates.x}%`}
                  y1={`${prev.coordinates.y}%`}
                  x2={`${node.coordinates.x}%`}
                  y2={`${node.coordinates.y}%`}
                  stroke={isUnlocked ? '#f4e4bc' : '#555'}
                  strokeWidth="3"
                  strokeDasharray={isUnlocked ? '0' : '5,5'}
                />
              );
            })}
          </svg>

          {island.nodes?.map((node, idx) => {
            const isUnlocked = isNodeUnlocked(node, idx);
            const isNext = idx === maxUnlockedNode + 1; // The next node to unlock
            const isHover = hoverNode === node.id;

            // You can visually distinguish completed nodes vs current frontier node
            const isCompleted = idx < maxUnlockedNode;

            return (
              <div
                key={node.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer transition-all duration-300"
                style={{
                  left: `${node.coordinates.x}%`,
                  top: `${node.coordinates.y}%`,
                }}
                onMouseEnter={() => setHoverNode(node.id)}
                onMouseLeave={() => setHoverNode(null)}
                onClick={() => isUnlocked && onNodeClick(node.id)}
              >
                {/* Node Icon */}
                <div
                  className={`w-10 h-10 md:w-14 md:h-14 rounded-full border-4 flex items-center justify-center shadow-xl relative
                   ${
                     isCompleted
                       ? 'bg-green-600 border-sand scale-100'
                       : isUnlocked
                         ? 'bg-cyan-600 border-white scale-110 animate-pulse'
                         : 'bg-gray-700 border-gray-600'
                   }
                   ${!isUnlocked && !isNext ? 'opacity-50' : ''}
                `}
                >
                  {isUnlocked ? (
                    <span className="text-xl">📍</span>
                  ) : (
                    <span className="text-xl opacity-50">🔒</span>
                  )}
                </div>

                {/* Tooltip */}
                {(isHover || (isUnlocked && !isCompleted)) && (
                  <div
                    className={`mt-2 bg-black/90 text-sand p-2 rounded text-center whitespace-nowrap z-10 pointer-events-none border border-wood/50`}
                  >
                    <div className="font-bold text-sm">{node.name}</div>
                    {isUnlocked && (
                      <div className="text-[10px] text-gray-300">
                        {node.description}
                      </div>
                    )}
                    {isUnlocked && (
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
      </div>

      {/* Dialog Overlay */}
      {sequence && onDialogContinue && (
        <div className="absolute inset-0 z-50 pointer-events-auto">
          <DialogContent
            sequence={sequence}
            onContinue={onDialogContinue}
            onDialogAction={onDialogAction || (() => {})}
            initialLineIndex={dialogStartIndex || 0}
          />
        </div>
      )}

      {showInventory && (
        <InventoryModal
          inventory={profile.inventory}
          creatures={profile.creatures}
          onClose={() => setShowInventory(false)}
          onUseItem={onUseItem}
        />
      )}
    </>
  );
}
