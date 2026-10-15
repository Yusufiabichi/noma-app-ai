import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar"
import { SafeAreaView } from "react-native-safe-area-context";
import { LanguageProvider } from "@/src/context/LanguageContext";
import { useSync } from '@/src/hooks/useSync';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useUpdateChecker } from '@/src/hooks/useUpdateChecker';
import UpdateModal from '@/app/components/UpdateModal';
import { AlertProvider } from '@/src/context/AlertContext';
import { useScanResultNotifications } from '@/src/hooks/useScanResultNotifications';
import { resumePendingPayment } from '@/src/services/paymentFlow';
import { syncUserFromServer } from '@/src/hooks/useAuth';

function UpdateCheckerWrapper() {
  const { updateInfo, showModal, closeModal } = useUpdateChecker();
  return <UpdateModal visible={showModal} updateInfo={updateInfo} onClose={closeModal} />;
}

function ScanResultNotificationsHandler() {
  useScanResultNotifications();
  return null;
}

const ACCOUNT_SYNC_INTERVAL_MS = 5 * 60 * 1000;

// Keeps the stored plan and role current: settles a checkout the payer never
// returned from, then refreshes the user on launch and when the app returns
function AccountSync() {
  const lastSync = useRef(0);

  useEffect(() => {
    const sync = async () => {
      if (Date.now() - lastSync.current < ACCOUNT_SYNC_INTERVAL_MS) return;
      lastSync.current = Date.now();
      await resumePendingPayment();
      await syncUserFromServer();
    };

    sync();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') sync();
    });
    return () => subscription.remove();
  }, []);
  return null;
}

export default function RootLayout(){
    // Initialize sync hook for network monitoring
    useSync();

    return (
        <>
        <StatusBar style="dark"/>
        <LanguageProvider>
        <AlertProvider>
            <Stack>
                <Stack.Screen name="index" options={{headerShown: false}} />
                <Stack.Screen name="(expert)" options={{headerShown: false}} />
                <Stack.Screen name="(admin)" options={{headerShown: false}} />
                <Stack.Screen name="(onboarding)" options={{headerShown: false}} />
                <Stack.Screen name="(tabs)" options={{headerShown: false}} />
                <Stack.Screen name="treatment-rec" options={{headerShown: false}} />
                <Stack.Screen name="cropscan" options={{headerShown: false}} />
                <Stack.Screen name="farming-tips" options={{headerShown: false,  title: "Farming Tips"}} />
                <Stack.Screen name="fertilizer-advice" options={{headerShown: false,  title: "Fertilizer Advice"}} />
                <Stack.Screen name="disease-guide" options={{headerShown: false,  title: "Pest & Disease Guide"}} />
                <Stack.Screen name="diseaseGuideDetail" options={{headerShown: false,  title: "Pest & Disease Guide"}} />
                <Stack.Screen name="fertilizerAdviceDetail" options={{headerShown: false,  title: "Pest & Disease Guide"}} />
                <Stack.Screen name="farmingTipsDetail" options={{headerShown: false,  title: "Pest & Disease Guide"}} />
                <Stack.Screen name="fileCaseScreen" options={{headerShown: false,  title: "Pest & Disease Guide"}} />
                <Stack.Screen name="farmerCases" options={{headerShown: false,  title: "Pest & Disease Guide"}} />
                <Stack.Screen name="farmerCaseDetail" options={{headerShown: false,  title: "Pest & Disease Guide"}} />
                <Stack.Screen name="recentDiagnosis" options={{headerShown: false,  title: "Pest & Disease Guide"}} />
                <Stack.Screen name="payment" options={{headerShown: false, gestureEnabled: false}} />
            </Stack>
            <UpdateCheckerWrapper />
            <ScanResultNotificationsHandler />
            <AccountSync />
        </AlertProvider>
        </LanguageProvider>
        </>
    )
}