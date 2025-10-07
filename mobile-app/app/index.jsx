// import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import CropCheck from './screens/CropCheckScreen';
import CheckResult from './screens/CheckResultScreen';
import Profile from './screens/ProfileScreen';
import Community from './screens/CommunityScreen';
import Welcome from './screens/Welcome';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    // <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CropCheck" component={CropCheck} />
        <Stack.Screen name="CheckResult" component={CheckResult} />
        <Stack.Screen name="Community" component={Community} />
        <Stack.Screen name="Profile" component={Profile} />
        <Stack.Screen name="Welcome" component={Welcome} />
      </Stack.Navigator>
    // </NavigationContainer>
  );
}
