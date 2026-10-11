export function readAuthConfig(env: NodeJS.ProcessEnv = process.env) {
  const secret = env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('BETTER_AUTH_SECRET must contain at least 32 characters');
  }

  const production = env.NODE_ENV === 'production';
  const baseURL =
    env.BETTER_AUTH_URL ?? (production ? undefined : 'http://localhost:3001');
  if (!baseURL) throw new Error('Missing BETTER_AUTH_URL');

  function parseOrigin(value: string) {
    const url = new URL(value);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.hostname.includes('*') ||
      url.pathname !== '/' ||
      url.search ||
      url.hash ||
      (production && url.protocol !== 'https:')
    ) {
      throw new Error(
        'Auth URLs must be origins without paths or credentials; production requires HTTPS'
      );
    }
    return url.origin;
  }

  const origin = parseOrigin(baseURL);
  const clientOrigins = env.AUTH_TRUSTED_ORIGINS
    ? env.AUTH_TRUSTED_ORIGINS.split(',').map((value) =>
        parseOrigin(value.trim())
      )
    : production
      ? []
      : ['http://localhost:3000'];

  return {
    secret,
    baseURL: origin,
    trustedOrigins: [...new Set([origin, ...clientOrigins])],
  };
}

export type AuthConfig = ReturnType<typeof readAuthConfig>;
