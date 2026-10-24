import { betterAuth, type BetterAuthOptions } from 'better-auth';
import type { AuthConfig } from './auth-config.js';
import {
  passwordResetDestination,
  type PasswordResetSender,
} from './password-reset-email.js';

export function createAuthOptions(
  database: BetterAuthOptions['database'],
  config: AuthConfig,
  sendPasswordReset?: PasswordResetSender
): BetterAuthOptions {
  return {
    appName: 'Cosmoids',
    database,
    baseURL: config.baseURL,
    secret: config.secret,
    trustedOrigins: config.trustedOrigins,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      resetPasswordTokenExpiresIn: 30 * 60,
      revokeSessionsOnPasswordReset: true,
      ...(sendPasswordReset
        ? {
            sendResetPassword: async ({ user, token, url }) => {
              const destination = passwordResetDestination(
                new URL(url).searchParams.get('callbackURL'),
                config.trustedOrigins
              );
              if (!destination) return;
              // Fragments are not sent to Vercel or included in HTTP referrers.
              destination.hash = new URLSearchParams({ token }).toString();
              sendPasswordReset(user.email, destination.href);
            },
          }
        : {}),
    },
    // Persist these counters so restarting the API does not reset login limits.
    rateLimit: {
      enabled: true,
      storage: 'database',
      window: 60,
      max: 100,
      customRules: {
        '/sign-in/email': { window: 60, max: 5 },
        '/sign-up/email': { window: 60, max: 5 },
        '/request-password-reset': { window: 60, max: 3 },
        '/reset-password': { window: 60, max: 5 },
      },
    },
    advanced: {
      useSecureCookies: config.baseURL.startsWith('https://'),
      // The Fastify adapter replaces this header with the resolved client IP.
      ipAddress: { ipAddressHeaders: ['x-cosmoids-client-ip'] },
    },
  };
}

export function createAuth(
  database: BetterAuthOptions['database'],
  config: AuthConfig,
  sendPasswordReset?: PasswordResetSender
) {
  return betterAuth(createAuthOptions(database, config, sendPasswordReset));
}

export type GameAuth = ReturnType<typeof createAuth>;
