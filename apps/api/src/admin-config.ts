/** Private server configuration; both fields must match the authenticated user. */
export function readAdminAccounts(env: NodeJS.ProcessEnv = process.env) {
  if (env.ADMIN_ACCOUNT_IDS?.trim()) {
    throw new Error(
      'Replace ADMIN_ACCOUNT_IDS with ADMIN_ACCOUNTS ID/email pairs.'
    );
  }
  const accounts = new Map<string, string>();
  const source = env.ADMIN_ACCOUNTS?.trim();
  if (!source) return accounts;
  const invalid = () =>
    new Error(
      'ADMIN_ACCOUNTS must be a JSON array of unique {"id":"account-id","email":"account-email"} pairs with exact values.'
    );
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch {
    throw invalid();
  }
  if (!Array.isArray(value)) throw invalid();
  for (const entry of value) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry))
      throw invalid();
    const { id, email } = entry as Record<string, unknown>;
    if (
      Object.keys(entry).length !== 2 ||
      typeof id !== 'string' ||
      !id ||
      id.length > 200 ||
      /[\s*]/.test(id) ||
      typeof email !== 'string' ||
      email.length > 320 ||
      !/^[^\s@*]+@[^\s@*]+$/.test(email) ||
      accounts.has(id)
    )
      throw invalid();
    accounts.set(id, email);
  }
  return accounts;
}
