// useScanResultNotifications Hook
// Shows offline scan result notifications in the foreground and opens the
// result when the farmer taps one (including when the tap launched the app)

import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { usePathname, useRouter } from 'expo-router';
import { getQueuedScan, OFFLINE_SCAN_NOTIFICATION } from '../services/offlineScanQueue';
import logger from '../utils/logger';

// Only scan result notifications are shown while the app is open; others keep the default behavior
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const isScanResult = notification.request.content.data?.type === OFFLINE_SCAN_NOTIFICATION;
    return {
      shouldShowBanner: isScanResult,
      shouldShowList: isScanResult,
      shouldPlaySound: isScanResult,
      shouldSetBadge: false,
    };
  },
});

export const useScanResultNotifications = () => {
  const router = useRouter();
  const pathname = usePathname();
  const lastResponse = Notifications.useLastNotificationResponse();
  const handledIds = useRef(new Set<string>());
  const [pendingQueueId, setPendingQueueId] = useState<string | null>(null);

  useEffect(() => {
    if (!lastResponse) return;
    const { identifier, content } = lastResponse.notification.request;
    if (content.data?.type !== OFFLINE_SCAN_NOTIFICATION || handledIds.current.has(identifier)) return;

    handledIds.current.add(identifier);
    setPendingQueueId(String(content.data.queueId));
  }, [lastResponse]);

  // Wait until the splash screen has redirected, otherwise its replace() would undo this navigation
  useEffect(() => {
    if (!pendingQueueId || pathname === '/') return;

    const openResult = async () => {
      setPendingQueueId(null);
      try {
        const item = await getQueuedScan(pendingQueueId);

        if (item?.planLimited) {
          router.push('/(onboarding)/plans');
        } else if (item?.status === 'diagnosed' && item.result) {
          router.push({ pathname: '/treatment-rec', params: { scanResult: JSON.stringify(item.result) } });
        } else if (item?.status === 'failed' || !item) {
          router.push('/cropscan');
        } else {
          router.push({
            pathname: '/treatment-rec',
            params: {
              scanResult: JSON.stringify({
                status: 'pending',
                cropType: item.cropType,
                language: item.language,
                isOnline: false,
                queueId: item.id,
                isFallback: false,
              }),
            },
          });
        }
      } catch (error) {
        logger.error('Failed to open scan result from notification', error);
      }
    };

    openResult();
  }, [pendingQueueId, pathname]);
};

export default useScanResultNotifications;
