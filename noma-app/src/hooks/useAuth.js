
// useAuth Hook
// Get current user information from auth context


import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';
import { clearAuthTokens, getAuthToken } from '../api/client';
import * as Notifications from 'expo-notifications';
import client from '@/src/api/client';

const USER_KEY = '@nomaapp_user';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem(USER_KEY);
      if (userData) {
        setUser(JSON.parse(userData));
      } else {
        setUser(null);
      }
    } catch (error) {
      logger.error('Failed to load user', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const logout = async () => {
    try {
      await clearAuthTokens();
      await AsyncStorage.removeItem(USER_KEY);
      setUser(null);
      logger.info('User logged out successfully');
      return true;
    } catch (error) {
      logger.error('Logout failed', error);
      return false;
    }
  };

  return { user, loading, logout, refreshUser: loadUser };
};

export const setUserData = async (userData) => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
  } catch (error) {
    logger.error('Failed to save user data', error);
  }
};

export const registerPushToken = async () => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await client.post('/auth/push-token', { expoPushToken: token });
  } catch (err) {
    // Non-fatal — don't block login if this fails
    console.log('Push token registration failed:', err);
  }
};

/**
 * Refresh the stored user (plan, role, usage) from the server.
 * Access checks read the stored user, so this keeps them current.
 * Fails quietly offline and keeps the cached user.
 */
export const syncUserFromServer = async () => {
  try {
    const token = await getAuthToken();
    if (!token) return false;

    const body = await client.get('/auth/me');
    const user = body?.data?.user;
    if (!user) return false;

    const meta = body?.meta || body?.data?.meta || {};
    const currentUser = await getUserData();
    await setUserData({
      ...currentUser,
      ...user,
      ...(meta.trialDaysRemaining !== undefined && { trialDaysRemaining: meta.trialDaysRemaining }),
      ...(meta.trialEndDate && { trialEndDate: meta.trialEndDate }),
    });
    return true;
  } catch (error) {
    logger.warn('Could not refresh user from server', error);
    return false;
  }
};

export const getUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    logger.error('Failed to get user data', error);
    return null;
  }
};

export default useAuth;
