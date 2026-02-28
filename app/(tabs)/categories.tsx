import React, { useState, useCallback } from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import { List, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, {
  SharedValue,
  useAnimatedStyle,
  LinearTransition
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets'; // The modern replacement for runOnJS
import { withUniwind } from 'uniwind';

import CreateActionsButton from '@/components/ui/create-actions-button';
import { cn } from '@/lib/utils';

const StyledSafeArea = withUniwind(SafeAreaView);
const StyledSurface = withUniwind(Surface);
const StyledText = withUniwind(Text);
const StyledView = withUniwind(View);

const initialEvents = [
  { id: '1', title: 'The first computer (ENIAC)', date: 'Feb 14, 1946', icon: 'memory' },
  { id: '2', title: 'Sputnik launched into space', date: 'Oct 4, 1957', icon: 'satellite-variant' },
  { id: '3', title: 'The Apollo 11 moon landing', date: 'Jul 20, 1969', icon: 'rocket-launch' },
];

function RightAction(prog: SharedValue<number>, drag: SharedValue<number>) {
  const styleAnimation = useAnimatedStyle(() => ({
    transform: [{ translateX: drag.value + 100 }],
  }));

  return (
    <Reanimated.View style={[styleAnimation, styles.deleteContainer]}>
      <MaterialCommunityIcons name="trash-can-outline" size={24} color="white" />
    </Reanimated.View>
  );
}

export default function ColumnManager() {
  const [data, setData] = useState(initialEvents);

  const deleteItem = useCallback((id: string) => {
    setData((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return (
    <StyledSafeArea className="flex-1 bg-background overflow-visible">
      <FlatList
        data={data}
        contentContainerStyle={{ padding: 16 }}
        keyExtractor={(item) => item.id}
        style={{ overflow: 'visible' }}
        renderItem={({ item, index }) => {
          const isFirst = index === 0;
          const isLast = index === data.length - 1;

          return (
            <Reanimated.View
              key={item.id}
              layout={LinearTransition.duration(300)}
            >
              <Swipeable
                friction={2}
                rightThreshold={40}
                leftThreshold={40}
                overshootRight
                renderRightActions={RightAction}
                onSwipeableWillOpen={() => {
                  scheduleOnRN(deleteItem, item.id);
                }}
                containerStyle={{
                  backgroundColor: '#ff5252',
                  marginTop: isFirst ? 0 : 1,
                  borderTopLeftRadius: isFirst ? 12 : 0,
                  borderTopRightRadius: isFirst ? 12 : 0,
                  borderBottomLeftRadius: isLast ? 12 : 0,
                  borderBottomRightRadius: isLast ? 12 : 0,
                }}
              >
                <StyledSurface
                  elevation={0}
                  className={cn(
                    "bg-white py-1 overflow-x-visible",
                    isFirst && "rounded-t-xl",
                    isLast && "rounded-b-xl"
                  )}
                >
                  <List.Item
                    title={item.title}
                    titleStyle={{ fontSize: 16, fontWeight: '500', color: '#333' }}
                    left={(props) => (
                      <List.Icon
                        {...props}
                        icon={() => (
                          <MaterialCommunityIcons name={item.icon as any} size={24} color="#444" />
                        )}
                      />
                    )}
                    right={() => (
                      <StyledView className="justify-center pr-4">
                        <StyledText className="text-gray-500 text-sm italic">
                          {item.date}
                        </StyledText>
                      </StyledView>
                    )}
                  />
                </StyledSurface>
              </Swipeable>
            </Reanimated.View>
          );
        }}
      />
      <CreateActionsButton />
    </StyledSafeArea>
  );
}

const styles = StyleSheet.create({
  deleteContainer: {
    backgroundColor: '#ff5252',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
  },
});
