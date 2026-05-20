import { Creature } from '@/types/baseGame';
import { useState, useEffect, useRef } from 'react';
import Panel from '@/app/components/ui/Panel';
import { Button } from '@/app/components/ui/Button';
import { BACKGROUND_IMAGES } from '@/constants/game';

interface PartyScreenProps {
  creatures: Creature[];
  onBack: () => void;
  onReorder: (startIndex: number, endIndex: number) => void;
}

export default function PartyScreen({
  creatures,
  onBack,
  onReorder,
}: PartyScreenProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  const creaturesPerPage = isDesktop ? 18 : 6;
  const activeTeam = creatures.slice(0, 6);
  const storageCreatures = creatures.slice(6);
  const totalPages = Math.ceil(
    Math.max(1, storageCreatures.length) / creaturesPerPage
  );

  // Clamp the page index to prevent rendering an out-of-bounds page
  const activePage = Math.min(currentPage, Math.max(0, totalPages - 1));

  // Pointer drag states & refs
  const DRAG_THRESHOLD = 10;
  const pendingDragRef = useRef<{
    index: number;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    spriteUrl: string;
  } | null>(null);

  const [globalDrag, setGlobalDrag] = useState<{
    startIndex: number;
    spriteUrl: string;
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    index: number,
    spriteUrl: string
  ) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    pendingDragRef.current = {
      index,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      spriteUrl,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pendingDragRef.current && !globalDrag) {
      const pd = pendingDragRef.current;
      const dx = e.clientX - pd.startX;
      const dy = e.clientY - pd.startY;
      if (Math.sqrt(dx * dx + dy * dy) >= DRAG_THRESHOLD) {
        // Threshold exceeded — activate real drag
        setDraggedIndex(pd.index);
        setGlobalDrag({
          startIndex: pd.index,
          spriteUrl: pd.spriteUrl,
          x: e.clientX,
          y: e.clientY,
          offsetX: pd.offsetX,
          offsetY: pd.offsetY,
        });
        pendingDragRef.current = null;
      }
      return;
    }
    if (globalDrag) {
      setGlobalDrag((prev) =>
        prev ? { ...prev, x: e.clientX, y: e.clientY } : null
      );
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pendingDragRef.current) {
      pendingDragRef.current = null;
      if (e.target instanceof Element && e.target.hasPointerCapture(e.pointerId)) {
        e.target.releasePointerCapture(e.pointerId);
      }
      return;
    }
    if (globalDrag) {
      if (e.target instanceof Element && e.target.hasPointerCapture(e.pointerId)) {
        e.target.releasePointerCapture(e.pointerId);
      }

      // Hit test to find slot
      const dropTarget = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest('[data-slot-index]');
      if (dropTarget) {
        const targetIndexAttr = dropTarget.getAttribute('data-slot-index');
        if (targetIndexAttr !== null) {
          const targetIndex = parseInt(targetIndexAttr, 10);
          if (globalDrag.startIndex !== targetIndex && !isNaN(targetIndex)) {
            onReorder(globalDrag.startIndex, targetIndex);
          }
        }
      }

      setDraggedIndex(null);
      setGlobalDrag(null);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pendingDragRef.current) {
      pendingDragRef.current = null;
    }
    if (globalDrag) {
      if (e.target instanceof Element && e.target.hasPointerCapture(e.pointerId)) {
        e.target.releasePointerCapture(e.pointerId);
      }
      setDraggedIndex(null);
      setGlobalDrag(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Ensure storage grid always has slots matching creaturesPerPage
  const renderStorageSlots = () => {
    const startIndex = activePage * creaturesPerPage;
    const slots = [];

    for (let i = 0; i < creaturesPerPage; i++) {
      const creatureIndex = startIndex + i;
      const creature = storageCreatures[creatureIndex];
      const absoluteIndex = 6 + creatureIndex; // Offset by active team

      slots.push(
        <div
          key={`storage-slot-${i}`}
          data-slot-index={absoluteIndex}
          onPointerDown={(e) =>
            creature && handlePointerDown(e, absoluteIndex, creature.spriteUrl)
          }
          className={`w-13 h-13 lg:w-16 lg:h-16 shrink-0 border-2 rounded flex flex-col items-center justify-center relative cursor-grab active:cursor-grabbing transition-all duration-200 touch-none ${draggedIndex === absoluteIndex ? 'opacity-50' : 'opacity-100'
            } ${creature ? 'bg-black/60 border-wood hover:bg-black/40' : 'bg-black/20 border-wood/30 hover:bg-white/5'
            }`}
        >
          {creature ? (
            <>
              <img
                src={creature.spriteUrl}
                alt={creature.name}
                className="w-8 h-8 lg:w-12 lg:h-12 pointer-events-none"
              />
              <div className="absolute top-0 right-0 text-[8px] lg:text-[10px] font-bold text-sand bg-black/60 px-1 rounded-bl">
                Lv{creature.level}
              </div>
            </>
          ) : null}
        </div>
      );
    }
    return slots;
  };

  return (
    <div
      className="relative w-screen h-screen bg-[#111] overflow-hidden flex flex-col items-center p-2 lg:p-6 touch-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {/* Background */}
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: `url(${BACKGROUND_IMAGES.Forest})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(4px)',
        }}
      />

      {/* Top Bar */}
      <div className="w-full flex justify-between items-center z-10 mb-2 lg:mb-6">
        <h1 className="text-xl lg:text-3xl font-bold text-sand drop-shadow-md">
          Current Team
        </h1>
        <Button
          variant="wood"
          className="px-3 py-1 lg:px-6 lg:py-2 text-xs lg:text-base font-bold"
          onClick={onBack}
        >
          Back
        </Button>
      </div>

      {/* Active Team Section */}
      <div className="z-10 w-full max-w-4xl mb-2 lg:mb-8">
        <Panel className="p-2 lg:p-4 bg-wood/80 border-cyan-700">
          <div className="flex justify-center gap-2 lg:gap-4 flex-nowrap">
            {Array.from({ length: 6 }).map((_, i) => {
              const creature = activeTeam[i];
              return (
                <div
                  key={`team-slot-${i}`}
                  data-slot-index={i}
                  onPointerDown={(e) =>
                    creature && handlePointerDown(e, i, creature.spriteUrl)
                  }
                  className={`w-16 h-16 lg:w-24 lg:h-24 shrink-0 border-2 rounded flex flex-col items-center justify-center relative transition-all duration-200 touch-none ${creature
                    ? 'bg-cyan-900/40 border-cyan-400 cursor-grab active:cursor-grabbing hover:bg-cyan-950/60'
                    : 'bg-black/40 border-wood/50 hover:bg-white/5'
                    } ${draggedIndex === i ? 'opacity-50' : 'opacity-100'}`}
                >
                  {creature ? (
                    <>
                      <img
                        src={creature.spriteUrl}
                        alt={creature.name}
                        className="w-10 h-10 lg:w-16 lg:h-16 pointer-events-none"
                      />
                      <div className="absolute top-0.5 right-0.5 text-[9px] lg:text-xs font-bold text-sand bg-black/80 px-1 rounded">
                        Lv{creature.level}
                      </div>
                      <div className="absolute bottom-1 w-full px-1">
                        <div className="h-1 lg:h-1.5 w-full bg-red-900 rounded-full overflow-hidden border border-black/50">
                          <div
                            className="h-full bg-green-500"
                            style={{
                              width: `${(creature.currentHp / creature.maxHp) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <span className="text-white/20 text-xl lg:text-3xl">+</span>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Storage Section */}
      <div className="z-10 w-full max-w-4xl flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-end mb-1 lg:mb-2">
          <h2 className="text-base lg:text-2xl font-bold text-sand">Storage</h2>
          <div className="text-xs lg:text-sm text-sand/70">
            Drag creatures between team slots and storage to reorder.
          </div>
        </div>

        <Panel className="flex-1 p-2 lg:p-4 bg-black/60 flex flex-col min-h-0 lg:min-h-[300px]">
          <div className="flex-1 grid grid-cols-6 gap-2 lg:gap-4 place-items-center content-start">
            {renderStorageSlots()}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-2 lg:mt-4 flex justify-center items-center gap-4 border-t border-wood pt-2 lg:pt-4">
              <Button
                variant="wood"
                className="px-3 py-1 lg:px-6 lg:py-2 text-xs lg:text-base font-bold"
                onClick={() => handlePageChange(Math.max(0, activePage - 1))}
                disabled={activePage === 0}
              >
                Previous
              </Button>
              <span className="text-sand font-bold text-xs lg:text-sm">
                Box {activePage + 1} of {totalPages}
              </span>
              <Button
                variant="wood"
                className="px-3 py-1 lg:px-6 lg:py-2 text-xs lg:text-base font-bold"
                onClick={() =>
                  handlePageChange(Math.min(totalPages - 1, activePage + 1))
                }
                disabled={activePage === totalPages - 1}
              >
                Next
              </Button>
            </div>
          )}
        </Panel>
      </div>

      {/* Floating Drag Preview */}
      {globalDrag && (
        <div
          className="fixed z-9999 pointer-events-none w-14 h-14 lg:w-24 lg:h-24 flex items-center justify-center bg-cyan-500/20 border-2 border-cyan-400 rounded shadow-[0_0_15px_rgba(34,211,238,0.8)] opacity-90 scale-105"
          style={{
            left: globalDrag.x - globalDrag.offsetX,
            top: globalDrag.y - globalDrag.offsetY,
          }}
        >
          <img
            src={globalDrag.spriteUrl}
            alt="Dragging Creature"
            className="w-10 h-10 lg:w-16 lg:h-16"
          />
        </div>
      )}
    </div>
  );
}
