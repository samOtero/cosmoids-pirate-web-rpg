import { Creature } from '@/types/baseGame';
import { useState, useEffect, useRef } from 'react';
import Panel from '@/app/components/ui/Panel';
import { Button } from '@/app/components/ui/Button';
import { BACKGROUND_IMAGES } from '@/constants/game';
import CreatureDetailsScreen from '@/app/components/CreatureDetailsScreen';

interface PartyScreenProps {
  creatures: Creature[];
  storageCreatures: Creature[];
  onBack: () => void;
  onReorder: (startIndex: number, endIndex: number) => void;
  onContinue?: () => void;
  onUpdateAttacks?: (creatureId: string, equippedAttacks: string[], activeAttackIndex: number) => void;
  getCreatureActiveAttackIndex?: (creatureId: string) => number;
  showTutorial?: boolean;
}

export default function PartyScreen({
  creatures,
  storageCreatures,
  onBack,
  onReorder,
  onContinue,
  onUpdateAttacks,
  getCreatureActiveAttackIndex,
  showTutorial = false,
}: PartyScreenProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [selectedCreatureIndex, setSelectedCreatureIndex] = useState<number | null>(null);
  const [tutorialDismissed, setTutorialDismissed] = useState(false);

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
    isShiny?: boolean;
  } | null>(null);

  const [globalDrag, setGlobalDrag] = useState<{
    startIndex: number;
    spriteUrl: string;
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
    isShiny?: boolean;
  } | null>(null);

  const handlePointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    index: number,
    spriteUrl: string,
    isShiny: boolean = false
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
      isShiny,
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
          isShiny: pd.isShiny,
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
      const clickedIdx = pendingDragRef.current.index;
      pendingDragRef.current = null;
      if (
        e.target instanceof Element &&
        e.target.hasPointerCapture(e.pointerId)
      ) {
        e.target.releasePointerCapture(e.pointerId);
      }
      
      const resolvedCreature = clickedIdx < 6 
        ? activeTeam[clickedIdx] 
        : storageCreatures[clickedIdx - 6];
      
      if (resolvedCreature) {
        setSelectedCreatureIndex(clickedIdx);
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
              creature.iconImg || creature.spriteUrl,
              creature.isShiny
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
                className="pointer-events-none h-8 w-8 object-contain lg:h-12 lg:w-12"
              />
              <div className="absolute top-0 right-0 rounded-bl bg-black/60 px-1 text-[8px] font-bold text-sand lg:text-[10px]">
                Lv{creature.level}
              </div>
              {creature.isShiny && (
                <div className="absolute top-0.5 left-0.5 text-[8px] lg:text-[10px]">
                  ✨
                </div>
              )}
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
                      creature.iconImg || creature.spriteUrl,
                      creature.isShiny
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
                        className="pointer-events-none h-10 w-10 object-contain lg:h-16 lg:w-16"
                      />
                      <div className="absolute top-0.5 right-0.5 rounded bg-black/80 px-1 text-[9px] font-bold text-sand lg:text-xs">
                        Lv{creature.level}
                      </div>
                      {creature.isShiny && (
                        <div className="absolute top-0.5 left-0.5 text-[9px] lg:text-sm">
                          ✨
                        </div>
                      )}
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
            className="h-10 w-10 object-contain lg:h-16 lg:w-16"
          />
          {globalDrag.isShiny && (
            <div className="absolute top-1 left-1 text-xs lg:text-lg">✨</div>
          )}
        </div>
      )}

      {/* Creature Details Screen Overlay */}
      {(() => {
        const selectedCreature =
          selectedCreatureIndex !== null
            ? selectedCreatureIndex < 6
              ? activeTeam[selectedCreatureIndex]
              : storageCreatures[selectedCreatureIndex - 6]
            : null;

        if (!selectedCreature) return null;

        const activeAttackIndex = getCreatureActiveAttackIndex
          ? getCreatureActiveAttackIndex(selectedCreature.id)
          : 0;

        return (
          <CreatureDetailsScreen
            creature={selectedCreature}
            activeAttackIndex={activeAttackIndex}
            onBack={() => setSelectedCreatureIndex(null)}
            onUpdateAttacks={(equipped, activeIdx) => {
              if (onUpdateAttacks) {
                onUpdateAttacks(selectedCreature.id, equipped, activeIdx);
              }
            }}
          />
        );
      })()}

      {/* Onboarding Tutorial Overlay */}
      {showTutorial && !tutorialDismissed && (
        <div className="absolute inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 pb-6 select-none">
          {/* Inner Container: aligns panel and character */}
          <div className="relative w-full max-w-4xl">
            {/* Dialog Panel */}
            <Panel className="relative flex h-32 flex-col items-start justify-start border-wood-light bg-ocean-dark/95 pr-24 lg:h-48 lg:pr-48">
              <div className="mb-1.5 font-mono text-xs font-bold text-yellow-400 md:text-sm lg:mb-3 lg:text-xl">
                Listen closely, kid! Assembling your crew is simple.
              </div>
              <div className="space-y-1 font-mono text-[10px] leading-relaxed text-sand md:text-xs lg:space-y-2 lg:text-lg">
                <div>
                  <span className="font-bold text-cyan-400">1.</span> Drag a
                  Cosmoid from your &quot;Storage&quot; and drop 'em onto your
                  &quot;Current Team&quot;.
                </div>
                <div>
                  <span className="font-bold text-cyan-400">2.</span> Tap on any
                  partner to swap their attacks, check their stats, or release
                  them.
                </div>
              </div>

              {/* Close button in the bottom right corner of panel (under Lance) */}
              <button
                onClick={() => setTutorialDismissed(true)}
                className="absolute right-4 bottom-2.5 cursor-pointer rounded-md border border-green-800 bg-green-600 px-4 py-1.5 text-[10px] font-bold tracking-widest text-white uppercase shadow-lg transition-colors hover:bg-green-500 active:bg-green-700 lg:right-12 lg:bottom-4 lg:text-base"
              >
                Close
              </button>
            </Panel>

            {/* Character Sprite on the right */}
            <div className="pointer-events-none absolute right-0 bottom-12 flex h-auto w-32 justify-end lg:bottom-16 lg:w-48">
              <img
                src="/battles/characters/lance_calm_battle.png"
                alt="Lance"
                className="h-auto w-full object-contain drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
