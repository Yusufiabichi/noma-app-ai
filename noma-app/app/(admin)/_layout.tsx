import { Stack } from "expo-router";
import RequireAccess from '@/app/components/RequireAccess';

function AdminLayout() {
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

export default function AdminLayoutWithAccess() {
  return (
    <RequireAccess feature="adminConsole">
      <AdminLayout />
    </RequireAccess>
  );
}
