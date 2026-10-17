'use client';

import type { SpeciesId } from '@/types/definitionIds';

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
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<SpeciesId | null>(
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
  const selectedIsCaptured = selectedSpecies
    ? capturedSpeciesIds.has(selectedSpecies.id)
    : false;
  const selectedNumber = selectedSpecies
    ? species.findIndex((entry) => entry.id === selectedSpecies.id) + 1
    : 0;
  const selectedJournalImg = selectedSpecies?.journalImg;

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

      <div className="relative z-10 grid min-h-0 flex-1 grid-cols-[minmax(180px,0.85fr)_minmax(0,3.15fr)] gap-3 px-4 pb-4 lg:grid-cols-[minmax(240px,0.75fr)_minmax(0,3.25fr)] lg:gap-5 lg:px-6 lg:pb-6">
        <section
          aria-label="Kip's journal entries"
          className="min-h-0 overflow-y-auto rounded-2xl border border-white/10 bg-[#0b2338]/85 p-2 shadow-2xl backdrop-blur-sm lg:p-3"
        >
          <div className="grid grid-cols-1 gap-1.5 lg:gap-2">
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
                  className={`group flex min-h-14 w-full items-center gap-2 overflow-hidden rounded-xl border p-1.5 text-left transition-all lg:min-h-16 lg:gap-3 lg:p-2 ${
                    isSelected
                      ? 'border-emerald-300 bg-emerald-900/35 shadow-lg shadow-emerald-500/15'
                      : 'border-white/15 bg-white/[0.045] hover:translate-x-0.5 hover:border-emerald-400/50 hover:bg-white/[0.075]'
                  }`}
                >
                  <span className="w-7 shrink-0 text-center font-mono text-[9px] text-sand/35 lg:w-8 lg:text-[10px]">
                    #{String(catalogNumber).padStart(3, '0')}
                  </span>

                  <div className="relative h-10 w-10 shrink-0 lg:h-12 lg:w-12">
                    <Image
                      src={entry.iconImg || entry.spriteUrl}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-contain drop-shadow-[0_8px_10px_rgba(0,0,0,0.35)]"
                    />
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-extrabold tracking-wide text-sand lg:text-sm">
                      {entry.name}
                    </span>
                    <span
                      className={`mt-0.5 block text-[8px] font-black tracking-widest uppercase lg:text-[9px] ${
                        isCaptured ? 'text-emerald-300' : 'text-amber-200'
                      }`}
                    >
                      {isCaptured ? 'Captured' : 'Seen'}
                    </span>
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

              <div
                className={`mt-3 grid min-h-0 flex-1 items-start gap-4 md:mt-4 ${
                  selectedIsCaptured
                    ? 'md:grid-cols-[minmax(240px,1.4fr)_minmax(190px,1fr)]'
                    : ''
                }`}
              >
                <div className="mx-auto flex w-full max-w-[440px] flex-col gap-3">
                  <div
                    className={
                      selectedJournalImg
                        ? 'relative aspect-square w-full shrink-0 overflow-hidden rounded-xl border border-amber-200/20 bg-[#ead8a9] shadow-lg'
                        : 'relative mx-auto aspect-square w-full max-w-72 shrink-0 lg:max-w-96'
                    }
                  >
                    {!selectedJournalImg && (
                      <div className="absolute inset-6 rounded-full bg-emerald-300/10 blur-xl" />
                    )}
                    <Image
                      src={
                        selectedJournalImg ||
                        selectedSpecies.iconImg ||
                        selectedSpecies.spriteUrl
                      }
                      alt={
                        selectedJournalImg
                          ? `${selectedSpecies.name} field sketch`
                          : selectedSpecies.name
                      }
                      fill
                      sizes={
                        selectedJournalImg
                          ? '(min-width: 1024px) 440px, (min-width: 768px) 360px, 55vw'
                          : '(min-width: 1024px) 384px, (min-width: 768px) 320px, 50vw'
                      }
                      priority
                      className={
                        selectedJournalImg
                          ? 'object-contain'
                          : 'object-contain drop-shadow-[0_14px_16px_rgba(0,0,0,0.45)]'
                      }
                    />
                  </div>

                  {selectedIsCaptured && selectedSpecies.journalEntry && (
                    <div
                      className="relative overflow-hidden rounded-xl border border-[#b88a4a]/70 bg-[#ead6a3] px-4 py-3 text-[#4a321f] shadow-[inset_0_0_22px_rgba(119,78,31,0.2),0_8px_18px_rgba(0,0,0,0.2)]"
                      style={{
                        backgroundImage:
                          'radial-gradient(circle at 15% 18%, rgba(255,255,255,0.22), transparent 30%), radial-gradient(circle at 84% 78%, rgba(116,73,25,0.12), transparent 36%)',
                      }}
                    >
                      <h3 className="mb-1.5 text-[10px] font-black tracking-[0.2em] text-[#76502d] uppercase">
                        Kip&apos;s Notes
                      </h3>
                      <p className="text-sm leading-relaxed text-[#4a321f]">
                        {selectedSpecies.journalEntry}
                      </p>
                    </div>
                  )}
                </div>

                {selectedIsCaptured ? (
                  <div className="min-w-0 rounded-xl border border-emerald-300/10 bg-black/15 p-3 lg:p-4">
                    <div className="mb-4 grid grid-cols-2 gap-2 text-center">
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
                          {selectedOwned.length > 0
                            ? Math.max(
                                ...selectedOwned.map(
                                  (creature) => creature.level
                                )
                              )
                            : '\u2014'}
                        </strong>
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-2 text-[10px] font-black tracking-[0.2em] text-sand/50 uppercase">
                        Base Stats
                      </h3>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 md:grid-cols-1">
                        {STAT_LABELS.map(({ key, label }) => (
                          <div
                            key={key}
                            className="flex items-center justify-between border-b border-white/[0.06] py-1.5 text-xs md:text-sm"
                          >
                            <span className="text-sand/50">{label}</span>
                            <strong className="font-mono text-sand">
                              {selectedSpecies.baseStats[key]}
                            </strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto w-full max-w-xl rounded-xl border border-dashed border-amber-300/20 bg-amber-950/15 p-4 text-center">
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
