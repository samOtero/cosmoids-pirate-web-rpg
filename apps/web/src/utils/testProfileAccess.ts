interface TestProfileAccessContext {
  nodeEnv?: string;
  buildBranch?: string;
  hostname?: string;
}

export function isLocalHostname(hostname?: string): boolean {
  const normalizedHostname = hostname?.trim().toLowerCase();
  return (
    normalizedHostname === 'localhost' ||
    normalizedHostname === '127.0.0.1' ||
    normalizedHostname === '::1' ||
    normalizedHostname === '[::1]'
  );
}

export function shouldEnableTestProfileOverride({
  nodeEnv,
  buildBranch,
  hostname,
}: TestProfileAccessContext): boolean {
  return (
    nodeEnv === 'development' ||
    buildBranch?.trim().toLowerCase() === 'experimental' ||
    isLocalHostname(hostname)
  );
}

export function isTestProfileOverrideEnabled(hostname?: string): boolean {
  return shouldEnableTestProfileOverride({
    nodeEnv: process.env.NODE_ENV,
    buildBranch: process.env.NEXT_PUBLIC_COSMOIDS_BUILD_BRANCH,
    hostname,
  });
}
