import { CreateActionsButton } from '@/components/ui/create-actions-button';
import { useSystem } from '@/lib/powersync/system';
import { View, Text } from 'react-native';
import { Button } from 'react-native-paper';
import { Uniwind , withUniwind } from "uniwind";

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);

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
    <StyledView className="flex-1 justify-center items-center">
      <StyledText className="text-on-surface">Tab [Home]</StyledText>
      <Button onPress={() => toggleTheme()} mode='elevated'>
        <Text>Click me</Text>
      </Button>
      <Button onPress={onPressPowerSync} mode='elevated'>
        <Text>Powercyn</Text>
      </Button>
      <CreateActionsButton />
    </StyledView>
  );
}

