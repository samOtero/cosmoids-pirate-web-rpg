export type PasswordResetSender = (email: string, url: string) => void;

/** Only exact frontend reset pages may receive reset credentials. */
export function passwordResetDestination(
  value: unknown,
  trustedOrigins: string[]
) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return trustedOrigins.includes(url.origin) &&
      !url.username &&
      !url.password &&
      url.pathname === '/reset-password' &&
      !url.search &&
      !url.hash
      ? url
      : null;
  } catch {
    return null;
  }
}

export function createPasswordResetEmail(
  env: NodeJS.ProcessEnv = process.env,
  transport: typeof fetch = fetch,
  reportFailure: () => void = () =>
    console.error('Password reset email delivery failed')
) {
  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.PASSWORD_RESET_FROM?.trim();
  if (!apiKey && !from) return undefined;
  if (!apiKey || !from || /[\r\n]/.test(from)) {
    throw new Error(
      'Configure RESEND_API_KEY and PASSWORD_RESET_FROM together'
    );
  }
  const pending = new Set<Promise<void>>();
  return {
    // Provider latency/errors must not reveal whether the account exists.
    send(email: string, url: string) {
      const task = (async () => {
        try {
          const response = await transport('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(10000),
            body: JSON.stringify({
              from,
              to: [email],
              subject: 'Reset your Cosmoids password',
              text: `A password reset was requested for your Cosmoids account.\n\nChoose a new password here:\n${url}\n\nThis link expires in 30 minutes and can only be used once. If you did not request this, you can ignore this email. Your password has not changed.`,
            }),
          });
          await response.body?.cancel();
          if (!response.ok) throw new Error('Delivery failed');
        } catch {
          // Never log provider responses, recipients, API keys, or reset links.
          reportFailure();
        }
      })();
      pending.add(task);
      void task.finally(() => pending.delete(task));
    },
    async drain() {
      await Promise.all(pending);
    },
  };
}
