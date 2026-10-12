'use client';

import { createContext, useContext, type ReactNode } from 'react';
import {
  authClient,
  isAuthConfigured,
  type AccountSession,
} from '@/lib/auth-client';

type AuthState = {
  enabled: boolean;
  session: AccountSession | null;
  isPending: boolean;
  hasError: boolean;
  refetch: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  enabled: false,
  session: null,
  isPending: false,
  hasError: false,
  refetch: async () => {},
});

export function useAccount() {
  return useContext(AuthContext);
}

function ConnectedAuthProvider({ children }: { children: ReactNode }) {
  const { data, isPending, error, refetch } = authClient.useSession();
  return (
    <AuthContext.Provider
      value={{
        enabled: true,
        session: data,
        isPending,
        hasError: Boolean(error),
        refetch: async () => {
          await refetch();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  if (!isAuthConfigured) return <>{children}</>;
  return <ConnectedAuthProvider>{children}</ConnectedAuthProvider>;
}
