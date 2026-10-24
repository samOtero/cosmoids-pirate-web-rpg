'use client';

import { useState, type FormEvent } from 'react';
import {
  authClient,
  getAuthErrorMessage,
  isAuthConfigured,
} from '@/lib/auth-client';
import styles from './account.module.css';

export default function PasswordRecoveryForm({
  initialEmail = '',
  onBack,
  onBusyChange,
}: {
  initialEmail?: string;
  onBack?: () => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !isAuthConfigured) return;
    const email = String(
      new FormData(event.currentTarget).get('email') ?? ''
    ).trim();
    setBusy(true);
    onBusyChange?.(true);
    setError(null);
    try {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: new URL('/reset-password', window.location.origin).href,
      });
      if (result.error) setError(getAuthErrorMessage(result.error));
      else setSent(true);
    } catch {
      setError(
        'We couldn’t reach the account service. Check your connection and try again.'
      );
    } finally {
      setBusy(false);
      onBusyChange?.(false);
    }
  }

  return (
    <>
      {sent ? (
        <p role="status" className={styles.recoveryMessage}>
          If an account uses that email, we’ll send a password-reset link. Check
          your inbox and spam folder. The link expires in 30 minutes.
        </p>
      ) : (
        <form onSubmit={submit} aria-busy={busy}>
          <p className={styles.note}>
            Enter your account email and we’ll send you a link to choose a new
            password.
          </p>
          <fieldset
            className={styles.fields}
            disabled={busy || !isAuthConfigured}
          >
            <label>
              Email
              <input
                name="email"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                defaultValue={initialEmail}
                required
              />
            </label>
            {error && (
              <p role="alert" className={styles.error}>
                {error}
              </p>
            )}
            <button type="submit" className={styles.primaryButton}>
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
          </fieldset>
          {!isAuthConfigured && (
            <p role="alert" className={styles.error}>
              The account service is unavailable on this version of the game.
            </p>
          )}
        </form>
      )}
      {onBack && (
        <button
          type="button"
          className={styles.textButton}
          disabled={busy}
          onClick={onBack}
        >
          Back to log in
        </button>
      )}
    </>
  );
}
