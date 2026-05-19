import { Creature } from '@/types/baseGame';
import { useState, useEffect } from 'react';
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

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    // Needed for Firefox
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }

    onReorder(draggedIndex, targetIndex);
    setDraggedIndex(null);
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
          className={`w-12 h-12 lg:w-16 lg:h-16 shrink-0 border-2 rounded flex flex-col items-center justify-center relative cursor-grab active:cursor-grabbing transition-colors ${draggedIndex === absoluteIndex ? 'opacity-50' : 'opacity-100'
            } ${creature ? 'bg-black/60 border-wood' : 'bg-black/20 border-wood/30'
            }`}
          draggable={!!creature}
          onDragStart={(e) => creature && handleDragStart(e, absoluteIndex)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, absoluteIndex)}
        >
          {creature ? (
            <>
              <img
                src={creature.spriteUrl}
                alt={creature.name}
                className="w-8 h-8 lg:w-12 lg:h-12 pixelated pointer-events-none"
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
    <div className="relative w-screen h-screen bg-[#111] overflow-hidden flex flex-col items-center p-2 lg:p-6">
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
                  className={`w-14 h-14 lg:w-24 lg:h-24 shrink-0 border-2 rounded flex flex-col items-center justify-center relative transition-colors ${creature
                      ? 'bg-cyan-900/40 border-cyan-400 cursor-grab active:cursor-grabbing'
                      : 'bg-black/40 border-wood/50'
                    } ${draggedIndex === i ? 'opacity-50' : 'opacity-100'}`}
                  draggable={!!creature}
                  onDragStart={(e) => creature && handleDragStart(e, i)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, i)}
                >
                  {creature ? (
                    <>
                      <img
                        src={creature.spriteUrl}
                        alt={creature.name}
                        className="w-10 h-10 lg:w-16 lg:h-16 pixelated pointer-events-none"
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
            Drag a creature to swap it into your team or return it to storage.
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
                onClick={() => setCurrentPage(Math.max(0, activePage - 1))}
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
                  setCurrentPage(Math.min(totalPages - 1, activePage + 1))
                }
                disabled={activePage === totalPages - 1}
              >
                Next
              </Button>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
