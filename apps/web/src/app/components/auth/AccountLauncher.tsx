'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { useAccount } from './AuthProvider';
import AccountDialog, { type AccountAction } from './AccountDialog';
import styles from './account.module.css';

export default function AccountLauncher({ onStart }: { onStart: () => void }) {
  const { enabled, session, isPending, hasError, refetch } = useAccount();
  const [action, setAction] = useState<AccountAction | null>(null);
  const started = useRef(false);

  useEffect(() => {
    // Restore an existing session, but let an open form confirm its cookie first.
    if (enabled && session && !isPending && !action && !started.current) {
      started.current = true;
      onStart();
    }
  }, [enabled, session, isPending, action, onStart]);

  return (
    <div className={styles.launcher}>
      {!(enabled && session) && (
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
      {action && (
        <AccountDialog
          action={action}
          onClose={() => setAction(null)}
          onAuthenticated={() => {
            started.current = true;
            setAction(null);
            onStart();
          }}
        />
      )}
    </div>
  );
}
