import React, { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { Button, Dialog, Divider, Portal, Text, useTheme } from 'react-native-paper';
import { FlatList, StyleSheet, View } from 'react-native';
import { useQuery } from '@powersync/react-native';
import { useAuth } from '@/hooks/use-auth-context';
import { Folder } from '@/lib/powersync/Schema';

export interface SelectCardSetDialogRef {
  show: (onSelect?: (folderId: string) => void) => void;
}

export const SelectCardSetDialog = forwardRef<SelectCardSetDialogRef>((_, ref) => {
  const [visible, setVisible] = useState(false);
  const [onSelectCallback, setOnSelectCallback] = useState<((folderId: string) => void) | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  const theme = useTheme();
  const { session } = useAuth();
  const userId = session?.user.id ?? '';

  const { data: folders = [] } = useQuery<Folder>(
    'SELECT * FROM folders WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );

  useImperativeHandle(ref, () => ({
    show: (onSelect?: (folderId: string) => void) => {
      setVisible(true);
      setOnSelectCallback(() => onSelect || null);
      setCurrentFolderId(null);
    }
  }));

  const { foldersOnly, cardSetsOnly, foldersByParent, cardSetsByParent } = useMemo(() => {
    const foldersOnly = folders.filter((f) => Number(f.is_card_set ?? 0) === 0);
    const cardSetsOnly = folders.filter((f) => Number(f.is_card_set ?? 0) === 1);

    const foldersByParent = new Map<string | null, Folder[]>();
    const cardSetsByParent = new Map<string | null, Folder[]>();

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

    return { foldersOnly, cardSetsOnly, foldersByParent, cardSetsByParent };
  }, [folders]);

  const displayedCardSets = currentFolderId
    ? (cardSetsByParent.get(currentFolderId) ?? [])
    : (cardSetsByParent.get(null) ?? []);

  const displayedFolders = currentFolderId
    ? (foldersByParent.get(currentFolderId) ?? [])
    : (foldersByParent.get(null) ?? []);

  const parentFolder = currentFolderId
    ? foldersOnly.find((f) => f.id === currentFolderId)
    : null;

  const handleSelectCardSet = (cardSetId: string) => {
    if (onSelectCallback) {
      onSelectCallback(cardSetId);
    }
    setVisible(false);
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={() => setVisible(false)} style={styles.dialog}>
        <Dialog.Title>Select a card set</Dialog.Title>
        <Divider />
        <Dialog.Content style={styles.content}>
          {parentFolder ? (
            <View style={styles.breadcrumb}>
              <Button
                mode="text"
                onPress={() => setCurrentFolderId(null)}
                icon="arrow-left"
                labelStyle={styles.breadcrumbLabel}
              >
                Back to folders
              </Button>
            </View>
          ) : null}

          {displayedFolders.length > 0 ? (
            <View style={styles.section}>
              <Text variant="labelSmall" style={styles.sectionLabel}>
                Folders
              </Text>
              <FlatList
                scrollEnabled={false}
                data={displayedFolders}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.listItem,
                      { borderLeftColor: theme.colors.primary, backgroundColor: theme.colors.elevation.level1 }
                    ]}
                  >
                    <Button
                      mode="text"
                      onPress={() => setCurrentFolderId(item.id)}
                      icon="folder"
                      style={styles.itemButton}
                      labelStyle={styles.itemButtonLabel}
                    >
                      {item.name}
                    </Button>
                  </View>
                )}
              />
            </View>
          ) : null}

          {displayedCardSets.length > 0 ? (
            <View style={styles.section}>
              <Text variant="labelSmall" style={styles.sectionLabel}>
                Card Sets
              </Text>
              <FlatList
                scrollEnabled={false}
                data={displayedCardSets}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.listItem,
                      { borderLeftColor: theme.colors.secondary, backgroundColor: theme.colors.elevation.level1 }
                    ]}
                  >
                    <Button
                      mode="contained"
                      onPress={() => handleSelectCardSet(item.id)}
                      icon="cards"
                      style={styles.selectButton}
                    >
                      {item.name}
                    </Button>
                  </View>
                )}
              />
            </View>
          ) : null}

          {displayedFolders.length === 0 && displayedCardSets.length === 0 ? (
            <Text style={styles.emptyText}>No folders or card sets here.</Text>
          ) : null}
        </Dialog.Content>
      </Dialog>
    </Portal>
  );
});

SelectCardSetDialog.displayName = 'SelectCardSetDialog';

const styles = StyleSheet.create({
  dialog: {
    maxHeight: '80%',
  },
  content: {
    gap: 12,
    maxHeight: '100%',
  },
  breadcrumb: {
    marginBottom: 8,
  },
  breadcrumbLabel: {
    fontSize: 12,
  },
  section: {
    gap: 6,
  },
  sectionLabel: {
    letterSpacing: 0.8,
    opacity: 0.72,
    marginLeft: 4,
  },
  listItem: {
    borderLeftWidth: 4,
    borderRadius: 8,
    marginBottom: 6,
  },
  itemButton: {
    justifyContent: 'flex-start',
  },
  itemButtonLabel: {
    fontSize: 13,
  },
  selectButton: {
    marginHorizontal: 0,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.72,
    marginVertical: 20,
  },
});

