import { Profile } from '@/types/baseGame';
import { resolvePlayerCreature } from '@/utils/resolvePlayerCreature';
import Panel from '@/app/components/ui/Panel';
import { Button } from '@/app/components/ui/Button';

interface ProfileScreenProps {
  profiles: (Profile | null)[];
  onSelect: (slotId: number) => void;
  onCreate: (slotId: number) => void;
  onDelete: (slotId: number) => void;
}

export default function ProfileScreen({
  profiles,
  onSelect,
  onCreate,
  onDelete,
}: ProfileScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-2 lg:p-4">
      <h2 className="text-xl lg:text-3xl text-sand font-bold mb-4 lg:mb-8 uppercase tracking-widest border-b-2 border-wood pb-2">
        Select Save File
      </h2>

      <div className="grid grid-cols-3 gap-4 lg:gap-6 w-full max-w-4xl">
        {[0, 1, 2].map((slotId) => {
          const profile = profiles[slotId];

          if (profile) {
            return (
              <Panel
                key={slotId}
                className="flex flex-col justify-between h-52 lg:h-64 group cursor-pointer hover:border-cyan-500 transition-colors"
              >
                <div
                  onClick={() => onSelect(slotId)}
                  className="flex-1 flex flex-col items-center justify-center space-y-1 lg:space-y-2"
                >
                  <div className="w-12 h-12 lg:w-16 lg:h-16 bg-blue-900 rounded-full flex items-center justify-center text-2xl lg:text-3xl mb-1 lg:mb-2">
                    {profile.creatures[0] || profile.storageCreatures?.[0] ? (
                      <img
                        src={
                          resolvePlayerCreature(
                            profile.creatures[0] || profile.storageCreatures![0]
                          ).spriteUrl
                        }
                        className="w-8 h-8 lg:w-12 lg:h-12"
                        alt="buddy"
                      />
                    ) : (
                      '⛵'
                    )}
                  </div>
                  <h3 className="text-base lg:text-xl font-bold text-cyan-300">
                    {profile.name}
                  </h3>
                  <p className="text-xs text-sand/70">
                    Island {profile.unlockedIslands + 1}
                  </p>
                  <p className="text-xs text-sand/50">
                    Last Played:{' '}
                    {new Date(profile.lastPlayed).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-white/10 flex justify-center lg:mt-4 lg:pt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete save?')) onDelete(slotId);
                    }}
                    className="text-red-400 hover:text-red-300 text-xs uppercase font-bold"
                  >
                    Delete Data
                  </button>
                </div>
              </Panel>
            );
          }

          return (
            <Panel
              key={slotId}
              className="flex flex-col items-center justify-center h-52 lg:h-64 cursor-pointer hover:bg-white/5 transition-colors"
            >
              <div
                onClick={() => onCreate(slotId)}
                className="text-center space-y-1 lg:space-y-4"
              >
                <div className="text-2xl lg:text-4xl text-wood-light opacity-50">+</div>
                <p className="text-sand/50 font-bold uppercase tracking-widest text-sm lg:text-base">
                  Empty Slot
                </p>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
