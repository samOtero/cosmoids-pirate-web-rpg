'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAccount } from '@/app/components/auth/AuthProvider';
import AccountDialog from '@/app/components/auth/AccountDialog';
import { authClient } from '@/lib/auth-client';
import type { AdminAccount, AdminPage } from '@/lib/admin-client';
import { useAdminResource, type OnAdminDenied } from './useAdminResource';
import { AccountInspector, Pagination, RequestState } from './AdminInspector';
import styles from './admin.module.css';

function AccountSearch({ onDenied }: { onDenied: OnAdminDenied }) {
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const result = useAdminResource<AdminPage<AdminAccount>>(
    `/accounts?${new URLSearchParams({ q: search, limit: '20', offset: String(offset) })}`,
    onDenied
  );
  if (selected)
    return (
      <AccountInspector
        key={selected}
        id={selected}
        onBack={() => setSelected(null)}
        onDenied={onDenied}
      />
    );
  return (
    <section aria-labelledby="accounts-heading" className={styles.panel}>
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.eyebrow}>Directory</p>
          <h2 id="accounts-heading">Player accounts</h2>
        </div>
        <button onClick={result.retry}>Refresh</button>
      </div>
      <form
        className={styles.search}
        onSubmit={(event) => {
          event.preventDefault();
          setOffset(0);
          setSearch(input.trim());
        }}
      >
        <label htmlFor="admin-search">
          Search by email, name or account ID
        </label>
        <div>
          <input
            id="admin-search"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            maxLength={200}
            autoComplete="off"
            placeholder="Find a player…"
          />
          <button type="submit">Search</button>
        </div>
      </form>
      <RequestState {...result} />
      {result.data && (
        <>
          <p className={styles.muted}>
            {result.data.total} account{result.data.total === 1 ? '' : 's'}
            {search ? ' found' : ''}
          </p>
          <div className={styles.accountList}>
            {result.data.items.map((account) => (
              <button
                key={account.id}
                className={styles.accountRow}
                onClick={() => setSelected(account.id)}
              >
                <span>
                  <strong>{account.name}</strong>
                  <span>{account.email}</span>
                  <small>{account.id}</small>
                </span>
                <span className={styles.rowMeta}>
                  {account.profileCount} profiles · {account.creatureCount}{' '}
                  creatures<span>Inspect →</span>
                </span>
              </button>
            ))}
          </div>
          {!result.data.items.length && (
            <p className={styles.empty}>No accounts match this search.</p>
          )}
          <Pagination page={result.data} onPage={setOffset} />
        </>
      )}
    </section>
  );
}

function AdminAccess() {
  const [denied, setDenied] = useState<number | null>(null);
  const onDenied = useCallback((status: number) => setDenied(status), []);
  const access = useAdminResource<{ allowed: boolean }>('/session', onDenied);
  const recheckAccess = access.retry;
  useEffect(() => {
    // Clear inspected data when a focused window discovers an expired/revoked login.
    const check = () => recheckAccess();
    window.addEventListener('focus', check);
    return () => window.removeEventListener('focus', check);
  }, [recheckAccess]);
  if (denied)
    return (
      <section className={styles.panel} role="alert">
        <h2>{denied === 401 ? 'Log in again' : 'Admin access required'}</h2>
        <p>
          {denied === 401
            ? 'Your session is no longer valid. Log out and log in again to continue.'
            : 'Your account has not been enabled for administration. Access is assigned privately on the API server.'}
        </p>
      </section>
    );
  if (!access.data)
    return (
      <section className={styles.panel}>
        <RequestState {...access} />
      </section>
    );
  return <AccountSearch onDenied={onDenied} />;
}

export default function AdminPanel() {
  const account = useAccount();
  const [showLogin, setShowLogin] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  async function logout() {
    setSigningOut(true);
    setLogoutError(null);
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error();
      await account.refetch();
    } catch {
      setLogoutError('Could not log out. Try again.');
    } finally {
      setSigningOut(false);
    }
  }
  return (
    <main data-admin-panel className={styles.shell}>
      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <Link href="/" className={styles.back}>
              ← Back to game
            </Link>
            <p className={styles.eyebrow}>Cosmoids · Administration</p>
            <h1>Player records</h1>
            <p className={styles.muted}>
              Inspect saved accounts, profiles and creatures.
            </p>
          </div>
          <div className={styles.headerActions}>
            <span className={styles.badge}>View only</span>
            {account.session && (
              <>
                <span className={styles.muted}>
                  {account.session.user.email}
                </span>
                <button disabled={signingOut} onClick={logout}>
                  {signingOut ? 'Logging out…' : 'Log out'}
                </button>
              </>
            )}
          </div>
        </header>
        {logoutError && <p role="alert">{logoutError}</p>}
        {!account.enabled ? (
          <section className={styles.panel}>
            <h2>Account service unavailable</h2>
            <p>
              This deployment needs an account service before administration can
              be used.
            </p>
          </section>
        ) : account.isPending ? (
          <p role="status">Checking your session…</p>
        ) : account.hasError ? (
          <section className={styles.panel}>
            <p role="alert">Could not check your login.</p>
            <button onClick={() => void account.refetch()}>Try again</button>
          </section>
        ) : !account.session ? (
          <section className={styles.panel}>
            <p className={styles.eyebrow}>Restricted access</p>
            <h2>Log in to administration</h2>
            <p>
              Use your Cosmoids account. Only accounts enabled for
              administration can inspect player records.
            </p>
            <button onClick={() => setShowLogin(true)}>Log in</button>
          </section>
        ) : (
          <>
            <div className={styles.toolbar}>
              <span className={styles.muted}>Viewing cloud records</span>
              <button onClick={() => setRefresh((value) => value + 1)}>
                Reload panel
              </button>
            </div>
            <AdminAccess key={`${account.session.user.id}:${refresh}`} />
          </>
        )}
        {showLogin && (
          <AccountDialog
            action="login"
            onClose={() => setShowLogin(false)}
            onAuthenticated={() => setShowLogin(false)}
          />
        )}
      </div>
    </main>
  );
}
