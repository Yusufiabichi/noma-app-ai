
// useAuth Hook
// Get current user information from auth context


import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../utils/logger';

const USER_KEY = '@nomaapp_user';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem(USER_KEY);
        if (userData) {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        logger.error('Failed to load user', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  return { user, loading };
};

export const setUserData = async (userData) => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
  } catch (error) {
    logger.error('Failed to save user data', error);
  }
};

export default useAuth;
