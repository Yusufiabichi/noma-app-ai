import { Stack } from "expo-router";
import RequireAccess from '@/app/components/RequireAccess';

function ExpertLayout() {
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
        name="expertCases"
        options={{
          headerShown: false,
        }}
      />
       <Stack.Screen
          name="expertWeather"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="caseDetail"
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

export default function ExpertLayoutWithAccess() {
  return (
    <RequireAccess feature="expertWorkspace">
      <ExpertLayout />
    </RequireAccess>
  );
}
