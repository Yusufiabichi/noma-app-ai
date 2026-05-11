

// WatermelonDB Database Setup
// Local database for offline-first functionality


import { Platform } from 'react-native';
import { Database } from '@nozbe/watermelondb';
import { schema } from './schema';
import { Scan } from './models/Scan';

// Use the web-friendly LokiJS adapter when running in a browser.
// Native platforms use SQLite.
let SQLiteAdapter;
let LokiJSAdapter;

if (Platform.OS === 'web') {
  try {
    LokiJSAdapter = require('@nozbe/watermelondb/adapters/lokijs').default;
  } catch (e) {
    console.error('Failed to load WatermelonDB LokiJS adapter:', e);
  }
} else if (Platform.OS === 'ios' || Platform.OS === 'android') {
  try {
    // For Expo, we need to be careful. If using Expo Go, this will fail at runtime
    // because the native module is missing.
    SQLiteAdapter = require('@nozbe/watermelondb/adapters/sqlite').default;
  } catch (e) {
    console.warn('WatermelonDB SQLite adapter could not be loaded. If you are using Expo Go, WatermelonDB requires a custom development client.', e);
  }
}

// Lazy initialization of database
let databaseInstance = null;

const getDatabase = () => {
  if (!databaseInstance) {
    const adapterOptions = {
      schema,
      dbName: 'noma_app.db',
      onSetUpError: (error) => {
        console.error('WatermelonDB setup error:', error);
      },
    };

    let adapter;

    if (Platform.OS === 'web') {
      adapter = new LokiJSAdapter({
        ...adapterOptions,
        useWebWorker: false,
        useIncrementalIndexedDB: true,
      });
    } else if (SQLiteAdapter) {
      adapter = new SQLiteAdapter({
        ...adapterOptions,
        jsi: false,
      });
    } else {
      // Fallback for Node or unknown environments to avoid crashing during bundling
      console.warn('WatermelonDB: No suitable adapter found for this platform. Database functionality will be unavailable.');
      return null;
    }

    if (adapter) {
      databaseInstance = new Database({
        adapter,
        modelClasses: [Scan],
        actionsEnabled: true,
      });
    }
  }

  return databaseInstance;
};


// Export database getter
export const database = getDatabase();

// Initialize database (call this when app starts)
export const initializeDatabase = async () => {
  try {
    // Test database connection by trying to access the scans table
    const db = getDatabase();
    if (!db) {
      console.warn('Database instance not available, skipping initialization');
      return false;
    }
    const scansCollection = db.get('scans');
    await scansCollection.query().fetchCount();
    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    // Return false but don't throw - allow app to continue
    return false;
  }
};

export default database;
// });

