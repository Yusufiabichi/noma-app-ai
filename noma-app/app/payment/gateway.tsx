import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, BackHandler, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useLanguage } from '@/src/context/LanguageContext';
import { isCheckoutFinishedUrl } from '@/src/services/paymentFlow';
import logger from '@/src/utils/logger';

// The gateway's checkout page, inside the app. When the gateway sends the payer
// to the backend's callback or our return link, this page closes itself and the
// result screen verifies the payment: the payer never closes a browser tab.

const COLORS = {
  primary: '#16A34A',
  ink: '#0E3B2C',
  muted: '#5F6B63',
  line: '#E3E9E1',
  white: '#FFFFFF',
  track: '#EEF2EC',
};

const hostOf = (url: string) => {
  const match = /^https?:\/\/([^/?#]+)/i.exec(url);
  return match ? match[1] : '';
};

export default function PaymentGatewayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ txnRef: string; checkoutUrl: string; returnUrl?: string }>();
  const { language } = useLanguage();
  const t = (ha: string, en: string) => (language === 'hausa' ? ha : en);

  const webViewRef = useRef<WebView>(null);
  const finished = useRef(false);
  const canGoBack = useRef(false);
  const [host, setHost] = useState(hostOf(params.checkoutUrl || ''));
  const [progress, setProgress] = useState(0);

  // Verify on the result screen, whatever the gateway's last page says
  const finish = () => {
    if (finished.current) return;
    finished.current = true;
    router.replace({ pathname: '/payment', params: { txnRef: params.txnRef } });
  };

  const handleUrl = (url: string) => {
    if (!isCheckoutFinishedUrl(url, params.returnUrl)) return false;
    // Let the backend's callback still run (it may record the payment), then leave
    if (/^https?:/i.test(url)) fetch(url).catch(() => {});
    finish();
    return true;
  };

  useEffect(() => {
    if (!params.checkoutUrl || !params.txnRef) {
      finish();
      return;
    }
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack.current) webViewRef.current?.goBack();
      else finish();
      return true;
    });
    return () => subscription.remove();
  }, []);

  if (!params.checkoutUrl || !params.txnRef) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={finish}
          style={styles.closeBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('Rufe biya', 'Close payment')}
        >
          <Ionicons name="close" size={22} color={COLORS.ink} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <View style={styles.secureRow}>
            <Ionicons name="lock-closed" size={12} color={COLORS.primary} />
            <Text style={styles.title}>{t('Biya mai tsaro', 'Secure payment')}</Text>
          </View>
          {!!host && <Text style={styles.host} numberOfLines={1}>{host}</Text>}
        </View>
        <View style={{ width: 36 }} />
      </View>
      <View style={styles.progressTrack}>
        {progress < 1 && <View style={[styles.progressFill, { width: `${Math.max(progress, 0.05) * 100}%` }]} />}
      </View>

      <WebView
        ref={webViewRef}
        source={{ uri: params.checkoutUrl }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        onShouldStartLoadWithRequest={(request) => {
          const url = request.url;
          if (handleUrl(url)) return false;
          // Bank apps, USSD, phone and mail links open outside the payment page
          if (!/^(https?|about|data|blob):/i.test(url)) {
            Linking.openURL(url).catch((error) => logger.warn('Could not open payment link', error));
            return false;
          }
          return true;
        }}
        onNavigationStateChange={(navigation: WebViewNavigation) => {
          canGoBack.current = navigation.canGoBack;
          // Android doesn't always ask before following a server redirect
          if (handleUrl(navigation.url)) return;
          const nextHost = hostOf(navigation.url);
          if (nextHost) setHost(nextHost);
        }}
        onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
        onError={({ nativeEvent }) => {
          // A failed load of the callback/return link still means the checkout is over
          if (!handleUrl(nativeEvent.url)) logger.warn('Payment page failed to load', nativeEvent);
        }}
        style={styles.webview}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, alignItems: 'center' },
  secureRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.ink },
  host: { fontSize: 12, color: COLORS.muted, marginTop: 1 },
  progressTrack: { height: 2, backgroundColor: COLORS.track },
  progressFill: { height: 2, backgroundColor: COLORS.primary },
  webview: { flex: 1 },
});
