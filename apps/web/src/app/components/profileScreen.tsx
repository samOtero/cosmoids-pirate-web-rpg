'use client';

import { useState } from 'react';
import type {
  CloudProfileReference,
  CloudProfileSummary,
} from '@/types/cloudProfile';
import type { CloudProfileMutation } from '@/store/profileSession';
import { Profile } from '@/types/baseGame';
import { LEVEL_ORDER } from '@/constants/tdLevels';
import { TestProfileTemplateOption } from '@/constants/testProfileTemplates';
import { resolvePlayerCreature } from '@/utils/resolvePlayerCreature';
import Panel, { PanelButton } from '@/app/components/ui/Panel';
import { Button } from '@/app/components/ui/Button';
import { useAccount } from './auth/AuthProvider';
import AccountIdentity from './auth/AccountIdentity';
import DeleteCloudProfileDialog from './DeleteCloudProfileDialog';

interface ProfileScreenProps {
  profiles: (Profile | null)[];
  onSelect: (slotId: number) => void;
  onCreate: (slotId: number) => void;
  onDelete: (slotId: number, confirmed?: CloudProfileReference) => void;
  onBack: () => void;
  creationPending?: boolean;
  accountSlots?: (CloudProfileSummary | null)[];
  loadStatus?: 'idle' | 'loading' | 'ready' | 'error';
  loadingSlot?: number | null;
  loadError?: string | null;
  onRetry?: () => void;
  onRefresh?: () => void;
  mutation?: CloudProfileMutation | null;
  mutationError?: string | null;
  mutationNeedsRefresh?: boolean;
  saveBlocked?: boolean;
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
  accountSlots,
  loadStatus = 'ready',
  loadingSlot = null,
  loadError,
  onRetry,
  onRefresh,
  mutation = null,
  mutationError,
  mutationNeedsRefresh = false,
  saveBlocked = false,
  testProfileTemplates,
  onApplyTestTemplate,
}: ProfileScreenProps) {
  const { session } = useAccount();
  const [showTestTemplates, setShowTestTemplates] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CloudProfileSummary | null>(
    null
  );
  const busy = Boolean(mutation) || loadingSlot !== null || saveBlocked;
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    testProfileTemplates?.[0]?.id ?? ''
  );
  const canUseTestTemplates = Boolean(
    !accountSlots && testProfileTemplates?.length && onApplyTestTemplate
  );
  const selectedTemplate =
    testProfileTemplates?.find(
      (template) => template.id === selectedTemplateId
    ) ?? testProfileTemplates?.[0];
  const activeTemplateId = selectedTemplate?.id ?? '';

  return (
    <div className="flex h-full flex-col items-center justify-start overflow-y-auto p-2 lg:justify-center lg:p-4">
      <div className="mb-4 flex w-full max-w-4xl flex-wrap items-center justify-between gap-3 lg:mb-8">
        <h2 className="border-b-2 border-wood pb-2 text-xl font-bold tracking-widest text-sand uppercase lg:text-3xl">
          Select Save File
        </h2>
        <div className="flex items-center gap-2">
          {accountSlots && onRefresh && (
            <Button
              variant="secondary"
              disabled={busy || loadStatus === 'loading'}
              onClick={onRefresh}
            >
              Refresh saves
            </Button>
          )}
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
          <Button variant="wood" disabled={Boolean(mutation)} onClick={onBack}>
            Back
          </Button>
        </div>
      </div>

      {creationPending && <p role="status">Checking your account…</p>}
      {accountSlots && (
        <p className="mb-4 max-w-4xl text-sm text-sand/75">
          Use Save to keep your cloud progress. New profiles are saved
          immediately. Unfinished battles aren’t saved.
        </p>
      )}
      {accountSlots && (loadStatus === 'loading' || loadStatus === 'idle') && (
        <p role="status">Loading your cloud saves…</p>
      )}
      {loadingSlot !== null && (
        <p role="status" className="mb-3">
          Loading profile…
        </p>
      )}
      {mutation &&
        (mutation.kind === 'create' || mutation.kind === 'delete') && (
          <p role="status" className="mb-3">
            {mutation.kind === 'create' ? 'Creating' : 'Deleting'} cloud save in
            slot {mutation.slot + 1}…
          </p>
        )}
      {mutationError && (
        <div role="alert" className="mb-4 max-w-4xl text-center text-red-300">
          {mutationError}
        </div>
      )}
      {loadError && (
        <div role="alert" className="mb-4 max-w-4xl text-center text-red-300">
          <p>{loadError}</p>
          {onRetry && (
            <Button className="mt-3" onClick={onRetry}>
              Retry
            </Button>
          )}
        </div>
      )}
      {(!accountSlots || loadStatus === 'ready') && (
        <div
          className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3 lg:gap-6"
          aria-busy={busy}
        >
          {[0, 1, 2].map((slotId) => {
            const profile = profiles[slotId];
            const card = profile ?? accountSlots?.[slotId];
            const buddyCreature =
              profile?.creatures[0] ?? profile?.storageCreatures?.[0];

            if (card) {
              return (
                <Panel
                  key={slotId}
                  className="group flex min-h-52 flex-col justify-between transition-colors hover:border-cyan-500 lg:min-h-64"
                >
                  <button
                    type="button"
                    aria-label={`Load ${card.name}`}
                    disabled={creationPending || busy}
                    onClick={() => onSelect(slotId)}
                    className="flex flex-1 flex-col items-center justify-center space-y-1 disabled:cursor-wait disabled:opacity-60 lg:space-y-2"
                  >
                    <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-blue-900 text-2xl lg:mb-2 lg:h-16 lg:w-16 lg:text-3xl">
                      {buddyCreature ? (
                        <img
                          src={(() => {
                            const buddy = resolvePlayerCreature(buddyCreature);
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
                      {card.name}
                    </h3>
                    <p className="text-xs text-sand/70">
                      Level{' '}
                      {
                        LEVEL_ORDER.filter(
                          (level) =>
                            level.requiredProgression === undefined ||
                            card.storyProgression >= level.requiredProgression
                        ).length
                      }
                    </p>
                    <p className="text-xs text-sand/50">
                      Last Played:{' '}
                      {new Date(card.lastPlayed).toLocaleDateString()}
                    </p>
                  </button>
                  {accountSlots && (
                    <p className="mt-2 text-center text-xs text-sand/60">
                      {profile?.creatures.length ??
                        accountSlots[slotId]?.partyCount ??
                        0}{' '}
                      in team ·{' '}
                      {profile?.storageCreatures.length ??
                        accountSlots[slotId]?.storageCount ??
                        0}{' '}
                      in storage
                    </p>
                  )}
                  <div className="mt-2 flex justify-center border-t border-white/10 pt-2">
                    <button
                      type="button"
                      aria-label={
                        accountSlots
                          ? `Delete ${card.name} in slot ${slotId + 1}`
                          : undefined
                      }
                      disabled={
                        creationPending ||
                        busy ||
                        (Boolean(accountSlots) && mutationNeedsRefresh)
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        if (accountSlots) {
                          const target = accountSlots[slotId];
                          if (target)
                            setDeleteTarget({ ...target, name: card.name });
                        } else if (confirm('Delete save?')) onDelete(slotId);
                      }}
                      className="min-h-11 px-3 text-xs font-bold text-red-400 uppercase hover:text-red-300 disabled:opacity-50"
                    >
                      {accountSlots ? 'Delete Cloud Save' : 'Delete Data'}
                    </button>
                  </div>
                </Panel>
              );
            }

            return (
              <PanelButton
                key={slotId}
                disabled={
                  creationPending ||
                  busy ||
                  (Boolean(accountSlots) && mutationNeedsRefresh)
                }
                aria-label={`Create save in slot ${slotId + 1}`}
                onClick={() => onCreate(slotId)}
                className="flex h-52 cursor-pointer flex-col items-center justify-center gap-1 text-center transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:cursor-wait disabled:opacity-50 lg:h-64 lg:gap-4"
              >
                <span className="block text-2xl text-wood-light opacity-50 lg:text-4xl">
                  +
                </span>
                <span className="block text-sm font-bold tracking-widest text-sand/50 uppercase lg:text-base">
                  Empty Slot
                </span>
              </PanelButton>
            );
          })}
        </div>
      )}

      {deleteTarget && (
        <DeleteCloudProfileDialog
          name={deleteTarget.name}
          slot={deleteTarget.slot}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            onDelete(deleteTarget.slot, {
              id: deleteTarget.id,
              revision: deleteTarget.revision,
            });
            setDeleteTarget(null);
          }}
        />
      )}

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
