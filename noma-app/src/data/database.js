
/**
 * WatermelonDB Database Setup
 * Local database for offline-first functionality
 */

import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { Scan } from './models/Scan';

// Lazy initialization of database
let databaseInstance = null;

const getDatabase = () => {
  if (!databaseInstance) {
    // Create SQLite adapter for React Native
    const adapter = new SQLiteAdapter({
      schema,
      dbName: 'noma_app.db',
      jsi: false, // Disable JSI for compatibility
      onSetUpError: (error) => {
        console.error('WatermelonDB setup error:', error);
      },
    });

    // Create database instance
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
  actionsEnabled: true,
});

export default database;
