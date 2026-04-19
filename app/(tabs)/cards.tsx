import { useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Appbar, Surface, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import CreateActionsButton from '@/components/ui/create-actions-button';
import { CardsBrowser } from '@/components/cards/cards-browser-new';
import { CardForm } from '@/components/cards/card-form';

export default function CardsTab() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const router = useRouter();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
      <Appbar.Header mode="center-aligned" style={{ backgroundColor: theme.colors.background, elevation: 0 }}>
        <Appbar.Content title="Cards" subtitle="Folders → card sets → cards" />
      </Appbar.Header>

      <View style={[styles.content, { backgroundColor: theme.colors.background }]}>
        {isTablet ? (
          <View style={styles.splitView}>
            <View style={styles.browserPane}>
              <CardsBrowser selectedCardId={selectedCardId} onSelectCard={setSelectedCardId} />
            </View>
            <View style={styles.editorPane}>
              {selectedCardId ? (
                <CardForm
                  mode="edit"
                  cardId={selectedCardId}
                  onCancel={() => setSelectedCardId(null)}
                  onSaved={() => setSelectedCardId(null)}
                />
              ) : (
                <Surface style={styles.emptyEditor} elevation={0}>
                  <Text variant="titleMedium">Pick a card to edit</Text>
                  <Text style={styles.emptyDescription}>
                    Use the list on the left, or tap + to create a new card.
                  </Text>
                </Surface>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.mobileList}>
            <CardsBrowser onSelectCard={(cardId) => router.push(`/cards/${cardId}`)} />
          </View>
        )}
      </View>
      <CreateActionsButton />
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
  editorPane: {
    flex: 1,
    minWidth: 360,
  },
  mobileList: {
    flex: 1,
    paddingBottom: 16,
  },
  emptyEditor: {
    flex: 1,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyDescription: {
    textAlign: 'center',
    opacity: 0.72,
  },
});

