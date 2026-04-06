# Offline-First Crop Disease Scan Implementation

This document describes the offline-first architecture implemented for the crop disease scan feature in the NoMA App.

## Overview

The implementation enables users to scan images of crops for disease detection with full offline support:

- **Online**: Immediate image upload and AI analysis
- **Offline**: Local image storage with pending analysis (processes when reconnected)

## Architecture

### Components

#### 1. Database Layer (`src/data/`)

**schema.js** - WatermelonDB schema definition

- Single `scans` table with 28 columns
- Stores: image URI, scan status, diagnosis results, metadata, error tracking, sync status
- Supports indexing for efficient queries

**models/Scan.js** - WatermelonDB model class

- Type-safe access to scan records
- Helper methods for parsing JSON fields and checking status
- Implements: `isSync()`, `isPending()`, `isProcessing()`, `isFailed()`

**database.js** - Database initialization

- Creates SQLite adapter for React Native
- Exports database singleton instance

#### 2. Network Utilities (`src/utils/network.js`)

Manages device network state using `@react-native-community/netinfo`:

- `isOnline()` - Async check for connectivity
- `isOnlineSync()` - Synchronous cached check
- `initNetworkMonitoring()` - Start listening to network changes
- `onNetworkStatusChange(callback)` - Subscribe to status changes

#### 3. Scan Services

**localScanService.js** (`src/services/`)
Manages local scan storage in WatermelonDB:

- `saveImageLocally(sourceUri)` - Copy image to app's document directory
- `createLocalScan(data)` - Create pending scan record
- `updateScanWithDiagnosis(scanId, diagnosis)` - Update with AI results
- `markScanAsSynced(scanId, serverId, imageUrl)` - Mark as synced
- `getPendingScans(userId)` - Get all pending/unsynced scans
- `getUserScans(userId)` - Get all user scans
- `deleteScan(scanId)` - Soft-delete scan and image file

**syncService.js** (`src/services/`)
Handles syncing pending scans with backend:

- `syncPendingScans(userId)` - Main sync function
  - Checks online status
  - Gets all pending scans
  - Uploads images and calls `/infer` endpoint
  - Updates local records with diagnosis
  - Marks as synced with server ID
  - Returns results for each scan: `{status, localId, serverScanId, disease, error}`

#### 4. Hooks

**useAuth.js** (`src/hooks/`)
Manages current user state (stores in AsyncStorage):

- `useAuth()` - Hook to get current user
- `setUserData(userData)` - Save user to AsyncStorage

**useSync.js** (`src/hooks/`)
Auto-sync on network reconnection:

- Initializes network monitoring
- Listens for online/offline transitions
- Triggers sync when coming back online
- Logs results

#### 5. UI Components

**cropScan.tsx** - Main scan capture screen
Flow:

1. User takes/selects image and chooses crop type
2. `imgCrop()` checks online status:
   - **Online**: Calls `processScanOnline()`
   - **Offline**: Calls `processScanOffline()`
3. **Online flow**:
   - Uploads image via `client.uploadFile('/infer', formData)`
   - Receives diagnosis with AI results
   - Includes disease, confidence, severity, recommendations
   - Navigates to treatment-rec with full results
4. **Offline flow**:
   - Saves image locally
   - Creates pending scan record
   - Navigates to treatment-rec showing "pending" state

**treatment-rec/index.tsx** - Treatment recommendations screen
States:

1. **Loading** - While checking result status
2. **Pending (Offline)**:
   - Shows "Device Offline" message
   - Displays saved crop type
   - "Sync Now" button to trigger manual sync
   - Shows sync errors if any
3. **Complete (Online)**:
   - Displays disease diagnosis
   - Shows confidence, severity, crop type
   - Lists recommended treatments
   - Lists future prevention tips
   - Buttons: "I will do this", "Ask Expert"

## Data Flow

### Online (Immediate Analysis)

```
[Camera/Gallery]
    ↓
[Check Online] → YES
    ↓
[Upload Image + Crop Type]
    ↓
[AI Inference (/infer)]
    ↓
[Receive: disease, confidence, severity, recommendations, futurePrevention]
    ↓
[Display Treatment Results]
```

