import React, { useCallback, useState } from 'react';
import { FlatList, View } from 'react-native';
import { ActivityIndicator, Appbar, TextInput , useTheme } from 'react-native-paper';
import Reanimated, {
  FadeOutRight,
  FadeInRight,
  FadeInLeft,
  FadeOutLeft,
} from 'react-native-reanimated';
import { withUniwind } from 'uniwind';

import { CreateActionsButton } from '@/components/ui/create-actions-button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useConfirmDialog } from '@/components/ui/use-confirm-dialog';
import { useSystem } from '@/lib/powersync/system';
import { useQuery } from '@powersync/react-native';
import { Column } from '@/lib/powersync/Schema';
import { useAuth } from '@/hooks/use-auth-context';
import { SwipeableListItem } from '@/components/ui/swipeable-list-item';

const StyledView = withUniwind(View);
const StyledAnimatedView = Reanimated.View;

export default function ColumnManager() {
  const { powerSync } = useSystem();
  const { session } = useAuth();
  const theme = useTheme();
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { confirmDialogRef, showDeleteConfirm } = useConfirmDialog();

  const { data: columns, isLoading } = useQuery<Column>(
    `SELECT * FROM columns WHERE user_id = ? AND label LIKE ?`,
    [session?.user.id, `%${searchQuery}%`]
  );

  const deleteItem = useCallback((id: string) => {
    powerSync.execute('DELETE FROM columns WHERE id = ?', [id])
      .catch(e => console.error("Delete failed", e));
  }, [powerSync]);

  const showDeleteDialog = useCallback((id: string, label: string) => {
    showDeleteConfirm({
      title: 'Delete Category',
      message: `Are you sure you want to delete "${label}"?`,
      onDelete: () => deleteItem(id),
    });
  }, [showDeleteConfirm, deleteItem]);

  const toggleSearch = () => {
    setIsSearching(!isSearching);
    if (isSearching) setSearchQuery('');
  };

  return (
    <>
      <Appbar.Header>
        {isSearching ? (
          <StyledAnimatedView
            key="search-mode"
            entering={FadeInLeft.duration(200)}
            exiting={FadeOutLeft.duration(200)}
            className="flex-1 flex-row items-center pr-3"
          >
            <Appbar.BackAction onPress={toggleSearch} />
            <TextInput
              placeholder="Search categories..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              mode="flat"
              underlineStyle={{ height: 0, backgroundColor: 'transparent' }}
              style={{ backgroundColor: 'transparent' }}
            />
          </StyledAnimatedView>
        ) : (
          <StyledAnimatedView
            key="title-mode"
            entering={FadeInRight.duration(200)}
            exiting={FadeOutRight.duration(200)}
            className="flex-1 flex-row items-center pl-3"
          >
            <Appbar.Content title="Manage Categories" />
            <Appbar.Action icon="magnify" onPress={toggleSearch} />
          </StyledAnimatedView>
        )}
      </Appbar.Header>
      {isLoading ? (
        <StyledView className="flex-1 justify-center items-center">
          <ActivityIndicator animating={true} />
        </StyledView>
      ) : (
        <FlatList
          data={columns}
          contentContainerStyle={{ padding: 16, gap: 2 }}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <SwipeableListItem
              title={item.label}
              description="Category"
              icon="label"
              iconColor={theme.colors.primary}
              showChevron={false}
              index={index}
              itemsLength={columns?.length ?? 0}
              onSwipeOpen={() => showDeleteDialog(item.id, item.label)}
            />
          )}
        />
      )}
      <CreateActionsButton />
      <ConfirmDialog ref={confirmDialogRef} />
    </>
  );
}