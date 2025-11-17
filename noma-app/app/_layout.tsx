import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LanguageProvider } from "./context/LanguageContext";

export default function RootLayout(){
    return (
    <Stack>
        <Stack.Screen name="(tabs)" options={{headerShown: false}} />
        <Stack.Screen name="(auth)" options={{headerShown: false}} />
        <Stack.Screen name="treatment-rec" options={{headerShown: false}} />
        <Stack.Screen name="crop-scan" options={{headerShown: false}} />
        <Stack.Screen name="farming-tips" options={{headerShown: false,  title: "Farming Tips"}} />
        <Stack.Screen name="fertilizer-advice" options={{headerShown: false,  title: "Fertilizer Advice"}} />
        <Stack.Screen name="disease-guide" options={{headerShown: false,  title: "Pest & Disease Guide"}} />
    </Stack>
)
}