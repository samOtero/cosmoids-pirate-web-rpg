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
    <div className="flex h-full flex-col items-center justify-center p-2 lg:p-4">
      <h2 className="mb-4 border-b-2 border-wood pb-2 text-xl font-bold tracking-widest text-sand uppercase lg:mb-8 lg:text-3xl">
        Select Save File
      </h2>

      <div className="grid w-full max-w-4xl grid-cols-3 gap-4 lg:gap-6">
        {[0, 1, 2].map((slotId) => {
          const profile = profiles[slotId];

          if (profile) {
            return (
              <Panel
                key={slotId}
                className="group flex h-52 cursor-pointer flex-col justify-between transition-colors hover:border-cyan-500 lg:h-64"
              >
                <div
                  onClick={() => onSelect(slotId)}
                  className="flex flex-1 flex-col items-center justify-center space-y-1 lg:space-y-2"
                >
                  <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-blue-900 text-2xl lg:mb-2 lg:h-16 lg:w-16 lg:text-3xl">
                    {profile.creatures[0] || profile.storageCreatures?.[0] ? (
                      <img
                        src={(() => {
                          const buddy = resolvePlayerCreature(
                            profile.creatures[0] || profile.storageCreatures![0]
                          );
                          return buddy.iconImg || buddy.spriteUrl;
                        })()}
                        className="h-8 w-8 object-contain lg:h-12 lg:w-12"
                        alt="buddy"
                      />
                    ) : (
                      '⛵'
                    )}
                  </div>
                  <h3 className="text-base font-bold text-cyan-300 lg:text-xl">
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
                <div className="mt-2 flex justify-center border-t border-white/10 pt-2 lg:mt-4 lg:pt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete save?')) onDelete(slotId);
                    }}
                    className="text-xs font-bold text-red-400 uppercase hover:text-red-300"
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
              className="flex h-52 cursor-pointer flex-col items-center justify-center transition-colors hover:bg-white/5 lg:h-64"
            >
              <div
                onClick={() => onCreate(slotId)}
                className="space-y-1 text-center lg:space-y-4"
              >
                <div className="text-2xl text-wood-light opacity-50 lg:text-4xl">
                  +
                </div>
                <p className="text-sm font-bold tracking-widest text-sand/50 uppercase lg:text-base">
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
