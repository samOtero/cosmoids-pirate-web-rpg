import type { PlayerCreature, Profile } from '@/types/baseGame';

export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  profileCount?: number;
  creatureCount?: number;
}
export interface AdminProfile {
  id: string;
  accountId: string;
  slot: number;
  profileVersion: number;
  revision: number;
  createdAt: string;
  savedAt: string;
  profileData: Omit<
    Profile,
    'id' | 'ownerId' | 'version' | 'creatures' | 'storageCreatures'
  >;
  partyCount: number;
  storageCount: number;
}
export interface AdminAccountDetails {
  account: AdminAccount;
  slots: (AdminProfile | null)[];
  tradeBox: {
    revision: number | null;
    updatedAt: string | null;
    creatureCount: number;
  };
}
export interface AdminCreature extends PlayerCreature {
  accountId: string;
  profileId: string | null;
  location: 'party' | 'storage' | 'tradeBox';
  position: number;
  createdAt: string;
  updatedAt: string;
}
export interface AdminPage<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
export class AdminRequestError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export async function getAdmin<T>(
  path: string,
  signal: AbortSignal
): Promise<T> {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base)
    throw new AdminRequestError(0, 'The account service is not configured.');
  const response = await fetch(`${base.replace(/\/$/, '')}/api/admin${path}`, {
    credentials: 'include',
    cache: 'no-store',
    signal,
  });
  if (!response.ok) {
    const message =
      response.status === 401
        ? 'Your session expired. Log in again.'
        : response.status === 403
          ? 'This account does not have admin access.'
          : response.status === 404
            ? 'This record is no longer available.'
            : 'Could not load this information. Try again.';
    throw new AdminRequestError(response.status, message);
  }
  return response.json() as Promise<T>;
}
