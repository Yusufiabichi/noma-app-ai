
// useAuth Hook
// Get current user information from auth context


import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';
import { clearAuthTokens } from '../api/client';

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

export default useAuth;
