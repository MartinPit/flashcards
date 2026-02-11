import { useAuth } from "@/hooks/use-auth-context";
import { useSystem } from "@/lib/powersync/system";
import GoogleSignInButton from "@/widgets/auth/google-sign-in-button";
import { Button, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


export default function Index() {
  const { powerSync } = useSystem();
  const { signOut, user, session, isSyncEnabled, setIsSyncEnabled } = useAuth();

  async function handleSignOut() {
    await powerSync.disconnectAndClear().catch((error) => console.error(error));
    setIsSyncEnabled(false);
    signOut();
  }

  console.log('user', user);
  console.log('session', session);
  console.log('isSyncEnabled', isSyncEnabled);

  function handleSync() {
    console.log("powerSync status", powerSync.currentStatus);
  }

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <View>
        {!user ? (
          <GoogleSignInButton />

        ) : (
          <Button title="Sign Out" onPress={handleSignOut} />
        )}
        <Button title="Sync" onPress={handleSync} />
      </View>
    </SafeAreaView>
  );
}
