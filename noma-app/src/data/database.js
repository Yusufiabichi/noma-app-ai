

// WatermelonDB Database Setup
// Local database for offline-first functionality


import { Platform } from 'react-native';
import { Database } from '@nozbe/watermelondb';
import { schema } from './schema';
import { Scan } from './models/Scan';

// Use the web-friendly LokiJS adapter when running in a browser.
// Native platforms use SQLite.
const SQLiteAdapter = Platform.OS !== 'web'
  ? require('@nozbe/watermelondb/adapters/sqlite').default
  : null;
const LokiJSAdapter = Platform.OS === 'web'
  ? require('@nozbe/watermelondb/adapters/lokijs').default
  : null;

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

    const adapter = Platform.OS === 'web'
      ? new LokiJSAdapter({
          ...adapterOptions,
          useWebWorker: false,
          useIncrementalIndexedDB: true,
        })
      : new SQLiteAdapter({
          ...adapterOptions,
          jsi: false,
        });

    databaseInstance = new Database({
      adapter,
      modelClasses: [Scan],
      actionsEnabled: true,
    });
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

