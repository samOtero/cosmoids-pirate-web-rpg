'use client';

import { useState } from 'react';
import { Profile } from '@/types/baseGame';
import { LEVEL_ORDER } from '@/constants/tdLevels';
import { TestProfileTemplateOption } from '@/constants/testProfileTemplates';
import { resolvePlayerCreature } from '@/utils/resolvePlayerCreature';
import Panel from '@/app/components/ui/Panel';
import { Button } from '@/app/components/ui/Button';
import { useAccount } from './auth/AuthProvider';
import AccountIdentity from './auth/AccountIdentity';

interface ProfileScreenProps {
  profiles: (Profile | null)[];
  onSelect: (slotId: number) => void;
  onCreate: (slotId: number) => void;
  onDelete: (slotId: number) => void;
  onBack: () => void;
  creationPending?: boolean;
  testProfileTemplates?: TestProfileTemplateOption[];
  onApplyTestTemplate?: (templateId: string) => void;
}

export default function ProfileScreen({
  profiles,
  onSelect,
  onCreate,
  onDelete,
  onBack,
  creationPending = false,
  testProfileTemplates,
  onApplyTestTemplate,
}: ProfileScreenProps) {
  const { session } = useAccount();
  const [showTestTemplates, setShowTestTemplates] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    testProfileTemplates?.[0]?.id ?? ''
  );
  const canUseTestTemplates = Boolean(
    testProfileTemplates?.length && onApplyTestTemplate
  );
  const selectedTemplate =
    testProfileTemplates?.find(
      (template) => template.id === selectedTemplateId
    ) ?? testProfileTemplates?.[0];
  const activeTemplateId = selectedTemplate?.id ?? '';

  return (
    <div className="flex h-full flex-col items-center justify-center overflow-y-auto p-2 lg:p-4">
      <div className="mb-4 flex w-full max-w-4xl flex-wrap items-center justify-between gap-3 lg:mb-8">
        <h2 className="border-b-2 border-wood pb-2 text-xl font-bold tracking-widest text-sand uppercase lg:text-3xl">
          Select Save File
        </h2>
        <div className="flex items-center gap-2">
          {canUseTestTemplates && (
            <Button
              variant="secondary"
              className="shrink-0 px-3 py-2 text-xs lg:px-5"
              onClick={() => setShowTestTemplates(true)}
            >
              🧪 Profile 3 Templates
            </Button>
          )}
          {session && <AccountIdentity onSignedOut={onBack} />}
          <Button variant="wood" onClick={onBack}>
            Back
          </Button>
        </div>
      </div>

      {creationPending && <p role="status">Checking your account…</p>}
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
                    Level{' '}
                    {
                      LEVEL_ORDER.filter(
                        (level) =>
                          level.requiredProgression === undefined ||
                          profile.storyProgression >= level.requiredProgression
                      ).length
                    }
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
              <button
                type="button"
                disabled={creationPending}
                aria-label={`Create save in slot ${slotId + 1}`}
                onClick={() => onCreate(slotId)}
                className="space-y-1 text-center disabled:cursor-wait disabled:opacity-50 lg:space-y-4"
              >
                <span className="block text-2xl text-wood-light opacity-50 lg:text-4xl">
                  +
                </span>
                <span className="block text-sm font-bold tracking-widest text-sand/50 uppercase lg:text-base">
                  Empty Slot
                </span>
              </button>
            </Panel>
          );
        })}
      </div>

      {showTestTemplates && canUseTestTemplates && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="test-profile-title"
          onClick={() => setShowTestTemplates(false)}
        >
          <Panel className="w-full max-w-md">
            <div onClick={(event) => event.stopPropagation()}>
              <p className="text-xs font-bold tracking-[0.2em] text-cyan-400 uppercase">
                Test tools
              </p>
              <h3
                id="test-profile-title"
                className="mt-1 text-xl font-bold text-sand"
              >
                Replace Profile 3
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-sand/65">
                Choose a ready-to-play save. Anything currently in the third
                slot will be overwritten.
              </p>

              <label
                htmlFor="test-profile-template"
                className="mt-4 block text-xs font-bold tracking-wider text-sand/80 uppercase"
              >
                Template
              </label>
              <select
                id="test-profile-template"
                value={activeTemplateId}
                onChange={(event) => setSelectedTemplateId(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-lg border-2 border-cyan-700 bg-ocean-dark px-3 text-base font-bold text-sand outline-none focus:border-cyan-400"
              >
                {testProfileTemplates?.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.label}
                  </option>
                ))}
              </select>

              {selectedTemplate && (
                <div className="mt-3 flex items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
                  <img
                    src={selectedTemplate.starterIcon}
                    alt=""
                    className="h-12 w-12 rounded-full bg-blue-950 object-contain p-1"
                  />
                  <div>
                    <p className="font-bold text-cyan-300">
                      Ready for Level {selectedTemplate.level}
                    </p>
                    <p className="text-xs text-sand/60">
                      {selectedTemplate.starterName} · Creature level{' '}
                      {selectedTemplate.creatureLevel}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-5 flex justify-end gap-3">
                <Button
                  variant="secondary"
                  className="px-4 text-xs"
                  onClick={() => setShowTestTemplates(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="px-4 text-xs"
                  disabled={!activeTemplateId}
                  onClick={() => {
                    onApplyTestTemplate?.(activeTemplateId);
                    setShowTestTemplates(false);
                  }}
                >
                  Replace Profile 3
                </Button>
              </div>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
