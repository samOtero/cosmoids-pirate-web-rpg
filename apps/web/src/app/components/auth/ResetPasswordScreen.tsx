'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  authClient,
  getAuthErrorMessage,
  isAuthConfigured,
} from '@/lib/auth-client';
import PasswordRecoveryForm from './PasswordRecoveryForm';
import styles from './account.module.css';

export default function ResetPasswordScreen() {
  const linkGeneration = useRef(0);
  const [link, setLink] = useState<{ ready: boolean; token: string | null }>({
    ready: false,
    token: null,
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const acceptLink = () => {
      const token = new URLSearchParams(window.location.hash.slice(1)).get(
        'token'
      );
      // Keep the token only in this mounted form, never in storage or navigation.
      window.history.replaceState(
        window.history.state,
        '',
        window.location.pathname
      );
      if (token) {
        linkGeneration.current++;
        setLink({ ready: true, token });
        setDone(false);
        setError(null);
        setBusy(false);
      } else {
        // Strict Mode replays setup after the first setup has cleaned the URL.
        setLink((previous) =>
          previous.ready ? previous : { ready: true, token: null }
        );
      }
    };
    acceptLink();
    window.addEventListener('hashchange', acceptLink);
    return () => window.removeEventListener('hashchange', acceptLink);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !link.token || !isAuthConfigured) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const newPassword = String(fields.get('password') ?? '');
    if (newPassword !== fields.get('confirmation')) {
      setError('Your passwords don’t match.');
      return;
    }
    if (newPassword.length < 12 || newPassword.length > 128) {
      setError('Your password must contain 12–128 characters.');
      return;
    }
    setError(null);
    setBusy(true);
    const generation = linkGeneration.current;
    try {
      const result = await authClient.resetPassword({
        newPassword,
        token: link.token,
      });
      if (linkGeneration.current !== generation) return;
      if (result.error) {
        if (result.error.code === 'INVALID_TOKEN') {
          setLink({ ready: true, token: null });
        } else setError(getAuthErrorMessage(result.error));
        return;
      }
      form.reset();
      setDone(true);
      setLink({ ready: true, token: null });
    } catch {
      if (linkGeneration.current !== generation) return;
      setError(
        'We couldn’t confirm the password change. Try logging in with your new password, or request another reset link.'
      );
    } finally {
      if (linkGeneration.current === generation) setBusy(false);
    }
  }

  return (
    <main className={styles.recoveryShell}>
      <section
        className={styles.recoveryCard}
        aria-labelledby="reset-password-title"
      >
        <p className={styles.note}>COSMOIDS · ACCOUNT RECOVERY</p>
        <h1 id="reset-password-title">
          {done ? 'Password updated' : 'Reset password'}
        </h1>
        {!link.ready ? (
          <p role="status">Opening your reset link…</p>
        ) : done ? (
          <p role="status" className={styles.recoveryMessage}>
            Your password has been updated and existing sessions have been
            signed out. Return to the game and log in with your new password.
          </p>
        ) : !link.token ? (
          <>
            <p role="alert" className={styles.recoveryMessage}>
              This reset link is missing, expired, or has already been used.
              Request a new link below.
            </p>
            <PasswordRecoveryForm />
          </>
        ) : (
          <form key={link.token} onSubmit={submit} aria-busy={busy}>
            <p className={styles.note}>
              Choose a new password for your account. Use 12–128 characters.
            </p>
            <fieldset
              className={styles.fields}
              disabled={busy || !isAuthConfigured}
            >
              <label>
                New password
                <input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  required
                />
              </label>
              <label>
                Confirm password
                <input
                  name="confirmation"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  required
                />
              </label>
              {error && (
                <p role="alert" className={styles.error}>
                  {error}
                </p>
              )}
              <button type="submit" className={styles.primaryButton}>
                {busy ? 'Updating…' : 'Update password'}
              </button>
            </fieldset>
            {!isAuthConfigured && (
              <p role="alert" className={styles.error}>
                The account service is unavailable on this version of the game.
              </p>
            )}
          </form>
        )}
        {/* A full navigation drops cached auth state after session revocation. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className={styles.textButton}>
          Return to game
        </a>
      </section>
    </main>
  );
}
