import { type ReactNode, useState, useEffect } from 'react';
import { AuthUser, AuthSession } from '@supabase/supabase-js';
import { AuthContext } from '@/hooks/use-auth-context';
import { Text } from 'react-native';
import { useSystem } from '@/lib/powersync/system';
import { SyncClientImplementation } from '@powersync/react-native';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncEnabled, setIsSyncEnabled] = useState(true);
  const { powerSync, supabase } = useSystem();

  useEffect(() => {
  const { data: { subscription } } = supabase.client.auth.onAuthStateChange((event, session) => {
    setSession(session);
    setUser(session?.user ?? null);
    setIsLoading(false);

    if (event === 'SIGNED_IN') {
      powerSync
        .connect(supabase, { clientImplementation: SyncClientImplementation.RUST })
        .then(() => console.log('connected'))
        .catch(console.error);
    }
  });

  return () => subscription.unsubscribe();
}, []);

  async function signIn({ session, user }: { session: AuthSession | null; user: AuthUser | null }) {
    console.log('signIn');
    setSession(session);
    setUser(user);
  }

  async function signOut() {
    console.log('signOut');
    const { error } = await supabase.client.auth.signOut();

    setSession(null);
    setUser(null);

    if (error) {
      console.error(error);
    }
  }

  async function getSession() {
    const { data } = await supabase.client.auth.getSession();

    if (data.session) {
      setSession(data.session);
      setUser(data.session.user);
    }

    setIsLoading(false);
  }

  useEffect(
    () => {
      if (!session) getSession();
    },
    [session]
  );

  if (isLoading) {
    return (
        <Text>Loading...</Text>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        signIn,
        signOut,
        isSyncEnabled,
        setIsSyncEnabled
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
