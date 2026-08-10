'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';

import { COSMOID_TEMPLATES } from '@/constants/creatures';
import { CosmoidTemplate, Profile } from '@/types/baseGame';
import { Button } from '@/app/components/ui/Button';
import { TypeBadge } from '@/app/components/ui/TypeBadge';
import {
  getCapturedSpeciesIds,
  getJournalSeenSpeciesIds,
} from '@/utils/cosmoidJournal';

interface CosmoidCodexScreenProps {
  profile: Profile;
  onBack: () => void;
}

const STAT_LABELS: Array<{
  key: keyof CosmoidTemplate['baseStats'];
  label: string;
}> = [
  { key: 'hp', label: 'HP' },
  { key: 'attack', label: 'Attack' },
  { key: 'defense', label: 'Defense' },
  { key: 'specialAttack', label: 'Sp. Atk' },
  { key: 'specialDefense', label: 'Sp. Def' },
  { key: 'speed', label: 'Speed' },
];

export default function CosmoidCodexScreen({
  profile,
  onBack,
}: CosmoidCodexScreenProps) {
  const species = useMemo(() => Object.values(COSMOID_TEMPLATES), []);
  const ownedCreatures = useMemo(
    () => [...profile.creatures, ...profile.storageCreatures],
    [profile.creatures, profile.storageCreatures]
  );
  const capturedSpeciesIds = useMemo(
    () => getCapturedSpeciesIds(profile),
    [profile]
  );
  const seenSpeciesIds = useMemo(
    () => getJournalSeenSpeciesIds(profile),
    [profile]
  );
  const discoveredSpecies = useMemo(
    () => species.filter((entry) => seenSpeciesIds.has(entry.id)),
    [seenSpeciesIds, species]
  );
  const firstDiscoveredId = discoveredSpecies[0]?.id ?? null;
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string | null>(
    firstDiscoveredId
  );

  const selectedSpecies = species.find(
    (entry) => entry.id === selectedSpeciesId && seenSpeciesIds.has(entry.id)
  );
  const selectedOwned = selectedSpecies
    ? ownedCreatures.filter(
        (creature) => creature.speciesId === selectedSpecies.id
      )
    : [];
  const selectedIsCaptured = selectedOwned.length > 0;
  const selectedNumber = selectedSpecies
    ? species.findIndex((entry) => entry.id === selectedSpecies.id) + 1
    : 0;

  return (
    <main className="relative flex h-full w-full flex-col overflow-hidden bg-[#071a2b] text-sand">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(circle at 12% 15%, rgba(16, 185, 129, 0.18), transparent 32%), radial-gradient(circle at 86% 80%, rgba(6, 182, 212, 0.14), transparent 35%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(#f4e4bc 1px, transparent 1px), linear-gradient(90deg, #f4e4bc 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <header className="relative z-10 flex shrink-0 items-center justify-between gap-4 px-4 py-3 lg:px-6 lg:py-5">
        <div>
          <p className="text-[10px] font-bold tracking-[0.28em] text-emerald-300/70 uppercase lg:text-xs">
            Notes from the voyage
          </p>
          <h1 className="text-xl font-black tracking-wider uppercase lg:text-3xl">
            Kip&apos;s Journal
          </h1>
          <p className="hidden text-sm text-sand/55 lg:block">
            Sketches, sightings, and secrets gathered along the way.
          </p>
        </div>

        <div className="flex items-center gap-2 lg:gap-3">
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-950/50 px-3 py-1.5 text-center">
            <span className="block text-[9px] font-bold tracking-widest text-emerald-300/70 uppercase">
              Sighted
            </span>
            <span className="text-sm font-black text-emerald-100 lg:text-lg">
              {discoveredSpecies.length}
            </span>
          </div>
          <div className="rounded-lg border border-cyan-400/20 bg-cyan-950/50 px-3 py-1.5 text-center">
            <span className="block text-[9px] font-bold tracking-widest text-cyan-300/70 uppercase">
              Caught
            </span>
            <span className="text-sm font-black text-cyan-100 lg:text-lg">
              {capturedSpeciesIds.size}
            </span>
          </div>
          <Button variant="wood" onClick={onBack}>
            Back
          </Button>
        </div>
      </header>

      <div className="relative z-10 grid min-h-0 flex-1 grid-cols-[minmax(0,3fr)_minmax(230px,2fr)] gap-3 px-4 pb-4 lg:gap-5 lg:px-6 lg:pb-6">
        <section
          aria-label="Kip's journal entries"
          className="min-h-0 overflow-y-auto rounded-2xl border border-white/10 bg-[#0b2338]/85 p-3 shadow-2xl backdrop-blur-sm lg:p-4"
        >
          <div className="grid grid-cols-3 gap-2 lg:grid-cols-4 lg:gap-3">
            {discoveredSpecies.map((entry) => {
              const isCaptured = capturedSpeciesIds.has(entry.id);
              const isSelected = selectedSpeciesId === entry.id;
              const catalogNumber =
                species.findIndex(
                  (speciesEntry) => speciesEntry.id === entry.id
                ) + 1;

              return (
                <button
                  key={entry.id}
                  type="button"
                  aria-label={`${entry.name}, ${isCaptured ? 'captured' : 'seen'}`}
                  onClick={() => setSelectedSpeciesId(entry.id)}
                  className={`relative flex min-h-[108px] flex-col items-center justify-center overflow-hidden rounded-xl border p-2 transition-all lg:min-h-[150px] lg:p-3 ${
                    isSelected
                      ? 'border-emerald-300 bg-emerald-900/35 shadow-lg shadow-emerald-500/15'
                      : 'border-white/15 bg-white/[0.045] hover:-translate-y-0.5 hover:border-emerald-400/50 hover:bg-white/[0.075]'
                  }`}
                >
                  <span className="absolute top-1.5 left-2 font-mono text-[9px] text-sand/35 lg:text-[10px]">
                    #{String(catalogNumber).padStart(3, '0')}
                  </span>

                  <div className="relative mt-2 h-12 w-12 lg:h-20 lg:w-20">
                    <Image
                      src={entry.iconImg || entry.spriteUrl}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.35)]"
                    />
                  </div>
                  <span className="mt-1 max-w-full truncate text-xs font-extrabold tracking-wide text-sand lg:text-sm">
                    {entry.name}
                  </span>
                  <span
                    className={`mt-1 rounded-full px-2 py-0.5 text-[8px] font-black tracking-widest uppercase lg:text-[9px] ${
                      isCaptured
                        ? 'bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/30'
                        : 'bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/25'
                    }`}
                  >
                    {isCaptured ? 'Captured' : 'Seen'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="min-h-0 overflow-y-auto rounded-2xl border border-emerald-400/20 bg-gradient-to-b from-[#103149]/95 to-[#091d30]/95 p-4 shadow-2xl lg:p-6">
          {selectedSpecies ? (
            <div className="flex min-h-full flex-col">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-emerald-300/55">
                    #{String(selectedNumber).padStart(3, '0')}
                  </p>
                  <h2 className="text-xl font-black tracking-wide lg:text-3xl">
                    {selectedSpecies.name}
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <TypeBadge type={selectedSpecies.type} />
                    {selectedSpecies.secondaryType && (
                      <TypeBadge type={selectedSpecies.secondaryType} />
                    )}
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[9px] font-black tracking-widest uppercase ${
                    selectedIsCaptured
                      ? 'bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-400/35'
                      : 'bg-amber-400/15 text-amber-100 ring-1 ring-amber-400/30'
                  }`}
                >
                  {selectedIsCaptured ? 'Captured' : 'Seen'}
                </span>
              </div>

              <div className="relative mx-auto my-2 h-28 w-28 shrink-0 lg:my-4 lg:h-44 lg:w-44">
                <div className="absolute inset-3 rounded-full bg-emerald-300/10 blur-xl" />
                <Image
                  src={selectedSpecies.iconImg || selectedSpecies.spriteUrl}
                  alt={selectedSpecies.name}
                  fill
                  sizes="176px"
                  priority
                  className="object-contain drop-shadow-[0_14px_16px_rgba(0,0,0,0.45)]"
                />
              </div>

              {selectedIsCaptured ? (
                <>
                  <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl border border-emerald-300/10 bg-black/15 p-3 text-center">
                    <div>
                      <span className="block text-[9px] font-bold tracking-widest text-sand/40 uppercase">
                        Owned
                      </span>
                      <strong className="text-lg text-emerald-200">
                        {selectedOwned.length}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold tracking-widest text-sand/40 uppercase">
                        Highest Level
                      </span>
                      <strong className="text-lg text-emerald-200">
                        {Math.max(
                          ...selectedOwned.map((creature) => creature.level)
                        )}
                      </strong>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-[10px] font-black tracking-[0.2em] text-sand/50 uppercase">
                      Base Stats
                    </h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      {STAT_LABELS.map(({ key, label }) => (
                        <div
                          key={key}
                          className="flex items-center justify-between border-b border-white/[0.06] py-1 text-xs"
                        >
                          <span className="text-sand/50">{label}</span>
                          <strong className="font-mono text-sand">
                            {selectedSpecies.baseStats[key]}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-auto rounded-xl border border-dashed border-amber-300/20 bg-amber-950/15 p-4 text-center">
                  <p className="text-sm font-bold text-amber-100">
                    Kip&apos;s notes are unfinished
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-sand/45">
                    Catch this Cosmoid in a Story battle so Kip can finish the
                    entry.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex min-h-full flex-col items-center justify-center text-center">
              <span className="text-5xl opacity-25">📖</span>
              <h2 className="mt-3 text-lg font-black">
                The pages are still blank
              </h2>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-sand/45">
                Kip will fill them with sketches as your voyage continues.
              </p>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
