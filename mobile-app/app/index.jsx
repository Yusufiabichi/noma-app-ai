import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import CropCheckScreen from './screens/CropCheckScreen';
import ProfileScreen from './screens/ProfileScreen';
import CommunityScreen from './screens/CommunityScreen';
import CheckResultScreen from './screens/CheckResultScreen';
import WelcomeScreen from './screens/Welcome'

const Stack = createNativeStackNavigator();

export default function App() {
  return (
      <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Welcome' }} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ title: 'NomaApp' }} />
      <Stack.Screen name="CropCheck" component={CropCheckScreen} options={{ title: 'Check My Crop' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
      <Stack.Screen name="Community" component={CommunityScreen} options={{ title: 'Community' }} />
      <Stack.Screen name="CheckResult" component={CheckResultScreen} options={{ title: 'Check Result' }} />
    </Stack.Navigator>
  );
}   