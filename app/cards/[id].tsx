import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Appbar, Surface, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CardsBrowser } from '@/components/cards/cards-browser-new';
import { CardForm } from '@/components/cards/card-form';

export default function EditCardScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isTablet = width >= 900;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      <Appbar.Header mode="center-aligned" style={{ backgroundColor: theme.colors.background }}>
        <Appbar.Content title="Edit card" subtitle="Update the set, type, and fields." />
      </Appbar.Header>

      <View style={[styles.content, { backgroundColor: theme.colors.background }]}>
        {isTablet ? (
          <View style={styles.splitView}>
            <View style={styles.browserPane}>
              <CardsBrowser />
            </View>
            <View style={styles.formPane}>
              <CardForm mode="edit" cardId={id} onSaved={() => router.back()} />
            </View>
          </View>
        ) : (
          <CardForm mode="edit" cardId={id} onSaved={() => router.back()} />
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






