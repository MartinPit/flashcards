import React, { useCallback } from 'react';
import { FlatList, View } from 'react-native';
import { ActivityIndicator, Appbar, List, Text, useTheme } from 'react-native-paper';
import { useQuery, usePowerSync } from '@powersync/react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useAuth } from '@/hooks/use-auth-context';
import { Folder } from '@/lib/powersync/Schema';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { CreateActionsButton } from '@/components/ui/create-actions-button';
import { SwipeableListItem } from '@/components/ui/swipeable-list-item';
import { useConfirmDialog } from '@/components/ui/use-confirm-dialog';
import { withUniwind } from 'uniwind';

const StyledView = withUniwind(View);
const StyledSafeAreaView = withUniwind(SafeAreaView);

export default function CardsIndex() {
  const router = useRouter();
  const params = useLocalSearchParams<{ folderId?: string }>();
  const { session } = useAuth();
  const powerSync = usePowerSync();
  const theme = useTheme();
  const currentFolderId = params.folderId || null;
  const { confirmDialogRef, showDeleteConfirm } = useConfirmDialog();

  const { data: folders, isLoading } = useQuery<Folder>(
    currentFolderId === null
      ? `SELECT * FROM folders WHERE user_id = ? AND parent_id IS NULL ORDER BY name`
      : `SELECT * FROM folders WHERE user_id = ? AND parent_id = ? ORDER BY name`,
    currentFolderId === null ? [session?.user.id] : [session?.user.id, currentFolderId]
  );

  const { data: currentFolder } = useQuery<Folder>(
    `SELECT * FROM folders WHERE id = ? AND user_id = ?`,
    currentFolderId ? [currentFolderId, session?.user.id] : []
  );

  const deleteFolder = useCallback((id: string) => {
    powerSync.execute('DELETE FROM folders WHERE id = ?', [id])
      .catch(e => console.error("Delete failed", e));
  }, [powerSync]);

  const showDeleteFolderDialog = useCallback((id: string, name: string) => {
    showDeleteConfirm({
      title: 'Delete Folder',
      message: `Are you sure you want to delete "${name}"? This will delete everything inside.`,
      onDelete: () => deleteFolder(id),
    });
  }, [showDeleteConfirm, deleteFolder]);

  const navigateToFolder = useCallback((folder: Folder) => {
    router.push(`/(tabs)/cards/${folder.id}`);
  }, [router]);

  const getIcon = (item: Folder) => item.is_card_set === 1 ? 'cards' : 'folder';
  const getDescription = (item: Folder) => item.is_card_set === 1 ? 'Card Set' : 'Folder';

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          headerBackVisible: !!currentFolderId,
        }}
      />
      <StyledSafeAreaView className="flex-1 bg-surface" edges={['left', 'right']}>
        <Appbar.Header elevated={false}>
          {currentFolderId && (
            <Appbar.BackAction onPress={() => router.back()} />
          )}
          <Appbar.Content
            title={currentFolder && currentFolder.length > 0 ? currentFolder[0].name : (currentFolderId ? 'Folder' : 'Cards')}
          />
        </Appbar.Header>

        {isLoading ? (
          <StyledView className="flex-1 justify-center items-center">
            <ActivityIndicator animating={true} size="large" />
          </StyledView>
        ) : folders && folders.length === 0 ? (
          <StyledView className="flex-1 justify-center items-center px-8">
            <List.Icon icon="folder-open-outline" color={theme.colors.outline} style={{ width: 64, height: 64 }} />
            <Text variant="bodyLarge" className="text-on-surface-variant text-center mt-4">
              No folders yet
            </Text>
            <Text variant="bodyMedium" className="text-outline text-center mt-2">
              Create a folder or card set to organize your flashcards
            </Text>
          </StyledView>
        ) : (
          <FlatList
            data={folders}
            contentContainerStyle={{ padding: 16, gap: 2 }}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <SwipeableListItem
                title={item.name!}
                description={getDescription(item)}
                icon={getIcon(item)}
                iconColor={item.is_card_set === 1 ? theme.colors.primary : theme.colors.onSurfaceVariant}
                showChevron
                index={index}
                itemsLength={folders?.length ?? 0}
                onPress={() => navigateToFolder(item)}
                onSwipeOpen={() => showDeleteFolderDialog(item.id, item.name!)}
              />
            )}
          />
        )}
      </StyledSafeAreaView>
      <ConfirmDialog ref={confirmDialogRef} />
      <CreateActionsButton currentFolderId={currentFolderId ?? undefined} />
    </>
  );
}
