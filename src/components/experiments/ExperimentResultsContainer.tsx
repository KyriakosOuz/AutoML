
import React, { useEffect, useState, useRef } from 'react';
import { getExperimentResults } from '@/lib/training';
import { ExperimentResults as ExperimentResultsType, ExperimentStatus } from '@/types/training';
import { useToast } from '@/hooks/use-toast';
import ExperimentResults from '../results/ExperimentResults';
import MLJARExperimentResults from '../results/MLJARExperimentResults';
import { useTraining } from '@/contexts/training/TrainingContext';

// Development-only logging utility
const logDebug = (message: string, data?: any) => {
  if (process.env.NODE_ENV !== 'production') {
    // Using a simple counter to prevent excessive identical logs
    const now = new Date().getTime();
    const key = `${message}-${JSON.stringify(data || {})}`;
    const lastLog = (window as any)._lastLogContainerTime || {};
    
    // Only log if 2 seconds have passed since the identical log
    if (now - (lastLog[key] || 0) > 2000) {
      console.log(message, data || '');
      (window as any)._lastLogContainerTime = {
        ...((window as any)._lastLogContainerTime || {}),
        [key]: now
      };
    }
  }
};

interface ExperimentResultsContainerProps {
  experimentId: string | null;
  status: ExperimentStatus;
  results?: ExperimentResultsType | null; // Make results optional
  isLoading?: boolean; // Make isLoading optional
  onReset?: () => void; // Make onReset optional but will be overridden
  onRefresh?: () => void;
}

const ExperimentResultsContainer: React.FC<ExperimentResultsContainerProps> = ({
  experimentId,
  status,
  results: providedResults,
  isLoading: providedIsLoading,
  onReset, // We'll use this only if we don't have access to the training context
  onRefresh
}) => {
  const [results, setResults] = useState<ExperimentResultsType | null>(providedResults || null);
  const [isLoading, setIsLoading] = useState<boolean>(providedIsLoading !== undefined ? providedIsLoading : false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const fetchAttemptedRef = useRef(false);
  
  // Access the training context to reset training state
  const { resetTrainingState, stopPolling, setActiveTab, lastTrainingType } = useTraining();

  useEffect(() => {
    if (providedResults) {
      // If results are provided as props, use them
      setResults(providedResults);
      return;
    }
    
    if (!experimentId) return;

    // Skip if we've already attempted to fetch and no refresh is requested
    if (fetchAttemptedRef.current && !isLoading) return;
    
    // Fetch results when status is completed, success, or failed (to show error details)
    if ((status === 'completed' || status === 'success' || status === 'failed')) {
      fetchAttemptedRef.current = true;
      fetchResults();
    }
  }, [experimentId, status, providedResults]);

  const fetchResults = async () => {
    if (!experimentId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      logDebug("[ExperimentResultsContainer] Fetching results for experiment:", experimentId);
      const data = await getExperimentResults(experimentId);
      
      if (data) {
        logDebug("[ExperimentResultsContainer] Successfully fetched experiment results:", {
          id: data.id,
          status: data.status,
          hasMetrics: !!data.metrics
        });
        
        // Ensure metrics are correctly mapped (handle both f1 and f1_score)
        if (data.metrics && data.metrics.f1 !== undefined && data.metrics.f1_score === undefined) {
          data.metrics.f1_score = data.metrics.f1;
        }
        
        setResults(data);
      } else {
        logDebug("[ExperimentResultsContainer] No results returned from API");
        setError("Failed to load experiment results");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load experiment results';
      console.error("[ExperimentResultsContainer] Error fetching results:", errorMessage);
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for the "Run New Experiment" button
  const handleReset = () => {
    logDebug("[ExperimentResultsContainer] Resetting training state and stopping all polling");
    
    // First ensure all polling is explicitly stopped
    stopPolling();
    
    // Then reset the training state
    resetTrainingState();
    
    // Set active tab to 'automl' to match behavior of Reset Training button
    setActiveTab('automl');
    
    // If an external onReset was provided, call it as well
    if (onReset) {
      onReset();
    }
    
    // Show a toast notification
    toast({
      title: "Training Reset",
      description: "Ready to start a new experiment",
    });
  };

  const handleRefresh = () => {
    // Stop any running polling before refreshing results
    stopPolling();
    fetchAttemptedRef.current = false; // Reset the fetch attempt flag
    fetchResults();
    if (onRefresh) onRefresh();
  };

  // Check if this is a MLJAR experiment
  const isMljarExperiment = results?.automl_engine?.toLowerCase() === "mljar";
  
  // Determine the correct training type from results or context
  const determineTrainingType = () => {
    // First check if results have explicit training_type
    if (results?.training_type) {
      return results.training_type;
    }
    
    // Then check if results have algorithm (custom training indicator)
    if (results?.algorithm) {
      return 'custom';
    }
    
    // Then check if results have automl_engine (legacy detection)
    if (results?.automl_engine) {
      return 'automl';
    }
    
    // If neither is available, use lastTrainingType from context
    return lastTrainingType;
  };
  
  const currentTrainingType = determineTrainingType();

  // Reduced final logging with key data only
  logDebug("[ExperimentResultsContainer] Determined training type:", {
    type: currentTrainingType,
    automlEngine: results?.automl_engine,
    hasAlgorithm: !!results?.algorithm
  });

  return (
    <div className="w-full overflow-x-hidden">
      {isMljarExperiment ? (
        <MLJARExperimentResults
          experimentId={experimentId}
          status={status}
          experimentResults={results}
          isLoading={isLoading}
          error={error}
          onReset={handleReset}
          onRefresh={handleRefresh}
        />
      ) : (
        <ExperimentResults
          experimentId={experimentId}
          status={status}
          experimentResults={results}
          isLoading={isLoading}
          error={error}
          onReset={handleReset}
          onRefresh={handleRefresh}
          trainingType={currentTrainingType} // Pass the training type to the component
        />
      )}
    </div>
  );
};

export default ExperimentResultsContainer;
