'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { authClient, getAuthErrorMessage } from '@/lib/auth-client';
import { useAccount } from './AuthProvider';
import styles from './account.module.css';
import PasswordRecoveryForm from './PasswordRecoveryForm';

export type AccountAction = 'login' | 'signup';

export default function AccountDialog({
  action,
  onClose,
  onAuthenticated,
}: {
  action: AccountAction;
  onClose: () => void;
  onAuthenticated: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recovering, setRecovering] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const { refetch } = useAccount();
  const isSignup = action === 'signup';

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    dialog?.showModal();
    dialog?.querySelector('input')?.focus();
    return () => {
      dialog?.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus();
    };
  }, []);

  useEffect(() => {
    dialogRef.current?.querySelector('input')?.focus();
  }, [recovering]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const email = String(fields.get('email') ?? '').trim();
    const password = String(fields.get('password') ?? '');
    const name = String(fields.get('name') ?? '').trim();
    if (isSignup && !name) {
      setError('Please enter a display name.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = isSignup
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });
      if (result.error) {
        setError(getAuthErrorMessage(result.error));
        return;
      }
      // A successful POST alone doesn't prove the browser accepted its cookie.
      const confirmed = await authClient.getSession();
      if (confirmed.error || !confirmed.data) {
        setError(
          'We couldn’t confirm your login. Check your connection and browser cookie settings, then try logging in again.'
        );
        return;
      }
      await refetch();
      form.reset();
      onAuthenticated();
    } catch {
      setError(
        'We couldn’t reach the account service. Check your connection and try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="account-dialog-title"
      onCancel={(event) => {
        if (busy) event.preventDefault();
        else onClose();
      }}
    >
      <div className={styles.dialogHeader}>
        <h2 id="account-dialog-title">
          {recovering
            ? 'Reset password'
            : isSignup
              ? 'Create account'
              : 'Log in'}
        </h2>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          disabled={busy}
          aria-label="Close account form"
        >
          ×
        </button>
      </div>
      {recovering ? (
        <PasswordRecoveryForm
          initialEmail={recoveryEmail}
          onBusyChange={setBusy}
          onBack={() => {
            setRecovering(false);
            setError(null);
          }}
        />
      ) : (
        <>
          <p className={styles.note}>
            Sign in to load your cloud profiles. Offline saves stay on this
            device.
          </p>
          <form onSubmit={submit} aria-busy={busy}>
            <fieldset
              disabled={busy}
              className={`${styles.fields} ${isSignup ? styles.signupFields : ''}`}
            >
              {isSignup && (
                <label>
                  Display name
                  <input
                    name="name"
                    type="text"
                    autoComplete="nickname"
                    required
                  />
                </label>
              )}
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  minLength={isSignup ? 12 : undefined}
                  maxLength={128}
                  required
                />
              </label>
              {isSignup && (
                <p className={styles.note}>Use 12–128 characters.</p>
              )}
              {error && (
                <p role="alert" className={styles.error}>
                  {error}
                </p>
              )}
              <button type="submit" className={styles.primaryButton}>
                {busy ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}
              </button>
              {!isSignup && (
                <button
                  type="button"
                  className={styles.textButton}
                  onClick={() => {
                    const email =
                      dialogRef.current?.querySelector<HTMLInputElement>(
                        'input[name="email"]'
                      )?.value ?? '';
                    setRecoveryEmail(email);
                    setError(null);
                    setRecovering(true);
                  }}
                >
                  Forgot password?
                </button>
              )}
            </fieldset>
          </form>
        </>
      )}
    </dialog>
  );
}
