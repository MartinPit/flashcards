import { useIsFocused } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';
import { FAB, Portal, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

export default function Tab() {

  const StyledView = withUniwind(View);
  const isFocused = useIsFocused();
  return (
    <SafeAreaView style={styles.container}>
      <Portal.Host>
        <Text className='text-foreground'>Column Manager</Text>
        <Portal>
          <StyledView className='absolute bottom-2 right-2'>
            <FAB
              icon="plus"
              onPress={() => alert('Pressed')}
              customSize={68}
              visible={isFocused}
              animated
            />
          </StyledView>
        </Portal>
      </Portal.Host>
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

