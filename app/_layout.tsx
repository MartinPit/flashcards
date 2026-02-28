import '../global.css';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SplashScreenController } from "@/components/splash-screen-controller";
import { useAuth } from "@/hooks/use-auth-context";
import { useSystem } from "@/lib/powersync/system";
import { AuthProvider } from "@/providers/auth-provider";
import { PowerSyncContext, SyncClientImplementation } from "@powersync/react-native";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { AppRegistry } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { expo } from "../app.json";
import { ThemeSyncProvider } from '@/providers/theme-sync-privider';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_URL,

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

function RootNavigator() {
  const { session, isSyncEnabled } = useAuth()
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
  }, [isSyncEnabled, powerSync, supabase]);

  return (
    <Stack>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  )
}

export default Sentry.wrap(function RootLayout() {
  const { powerSync } = useSystem();

  return (
    <ThemeSyncProvider>
      <GestureHandlerRootView>
        <SafeAreaProvider>
          <PowerSyncContext.Provider value={powerSync}>
            <AuthProvider>
              <SplashScreenController />
              <RootNavigator />
              <StatusBar style="auto" animated />
            </AuthProvider>
          </PowerSyncContext.Provider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ThemeSyncProvider>
  );
});

AppRegistry.registerComponent(expo.name, () => RootNavigator);
