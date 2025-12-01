import { Profile } from "@/types/baseGame";
import Panel from "@/app/components/ui/Panel";
import { Button } from "@/app/components/ui/Button";

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
    <div className="flex flex-col items-center justify-center h-full p-4">
      <h2 className="text-3xl text-sand font-bold mb-8 uppercase tracking-widest border-b-2 border-wood pb-2">
        Select Save File
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {[0, 1, 2].map((slotId) => {
          const profile = profiles[slotId];

          if (profile) {
            return (
              <Panel
                key={slotId}
                className="flex flex-col justify-between h-64 group cursor-pointer hover:border-cyan-500 transition-colors"
              >
                <div
                  onClick={() => onSelect(slotId)}
                  className="flex-1 flex flex-col items-center justify-center space-y-2"
                >
                  <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center text-3xl mb-2">
                    {profile.creatures[0] ? (
                      <img
                        src={profile.creatures[0].spriteUrl}
                        className="w-12 h-12"
                        alt="buddy"
                      />
                    ) : (
                      "⛵"
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-cyan-300">
                    {profile.name}
                  </h3>
                  <p className="text-xs text-sand/70">
                    Island {profile.unlockedIslands + 1}
                  </p>
                  <p className="text-xs text-sand/50">
                    Last Played:{" "}
                    {new Date(profile.lastPlayed).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 flex justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Delete save?")) onDelete(slotId);
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
              className="flex flex-col items-center justify-center h-64 cursor-pointer hover:bg-white/5 transition-colors"
            >
              <div
                onClick={() => onCreate(slotId)}
                className="text-center space-y-4"
              >
                <div className="text-4xl text-wood-light opacity-50">+</div>
                <p className="text-sand/50 font-bold uppercase tracking-widest">
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
