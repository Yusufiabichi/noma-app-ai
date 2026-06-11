import { Stack } from "expo-router";

export default function ExpertLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="assessment"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="dashboard"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="documents"
        options={{
          headerShown: false,
        }}
      />
        <Stack.Screen
          name="plans"
          options={{
            headerShown: true,
            title: "Plans"
          }}
        />
      <Stack.Screen
          name="profile"
          options={{
            headerShown: false,
          }}
        />
    </Stack>
  );
}
