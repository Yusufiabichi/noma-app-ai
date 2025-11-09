import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Home", headerShown: false }} />
      <Stack.Screen name="Welcome" options={{ title: "Welcome" }} />
      <Stack.Screen name="CropCheck" options={{ title: "Crop Check" }} />
      <Stack.Screen name="CheckResult" options={{ 
        title: "Diagnosis Result", 
        presentation: "modal" 
      }} />
      <Stack.Screen name="Community" options={{ title: "Community" }} />
      <Stack.Screen name="Profile" options={{ title: "Profile" }} />
    </Stack>
  );
}
