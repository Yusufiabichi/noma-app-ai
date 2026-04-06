
// WatermelonDB Database Setup
// Local database for offline-first functionality


import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { Scan } from './models/Scan';

// Create SQLite adapter
const adapter = new SQLiteAdapter({
  schema,
  // Migrations can be added here if needed
});

// Create database instance
export const database = new Database({
  adapter,
  modelClasses: [Scan],
  actionsEnabled: true,
});

export default database;
