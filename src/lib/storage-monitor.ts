/**
 * Storage monitoring utilities
 * Tracks IndexedDB usage and warns when approaching limits
 */

/**
 * Get current storage usage and quota
 * Returns null if StorageManager API is not available
 */
export async function getStorageInfo(): Promise<{
  usage: number;
  quota: number;
  percentUsed: number;
} | null> {
  if (!navigator.storage || !navigator.storage.estimate) {
    console.warn("StorageManager API not available");
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;

    if (quota === 0) return null;

    return {
      usage,
      quota,
      percentUsed: (usage / quota) * 100,
    };
  } catch (err) {
    console.error("Failed to estimate storage:", err);
    return null;
  }
}

/**
 * Check if storage is running low (>80% used)
 * Returns warning message if low, null otherwise
 */
export async function checkStorageHealth(): Promise<string | null> {
  const info = await getStorageInfo();
  
  if (!info) return null;

  const { usage, quota, percentUsed } = info;
  const usageMB = (usage / (1024 * 1024)).toFixed(1);
  const quotaMB = (quota / (1024 * 1024)).toFixed(1);

  // Warn at 80% usage
  if (percentUsed > 80) {
    return `Storage running low: ${usageMB}MB used of ${quotaMB}MB (${percentUsed.toFixed(1)}%). Consider exporting and deleting old conversations.`;
  }

  // Critical at 95% usage
  if (percentUsed > 95) {
    return `Storage almost full: ${usageMB}MB used of ${quotaMB}MB (${percentUsed.toFixed(1)}%)! Delete conversations or the app may stop working.`;
  }

  return null;
}

/**
 * Format storage info as human-readable string
 */
export function formatStorageInfo(info: { usage: number; quota: number; percentUsed: number }): string {
  const usageMB = (info.usage / (1024 * 1024)).toFixed(1);
  const quotaMB = (info.quota / (1024 * 1024)).toFixed(1);
  return `${usageMB}MB / ${quotaMB}MB (${info.percentUsed.toFixed(1)}%)`;
}
