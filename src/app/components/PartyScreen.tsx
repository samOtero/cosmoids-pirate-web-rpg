import { Creature } from '@/types/baseGame';
import { useState, useEffect, useRef } from 'react';
import Panel from '@/app/components/ui/Panel';
import { Button } from '@/app/components/ui/Button';
import { BACKGROUND_IMAGES } from '@/constants/game';

interface PartyScreenProps {
  creatures: Creature[];
  storageCreatures: Creature[];
  onBack: () => void;
  onReorder: (startIndex: number, endIndex: number) => void;
  onContinue?: () => void;
}

export default function PartyScreen({
  creatures,
  storageCreatures,
  onBack,
  onReorder,
  onContinue,
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
  const activeTeam = creatures;
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
      if (
        e.target instanceof Element &&
        e.target.hasPointerCapture(e.pointerId)
      ) {
        e.target.releasePointerCapture(e.pointerId);
      }
      return;
    }
    if (globalDrag) {
      if (
        e.target instanceof Element &&
        e.target.hasPointerCapture(e.pointerId)
      ) {
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
      if (
        e.target instanceof Element &&
        e.target.hasPointerCapture(e.pointerId)
      ) {
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
            creature &&
            handlePointerDown(
              e,
              absoluteIndex,
              creature.iconImg || creature.spriteUrl
            )
          }
          className={`relative flex h-13 w-13 shrink-0 cursor-grab touch-none flex-col items-center justify-center rounded border-2 transition-all duration-200 active:cursor-grabbing lg:h-16 lg:w-16 ${
            draggedIndex === absoluteIndex ? 'opacity-50' : 'opacity-100'
          } ${
            creature
              ? 'border-wood bg-black/60 hover:bg-black/40'
              : 'border-wood/30 bg-black/20 hover:bg-white/5'
          }`}
        >
          {creature ? (
            <>
              <img
                src={creature.iconImg || creature.spriteUrl}
                alt={creature.name}
                className="pointer-events-none h-8 w-8 lg:h-12 lg:w-12"
              />
              <div className="absolute top-0 right-0 rounded-bl bg-black/60 px-1 text-[8px] font-bold text-sand lg:text-[10px]">
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
      className="relative flex h-screen w-screen touch-none flex-col items-center overflow-hidden bg-[#111] p-2 lg:p-6"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {/* Top Bar */}
      <div className="z-10 mb-2 flex w-full items-center justify-between lg:mb-6">
        <h1 className="text-xl font-bold text-sand drop-shadow-md lg:text-3xl">
          Current Team
        </h1>
        <div className="flex gap-2">
          <Button
            variant="wood"
            className="px-3 py-1 text-xs font-bold lg:px-6 lg:py-2 lg:text-base"
            onClick={onBack}
          >
            Back
          </Button>
          {onContinue && (
            <Button
              variant="wood"
              className="px-3 py-1 text-xs font-bold lg:px-6 lg:py-2 lg:text-base"
              onClick={onContinue}
              disabled={activeTeam.length === 0}
            >
              Start
            </Button>
          )}
        </div>
      </div>

      {/* Active Team Section */}
      <div className="z-10 mb-2 w-full lg:mb-8">
        <Panel className="border-cyan-700 bg-wood/80">
          {onContinue && activeTeam.length === 0 && (
            <div className="mb-2 animate-pulse text-center text-xs font-bold text-red-400 lg:text-sm">
              ⚠️ Active party is empty! Drag a creature from your storage to
              join your team.
            </div>
          )}
          <div className="flex flex-nowrap justify-center gap-6">
            {Array.from({ length: 6 }).map((_, i) => {
              const creature = activeTeam[i];
              return (
                <div
                  key={`team-slot-${i}`}
                  data-slot-index={i}
                  onPointerDown={(e) =>
                    creature &&
                    handlePointerDown(
                      e,
                      i,
                      creature.iconImg || creature.spriteUrl
                    )
                  }
                  className={`relative flex h-16 w-16 shrink-0 touch-none flex-col items-center justify-center rounded border-2 transition-all duration-200 lg:h-24 lg:w-24 ${
                    creature
                      ? 'cursor-grab border-cyan-400 bg-cyan-900/40 hover:bg-cyan-950/60 active:cursor-grabbing'
                      : 'border-wood/50 bg-black/40 hover:bg-white/5'
                  } ${draggedIndex === i ? 'opacity-50' : 'opacity-100'}`}
                >
                  {creature ? (
                    <>
                      <img
                        src={creature.iconImg || creature.spriteUrl}
                        alt={creature.name}
                        className="pointer-events-none h-10 w-10 lg:h-16 lg:w-16"
                      />
                      <div className="absolute top-0.5 right-0.5 rounded bg-black/80 px-1 text-[9px] font-bold text-sand lg:text-xs">
                        Lv{creature.level}
                      </div>
                      <div className="absolute bottom-1 w-full px-1">
                        <div className="h-1 w-full overflow-hidden rounded-full border border-black/50 bg-red-900 lg:h-1.5">
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
                    <span className="text-xl text-white/20 lg:text-3xl">+</span>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Storage Section */}
      <div className="z-10 flex min-h-0 w-full flex-1 flex-col">
        <div className="mb-1 flex items-end justify-between lg:mb-2">
          <h2 className="text-base font-bold text-sand lg:text-2xl">Storage</h2>
          <div className="text-xs text-sand/70 lg:text-sm">
            Drag creatures between team slots and storage to reorder.
          </div>
        </div>

        <Panel className="flex min-h-0 flex-1 flex-col bg-black/60 p-2 lg:min-h-[300px] lg:p-4">
          <div className="grid flex-1 grid-cols-6 place-items-center content-start gap-2 lg:gap-4">
            {renderStorageSlots()}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-2 flex items-center justify-center gap-4 border-t border-wood pt-2 lg:mt-4 lg:pt-4">
              <Button
                variant="wood"
                className="px-3 py-1 text-xs font-bold lg:px-6 lg:py-2 lg:text-base"
                onClick={() => handlePageChange(Math.max(0, activePage - 1))}
                disabled={activePage === 0}
              >
                Previous
              </Button>
              <span className="text-xs font-bold text-sand lg:text-sm">
                Box {activePage + 1} of {totalPages}
              </span>
              <Button
                variant="wood"
                className="px-3 py-1 text-xs font-bold lg:px-6 lg:py-2 lg:text-base"
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
          className="pointer-events-none fixed z-9999 flex h-14 w-14 scale-105 items-center justify-center rounded border-2 border-cyan-400 bg-cyan-500/20 opacity-90 shadow-[0_0_15px_rgba(34,211,238,0.8)] lg:h-24 lg:w-24"
          style={{
            left: globalDrag.x - globalDrag.offsetX,
            top: globalDrag.y - globalDrag.offsetY,
          }}
        >
          <img
            src={globalDrag.spriteUrl}
            alt="Dragging Creature"
            className="h-10 w-10 lg:h-16 lg:w-16"
          />
        </div>
      )}
    </div>
  );
}
