import { useAuth } from "@/hooks/use-auth-context";
import { useSystem } from "@/lib/powersync/system";
import { AuthProvider } from "@/providers/auth-provider";
import { PowerSyncContext, SyncClientImplementation } from "@powersync/react-native";
import { Stack } from "expo-router";
import { useEffect } from "react";

export default function RootLayout() {
  const { isSyncEnabled } = useAuth();
  const { powerSync, supabase } = useSystem();

  useEffect(() => {
    if (isSyncEnabled) {
      powerSync
        .connect(supabase, { clientImplementation: SyncClientImplementation.RUST })
        .then(() => console.log('connected'))
        .catch(console.error);
    } else {
      powerSync
        .disconnect()
        .then(() => console.log('not connected'))
        .catch(console.error);
    }
  }, [isSyncEnabled, powerSync]);

  return (
    <PowerSyncContext.Provider value={powerSync}>
      <AuthProvider>
        <Stack screenOptions={{ headerTintColor: '#fff', headerStyle: { backgroundColor: '#2196f3' } }}>
          <Stack.Screen name="signin" options={{ title: 'Supabase Login' }} />
          <Stack.Screen name="register" options={{ title: 'Register' }} />

          <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </PowerSyncContext.Provider>
  );
}

