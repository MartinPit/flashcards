import { AuthSession, AuthUser, Session } from '@supabase/supabase-js'
import { createContext, useContext } from 'react'

export type AuthState = {
  session: AuthSession | null;
  user: AuthUser | null;
  signIn: ({ session, user }: { session: AuthSession | null; user: AuthUser | null }) => void;
  signOut: () => void;
  isSyncEnabled: boolean;
  setIsSyncEnabled: (isSyncEnabled: boolean) => void;
};

export const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  signIn: () => {},
  signOut: () => {},
  isSyncEnabled: true,
  setIsSyncEnabled: () => {}
});

export const useAuth = () => {
  return useContext(AuthContext);
};
