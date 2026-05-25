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
        <Panel className="bg-wood-dark w-full max-w-lg p-6">
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-2">
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
                className="flex cursor-pointer items-center rounded border border-transparent bg-white/5 p-3 transition-all hover:border-cyan-400 hover:bg-white/10"
              >
                <img
                  src={creature.iconImg || creature.spriteUrl}
                  alt={creature.name}
                  className="mr-4 h-12 w-12"
                />
                <div className="flex-1">
                  <div className="font-bold text-cyan-300">{creature.name}</div>
                  <div className="text-xs text-sand/70">
                    Lvl {creature.level}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-sand">
                    HP {creature.currentHp}/{creature.maxHp}
                  </div>
                  {/* Simple HP Bar */}
                  <div className="mt-1 h-2 w-24 overflow-hidden rounded-full bg-gray-700">
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
      <Panel className="bg-wood-dark flex h-[600px] w-full max-w-4xl flex-col">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between border-b-2 border-wood-light/30 pb-4">
          <h2 className="text-3xl font-bold tracking-widest text-sand uppercase">
            Inventory
          </h2>
          <Button variant="wood" onClick={onClose}>
            Close
          </Button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-4">
          {(['ALL', 'HEAL', 'CATCH'] as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategory(cat);
                setPage(0);
              }}
              className={`rounded px-6 py-2 font-bold tracking-wider uppercase transition-all ${
                category === cat
                  ? 'scale-105 bg-cyan-600 text-white shadow-lg'
                  : 'bg-black/20 text-sand/60 hover:bg-black/40'
              } `}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {currentItems.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xl text-sand/30 italic">
              No items found.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {currentItems.map((item) => (
                <div
                  key={item.id}
                  className="group relative flex flex-col items-center rounded border border-white/5 bg-black/20 p-4 text-center transition-colors hover:bg-black/30"
                >
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-3xl shadow-inner">
                    {item.effect === 'HEAL'
                      ? '💊'
                      : item.effect === 'CATCH'
                        ? '🕸️'
                        : '📦'}
                  </div>
                  <div className="mb-1 font-bold text-cyan-200">
                    {item.name}
                  </div>
                  <div className="mb-3 h-8 overflow-hidden text-xs text-sand/60">
                    {item.description}
                  </div>

                  <div className="mt-auto flex w-full items-center justify-between">
                    <span className="font-mono font-bold text-sand">
                      x{item.count}
                    </span>
                    {(item.effect === 'HEAL' || item.effect === 'CATCH') && (
                      <button
                        onClick={() => handleUseClick(item)}
                        className="rounded bg-green-600 px-3 py-1 text-xs font-bold text-white uppercase transition-colors hover:bg-green-500"
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
          <div className="mt-6 flex items-center justify-center gap-4 border-t border-white/10 pt-4">
            <Button
              variant="secondary"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-1 text-sm"
            >
              Prev
            </Button>
            <span className="font-mono text-sand">
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
