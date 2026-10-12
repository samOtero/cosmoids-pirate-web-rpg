'use client';

import { useState } from 'react';
import { authClient, getAuthErrorMessage } from '@/lib/auth-client';
import { Button } from '../ui/Button';
import { useAccount } from './AuthProvider';
import AccountDialog, { type AccountAction } from './AccountDialog';
import styles from './account.module.css';

export default function AccountLauncher({ onStart }: { onStart: () => void }) {
  const { enabled, session, isPending, hasError, refetch } = useAccount();
  const [action, setAction] = useState<AccountAction | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logout = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await authClient.signOut();
      if (result.error) setError(getAuthErrorMessage(result.error));
      else await refetch();
    } catch {
      setError('We couldn’t log you out. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.launcher}>
      {enabled && session ? (
        <>
          <p className={styles.identity}>
            Signed in as <strong>{session.user.name}</strong>
          </p>
          <Button variant="wood" onClick={onStart}>
            Continue
          </Button>
          <button
            type="button"
            className={styles.textButton}
            onClick={logout}
            disabled={busy}
          >
            {busy ? 'Logging out…' : 'Log out'}
          </button>
        </>
      ) : (
        <>
          {enabled && (
            <div className={styles.accountActions}>
              <Button
                variant="wood"
                disabled={isPending}
                onClick={() => setAction('login')}
              >
                Log in
              </Button>
              <button
                type="button"
                className={styles.textButton}
                disabled={isPending}
                onClick={() => setAction('signup')}
              >
                Create account
              </button>
            </div>
          )}
          <Button variant={enabled ? 'secondary' : 'wood'} onClick={onStart}>
            Play as guest
          </Button>
        </>
      )}
      {enabled && isPending && (
        <p role="status" className={styles.note}>
          Checking your account…
        </p>
      )}
      {enabled && !isPending && (
        <p className={styles.note}>Saves are stored on this device.</p>
      )}
      {hasError && (
        <p role="status" className={styles.error}>
          We couldn’t check your account. Your local saves are still available.{' '}
          <button
            type="button"
            className={styles.textButton}
            onClick={() => {
              void refetch();
            }}
          >
            Retry
          </button>
        </p>
      )}
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      {action && (
        <AccountDialog action={action} onClose={() => setAction(null)} />
      )}
    </div>
  );
}
