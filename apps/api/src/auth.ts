import { betterAuth, type BetterAuthOptions } from 'better-auth';
import type { AuthConfig } from './auth-config.js';

export function createAuthOptions(
  database: BetterAuthOptions['database'],
  config: AuthConfig
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
  config: AuthConfig
) {
  return betterAuth(createAuthOptions(database, config));
}

export type GameAuth = ReturnType<typeof createAuth>;
