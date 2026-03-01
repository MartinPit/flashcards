import CreateActionsButton from '@/components/ui/create-actions-button';
import { useSystem } from '@/lib/powersync/system';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { Uniwind } from "uniwind";

export default function Tab() {
  const { powerSync } = useSystem();

  const toggleTheme = () => {
    if (Uniwind.currentTheme === 'light') {
      Uniwind.setTheme('dark');
    } else {
      Uniwind.setTheme('light');
    }
  };

  const onPressPowerSync = async () => {
    const status = await powerSync.getUploadQueueStats();
    console.log('Pending uploads:', status.count);
    console.log('Last sync time:', powerSync.currentStatus);
  };

  return (
    <View style={styles.container}>
      <Text>Tab [Home]</Text>
      <Button onPress={() => toggleTheme()} mode='elevated'>
        <Text>Click me</Text>
      </Button>
      <Button onPress={onPressPowerSync} mode='elevated'>
        <Text>Powercyn</Text>
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