### Offline (Deferred Analysis)

```
[Camera/Gallery]
    ↓
[Check Online] → NO
    ↓
[Save Image Locally]
    ↓
[Create Pending Scan Record]
    ↓
[Show "Pending" UI]
    ↓
[User reconnects to internet]
    ↓
[Network Change Event]
    ↓
[syncService.syncPendingScans()]
    ↓
[Upload to /infer]
    ↓
[Update Local Record with Results]
    ↓
[UI Auto-Updates or User Refreshes]
```

## Database Schema

```
scans table {
  // Basic info
  user_id: string (indexed)
  crop_type: string

  // Image storage
  image_uri: string (local file URI)
  image_provider: string ('s3' or 'cloudinary' after sync)
  image_url: string (remote URL)
  image_public_id: string (Cloudinary ID)
  image_key: string (S3 key)
  image_bucket: string (S3 bucket)

  // Scan status
  status: string (pending|processing|diagnosed|failed)

  // Diagnosis results
  disease: string
  crop_detected: string
  confidence: number (0-1)
  severity: string (low|medium|high)
  recommendations: string (JSON array)
  future_prevention: string (JSON array)

  // AI metadata
  model_version: string
  processing_time: number
  request_id: string

  // Error tracking
  error_code: string
  error_message: string
  error_retryable: boolean
  error_retry_count: number
  error_last_retry_at: number

  // Sync metadata
  local_id: string (unique local identifier)
  server_scan_id: string (backend scan ID)
  synced_at: number (timestamp)
  is_deleted: boolean
  deleted_at: number (timestamp)

  // Timestamps
  created_at: timestamp
  updated_at: timestamp
}
```

## Backend Integration

### Endpoints Used

**POST /infer** (AI Inference)

```
Request: multipart/form-data
- image: file
- cropType: string

Response:
{
  scan_id: string
  disease: string
  cropType: string
  confidence: number (0-1)
  severity: string
  recommendations: [string]
  futurePrevention: [string]
  modelVersion?: string
  processingTime?: number
  image_url?: string (if image uploaded)
  image_provider?: string
}
```

### Sync Flow (When Backend Ready)

POST /sync/push with pending scans instead of uploading individually

## Installation & Setup

### 1. Install Dependencies

```bash
npm install @react-native-community/netinfo
```

### 2. Initialize Database (in App Root/Layout)

```tsx
import { initNetworkMonitoring } from '@/src/utils/network';
import { useSync } from '@/src/hooks/useSync';

// In your root layout or app entry point:
export default function App() {
  useSync(); // Initialize sync on network changes

  return (
    // your app components
  );
}
```

### 3. Set User ID on Login

```tsx
import { setUserData } from "@/src/hooks/useAuth";

// After successful login:
await setUserData({ id: "user-123" });
```

## Configuration

### Image Storage

- Local storage directory: `${documentDirectory}/scans/`
- File format: `scan-{timestamp}-{random}.jpg`
- Backend uses: Cloudinary or S3 (configured on backend)

### Network Monitoring

- Monitors connectivity and internet reachability
- Updates cached status on changes
- Triggers sync callbacks when coming online

### Error Handling

- Retryable errors tracked with retry count and timestamp
- Max retries typically handled by backend
- Failed scans can be manually retried via "Sync Now" button

## Best Practices

1. **Always initialize sync hook** in app root
2. **Set user ID immediately after auth** so sync works properly
3. **Handle network unavailability gracefully** (show offline UI)
4. **Test sync manually** by:
   - Disabling internet
   - Taking a scan (should be pending)
   - Re-enabling internet
   - Tapping "Sync Now" or waiting for auto-sync
5. **Monitor error logs** for failed syncs

## Future Enhancements

1. Add bulk sync endpoint `/api/sync` for efficiency
2. Implement offline queue for other resources (farms, posts)
3. Add sync progress indicators
4. Implement conflict resolution for multi-device sync
5. Add compression for images before upload
6. Implement resumable uploads for large files
