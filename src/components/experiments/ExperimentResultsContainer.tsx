import React, { useEffect, useState } from 'react';
import { getExperimentResults } from '@/lib/training';
import { ExperimentResults as ExperimentResultsType, ExperimentStatus, TrainingType } from '@/types/training';
import { useToast } from '@/hooks/use-toast';
import ExperimentResults from '../results/ExperimentResults';
import MLJARExperimentResults from '../results/MLJARExperimentResults';
import H2OExperimentResults from '../results/H2OExperimentResults';
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
  const { resetTrainingState, stopPolling, setActiveTab, lastTrainingType, setLastTrainingType } = useTraining();

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
        // Only log this when actually receiving new data
        console.log("[ExperimentResultsContainer] Successfully fetched experiment results:", {
          id: data.experimentId,
          status: data.status,
          modelName: data.model_display_name,
          engine: data.automl_engine
        });
        
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

  // ✅ IMPROVED: Handler for the "Run New Experiment" button with enhanced training type detection
  const handleReset = () => {
    console.log("[ExperimentResultsContainer] Resetting training state and stopping all polling");
    
    // First ensure all polling is explicitly stopped
    stopPolling();
    
    // ✅ IMPROVED: More robust training type detection with detailed logging
    const trainingType = determineTrainingType();
    console.log("[ExperimentResultsContainer] Determined training type before reset:", trainingType);
    
    // ✅ FIXED: Always update the lastTrainingType in context if we have a valid type
    if (trainingType && trainingType !== lastTrainingType) {
      console.log("[ExperimentResultsContainer] Updating lastTrainingType in context:", trainingType);
      setLastTrainingType(trainingType);
    }
    
    // ✅ FIXED: Always save to localStorage if we have a valid type
    if (trainingType) {
      console.log("[ExperimentResultsContainer] Saving training type to localStorage:", trainingType);
      localStorage.setItem('lastTrainingType', trainingType);
    }
    
    // ✅ FIXED: Set active tab based on determined type before reset
    console.log("[ExperimentResultsContainer] Setting active tab to:", trainingType === 'custom' ? 'custom' : 'automl');
    setActiveTab(trainingType === 'custom' ? 'custom' : 'automl');
    
    // Then reset the training state (which now preserves the lastTrainingType)
    resetTrainingState();
    
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

  // Check experiment engine type
  const isMljarExperiment = results?.automl_engine?.toLowerCase() === "mljar";
  const isH2OExperiment = results?.automl_engine?.toLowerCase() === "h2o";
  
  // ✅ IMPROVED: More robust training type detection logic with enhanced logging
  const determineTrainingType = (): TrainingType => {
    // First check if results have explicit training_type
    if (results?.training_type === 'custom') {
      console.log("[ExperimentResultsContainer] Using training_type from results:", results.training_type);
      return 'custom';
    }
    
    // Then check if results have algorithm (custom training indicator)
    if (results?.algorithm) {
      console.log("[ExperimentResultsContainer] Detected custom training from algorithm field:", results.algorithm);
      return 'custom';
    }
    
    // Then check if results have automl_engine (automl indicator)
    if (results?.automl_engine) {
      console.log("[ExperimentResultsContainer] Using automl_engine from results:", results.automl_engine);
      return 'automl';
    }
    
    // If neither is available, use lastTrainingType from context
    console.log("[ExperimentResultsContainer] Falling back to lastTrainingType from context:", lastTrainingType);
    
    // Return lastTrainingType if valid, otherwise default to automl
    return lastTrainingType === 'custom' ? 'custom' : 'automl';
  };
  
  const currentTrainingType = determineTrainingType();

  console.log("[ExperimentResultsContainer] Final determined training type:", currentTrainingType, "from results:", {
    resultType: results?.training_type,
    algorithm: results?.algorithm,
    automlEngine: results?.automl_engine,
    contextType: lastTrainingType,
    modelName: results?.model_display_name
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
      ) : isH2OExperiment ? (
        <H2OExperimentResults
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
          trainingType={currentTrainingType}
        />
      )}
    </div>
  );
};

export default ExperimentResultsContainer;
