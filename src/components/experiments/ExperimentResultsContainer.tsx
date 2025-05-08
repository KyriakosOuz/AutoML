import React, { useEffect, useState } from 'react';
import { getExperimentResults } from '@/lib/training';
import { ExperimentResults as ExperimentResultsType, ExperimentStatus } from '@/types/training';
import { useToast } from '@/hooks/use-toast';
import ExperimentResults from '../results/ExperimentResults';
import MLJARExperimentResults from '../results/MLJARExperimentResults';
import { useTraining } from '@/contexts/training/TrainingContext';

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
  
  // Access the training context to reset training state
  const { resetTrainingState, stopPolling, setActiveTab, lastTrainingType } = useTraining();

  useEffect(() => {
    if (providedResults) {
      // If results are provided as props, use them
      setResults(providedResults);
      return;
    }
    
    if (!experimentId) return;
    
    // Fetch results when status is completed, success, or failed (to show error details)
    if ((status === 'completed' || status === 'success' || status === 'failed')) {
      fetchResults();
    }
  }, [experimentId, status, providedResults]);

  const fetchResults = async () => {
    if (!experimentId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("[ExperimentResultsContainer] Fetching results for experiment:", experimentId);
      const data = await getExperimentResults(experimentId);
      
      if (data) {
        console.log("[ExperimentResultsContainer] Successfully fetched experiment results:", data);
        
        // Ensure metrics are correctly mapped (handle both f1 and f1_score)
        if (data.metrics && data.metrics.f1 !== undefined && data.metrics.f1_score === undefined) {
          data.metrics.f1_score = data.metrics.f1;
        }
        
        setResults(data);
      } else {
        console.log("[ExperimentResultsContainer] No results returned from API");
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
    console.log("[ExperimentResultsContainer] Resetting training state and stopping all polling");
    
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
    fetchResults();
    if (onRefresh) onRefresh();
  };

  // Check if this is a MLJAR experiment
  const isMljarExperiment = results?.automl_engine?.toLowerCase() === "mljar";
  
  // Determine the correct training type from results or context
  const determineTrainingType = () => {
    // First check if results have automl_engine
    if (results?.automl_engine) return 'automl';
    
    // Then check if results have training_type
    if (results?.training_type) return results.training_type;
    
    // If neither is available, use lastTrainingType from context
    return lastTrainingType;
  };
  
  const currentTrainingType = determineTrainingType();

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
