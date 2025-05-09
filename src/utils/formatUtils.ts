
/**
 * Format training time from seconds to a human-readable string
 */
export const formatTrainingTime = (seconds?: number): string => {
  if (!seconds) return 'N/A';
  
  if (seconds < 60) {
    return `${seconds.toFixed(1)} secs`;
  } else if (seconds < 3600) {
    return `${(seconds / 60).toFixed(1)} mins`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
};

/**
 * Format a metric value for display
 */
export const formatMetricValue = (value: number | undefined): string => {
  if (value === undefined) return 'N/A';
  
  // Format as percentage if between 0 and 1
  if (value >= 0 && value <= 1) {
    return `${(value * 100).toFixed(2)}%`;
  }
  
  // Format other numbers
  return value.toFixed(4);
};

/**
 * Get appropriate color class based on metric value
 */
export const getMetricColorClass = (metric: string, value: number | undefined): string => {
  if (value === undefined) return '';
  
  // For metrics where higher is better
  if (['accuracy', 'auc', 'r2', 'f1', 'precision', 'recall'].includes(metric.toLowerCase())) {
    if (value >= 0.9) return 'text-green-600';
    if (value >= 0.7) return 'text-emerald-600';
    if (value >= 0.5) return 'text-amber-600';
    return 'text-red-600';
  }
  
  // For metrics where lower is better
  if (['rmse', 'mae', 'mse', 'logloss', 'error'].includes(metric.toLowerCase())) {
    if (value < 0.1) return 'text-green-600';
    if (value < 0.3) return 'text-emerald-600';
    if (value < 0.5) return 'text-amber-600';
    return 'text-red-600';
  }
  
  return '';
};
