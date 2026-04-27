import { Stack } from "expo-router";
import { CreateActionsButton } from "@/components/ui/create-actions-button";

export default function Layout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="[folderId]" />
      </Stack>
      <CreateActionsButton />
    </>
  );
}