import { Creature } from '@/types/baseGame';
import { useState } from 'react';
import Panel from '@/app/components/ui/Panel';
import { Button } from '@/app/components/ui/Button';
import { BACKGROUND_IMAGES } from '@/constants/game';

interface PartyScreenProps {
  creatures: Creature[];
  onBack: () => void;
  onReorder: (startIndex: number, endIndex: number) => void;
}

const CREATURES_PER_PAGE = 18;

export default function PartyScreen({
  creatures,
  onBack,
  onReorder,
}: PartyScreenProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const activeTeam = creatures.slice(0, 6);
  const storageCreatures = creatures.slice(6);
  const totalPages = Math.ceil(
    Math.max(1, storageCreatures.length) / CREATURES_PER_PAGE
  );

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

  // Ensure storage grid always has 18 slots
  const renderStorageSlots = () => {
    const startIndex = currentPage * CREATURES_PER_PAGE;
    const slots = [];

    for (let i = 0; i < CREATURES_PER_PAGE; i++) {
      const creatureIndex = startIndex + i;
      const creature = storageCreatures[creatureIndex];
      const absoluteIndex = 6 + creatureIndex; // Offset by active team

      slots.push(
        <div
          key={`storage-slot-${i}`}
          className={`w-14 h-14 md:w-16 md:h-16 shrink-0 border-2 rounded flex flex-col items-center justify-center relative cursor-grab active:cursor-grabbing transition-colors ${
            draggedIndex === absoluteIndex ? 'opacity-50' : 'opacity-100'
          } ${
            creature ? 'bg-black/60 border-wood' : 'bg-black/20 border-wood/30'
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
                className="w-10 h-10 md:w-12 md:h-12 pixelated pointer-events-none"
              />
              <div className="absolute top-0 right-0 text-[10px] font-bold text-sand bg-black/60 px-1 rounded-bl">
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
    <div className="relative w-full h-full bg-[#111] overflow-hidden flex flex-col items-center p-4">
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
      <div className="w-full flex justify-between items-center z-10 mb-6">
        <h1 className="text-3xl font-bold text-sand drop-shadow-md">
          Current Team
        </h1>
        <Button variant="wood" onClick={onBack}>
          Back
        </Button>
      </div>

      {/* Active Team Section */}
      <div className="z-10 w-full max-w-4xl mb-8">
        <Panel className="p-4 bg-wood/80 border-cyan-700">
          <div className="flex justify-center gap-2 md:gap-4 flex-wrap">
            {Array.from({ length: 6 }).map((_, i) => {
              const creature = activeTeam[i];
              return (
                <div
                  key={`team-slot-${i}`}
                  className={`w-20 h-20 md:w-24 md:h-24 shrink-0 border-2 rounded flex flex-col items-center justify-center relative transition-colors ${
                    creature
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
                        className="w-14 h-14 md:w-16 md:h-16 pixelated pointer-events-none"
                      />
                      <div className="absolute top-1 right-1 text-xs font-bold text-sand bg-black/80 px-1 rounded">
                        Lv{creature.level}
                      </div>
                      <div className="absolute bottom-1 w-full px-1">
                        <div className="h-1.5 w-full bg-red-900 rounded-full overflow-hidden border border-black/50">
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
                    <span className="text-white/20 text-3xl">+</span>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Storage Section */}
      <div className="z-10 w-full max-w-4xl flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-end mb-2">
          <h2 className="text-2xl font-bold text-sand">Storage</h2>
          <div className="text-sm text-sand/70">
            Drag a creature to swap it into your team or return it to storage.
          </div>
        </div>

        <Panel className="flex-1 p-4 bg-black/60 overflow-y-auto flex flex-col min-h-[300px]">
          <div className="flex-1 grid grid-cols-6 sm:grid-cols-6 md:grid-cols-6 gap-2 md:gap-4 place-items-center sm:content-start">
            {renderStorageSlots()}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center items-center gap-4 border-t border-wood pt-4">
              <Button
                variant="wood"
                className="px-4 py-1 text-sm"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                Previous
              </Button>
              <span className="text-sand font-bold text-sm">
                Box {currentPage + 1} of {totalPages}
              </span>
              <Button
                variant="wood"
                className="px-4 py-1 text-sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
                }
                disabled={currentPage === totalPages - 1}
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
