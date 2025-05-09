
import React, { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getExperimentResults } from '@/lib/training';
import { ExperimentResults } from '@/types/training';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import CustomTrainingResults from './CustomTrainingResults';
import MLJARExperimentResults from '@/components/results/MLJARExperimentResults';
import StandardExperimentResults from '@/components/results/ExperimentResults';
import { useTraining } from '@/contexts/training/TrainingContext';
import debugLog from '@/utils/debugLogger';

interface ExperimentResultsViewProps {
  experimentId: string;
}

const ExperimentResultsView: React.FC<ExperimentResultsViewProps> = ({
  experimentId
}) => {
  const { 
    setResultsLoaded, 
    resetTrainingState, 
    setIsTraining, 
    setExperimentStatus, 
    lastTrainingType,
    experimentStatus 
  } = useTraining();
  
  const [localLoadingState, setLocalLoadingState] = useState(true); // Local loading state
  const [previousExperimentId, setPreviousExperimentId] = useState<string | null>(null);
  
  // Use React Query with improved configuration
  const { data, isLoading, error } = useQuery({
    queryKey: ['experiment', experimentId],
    queryFn: () => getExperimentResults(experimentId),
    enabled: !!experimentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2, // Retry up to 2 times if the request fails
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid disrupting UI
  });
  
  // Log only when experimentId changes to avoid excessive logging
  useEffect(() => {
    if (previousExperimentId !== experimentId) {
      debugLog("ExperimentResultsView", "Experiment ID changed", { 
        previousId: previousExperimentId,
        newId: experimentId
      });
      setPreviousExperimentId(experimentId);
    }
  }, [experimentId, previousExperimentId]);
  
  // Special handling for AutoML results - combined into one effect with guards
  useEffect(() => {
    // Skip if nothing significant changed
    if (!data || isLoading) return;
    
    const isAutoML = lastTrainingType === 'automl';
    const isStatusCompleted = experimentStatus === 'completed' || experimentStatus === 'success';
    
    debugLog("ExperimentResultsView", "Data update check", { 
      isAutoML, 
      isStatusCompleted,
      hasData: !!data
    });
    
    // Only run this logic for completed AutoML experiments with data
    if (isAutoML && isStatusCompleted && data) {
      setResultsLoaded(true);
      setIsTraining(false);
      
      // Only update status if needed
      if (experimentStatus !== 'completed' && experimentStatus !== 'failed') {
        setExperimentStatus('completed');
      }
    }
  }, [data, isLoading, lastTrainingType, setResultsLoaded, setIsTraining, setExperimentStatus, experimentStatus]);
  
  // Handle primary data loading state changes - with guard conditions
  useEffect(() => {
    // Create a single state object to track all changes
    const newState = {
      loaded: false,
      localLoading: true
    };
    
    if (data && !isLoading) {
      newState.loaded = true;
      newState.localLoading = false;
      
      debugLog("ExperimentResultsView", "Results loaded", {
        status: data.status,
        algorithm: data.algorithm,
        automl_engine: data.automl_engine
      });
      
      // Only update training state if needed
      setIsTraining(false);
      
      // Handle 'success' status from API
      if (data.status === 'success' || data.status === 'completed') {
        setExperimentStatus('completed');
      }
      
    } else if (error) {
      newState.loaded = false;
      newState.localLoading = false;
      debugLog("ExperimentResultsView", "Error loading results", error);
    } else {
      // Just update local loading state without changing global state
      newState.localLoading = isLoading;
    }
    
    // Apply state changes that actually differ from current
    if (newState.loaded) {
      setResultsLoaded(true);
    }
    
    setLocalLoadingState(newState.localLoading);
    
  }, [data, isLoading, error, setResultsLoaded, setIsTraining, setExperimentStatus]);

  // Handler for the "Run New Experiment" button - memoized to prevent recreations
  const handleReset = useCallback(() => {
    debugLog("ExperimentResultsView", "Resetting training state");
    resetTrainingState();
  }, [resetTrainingState]);

  // Use localLoadingState instead of isLoading to prevent UI flickering
  if (localLoadingState) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load experiment results. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  // Determine which component to render based on the automl_engine
  const isMljarExperiment = data.automl_engine?.toLowerCase() === "mljar";
  const isAutoMLExperiment = !!data.automl_engine;
  const isCustomTrainingExperiment = data.training_type === "custom" || (!data.automl_engine && !data.training_type);

  // Render the appropriate component based on experiment type
  if (isMljarExperiment) {
    return (
      <div className="w-full">
        <MLJARExperimentResults
          experimentId={experimentId}
          status={data.status}
          experimentResults={data}
          isLoading={false}
          error={null}
          onReset={handleReset}
        />
      </div>
    );
  } else if (isAutoMLExperiment) {
    return (
      <div className="w-full">
        <StandardExperimentResults
          experimentId={experimentId}
          status={data.status}
          experimentResults={data}
          isLoading={false}
          error={null}
          onReset={handleReset}
        />
      </div>
    );
  } else {
    // Default to CustomTrainingResults for custom training experiments
    return (
      <div className="w-full">
        <CustomTrainingResults 
          experimentResults={data} 
          onReset={handleReset}
        />
      </div>
    );
  }
};

export default ExperimentResultsView;
