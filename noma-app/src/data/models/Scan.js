
// Scan Model for WatermelonDB
// Represents a crop disease scan record


import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export class Scan extends Model {
  static table = 'scans';

  // Basic info
  @field('user_id') userId;
  @field('crop_type') cropType;

  // Image storage info
  @field('image_uri') imageUri;
  @field('image_provider') imageProvider;
  @field('image_url') imageUrl;
  @field('image_public_id') imagePublicId;
  @field('image_key') imageKey;
  @field('image_bucket') imageBucket;

  // Scan status
  @field('status') status;

  // Diagnosis result
  @field('disease') disease;
  @field('crop_detected') cropDetected;
  @field('confidence') confidence;
  @field('severity') severity;
  @field('recommendations') recommendations; // JSON string
  @field('future_prevention') futurePrevention; // JSON string

  // AI service metadata
  @field('model_version') modelVersion;
  @field('processing_time') processingTime;
  @field('request_id') requestId;

  // Error tracking
  @field('error_code') errorCode;
  @field('error_message') errorMessage;
  @field('error_retryable') errorRetryable;
  @field('error_retry_count') errorRetryCount;
  @field('error_last_retry_at') errorLastRetryAt;

  // Sync metadata
  @field('local_id') localId;
  @field('server_scan_id') serverScanId;
  @field('synced_at') syncedAt;
  @field('is_deleted') isDeleted;
  @field('deleted_at') deletedAt;

  // Timestamps
  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;

  // Helper methods
  parseRecommendations() {
    try {
      return this.recommendations ? JSON.parse(this.recommendations) : [];
    } catch {
      return [];
    }
  }

  parseFuturePrevention() {
    try {
      return this.futurePrevention ? JSON.parse(this.futurePrevention) : [];
    } catch {
      return [];
    }
  }

  isSync() {
    return this.status === 'diagnosed' && this.serverScanId;
  }

  isPending() {
    return this.status === 'pending';
  }

  isProcessing() {
    return this.status === 'processing';
  }

  isFailed() {
    return this.status === 'failed';
  }
}
