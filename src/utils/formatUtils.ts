
/**
 * Formats training time from seconds to a human-readable format
 * - For times < 60 seconds: Shows as "X.X seconds"
 * - For times ≥ 60 seconds: Shows as "X min Y sec"
 */
export const formatTrainingTime = (seconds: number | undefined): string => {
  if (seconds === undefined) return "N/A";
  
  if (seconds < 60) {
    return `${seconds.toFixed(1)} seconds`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  
  if (remainingSeconds === 0) {
    return `${minutes} min`;
  }
  
  return `${minutes} min ${remainingSeconds} sec`;
};
