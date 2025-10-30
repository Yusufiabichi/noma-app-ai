import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LanguageProvider } from "./context/LanguageContext";

export default function RootLayout(){
    return (
    <Stack>
        <Stack.Screen name="(tabs)" options={{headerShown: false}} />
        <Stack.Screen name="(auth)" options={{headerShown: false}} />
        <Stack.Screen name="farming-tips" options={{headerShown: true,  title: "Farming Tips"}} />
        <Stack.Screen name="fertilizer-advice" options={{headerShown: true,  title: "Fertilizer Advice"}} />
        <Stack.Screen name="disease-guide" options={{headerShown: true,  title: "Pest & Disease Guide"}} />
    </Stack>
)
}