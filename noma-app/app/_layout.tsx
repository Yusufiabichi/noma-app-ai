import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LanguageProvider } from "@/src/context/LanguageContext";
import { useSync } from '@/src/hooks/useSync';
import { useEffect } from 'react';

export default function RootLayout(){
    // Initialize sync hook for network monitoring
    useSync();

    return (
        <>
        <LanguageProvider>
            <Stack>
                <Stack.Screen name="index" options={{headerShown: false}} />
                <Stack.Screen name="(onboarding)" options={{headerShown: false}} />
                <Stack.Screen name="(tabs)" options={{headerShown: false}} />
                <Stack.Screen name="treatment-rec" options={{headerShown: false}} />
                <Stack.Screen name="cropscan" options={{headerShown: false}} />
                <Stack.Screen name="farming-tips" options={{headerShown: false,  title: "Farming Tips"}} />
                <Stack.Screen name="fertilizer-advice" options={{headerShown: false,  title: "Fertilizer Advice"}} />
                <Stack.Screen name="disease-guide" options={{headerShown: false,  title: "Pest & Disease Guide"}} />
            </Stack>
        </LanguageProvider>
        </>
    )
}