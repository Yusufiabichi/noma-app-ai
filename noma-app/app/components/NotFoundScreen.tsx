import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/src/context/LanguageContext';

interface NotFoundScreenProps {
  title?: string;
  message?: string;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  onRetry?: () => void;
}

export default function NotFoundScreen({
  title,
  message,
  showHomeButton = true,
  showBackButton = true,
  onRetry,
}: NotFoundScreenProps) {
  const { language } = useLanguage();
  const router = useRouter();

  const isHausa = language === 'ha';

  const defaultTitle = isHausa ? 'Ba a Samu ba' : 'Not Found';
  const defaultMessage = isHausa
    ? 'Shafin da kake nema bai wanzu ba.'
    : 'The page you’re looking for doesn’t exist.';

  const finalTitle = title || defaultTitle;
  const finalMessage = message || defaultMessage;

  return (
    <View style={styles.container}>
      <Ionicons name="sad-outline" size={72} color="#16A34A" />
      <Text style={styles.title}>{finalTitle}</Text>
      <Text style={styles.message}>{finalMessage}</Text>

      <View style={styles.buttonContainer}>
        {showBackButton && (
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.buttonText}>
              {isHausa ? 'Koma baya' : 'Go Back'}
            </Text>
          </TouchableOpacity>
        )}

        {showHomeButton && (
          <TouchableOpacity style={styles.homeButton} onPress={() => router.push('/')}>
            <Text style={styles.buttonText}>
              {isHausa ? 'Koma Gida' : 'Go Home'}
            </Text>
          </TouchableOpacity>
        )}

        {onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.buttonText}>
              {isHausa ? 'Sake gwadawa' : 'Retry'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FFFB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#122C27',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#5C5C5C',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: '#E8F5ED',
    paddingVertical: 12,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  homeButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#0052cc',
    paddingVertical: 12,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#122C27',
    fontSize: 16,
    fontWeight: '600',
  },
});