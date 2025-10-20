import { Tabs } from 'expo-router'
import { FontAwesome, FontAwesome5, MaterialIcons } from '@expo/vector-icons'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'left',
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: '700',
        },
        tabBarActiveTintColor: '#00B894',
        tabBarInactiveTintColor: '#A0A0A0',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          elevation: 10,
          height: 65,
          paddingBottom: 4,
          // borderTopColor: "gray",
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'NomaApp AI', // ✅ Header title
          tabBarLabel: 'Crops',
          tabBarIcon: ({ color }) => <FontAwesome5 name="seedling" size={22} color={color} />,
        }}
      />
      {/* <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarLabel: 'Scan',
          tabBarIcon: ({ color }) => <FontAwesome name="camera" size={22} color={color} />,
        }}
      /> */}
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarLabel: 'Community',
          tabBarIcon: ({ color }) => <MaterialIcons name="forum" size={22} color={color} />,
          
        }}
      />
        {/* <Tabs.Screen
          name="marketplace"
          options={{
            title: 'Market Place',
            tabBarLabel: 'Market Place',
            tabBarIcon: ({ color }) => <FontAwesome5 name="market" size={22} color={color} />,
          }}
        /> */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <FontAwesome5 name="user-circle" size={22} color={color} />,
        }}
      />
    </Tabs>
  )
}
