/** Reset URLs are bearer credentials, including native Better Auth callbacks. */
export function loggedRequestURL(url: string) {
  const path = url.split('?')[0];
  return path.startsWith('/api/auth/reset-password/')
    ? '/api/auth/reset-password/[redacted]'
    : path;
}
