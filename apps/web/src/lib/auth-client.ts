import { createAuthClient } from 'better-auth/react';

const apiURL = process.env.NEXT_PUBLIC_API_URL;

// A deployment without an API URL remains playable as a guest. The fallback
// gives the client a valid URL, but AuthProvider won't mount its session hook.
export const isAuthConfigured = Boolean(apiURL);
export const authClient = createAuthClient({
  baseURL: apiURL || 'http://localhost:3001',
  fetchOptions: { credentials: 'include', timeout: 15000 },
  sessionOptions: {
    refetchOnWindowFocus: true,
    refetchInterval: 0,
    refetchWhenOffline: false,
  },
});

export type AccountSession = typeof authClient.$Infer.Session;

export function getAuthErrorMessage(error: { status?: number; code?: string }) {
  if (error.status === 429)
    return 'Too many attempts. Wait a minute and try again.';
  switch (error.code) {
    case 'INVALID_EMAIL_OR_PASSWORD':
      return 'That email and password combination is incorrect.';
    case 'USER_ALREADY_EXISTS':
    case 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL':
      return 'An account with that email already exists. Try logging in.';
    case 'PASSWORD_TOO_SHORT':
    case 'PASSWORD_TOO_LONG':
      return 'Your password must contain 12–128 characters.';
    default:
      return 'We couldn’t complete your request. Please try again.';
  }
}
