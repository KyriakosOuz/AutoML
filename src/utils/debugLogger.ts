
/**
 * Debug logger utility that provides controlled console logging
 * Only logs in development environment and can be disabled globally
 */

// Set this to false to disable all debug logs
const DEBUG_ENABLED = process.env.NODE_ENV === 'development';

// Store the last log timestamp by category to prevent flooding
const lastLogTimestamp: Record<string, number> = {};

// Set the minimum interval between logs of the same category (in ms)
const LOG_THROTTLE_MS = 1000;

/**
 * Logs a debug message if debugging is enabled
 * Throttles repeated logs from the same category
 */
export function debugLog(category: string, message: string, data?: any): void {
  if (!DEBUG_ENABLED) return;
  
  const now = Date.now();
  const lastTime = lastLogTimestamp[category] || 0;
  
  // Throttle logs from the same category
  if (now - lastTime < LOG_THROTTLE_MS) return;
  
  lastLogTimestamp[category] = now;
  
  if (data !== undefined) {
    console.log(`[${category}] ${message}`, data);
  } else {
    console.log(`[${category}] ${message}`);
  }
}

/**
 * Wrapper for important logs that should always be shown
 * regardless of throttling
 */
export function criticalLog(category: string, message: string, data?: any): void {
  if (!DEBUG_ENABLED) return;
  
  if (data !== undefined) {
    console.log(`[${category}] CRITICAL: ${message}`, data);
  } else {
    console.log(`[${category}] CRITICAL: ${message}`);
  }
}

export default debugLog;
