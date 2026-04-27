import React, { useCallback } from 'react';
import { FlatList, View, Text } from 'react-native';
import { ActivityIndicator, Appbar, List, useTheme } from 'react-native-paper';
import { useQuery, usePowerSync } from '@powersync/react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth-context';
import { Folder, Card as CardType } from '@/lib/powersync/Schema';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { CreateActionsButton } from '@/components/ui/create-actions-button';
import { SwipeableListItem } from '@/components/ui/swipeable-list-item';
import { useConfirmDialog } from '@/components/ui/use-confirm-dialog';
import { withUniwind } from 'uniwind';

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledSafeAreaView = withUniwind(SafeAreaView);

type Item = Folder | CardType;

export default function FolderDetail() {
  const router = useRouter();
  const params = useLocalSearchParams<{ folderId: string }>();
  const { session } = useAuth();
  const powerSync = usePowerSync();
  const theme = useTheme();
  const folderId = params.folderId;
  const { confirmDialogRef, showDeleteConfirm } = useConfirmDialog();

  const { data: folders, isLoading: loadingFolders } = useQuery<Folder>(
    `SELECT * FROM folders WHERE user_id = ? AND parent_id = ? ORDER BY name`,
    [session?.user.id, folderId]
  );

  const { data: cards, isLoading: loadingCards } = useQuery<CardType>(
    `SELECT * FROM cards WHERE user_id = ? AND folder_id = ? ORDER BY created_at DESC`,
    [session?.user.id, folderId]
  );

  const { data: currentFolder } = useQuery<Folder>(
    `SELECT * FROM folders WHERE id = ? AND user_id = ?`,
    [folderId, session?.user.id]
  );

  const allItems: Item[] = [...(folders || []), ...(cards || [])];
  const isLoading = loadingFolders || loadingCards;

  const deleteFolder = useCallback((id: string) => {
    powerSync.execute('DELETE FROM folders WHERE id = ?', [id])
      .catch(e => console.error("Delete failed", e));
  }, [powerSync]);

  const deleteCard = useCallback((id: string) => {
    powerSync.execute('DELETE FROM cards WHERE id = ?', [id])
      .catch(e => console.error("Delete failed", e));
  }, [powerSync]);

  const showDeleteFolderDialog = useCallback((id: string, name: string) => {
    showDeleteConfirm({
      title: 'Delete Folder',
      message: `Are you sure you want to delete "${name}"? This will delete everything inside.`,
      onDelete: () => deleteFolder(id),
    });
  }, [showDeleteConfirm, deleteFolder]);

  const showDeleteCardDialog = useCallback((id: string) => {
    showDeleteConfirm({
      title: 'Delete Card',
      message: 'Are you sure you want to delete this card?',
      onDelete: () => deleteCard(id),
    });
  }, [showDeleteConfirm, deleteCard]);

  const navigateToFolder = useCallback((folder: Folder) => {
    router.push(`/(tabs)/cards/${folder.id}`);
  }, [router]);

  const getItemData = (item: Item) => {
    const isFolder = 'parent_id' in item && 'name' in item;
    if (isFolder) {
      const folder = item as Folder;
      return {
        title: folder.name!,
        description: folder.is_card_set === 1 ? 'Card Set' : 'Folder',
        icon: folder.is_card_set === 1 ? 'cards' : 'folder',
        iconColor: folder.is_card_set === 1 ? theme.colors.primary : theme.colors.onSurfaceVariant,
        showChevron: true,
        onPress: () => navigateToFolder(folder),
        onSwipeOpen: () => showDeleteFolderDialog(folder.id, folder.name!),
      };
    } else {
      const card = item as CardType;
      const data = card.data ? JSON.parse(card.data!) : {};
      return {
        title: data.front || 'Card',
        description: card.word_type || 'Card',
        icon: 'card',
        iconColor: theme.colors.onSurfaceVariant,
        showChevron: false,
        onPress: undefined,
        onSwipeOpen: () => showDeleteCardDialog(card.id),
      };
    }
  };

  return (
    <>
      <StyledSafeAreaView className="flex-1 bg-surface" edges={['left', 'right']}>
        <Appbar.Header elevated={false}>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content
            title={currentFolder && currentFolder.length > 0 ? currentFolder[0].name : 'Folder'}
          />
        </Appbar.Header>

        {isLoading ? (
          <StyledView className="flex-1 justify-center items-center">
            <ActivityIndicator animating={true} size="large" />
          </StyledView>
        ) : allItems.length === 0 ? (
          <StyledView className="flex justify-center items-center px-8">
            <List.Icon icon="folder-open-outline" color={theme.colors.outline} style={{ width: 64, height: 64 }} />
            <StyledText variant="bodyLarge" className="text-on-surface-variant text-center mt-4">
              Empty folder
            </StyledText>
            <StyledText variant="bodyMedium" className="text-outline text-center mt-2">
              Add cards or subfolders to get started
            </StyledText>
          </StyledView>
        ) : (
          <FlatList
            data={allItems}
            contentContainerStyle={{ padding: 16, gap: 2 }}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => {
              const data = getItemData(item);
              return (
                <SwipeableListItem
                  title={data.title}
                  description={data.description}
                  icon={data.icon}
                  iconColor={data.iconColor}
                  showChevron={data.showChevron}
                  index={index}
                  itemsLength={allItems.length}
                  onPress={data.onPress}
                  onSwipeOpen={data.onSwipeOpen}
                />
              );
            }}
          />
        )}
      </StyledSafeAreaView>
      <ConfirmDialog ref={confirmDialogRef} />
      <CreateActionsButton currentFolderId={folderId} />
    </>
  );
}
