import React, { useRef, useCallback } from 'react';
import { View } from 'react-native';
import { List, useTheme } from 'react-native-paper';
import Swipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { useAnimatedStyle, LinearTransition, SharedValue } from 'react-native-reanimated';
import { withUniwind } from 'uniwind';
import { cn } from '@/lib/utils';

const StyledAnimatedView = withUniwind(Reanimated.View);
const StyledSwipeable = withUniwind(Swipeable);
const StyledItem = withUniwind(List.Item);

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

interface SwipeableListItemProps {
  title: string;
  description?: string;
  icon: string;
  iconColor?: string;
  showChevron?: boolean;
  index: number;
  itemsLength: number;
  onPress?: () => void;
  onSwipeOpen: () => void;
  childrenContainerClassName?: string;
}

export const SwipeableListItem = React.memo(function SwipeableListItem({
  title,
  description,
  icon,
  iconColor,
  showChevron = false,
  index,
  itemsLength,
  onPress,
  onSwipeOpen,
  childrenContainerClassName,
}: SwipeableListItemProps) {
  const theme = useTheme();
  const swipeableRef = useRef<SwipeableMethods>(null);
  const isFirst = index === 0;
  const isLast = index === itemsLength - 1;

  const handleSwipeOpen = useCallback(() => {
    swipeableRef.current?.close();
    onSwipeOpen();
  }, [onSwipeOpen]);

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
          isLast && "rounded-b-xl",
          childrenContainerClassName
        )}
      >
        <StyledItem
          title={title}
          titleClassName="text-on-surface-variant"
          description={description}
          onPress={onPress}
          left={props => (
            <List.Icon
              {...props}
              icon={icon}
              color={iconColor ?? theme.colors.onSurfaceVariant}
            />
          )}
          right={props => showChevron ? <List.Icon {...props} icon="chevron-right" /> : undefined}
        />
      </StyledSwipeable>
    </StyledAnimatedView>
  );
});