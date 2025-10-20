import { Stack } from "expo-router";
import { Pressable, Text, Image } from "react-native";

function LogoTitle(){
    return(
        <Image/>
    )
}

export default function RootLayout(){
    return (
        <Stack>
        <Stack.Screen name="index" options={{
            title: "NomaApp AI",
            headerStyle: {backgroundColor: "#6a51ae"},
            headerTintColor: "#fff",
            headerTitleStyle: { fontWeight: "bold" },
            headerRight: () => (
                <Pressable onPress={()=> alert("Menu button pressed!")}>
                    <Text style={{ color: "#fff", fontSize: 16 }}>Menu</Text>
                </Pressable>
            ),
            // headerTitle: (props) => <LogoTitle />
        }}/>
        <Stack.Screen name="profile" options={{
            title: "Profile"
        }}/>
        <Stack.Screen name="community" options={{
            title: "Community"
        }}/>
        <Stack.Screen name="marketplace" options={{
            title: "Market Place"
        }}/>
    </Stack>
    );
}