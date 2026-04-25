import React, { useCallback, useRef } from 'react';
import { FlatList, View } from 'react-native';
import { ActivityIndicator, Appbar, List, Text } from 'react-native-paper';
import Swipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { useAnimatedStyle, LinearTransition, SharedValue } from 'react-native-reanimated';
import { withUniwind } from 'uniwind';
import { useQuery, usePowerSync } from '@powersync/react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/use-auth-context';
import { Folder, Card as CardType } from '@/lib/powersync/Schema';
import { cn } from '@/lib/utils';
import { ConfirmDialog, ConfirmDialogRef } from '@/components/ui/confirm-dialog';

const StyledView = withUniwind(View);
const StyledItem = withUniwind(List.Item);
const StyledAnimatedView = withUniwind(Reanimated.View);
const StyledSwipeable = withUniwind(Swipeable);

type Item = Folder | CardType;

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

interface ItemListItemProps {
  item: Item;
  index: number;
  itemsLength: number;
  onDeleteFolder: (id: string, name: string) => void;
  onDeleteCard: (id: string) => void;
  onFolderPress: (folder: Folder) => void;
}

const ItemListItem = React.memo(function ItemListItem({
  item,
  index,
  itemsLength,
  onDeleteFolder,
  onDeleteCard,
  onFolderPress,
}: ItemListItemProps) {
  const isItemFolder = 'parent_id' in item && 'name' in item;
  const isCardSet = isItemFolder ? (item as Folder).is_card_set === 1 : false;
  const isFirst = index === 0;
  const isLast = index === itemsLength - 1;
  const swipeableRef = useRef<SwipeableMethods>(null);

  const handleSwipeOpen = () => {
    swipeableRef.current?.close();
    if (isItemFolder) {
      onDeleteFolder(item.id, (item as Folder).name!);
    } else {
      onDeleteCard(item.id);
    }
  };

  const handlePress = () => {
    if (isItemFolder) {
      onFolderPress(item as Folder);
    }
  };

  const getIcon = () => {
    if (isItemFolder) {
      return isCardSet ? 'cards' : 'folder';
    }
    return 'card';
  };

  const getTitle = () => {
    if (isItemFolder) {
      return (item as Folder).name;
    }
    const data = (item as CardType).data ? JSON.parse((item as CardType).data!) : {};
    return data.front || 'Card';
  };

  const getSubtitle = () => {
    if (isItemFolder) {
      return isCardSet ? 'Card Set' : 'Folder';
    }
    return (item as CardType).word_type || 'Card';
  };

  const iconColor = isCardSet ? '#6750A4' : '#79747E';

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
          title={getTitle()}
          titleClassName="text-on-surface-variant"
          description={getSubtitle()}
          onPress={handlePress}
          left={props => (
            <List.Icon
              {...props}
              icon={getIcon()}
              color={iconColor}
            />
          )}
          right={props => isItemFolder ? <List.Icon {...props} icon="chevron-right" /> : undefined}
        />
      </StyledSwipeable>
    </StyledAnimatedView>
  );
});

export default function FolderDetail() {
  const router = useRouter();
  const params = useLocalSearchParams<{ folderId: string }>();
  const { session } = useAuth();
  const powerSync = usePowerSync();
  const folderId = params.folderId;
  const confirmDialogRef = useRef<ConfirmDialogRef>(null);

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
    confirmDialogRef.current?.show({
      title: 'Delete Folder',
      message: `Are you sure you want to delete "${name}"? This will not delete any cards inside.`,
      destructive: true,
      onConfirm: () => deleteFolder(id),
    });
  }, [deleteFolder]);

  const showDeleteCardDialog = useCallback((id: string) => {
    confirmDialogRef.current?.show({
      title: 'Delete Card',
      message: 'Are you sure you want to delete this card?',
      destructive: true,
      onConfirm: () => deleteCard(id),
    });
  }, [deleteCard]);

  const navigateToFolder = useCallback((folder: Folder) => {
    router.push(`/(tabs)/cards/${folder.id}`);
  }, [router]);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          headerBackVisible: true,
        }}
      />
      <SafeAreaView className="flex-1 bg-surface" edges={['left', 'right']}>
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
          <StyledView className="flex-1 justify-center items-center px-8">
            <List.Icon icon="folder-open-outline" color="#79747E" style={{ width: 64, height: 64 }} />
            <Text variant="bodyLarge" className="text-on-surface-variant text-center mt-4">
              Empty folder
            </Text>
            <Text variant="bodyMedium" className="text-outline text-center mt-2">
              Add cards or subfolders to get started
            </Text>
          </StyledView>
        ) : (
          <FlatList
            data={allItems}
            contentContainerStyle={{ padding: 16, gap: 2 }}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <ItemListItem
                item={item}
                index={index}
                itemsLength={allItems.length}
                onDeleteFolder={showDeleteFolderDialog}
                onDeleteCard={showDeleteCardDialog}
                onFolderPress={navigateToFolder}
              />
            )}
          />
        )}
      </SafeAreaView>
      <ConfirmDialog ref={confirmDialogRef} />
    </>
  );
}
