// WatermelonDB schema migrations
// Without these, bumping the schema version resets the local database and
// loses scans that haven't been sent yet.

import { schemaMigrations, addColumns } from '@nozbe/watermelondb/Schema/migrations';

export const migrations = schemaMigrations({
  migrations: [
    {
      // Low-confidence diagnoses: no treatment, expert review only
      toVersion: 4,
      steps: [
        addColumns({
          table: 'scans',
          columns: [{ name: 'low_confidence', type: 'boolean', isOptional: true }],
        }),
      ],
    },
  ],
});
