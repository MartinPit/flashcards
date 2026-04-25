import React, { useCallback, useRef } from 'react';
import { FlatList, View } from 'react-native';
import { ActivityIndicator, Appbar, List, Text } from 'react-native-paper';
import Swipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { useAnimatedStyle, LinearTransition, SharedValue } from 'react-native-reanimated';
import { withUniwind } from 'uniwind';
import { useQuery, usePowerSync } from '@powersync/react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useAuth } from '@/hooks/use-auth-context';
import { Folder } from '@/lib/powersync/Schema';
import { cn } from '@/lib/utils';
import { ConfirmDialog, ConfirmDialogRef } from '@/components/ui/confirm-dialog';

const StyledView = withUniwind(View);
const StyledItem = withUniwind(List.Item);
const StyledAnimatedView = withUniwind(Reanimated.View);
const StyledSwipeable = withUniwind(Swipeable);

function SwipeAction(drag: SharedValue<number>, isRight: boolean) {
  const styleAnimation = useAnimatedStyle(() => ({
    transform: [{ translateX: drag.value + (isRight ? 80 : -80) }],
  }));

  return (
    <StyledAnimatedView style={styleAnimation}>
      <View style={{ width: 80 }} />
    </StyledAnimatedView>
  );
}

interface FolderItemProps {
  item: Folder;
  index: number;
  foldersLength: number;
  onDelete: (id: string, name: string) => void;
  onPress: (folder: Folder) => void;
}

const FolderListItem = React.memo(function FolderListItem({
  item,
  index,
  foldersLength,
  onDelete,
  onPress
}: FolderItemProps) {
  const isCardSet = item.is_card_set === 1;
  const isFirst = index === 0;
  const isLast = index === foldersLength - 1;
  const swipeableRef = useRef<SwipeableMethods>(null);

  const handleSwipeOpen = () => {
    swipeableRef.current?.close();
    onDelete(item.id, item.name!);
  };

  return (
    <StyledAnimatedView layout={LinearTransition.duration(300)}>
      <StyledSwipeable
        ref={swipeableRef}
        friction={2}
        rightThreshold={40}
        leftThreshold={40}
        renderRightActions={(_, drag) => SwipeAction(drag, true)}
        renderLeftActions={(_, drag) => SwipeAction(drag, false)}
        onSwipeableWillOpen={handleSwipeOpen}
        childrenContainerClassName={cn(
          "bg-surface-variant rounded-sm",
          isFirst && "rounded-t-xl",
          isLast && "rounded-b-xl"
        )}
      >
        <StyledItem
          title={item.name}
          titleClassName="text-on-surface-variant"
          description={isCardSet ? 'Card Set' : 'Folder'}
          onPress={() => onPress(item)}
          left={props => (
            <List.Icon
              {...props}
              icon={isCardSet ? 'cards' : 'folder'}
              color={isCardSet ? '#6750A4' : '#79747E'}
            />
          )}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
      </StyledSwipeable>
    </StyledAnimatedView>
  );
});

export default function CardsIndex() {
  const router = useRouter();
  const params = useLocalSearchParams<{ folderId?: string }>();
  const { session } = useAuth();
  const powerSync = usePowerSync();
  const currentFolderId = params.folderId || null;
  const confirmDialogRef = useRef<ConfirmDialogRef>(null);

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

  const showDeleteDialog = useCallback((id: string, name: string) => {
    confirmDialogRef.current?.show({
      title: 'Delete Folder',
      message: `Are you sure you want to delete "${name}"? This will not delete any cards inside.`,
      destructive: true,
      onConfirm: () => deleteFolder(id),
    });
  }, [deleteFolder]);

  const navigateToFolder = useCallback((folder: Folder) => {
    router.push(`/(tabs)/cards/${folder.id}`);
  }, [router]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          headerBackVisible: !!currentFolderId,
        }}
      />
      <SafeAreaView className="flex-1 bg-surface" edges={['left', 'right']}>
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
            <List.Icon icon="folder-open-outline" color="#79747E" style={{ width: 64, height: 64 }} />
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
              <FolderListItem
                item={item}
                index={index}
                foldersLength={folders?.length ?? 0}
                onDelete={showDeleteDialog}
                onPress={navigateToFolder}
              />
            )}
          />
        )}
      </SafeAreaView>
      <ConfirmDialog ref={confirmDialogRef} />
    </>
  );
}
