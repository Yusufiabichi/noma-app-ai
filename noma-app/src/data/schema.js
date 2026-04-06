/**
 * WatermelonDB Database Schema
 * Defines the structure for local database tables
 */

import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'scans',
      columns: [
        // Basic info
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'crop_type', type: 'string' },
        
        // Image storage info
        { name: 'image_uri', type: 'string' }, // Local file system URI
        { name: 'image_provider', type: 'string' }, // 's3' or 'cloudinary' (when synced)
        { name: 'image_url', type: 'string' }, // Remote URL (after sync)
        { name: 'image_public_id', type: 'string' }, // Cloudinary public_id
        { name: 'image_key', type: 'string' }, // S3 key
        { name: 'image_bucket', type: 'string' }, // S3 bucket
        
        // Scan status
        { name: 'status', type: 'string', isIndexed: true }, // 'pending', 'processing', 'diagnosed', 'failed'
        
        // Diagnosis result (stored as JSON string)
        { name: 'disease', type: 'string' },
        { name: 'crop_detected', type: 'string' },
        { name: 'confidence', type: 'number' },
        { name: 'severity', type: 'string' }, // 'low', 'medium', 'high'
        { name: 'recommendations', type: 'string' }, // JSON string array
        { name: 'future_prevention', type: 'string' }, // JSON string array
        
        // AI service metadata
        { name: 'model_version', type: 'string' },
        { name: 'processing_time', type: 'number' },
        { name: 'request_id', type: 'string' },
        
        // Error tracking
        { name: 'error_code', type: 'string' },
        { name: 'error_message', type: 'string' },
        { name: 'error_retryable', type: 'boolean' },
        { name: 'error_retry_count', type: 'number', isIndexed: false },
        { name: 'error_last_retry_at', type: 'number' },
        
        // Sync metadata
        { name: 'local_id', type: 'string', isIndexed: true },
        { name: 'server_scan_id', type: 'string' }, // After sync with server
        { name: 'synced_at', type: 'number' },
        { name: 'is_deleted', type: 'boolean', isIndexed: true },
        { name: 'deleted_at', type: 'number' },
        
        // Timestamps
        { name: 'created_at', type: 'number', isIndexed: true },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});
