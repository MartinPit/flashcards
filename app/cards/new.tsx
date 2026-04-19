import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Appbar, Surface, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CardsBrowser } from '@/components/cards/cards-browser-new';
import { CardForm } from '@/components/cards/card-form';

export default function NewCardScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { cardSetId } = useLocalSearchParams<{ cardSetId?: string }>();
  const isTablet = width >= 900;

  const initialCardSetId = typeof cardSetId === 'string' ? cardSetId : undefined;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      <Appbar.Header mode="center-aligned" style={{ backgroundColor: theme.colors.background }}>
        <Appbar.Content title="New card" subtitle="Choose a set, type, and fill the fields." />
      </Appbar.Header>

      <View style={[styles.content, { backgroundColor: theme.colors.background }]}>
        {isTablet ? (
          <View style={styles.splitView}>
            <View style={styles.browserPane}>
              <CardsBrowser />
            </View>
            <View style={styles.formPane}>
              <CardForm mode="create" initialCardSetId={initialCardSetId} />
            </View>
          </View>
        ) : (
          <CardForm mode="create" initialCardSetId={initialCardSetId} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 0,
  },
  splitView: {
    flex: 1,
    flexDirection: 'row',
    gap: 16,
  },
  browserPane: {
    flex: 1,
    minWidth: 340,
  },
  formPane: {
    flex: 1,
    minWidth: 360,
  },
});







