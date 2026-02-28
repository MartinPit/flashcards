import React, { useCallback, useState } from 'react';
import { FlatList, View } from 'react-native';
import { ActivityIndicator, Appbar, List, Searchbar, TextInput } from 'react-native-paper';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, {
  SharedValue,
  useAnimatedStyle,
  LinearTransition,
  FadeOutRight,
  FadeInRight,
  FadeInLeft,
  FadeOutLeft
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { withUniwind } from 'uniwind';

import CreateActionsButton from '@/components/ui/create-actions-button';
import { cn } from '@/lib/utils';
import { useSystem } from '@/lib/powersync/system';
import { useQuery } from '@powersync/react-native';
import { Column } from '@/lib/powersync/Schema';
import { useAuth } from '@/hooks/use-auth-context';

const StyledView = withUniwind(View);
const StyledAnimatedView = withUniwind(Reanimated.View);
const StyledSwipeable = withUniwind(Swipeable);
const StyledItem = withUniwind(List.Item);

function SwipeAction(drag: SharedValue<number>, isRight: boolean) {
  const styleAnimation = useAnimatedStyle(() => ({
    transform: [{ translateX: drag.value + (isRight ? 100 : -100) }],
  }));

  return (
    <StyledAnimatedView
      style={styleAnimation}
      className={cn(
        "w-24",
      )}

    >
      <StyledView style={{ width: 100 }} />
    </StyledAnimatedView>
  );
}

export default function ColumnManager() {
  const { powerSync } = useSystem();
  const { session } = useAuth();
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: columns, isLoading } = useQuery<Column>(
    `SELECT * FROM columns WHERE user_id = ? AND label LIKE ?`,
    [session?.user.id, `%${searchQuery}%`]
  );

  const deleteItem = useCallback((id: string) => {
    powerSync.execute('DELETE FROM columns WHERE id = ?', [id])
      .catch(e => console.error("Delete failed", e));
  }, [powerSync]);

  const toggleSearch = () => {
    setIsSearching(!isSearching);
    if (isSearching) setSearchQuery('');
  };

  return (
    <>
      <Appbar.Header>
        {isSearching ? (
          <StyledAnimatedView
            key="search-mode" // Unique key triggers entering/exiting
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
              style={{ flex: 1, backgroundColor: 'transparent' }}
            />
          </StyledAnimatedView>
        ) : (
          <StyledAnimatedView
            key="title-mode" // Unique key triggers entering/exiting
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
          renderItem={({ item, index }) => {
            const isFirst = index === 0;
            const isLast = index === columns.length - 1;

            return (
              <Reanimated.View
                key={item.id}
                layout={LinearTransition.duration(300)}
              >
                <StyledSwipeable
                  friction={2}
                  rightThreshold={40}
                  leftThreshold={40}
                  renderRightActions={(_, drag) => SwipeAction(drag, true)}
                  renderLeftActions={(_, drag) => SwipeAction(drag, false)}
                  onSwipeableWillOpen={() => {
                    scheduleOnRN(deleteItem, item.id);
                  }}
                  childrenContainerClassName={cn(
                    "bg-surface-variant rounded-sm",
                    isFirst && "rounded-t-xl",
                    isLast && "rounded-b-xl"
                  )}
                >
                  <StyledItem
                    title={item.label}
                    titleClassName='text-on-surface-variant'
                  />
                </StyledSwipeable>
              </Reanimated.View>
            );
          }}
        />
      )}
      <CreateActionsButton />
    </>
  );
}
