import { View, Text } from 'react-native';
import { Button } from 'react-native-paper';
import { ErrorBoundaryProps } from 'expo-router';
import { withUniwind } from 'uniwind';

const StyledView = withUniwind(View);

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <StyledView className="flex-1 justify-center items-center bg-background p-6">
      <Text className="text-xl font-bold text-error mb-2">Oops! Something went wrong.</Text>
      <Text className="text-on-surface-variant text-center mb-6">
        {error.message}
      </Text>

      <View className="flex-row gap-4">
        <Button mode="contained" onPress={retry}>
          Try Again
        </Button>
        <Button
          mode="outlined"
          onPress={() => {
            import('expo-updates').then(Updates => Updates.reloadAsync());
          }}
        >
          Hard Reload
        </Button>
      </View>
    </StyledView>
  );
}
