import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { FAB, Portal, FABGroupProps } from "react-native-paper";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing
} from "react-native-reanimated";
import { AddCategoryDialog, AddCategoryDialogRef } from "../modals/create-category-modal";
import { AddFolderDialog, AddFolderDialogRef } from "../modals/create-folder-modal";

const CreateActionsButton = (props: Partial<FABGroupProps>) => {
  const router = useRouter();
  const [state, setState] = useState({ open: false });
  const isFocused = useIsFocused();
  const rotation = useSharedValue(0);

  const dialogRef = useRef<AddCategoryDialogRef>(null);
  const folderDialogRef = useRef<AddFolderDialogRef>(null);

  const onStateChange = ({ open }: { open: boolean }) => {
    setState({ open });
    rotation.value = withTiming(open ? 1 : 0, {
      duration: 400,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  };

   const animatedIconStyle = useAnimatedStyle(() => {
     return {
       transform: [{ rotate: `${rotation.value * 135}deg` }],
     };
   });

  return (
    <>
      <Portal>
        <FAB.Group
          icon={({ size, color }) => (
            <Animated.View style={animatedIconStyle}>
              <MaterialCommunityIcons
                name="plus"
                size={size}
                color={color}
              />
            </Animated.View>
          )}
          open={state.open}
          visible={isFocused}
          style={{ paddingBottom: 108, paddingRight: 12 }}
          fabStyle={{ transform: [{ scale: 1.2 }] }}
          actions={[
            {
              icon: 'arrow-projectile-multiple',
              label: 'Start Practice',
              onPress: () => router.push('/(tabs)'),
              size: 'medium'
            },
            {
              icon: 'card-bulleted-outline',
              label: 'Add Card Set',
              onPress: () => router.push('/(tabs)/card-sets/new'),
              size: 'medium'
            },
            {
              icon: 'folder-text-outline',
              label: 'Add Folder',
              onPress: () => folderDialogRef.current?.show(),
              size: 'medium'
            },
            {
              icon: 'pencil-plus',
              label: 'Create Card',
              onPress: () => router.push('/(tabs)/cards/new'),
              size: 'medium'
            },
            {
              icon: 'label-outline',
              label: 'Add Category',
              onPress: () => {
                dialogRef.current?.show();
                router.push('/categories');
              },
              size: 'medium'
            },
          ]}
          onStateChange={onStateChange}
          {...props}
        />
      </Portal>
      <AddCategoryDialog ref={dialogRef} />
      <AddFolderDialog ref={folderDialogRef} />
    </>
  );
}

export default CreateActionsButton;
