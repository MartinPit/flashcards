import CreateActionsButton from '@/components/ui/create-actions-button';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { Uniwind } from "uniwind";

export default function Tab() {

  const toggleTheme = () => {
    if (Uniwind.currentTheme === 'light') {
      Uniwind.setTheme('dark');
    } else {
      Uniwind.setTheme('light');
    }
  };

  return (
    <View style={styles.container}>
      <Text>Tab [Home]</Text>
      <Button onPress={() => toggleTheme()} mode='elevated'>
        <Text>Click me</Text>
      </Button>
      <CreateActionsButton />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

