import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="adminExpertsList"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="admins"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="cases"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          headerShown: false,
        }}
      />
        <Stack.Screen
          name="questions"
          options={{
            headerShown: false,
          }}
        />
    </Stack>
  );
}
