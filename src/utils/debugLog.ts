
/**
 * Debug logging utility that prevents excessive console logs
 * by throttling identical messages based on content and time
 */

// Global store for last log timestamps
interface LogTimeRecord {
  [key: string]: number;
}

// Separate log stores per component to prevent conflicts
interface LogStores {
  [component: string]: LogTimeRecord;
}

// Global store in window object
declare global {
  interface Window {
    _logTimestamps: LogStores;
  }
}

// Initialize log store if it doesn't exist
if (typeof window !== 'undefined' && !window._logTimestamps) {
  window._logTimestamps = {};
}

/**
 * Log debug messages with throttling to prevent console spam
 * 
 * @param component Component identifier (e.g., 'TrainingContext')
 * @param message Message to log
 * @param data Optional data to include with the log
 * @param throttleMs Milliseconds to throttle identical messages (default: 2000ms)
 */
export const debugLog = (
  component: string,
  message: string,
  data?: any,
  throttleMs: number = 2000
): void => {
  // Only log in non-production environments
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  if (typeof window === 'undefined') {
    // Server-side rendering fallback
    console.log(`[${component}] ${message}`, data || '');
    return;
  }

  // Initialize component store if needed
  if (!window._logTimestamps[component]) {
    window._logTimestamps[component] = {};
  }

  // Create a unique key based on message and serialized data
  const key = `${message}-${JSON.stringify(data || {})}`;
  const now = new Date().getTime();
  const lastLogTime = window._logTimestamps[component][key] || 0;

  // Only log if enough time has passed since the identical log
  if (now - lastLogTime > throttleMs) {
    console.log(`[${component}] ${message}`, data || '');
    window._logTimestamps[component][key] = now;
  }
};

/**
 * Always logs errors regardless of throttling
 */
export const debugError = (component: string, message: string, error?: any): void => {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  console.error(`[${component}] ${message}`, error || '');
};

/**
 * Logs warnings with minimal throttling
 */
export const debugWarn = (
  component: string,
  message: string,
  data?: any,
  throttleMs: number = 1000
): void => {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  if (typeof window === 'undefined') {
    console.warn(`[${component}] ${message}`, data || '');
    return;
  }

  // Initialize component store if needed
  if (!window._logTimestamps[component]) {
    window._logTimestamps[component] = {};
  }

  // Create a unique key based on message and serialized data
  const key = `WARN-${message}-${JSON.stringify(data || {})}`;
  const now = new Date().getTime();
  const lastLogTime = window._logTimestamps[component][key] || 0;

  // Only log if enough time has passed since the identical log
  if (now - lastLogTime > throttleMs) {
    console.warn(`[${component}] ${message}`, data || '');
    window._logTimestamps[component][key] = now;
  }
};

export default debugLog;
