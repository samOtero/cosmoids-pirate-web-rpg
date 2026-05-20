import { useState } from 'react';
import { Item, Creature } from '@/types/baseGame';
import Panel from '@/app/components/ui/Panel';
import { Button } from '@/app/components/ui/Button';

interface InventoryModalProps {
  inventory: Item[];
  creatures: Creature[];
  onClose: () => void;
  onUseItem: (itemId: string, targetCreatureId?: string) => void;
}

type Category = 'ALL' | 'HEAL' | 'CATCH';

const ITEMS_PER_PAGE = 8;

export default function InventoryModal({
  inventory,
  creatures,
  onClose,
  onUseItem,
}: InventoryModalProps) {
  const [category, setCategory] = useState<Category>('ALL');
  const [page, setPage] = useState(0);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showCreatureSelect, setShowCreatureSelect] = useState(false);

  const filteredItems = inventory.filter((item) => {
    if (category === 'ALL') return true;
    return item.effect === category;
  });

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const currentItems = filteredItems.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE
  );

  const handleUseClick = (item: Item) => {
    if (item.effect === 'HEAL') {
      setSelectedItem(item);
      setShowCreatureSelect(true);
    } else if (item.effect === 'CATCH') {
      onUseItem(item.id, 'ENEMY');
    } else {
      // For now, maybe just log or show message that it can't be used here?
      alert('This item cannot be used here.');
    }
  };

  const handleCreatureSelect = (creatureId: string) => {
    if (selectedItem) {
      onUseItem(selectedItem.id, creatureId);
      setShowCreatureSelect(false);
      setSelectedItem(null);
    }
  };

  if (showCreatureSelect && selectedItem) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <Panel className="w-full max-w-lg bg-wood-dark p-6">
          <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
            <h2 className="text-xl font-bold text-sand">
              Use {selectedItem.name} on who?
            </h2>
            <Button
              variant="secondary"
              onClick={() => setShowCreatureSelect(false)}
            >
              Cancel
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {creatures.map((creature) => (
              <div
                key={creature.id}
                onClick={() => handleCreatureSelect(creature.id)}
                className="flex items-center p-3 bg-white/5 rounded cursor-pointer hover:bg-white/10 border border-transparent hover:border-cyan-400 transition-all"
              >
                <img
                  src={creature.spriteUrl}
                  alt={creature.name}
                  className="w-12 h-12 mr-4"
                />
                <div className="flex-1">
                  <div className="font-bold text-cyan-300">{creature.name}</div>
                  <div className="text-xs text-sand/70">
                    Lvl {creature.level}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-sand font-bold">
                    HP {creature.currentHp}/{creature.maxHp}
                  </div>
                  {/* Simple HP Bar */}
                  <div className="w-24 h-2 bg-gray-700 rounded-full mt-1 overflow-hidden">
                    <div
                      className={`h-full ${creature.currentHp < creature.maxHp * 0.3 ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{
                        width: `${(creature.currentHp / creature.maxHp) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Panel className="w-full max-w-4xl h-[600px] flex flex-col bg-wood-dark">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b-2 border-wood-light/30 pb-4">
          <h2 className="text-3xl font-bold text-sand uppercase tracking-widest">
            Inventory
          </h2>
          <Button variant="wood" onClick={onClose}>
            Close
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          {(['ALL', 'HEAL', 'CATCH'] as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategory(cat);
                setPage(0);
              }}
              className={`px-6 py-2 rounded font-bold uppercase tracking-wider transition-all
                ${category === cat
                  ? 'bg-cyan-600 text-white shadow-lg scale-105'
                  : 'bg-black/20 text-sand/60 hover:bg-black/40'
                }
              `}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {currentItems.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sand/30 italic text-xl">
              No items found.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {currentItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-black/20 p-4 rounded border border-white/5 flex flex-col items-center text-center hover:bg-black/30 transition-colors group relative"
                >
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-3 text-3xl shadow-inner">
                    {item.effect === 'HEAL'
                      ? '💊'
                      : item.effect === 'CATCH'
                        ? '🕸️'
                        : '📦'}
                  </div>
                  <div className="font-bold text-cyan-200 mb-1">
                    {item.name}
                  </div>
                  <div className="text-xs text-sand/60 mb-3 h-8 overflow-hidden">
                    {item.description}
                  </div>

                  <div className="mt-auto w-full flex items-center justify-between">
                    <span className="font-mono text-sand font-bold">
                      x{item.count}
                    </span>
                    {(item.effect === 'HEAL' || item.effect === 'CATCH') && (
                      <button
                        onClick={() => handleUseClick(item)}
                        className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-500 transition-colors uppercase"
                      >
                        Use
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6 pt-4 border-t border-white/10">
            <Button
              variant="secondary"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-1 text-sm"
            >
              Prev
            </Button>
            <span className="text-sand font-mono">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="secondary"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="px-4 py-1 text-sm"
            >
              Next
            </Button>
          </div>
        )}
      </Panel>
    </div>
  );
}
