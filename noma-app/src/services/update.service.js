import Constants from 'expo-constants';
import { Platform } from 'react-native';
import apiClient from './api.client'; // your axios instance
import AsyncStorage from '@react-native-async-storage/async-storage';

const VERSION_CHECK_KEY = '@update_check_last_shown';

/**
 * Check if an update is available.
 * Returns { updateAvailable, latestVersion, minVersion, isRequired, message }
 */
export const checkForUpdate = async () => {
  try {
    // Get current app version
    const currentVersion = Constants.expoConfig?.version || Constants.manifest?.version || '0.0.0';

    const response = await apiClient.get('/update-check', {
      params: { currentVersion, platform: Platform.OS }
    });

    return response.data; // { updateAvailable, latestVersion, minVersion, isRequired, message }
  } catch (error) {
    console.error('Update check failed:', error);
    return { updateAvailable: false };
  }
};

/**
 * Check if user has already seen the update prompt recently.
 * We can store a timestamp to avoid showing it too often.
 */
export const shouldShowUpdatePrompt = async (updateAvailable) => {
  if (!updateAvailable) return false;

  const lastShown = await AsyncStorage.getItem(VERSION_CHECK_KEY);
  if (!lastShown) return true;

  const oneDay = 24 * 60 * 60 * 1000;
  const elapsed = Date.now() - parseInt(lastShown, 10);
  return elapsed > oneDay; // show once per day
};

export const markUpdatePromptShown = async () => {
  await AsyncStorage.setItem(VERSION_CHECK_KEY, String(Date.now()));
};