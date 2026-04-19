import { useMemo, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { ActivityIndicator, Button, Card, Divider, List, Surface, Text, useTheme } from 'react-native-paper';
import { useQuery } from '@powersync/react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth-context';
import { Card as CardRow, Folder } from '@/lib/powersync/Schema';

type CardsBrowserProps = {
  onSelectCard?: (cardId: string) => void;
  selectedCardId?: string | null;
};

export function CardsBrowser({ onSelectCard, selectedCardId }: CardsBrowserProps) {
  const theme = useTheme();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  const { data: folders = [], isLoading: loadingFolders } = useQuery<Folder>(
    'SELECT * FROM folders WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  const { data: cards = [], isLoading: loadingCards } = useQuery<CardRow>(
    'SELECT * FROM cards WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );

  const { foldersOnly, cardSetsOnly, foldersByParent, cardSetsByParent, cardsBySet } = useMemo(() => {
    const foldersOnly = folders.filter((f) => Number(f.is_card_set ?? 0) === 0);
    const cardSetsOnly = folders.filter((f) => Number(f.is_card_set ?? 0) === 1);

    const foldersByParent = new Map<string | null, Folder[]>();
    const cardSetsByParent = new Map<string | null, Folder[]>();
    const cardsBySet = new Map<string, CardRow[]>();

    for (const folder of foldersOnly) {
      const key = folder.parent_id || null;
      const current = foldersByParent.get(key) ?? [];
      current.push(folder);
      foldersByParent.set(key, current);
    }

    for (const cardSet of cardSetsOnly) {
      const key = cardSet.parent_id || null;
      const current = cardSetsByParent.get(key) ?? [];
      current.push(cardSet);
      cardSetsByParent.set(key, current);
    }

    for (const card of cards) {
      const current = cardsBySet.get(card.folder_id) ?? [];
      current.push(card);
      cardsBySet.set(card.folder_id, current);
    }

    return { foldersOnly, cardSetsOnly, foldersByParent, cardSetsByParent, cardsBySet };
  }, [folders, cards]);

  const currentFolder = currentFolderId ? foldersOnly.find((f) => f.id === currentFolderId) : null;
  const displayedFolders = (foldersByParent.get(currentFolderId || null) ?? []).sort((a, b) =>
    (a.name ?? '').localeCompare(b.name ?? '')
  );
  const displayedCardSets = (cardSetsByParent.get(currentFolderId || null) ?? []).sort((a, b) =>
    (a.name ?? '').localeCompare(b.name ?? '')
  );

  if (loadingFolders || loadingCards) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Breadcrumb / Current folder header */}
      {currentFolder ? (
        <Surface style={[styles.headerSurface, { backgroundColor: theme.colors.elevation.level1 }]} elevation={1}>
          <Button
            mode="text"
            icon="arrow-left"
            onPress={() => setCurrentFolderId(null)}
            labelStyle={styles.breadcrumbLabel}
          >
            Back
          </Button>
          <Text variant="titleMedium" style={styles.folderTitle}>
            {currentFolder.name}
          </Text>
        </Surface>
      ) : (
        <Surface style={[styles.headerSurface, { backgroundColor: theme.colors.elevation.level1 }]} elevation={1}>
          <Text variant="titleMedium">Your Card Sets</Text>
        </Surface>
      )}

      <FlatList
        scrollEnabled
        data={[
          ...displayedFolders.map((f) => ({ type: 'folder' as const, data: f })),
          ...displayedCardSets.map((cs) => ({ type: 'cardset' as const, data: cs })),
        ]}
        keyExtractor={(item) => item.data.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Surface style={[styles.emptyState, { backgroundColor: theme.colors.elevation.level1 }]} elevation={0}>
            <Text variant="bodyMedium">Nothing here yet.</Text>
            <Text variant="bodySmall" style={{ opacity: 0.72 }}>
              Use the + to create a folder or card set.
            </Text>
          </Surface>
        }
        renderItem={({ item }) => {
          if (item.type === 'folder') {
            return (
              <Card
                style={[styles.item, { backgroundColor: theme.colors.elevation.level1 }]}
                onPress={() => setCurrentFolderId(item.data.id)}
              >
                <Card.Content style={styles.cardContent}>
                  <View style={styles.itemHeader}>
                    <Text variant="titleSmall" numberOfLines={1}>
                      📁 {item.data.name}
                    </Text>
                  </View>
                  <Text variant="bodySmall" style={{ opacity: 0.72 }}>
                    Tap to open
                  </Text>
                </Card.Content>
              </Card>
            );
          }

          const setCards = cardsBySet.get(item.data.id) ?? [];
          return (
            <Card style={[styles.item, { backgroundColor: theme.colors.elevation.level1 }]}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.itemHeader}>
                  <Text variant="titleSmall" numberOfLines={1}>
                    🃏 {item.data.name}
                  </Text>
                  <Text variant="labelSmall" style={styles.cardCount}>
                    {setCards.length}
                  </Text>
                </View>
                {setCards.length === 0 ? (
                  <Text variant="bodySmall" style={{ opacity: 0.72 }}>
                    No cards yet
                  </Text>
                ) : (
                  <FlatList
                    scrollEnabled={false}
                    data={setCards.slice(0, 2)}
                    keyExtractor={(card) => card.id}
                    renderItem={({ item: card }) => (
                      <Button
                        mode="text"
                        onPress={() => (onSelectCard ? onSelectCard(card.id) : router.push(`/cards/${card.id}`))}
                        style={[
                          styles.cardButton,
                          selectedCardId === card.id && styles.selectedCardButton,
                        ]}
                        labelStyle={styles.cardButtonLabel}
                        compact
                      >
                        {card.word_type || 'Untitled'}
                      </Button>
                    )}
                  />
                )}
                {setCards.length > 2 ? (
                  <Text variant="bodySmall" style={{ opacity: 0.6, marginTop: 4 }}>
                    +{setCards.length - 2} more
                  </Text>
                ) : null}
              </Card.Content>
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSurface: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  breadcrumbLabel: {
    fontSize: 12,
  },
  folderTitle: {
    marginLeft: 8,
  },
  listContent: {
    gap: 10,
  },
  item: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardContent: {
    paddingVertical: 12,
    gap: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardCount: {
    backgroundColor: 'rgba(103, 80, 164, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardButton: {
    marginLeft: -8,
    marginBottom: 2,
    justifyContent: 'flex-start',
  },
  cardButtonLabel: {
    fontSize: 12,
    textAlign: 'left',
  },
  selectedCardButton: {
    backgroundColor: 'rgba(103, 80, 164, 0.12)',
  },
  emptyState: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    marginVertical: 40,
  },
});

