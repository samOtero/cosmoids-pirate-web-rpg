'use client';

import { useState } from 'react';
import { authClient, getAuthErrorMessage } from '@/lib/auth-client';
import { Button } from '../ui/Button';
import { useAccount } from './AuthProvider';
import styles from './account.module.css';

export default function AccountIdentity({
  onSignedOut,
  onStart,
}: {
  onSignedOut: () => void;
  onStart?: () => void;
}) {
  const { session, hasError, refetch } = useAccount();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logout = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setError(getAuthErrorMessage(result.error));
        return;
      }
      await refetch();
      onSignedOut();
    } catch {
      setError('We couldn’t log you out. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={
        onStart ? styles.titleIdentity : 'flex min-w-0 flex-col items-end gap-1'
      }
    >
      <div
        className={
          onStart ? styles.titleActions : 'flex min-w-0 items-center gap-3'
        }
      >
        <p className={styles.identity}>
          Signed in as <strong>{session?.user.name}</strong>
        </p>
        {onStart ? (
          <>
            <Button
              variant="wood"
              className={styles.startButton}
              onClick={onStart}
            >
              Start
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
          <Button variant="wood" onClick={logout} disabled={busy}>
            {busy ? 'Logging out…' : 'Log out'}
          </Button>
        )}
      </div>
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
    </div>
  );
}
