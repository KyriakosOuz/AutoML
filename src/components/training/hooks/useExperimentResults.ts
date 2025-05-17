
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getExperimentResults } from '@/lib/training';
import { ExperimentStatus } from '@/types/training';
import { useTraining } from '@/contexts/training/TrainingContext';

export const useExperimentResults = (experimentId: string) => {
  const { 
    setResultsLoaded, 
    resetTrainingState, 
    setIsTraining, 
    setExperimentStatus, 
    lastTrainingType,
    experimentStatus,
    resultsLoaded,
    isTraining
  } = useTraining();
  
  const [localLoadingState, setLocalLoadingState] = useState(true);
  
  // Use React Query with improved configuration
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['experiment', experimentId],
    queryFn: () => getExperimentResults(experimentId),
    enabled: !!experimentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2, // Retry up to 2 times if the request fails
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid disrupting UI
  });
  
  // Log key state changes and include model_display_name
  useEffect(() => {
    console.log("[useExperimentResults] Component mounted or updated:", { 
      experimentId, 
      lastTrainingType, 
      experimentStatus,
      isLoading,
      hasData: !!data,
      hasError: !!error,
      modelName: data?.model_display_name,
      filesCount: data?.files?.length,
      filesTypes: data?.files?.map(f => f.file_type),
      metrics: data?.metrics ? Object.keys(data.metrics) : []
    });
  }, [experimentId, lastTrainingType, experimentStatus, isLoading, data, error]);
  
  // Special handling for AutoML results
  useEffect(() => {
    const isAutoML = lastTrainingType === 'automl' || data?.training_type === 'automl';
    
    // For AutoML experiments, make extra sure resultsLoaded is set to true when data is available
    if (isAutoML && data && !isLoading) {
      console.log("[useExperimentResults] Setting resultsLoaded for AutoML explicitly");
      
      // Only update states if they need updating
      if (!resultsLoaded) {
        setResultsLoaded(true);
      }
      
      if (isTraining) {
        setIsTraining(false);
      }
      
      if (experimentStatus !== 'completed' && experimentStatus !== 'failed') {
        setExperimentStatus(data.status === 'failed' ? 'failed' : 'completed');
      }
    }
  }, [data, isLoading, lastTrainingType, setResultsLoaded, setIsTraining, setExperimentStatus, experimentStatus, resultsLoaded, isTraining]);
  
  // Notify parent components when results are loaded or loading, with improved flow
  useEffect(() => {
    if (data && !isLoading) {
      console.log("[useExperimentResults] Results loaded successfully", {
        status: data.status,
        algorithm: data.algorithm,
        automl_engine: data.automl_engine,
        filesCount: data.files?.length,
        metricKeys: data.metrics ? Object.keys(data.metrics) : [],
        hasPerClass: data.metrics?.per_class ? Object.keys(data.metrics.per_class).length : 0
      });
      
      setLocalLoadingState(false); // ✅ Always safe to update this
      
      // ✅ Set other global flags ONLY if not already correct
      if (!resultsLoaded) {
        setResultsLoaded(true);
      }
      
      if (experimentStatus !== 'completed' && data.status !== 'failed') {
        setExperimentStatus('completed');
      } else if (data.status === 'failed' && experimentStatus !== 'failed') {
        setExperimentStatus('failed');
      }
      
      if (isTraining) {
        setIsTraining(false);
      }
    } else if (error) {
      console.log("[useExperimentResults] Error loading results, setting resultsLoaded to FALSE");
      setResultsLoaded(false);
      setLocalLoadingState(false);
    }
  }, [data, isLoading, error, setResultsLoaded, setIsTraining, setExperimentStatus, experimentStatus, resultsLoaded, isTraining]);

  // Handler for the "Run New Experiment" button
  const handleReset = () => {
    console.log("[useExperimentResults] Resetting training state");
    resetTrainingState();
  };

  // Handler for refreshing results
  const handleRefresh = () => {
    console.log("[useExperimentResults] Refreshing results");
    refetch();
  };

  // Use memoized values for result type determination
  const resultType = useMemo(() => {
    return {
      isMljarExperiment: data?.automl_engine?.toLowerCase() === "mljar",
      isH2OExperiment: data?.automl_engine?.toLowerCase() === "h2o",
      isAutoMLExperiment: !!data?.automl_engine,
      isCustomTrainingExperiment: data?.training_type === "custom" || (!data?.automl_engine && !data?.training_type)
    };
  }, [data]);

  return {
    data,
    isLoading: localLoadingState,
    error,
    resultType,
    handleReset,
    handleRefresh,
  };
};
