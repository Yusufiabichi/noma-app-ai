// src/utils/pollScan.ts

import { getScanById } from '@/src/api/scans.api';
import logger from '@/src/utils/logger';

const POLL_INTERVAL_MS = 3000;  // check every 3 seconds
const MAX_WAIT_MS = 60000;      // give up after 60 seconds

export async function pollUntilDiagnosed(scanId: string) {
  const startTime = Date.now();

  return new Promise<any>((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const elapsed = Date.now() - startTime;

        if (elapsed >= MAX_WAIT_MS) {
          clearInterval(interval);
          reject(new Error('Diagnosis timed out. Please try again.'));
          return;
        }

        logger.debug('Polling scan status', { scanId, elapsed });

        const result = await getScanById(scanId);
        console.log('Poll raw result:', JSON.stringify(result, null, 2));
        const scan = result?.scan;

        if (!scan) {
          clearInterval(interval);
          reject(new Error('Scan not found'));
          return;
        }

        if (scan.status === 'diagnosed') {
          clearInterval(interval);
          resolve(scan);
          return;
        }

        if (scan.status === 'failed') {
          clearInterval(interval);
          const isRetryable = scan.error?.retryable ?? false;
          reject(Object.assign(
            new Error(scan.error?.message || 'Diagnosis failed'),
            { code: scan.error?.code, retryable: isRetryable, scanId }
          ));
          return;
        }

        if (scan.status === 'pending' && scan.error?.code && !scan.error?.retryable) {
          clearInterval(interval);
          reject(Object.assign(
            new Error(scan.error.message || 'Diagnosis failed and cannot be retried'),
            { code: scan.error.code, retryable: false, scanId }
          ));
          return;
        }

        // status is 'pending' or 'processing' — keep polling
        logger.debug('Scan still processing', { scanId, status: scan.status });

      } catch (err: any) {
        clearInterval(interval);
        reject(err);
      }
    }, POLL_INTERVAL_MS);
  });
}