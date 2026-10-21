/** Private server configuration; an empty allowlist disables admin access. */
export function readAdminAccountIds(env: NodeJS.ProcessEnv = process.env) {
  const ids = (env.ADMIN_ACCOUNT_IDS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  if (ids.some((id) => id === '*' || id.length > 200 || /\s/.test(id))) {
    throw new Error('ADMIN_ACCOUNT_IDS must contain exact account IDs.');
  }
  return new Set(ids);
}
