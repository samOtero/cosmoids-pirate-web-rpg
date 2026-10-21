'use client';

import { useState } from 'react';
import Image from 'next/image';
import { COSMOID_TEMPLATES } from '@/constants/creatures';
import { ATTACK_DEFS } from '@/engine/tower-defense/attacks/definitions';
import type { SpeciesId, AttackId } from '@/types/definitionIds';
import type {
  AdminAccountDetails,
  AdminCreature,
  AdminPage,
  AdminProfile,
} from '@/lib/admin-client';
import { useAdminResource, type OnAdminDenied } from './useAdminResource';
import styles from './admin.module.css';

const date = (value: string | number | null) => {
  if (value === null) return 'Not saved yet';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? 'Unknown date'
    : parsed.toLocaleString();
};
const species = (id: number) => COSMOID_TEMPLATES[id as SpeciesId];
export function RequestState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: string | null;
  retry: () => void;
}) {
  if (loading)
    return (
      <p role="status" className={styles.muted}>
        Loading records…
      </p>
    );
  if (error)
    return (
      <div role="alert">
        <p>{error}</p>
        <button onClick={retry}>Try again</button>
      </div>
    );
  return null;
}
export function Pagination({
  page,
  onPage,
}: {
  page: { offset: number; limit: number; total: number };
  onPage: (offset: number) => void;
}) {
  return (
    <nav aria-label="Pagination" className={styles.pagination}>
      <span>
        {page.total
          ? `${page.offset + 1}–${Math.min(page.offset + page.limit, page.total)} of ${page.total}`
          : '0 results'}
      </span>
      <button
        disabled={page.offset === 0}
        onClick={() => onPage(Math.max(0, page.offset - page.limit))}
      >
        Previous
      </button>
      <button
        disabled={page.offset + page.limit >= page.total}
        onClick={() => onPage(page.offset + page.limit)}
      >
        Next
      </button>
    </nav>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function CreatureInspector({
  id,
  onDenied,
}: {
  id: string;
  onDenied: OnAdminDenied;
}) {
  const result = useAdminResource<AdminCreature>(
    `/creatures/${encodeURIComponent(id)}`,
    onDenied
  );
  const c = result.data;
  const definition = c ? species(c.speciesId) : null;
  return (
    <section className={styles.inspector} aria-label="Creature details">
      <RequestState {...result} />
      {c && (
        <>
          <div className={styles.creatureHeading}>
            {definition?.iconImg && (
              <Image src={definition.iconImg} alt="" width={64} height={64} />
            )}
            <div>
              <p className={styles.eyebrow}>Creature details</p>
              <h3>{definition?.name ?? `Species ${c.speciesId}`}</h3>
              <p>
                {c.gender} · {c.isShiny ? 'Shiny' : 'Regular'}
              </p>
            </div>
          </div>
          <dl className={styles.facts}>
            <Field label="Level">{c.level}</Field>
            <Field label="XP">{c.xp}</Field>
            <Field label="Location">
              {c.location === 'tradeBox' ? 'Account trade box' : c.location}
            </Field>
            <Field label="Position">{c.position + 1}</Field>
            <Field label="Species ID">{c.speciesId}</Field>
            <Field label="Targeting">{c.targetingMode ?? 'first'}</Field>
          </dl>
          <h4>Equipped moves</h4>
          <ul className={styles.moves}>
            {c.equippedAttacks.map((id, index) => (
              <li key={id}>
                <strong>
                  {ATTACK_DEFS[id as AttackId]?.name ?? `Attack ${id}`}
                </strong>
                <span>
                  #{id}
                  {index === (c.activeAttackIndex ?? 0) ? ' · Active' : ''}
                </span>
              </li>
            ))}
          </ul>
          <dl className={styles.identities}>
            <Field label="Creature instance ID">{c.id}</Field>
            <Field label="Current account owner">{c.accountId}</Field>
            <Field label="Original owner">{c.originalOwnerId}</Field>
            <Field label="Profile ID">
              {c.profileId ?? 'None · account trade box'}
            </Field>
            <Field label="Created">{date(c.createdAt)}</Field>
            <Field label="Updated">{date(c.updatedAt)}</Field>
          </dl>
        </>
      )}
    </section>
  );
}

function CreatureCollection({
  accountId,
  profileId,
  location,
  onDenied,
}: {
  accountId: string;
  profileId?: string;
  location: AdminCreature['location'];
  onDenied: OnAdminDenied;
}) {
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const query = new URLSearchParams({
    location,
    limit: '24',
    offset: String(offset),
  });
  if (profileId) query.set('profileId', profileId);
  const result = useAdminResource<AdminPage<AdminCreature>>(
    `/accounts/${encodeURIComponent(accountId)}/creatures?${query}`,
    onDenied
  );
  return (
    <>
      <RequestState {...result} />
      {result.data && (
        <>
          <div className={styles.collectionLayout}>
            <div>
              <div className={styles.creatureGrid}>
                {result.data.items.map((c) => {
                  const definition = species(c.speciesId);
                  return (
                    <button
                      key={c.id}
                      aria-pressed={selected === c.id}
                      className={styles.creatureCard}
                      onClick={() => setSelected(c.id)}
                    >
                      {definition?.iconImg && (
                        <Image
                          src={definition.iconImg}
                          alt=""
                          width={40}
                          height={40}
                        />
                      )}
                      <span>
                        <strong>
                          {definition?.name ?? `Species ${c.speciesId}`}
                        </strong>
                        <small>
                          Lv. {c.level} · {c.gender}
                          {c.isShiny ? ' · Shiny' : ''}
                        </small>
                      </span>
                    </button>
                  );
                })}
              </div>
              {!result.data.total && (
                <p className={styles.empty}>No creatures in this collection.</p>
              )}
              <Pagination
                page={result.data}
                onPage={(next) => {
                  setSelected(null);
                  setOffset(next);
                }}
              />
            </div>
            {selected ? (
              <CreatureInspector
                key={selected}
                id={selected}
                onDenied={onDenied}
              />
            ) : result.data.total > 0 ? (
              <p className={styles.empty}>
                Select a creature to inspect its moves and ownership.
              </p>
            ) : null}
          </div>
        </>
      )}
    </>
  );
}

function ProfileInspector({
  id,
  onDenied,
}: {
  id: string;
  onDenied: OnAdminDenied;
}) {
  const result = useAdminResource<AdminProfile>(
    `/profiles/${encodeURIComponent(id)}`,
    onDenied
  );
  const [location, setLocation] = useState<'party' | 'storage'>('party');
  const p = result.data;
  return (
    <>
      <RequestState {...result} />
      {p && (
        <section className={styles.panel} aria-label="Profile details">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Profile slot {p.slot + 1}</p>
              <h2>{p.profileData.name}</h2>
            </div>
            <span className={styles.badge}>Revision {p.revision}</span>
          </div>
          <dl className={styles.facts}>
            <Field label="Progression">{p.profileData.storyProgression}</Field>
            <Field label="Save format">{p.profileVersion}</Field>
            <Field label="Last saved">{date(p.savedAt)}</Field>
            <Field label="Last played">{date(p.profileData.lastPlayed)}</Field>
          </dl>
          <dl className={styles.identities}>
            <Field label="Profile ID">{p.id}</Field>
            <Field label="Account ID">{p.accountId}</Field>
          </dl>
          <div className={styles.tabs} aria-label="Creature collection">
            <button
              aria-pressed={location === 'party'}
              onClick={() => setLocation('party')}
            >
              Party ({p.partyCount})
            </button>
            <button
              aria-pressed={location === 'storage'}
              onClick={() => setLocation('storage')}
            >
              Storage ({p.storageCount})
            </button>
          </div>
          <CreatureCollection
            key={location}
            accountId={p.accountId}
            profileId={p.id}
            location={location}
            onDenied={onDenied}
          />
          <div className={styles.detailColumns}>
            <section>
              <h3>Inventory</h3>
              {p.profileData.inventory.length ? (
                <ul className={styles.moves}>
                  {p.profileData.inventory.map((item) => (
                    <li key={item.id}>
                      <span>{item.name}</span>
                      <strong>×{item.count}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.muted}>Empty inventory</p>
              )}
            </section>
            <section>
              <h3>Game flags</h3>
              <div className={styles.flags}>
                {p.profileData.gameFlags.map((flag) => (
                  <code key={flag}>{flag}</code>
                ))}
              </div>
              {!p.profileData.gameFlags.length && (
                <p className={styles.muted}>No saved flags</p>
              )}
            </section>
          </div>
          <details className={styles.raw}>
            <summary>All saved profile data</summary>
            <pre>{JSON.stringify(p.profileData, null, 2)}</pre>
          </details>
        </section>
      )}
    </>
  );
}

export function AccountInspector({
  id,
  onBack,
  onDenied,
}: {
  id: string;
  onBack: () => void;
  onDenied: OnAdminDenied;
}) {
  const result = useAdminResource<AdminAccountDetails>(
    `/accounts/${encodeURIComponent(id)}`,
    onDenied
  );
  const [view, setView] = useState<string | null>(null);
  const data = result.data;
  return (
    <>
      <div className={styles.toolbar}>
        <button onClick={onBack}>← All accounts</button>
        <button onClick={result.retry}>Refresh account</button>
      </div>
      <RequestState {...result} />
      {data && (
        <>
          <section className={styles.panel}>
            <p className={styles.eyebrow}>Account</p>
            <h2>{data.account.name}</h2>
            <p>{data.account.email}</p>
            <dl className={styles.facts}>
              <Field label="Email verified">
                {data.account.emailVerified ? 'Yes' : 'No'}
              </Field>
              <Field label="Created">{date(data.account.createdAt)}</Field>
            </dl>
            <dl className={styles.identities}>
              <Field label="Account ID">{data.account.id}</Field>
            </dl>
            <div className={styles.slots}>
              {data.slots.map((p, slot) => (
                <button
                  key={slot}
                  disabled={!p}
                  aria-pressed={Boolean(p && view === p.id)}
                  onClick={() => p && setView(p.id)}
                >
                  <small>Profile {slot + 1}</small>
                  <strong>{p?.profileData.name ?? 'Empty slot'}</strong>
                  {p && (
                    <span>
                      {p.partyCount} party · {p.storageCount} storage
                    </span>
                  )}
                </button>
              ))}
              <button
                aria-pressed={view === 'box'}
                onClick={() => setView('box')}
              >
                <small>Shared across profiles</small>
                <strong>Trade box</strong>
                <span>{data.tradeBox.creatureCount} creatures</span>
              </button>
            </div>
          </section>
          {view === 'box' ? (
            <section className={styles.panel}>
              <div className={styles.sectionHeading}>
                <h2>Account trade box</h2>
                <span className={styles.badge}>
                  {data.tradeBox.revision === null
                    ? 'Not used yet'
                    : `Revision ${data.tradeBox.revision}`}
                </span>
              </div>
              <p className={styles.muted}>
                Last updated: {date(data.tradeBox.updatedAt)}
              </p>
              <CreatureCollection
                accountId={id}
                location="tradeBox"
                onDenied={onDenied}
              />
            </section>
          ) : view ? (
            <ProfileInspector key={view} id={view} onDenied={onDenied} />
          ) : (
            <p className={styles.empty}>
              Choose a profile or the account trade box.
            </p>
          )}
        </>
      )}
    </>
  );
}
