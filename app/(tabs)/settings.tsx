import React, { useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';
import SignOutButton from '@/components/auth/sign-out-button';
import { withUniwind } from 'uniwind';

const StyledView = withUniwind(View);

export default function Tab() {
  const [checking, setChecking] = useState(false);

  const onCheckForUpdate = async () => {
    setChecking(true);
    try {
      // 1. Check if there is an update available on the server
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        Alert.alert(
          'Update Available',
          'A new version is available. Download and restart now?',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setChecking(false) },
            {
              text: 'Download',
              onPress: async () => {
                // 2. Fetch the update
                await Updates.fetchUpdateAsync();
                // 3. Reload the app to apply the update
                await Updates.reloadAsync();
              }
            },
          ]
        );
      } else {
        Alert.alert('Up to date', 'You are already running the latest version.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not check for updates. Make sure you are not in a development build.');
      console.error(error);
    } finally {
      setChecking(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StyledView className="gap-4 items-center">
        <SignOutButton />

        <Button
          mode="contained-tonal"
          onPress={onCheckForUpdate}
          loading={checking}
          disabled={checking}
          icon="update"
        >
          Check for Updates
        </Button>

        {/* Display current update ID for debugging */}
        <Text variant="labelSmall" style={{ opacity: 0.5 }}>
          Update ID: {Updates.updateId || 'Development'}
        </Text>
        <Text variant="labelSmall" style={{ opacity: 0.5 }}>
          Update Channel: {Updates.channel || 'default'}
        </Text>
        <Text variant="labelSmall" style={{ opacity: 0.5 }}>
          Runtime Version: {Updates.runtimeVersion}
        </Text>
      </StyledView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
