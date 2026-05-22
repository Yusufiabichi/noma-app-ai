// src/utils/getLanguageCode.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getLanguageCode(): Promise<'en' | 'ha'> {
  try {
    const stored = await AsyncStorage.getItem('appLanguage');
    return stored === 'hausa' ? 'ha' : 'en';
  } catch {
    return 'en'; // safe fallback
  }
}