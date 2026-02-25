import { useAuth } from '@/hooks/use-auth-context';
import { useSystem } from '@/lib/powersync/system'
import React from 'react'
import { Button } from 'react-native'


export default function SignOutButton() {
  const { powerSync } = useSystem();
  const { signOut, setIsSyncEnabled } = useAuth();

  async function handleSignOut() {
    await powerSync.disconnectAndClear().catch((error) => console.error(error));
    setIsSyncEnabled(false);
    signOut();
  }

  return <Button title="Sign out" onPress={handleSignOut} />
}
