import React from 'react';
import { BottomNavigation, useTheme } from 'react-native-paper';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      tabBar={({ navigation, state, descriptors, insets }) => (
        <BottomNavigation.Bar
          navigationState={state}
          safeAreaInsets={insets}
          theme={theme}
          shifting
          onTabPress={({ route }) => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            const isFocused = state.routes[state.index].key === route.key;

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          }}
          renderIcon={({ route, focused, color }) => {
            const { options } = descriptors[route.key];
            if (options.tabBarIcon) {
              return options.tabBarIcon({ focused, color, size: 24 });
            }
            return null;
          }}
          activeIndicatorStyle={{
            backgroundColor: theme.colors.secondaryContainer,
          }}
          style={{ backgroundColor: theme.colors.elevation.level2 }}
          getLabelText={({ route }) => {
            const { options } = descriptors[route.key];
            const label = options.tabBarLabel ?? options.title ?? route.name;
            return typeof label === 'string' ? label : route.name;
          }}
        />
      )}
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        lazy: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Practice',
          tabBarIcon: (props) => (
            <MaterialCommunityIcons
              name={props.focused ? "arrow-projectile-multiple" : "arrow-projectile"}
              {...props}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          title: 'Cards',
          tabBarIcon: (props) => (
            <MaterialCommunityIcons
              name={props.focused ? "cards" : "cards-outline"}
              {...props}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: (props) => (
            <MaterialCommunityIcons
              name={props.focused ? "label-multiple" : "label-multiple-outline"}
              {...props}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: (props) => (
            <MaterialCommunityIcons
              name={props.focused ? "cog" : "cog-outline"}
              {...props}
            />
          ),
        }}
      />
    </Tabs>

  );
}
