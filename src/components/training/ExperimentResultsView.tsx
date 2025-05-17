import React, { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getExperimentResults } from '@/lib/training';
import { ExperimentStatus, TrainingType } from '@/types/training';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import CustomTrainingResults from './CustomTrainingResults';
import MLJARExperimentResults from '@/components/results/MLJARExperimentResults';
// Fix: Import with a different name directly
import StandardExperimentResults from '@/components/results/ExperimentResults';
import H2OExperimentResults from '@/components/results/H2OExperimentResults';
import { useTraining } from '@/contexts/training/TrainingContext';

interface ExperimentResultsViewProps {
  experimentId: string;
}

export const ExperimentResultsView: React.FC<ExperimentResultsViewProps> = ({
  experimentId
}) => {
  const { 
    setResultsLoaded, 
    resetTrainingState, 
    setIsTraining, 
    setExperimentStatus, 
    lastTrainingType,
    setLastTrainingType, // ✅ NEW: Get the setter for lastTrainingType
    experimentStatus,
    resultsLoaded,
    isTraining
  } = useTraining();
  
  const [localLoadingState, setLocalLoadingState] = useState(true); // Local loading state
  
  // Use React Query with improved configuration
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['experiment', experimentId],
    queryFn: () => getExperimentResults(experimentId),
    enabled: !!experimentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2, // Retry up to 2 times if the request fails
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid disrupting UI
  });
  
  // ✅ NEW: Update lastTrainingType when results arrive
  useEffect(() => {
    if (data) {
      // Determine training type from results
      let detectedType = 'automl';
      if (data.training_type) {
        detectedType = data.training_type;
      } else if (data.algorithm) {
        detectedType = 'custom';
      } else if (!data.automl_engine) {
        detectedType = 'custom'; // If no automl_engine, likely custom
      }
      
      // ✅ FIXED: Validate and cast the training type to ensure it's a valid TrainingType
      const validatedType: TrainingType = detectedType === 'custom' ? 'custom' : 'automl';
      
      if (validatedType !== lastTrainingType) {
        console.log("[ExperimentResultsView] Updating lastTrainingType based on results:", {
          from: lastTrainingType,
          to: validatedType,
          modelName: data.model_display_name,
          trainingType: data.training_type,
          algorithm: data.algorithm,
          automlEngine: data.automl_engine
        });
        
        // Update lastTrainingType in context with validated type
        setLastTrainingType(validatedType);
        
        // Also update in localStorage for persistence
        localStorage.setItem('lastTrainingType', validatedType);
      }
    }
  }, [data, lastTrainingType, setLastTrainingType]);
  
  // Log key state changes and include model_display_name
  useEffect(() => {
    console.log("[ExperimentResultsView] Component mounted or updated:", { 
      experimentId, 
      lastTrainingType, 
      experimentStatus,
      isLoading,
      hasData: !!data,
      hasError: !!error,
      modelName: data?.model_display_name,
      filesCount: data?.files?.length,
      filesTypes: data?.files?.map(f => f.file_type),
      metrics: data?.metrics ? Object.keys(data.metrics) : [],
      trainingType: data?.training_type,
      algorithm: data?.algorithm
    });
  }, [experimentId, lastTrainingType, experimentStatus, isLoading, data, error]);
  
  // Special handling for AutoML results
  useEffect(() => {
    const isAutoML = lastTrainingType === 'automl' || data?.training_type === 'automl';
    
    // For AutoML experiments, make extra sure resultsLoaded is set to true when data is available
    if (isAutoML && data && !isLoading) {
      console.log("[ExperimentResultsView] Setting resultsLoaded for AutoML explicitly");
      
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
      console.log("[ExperimentResultsView] Results loaded successfully", {
        status: data.status,
        algorithm: data.algorithm,
        automl_engine: data.automl_engine,
        filesCount: data.files?.length,
        metricKeys: data.metrics ? Object.keys(data.metrics) : [],
        hasPerClass: data.metrics?.per_class ? Object.keys(data.metrics.per_class).length : 0
      });
      
      setLocalLoadingState(false); // �� Always safe to update this
      
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
      console.log("[ExperimentResultsView] Error loading results, setting resultsLoaded to FALSE");
      setResultsLoaded(false);
      setLocalLoadingState(false);
    }
  }, [data, isLoading, error, setResultsLoaded, setIsTraining, setExperimentStatus, experimentStatus, resultsLoaded, isTraining]);

  // Handler for the "Run New Experiment" button - ✅ UPDATED to respect training type
  const handleReset = () => {
    // Determine most accurate training type before reset
    let trainingType = 'automl';
    
    if (data?.training_type) {
      trainingType = data.training_type;
    } else if (data?.algorithm) {
      trainingType = 'custom';
    } else if (lastTrainingType) {
      trainingType = lastTrainingType;
    }
    
    console.log("[ExperimentResultsView] Resetting training state with type:", trainingType);
    
    // ✅ FIXED: Validate and cast the training type
    const validatedType: TrainingType = trainingType === 'custom' ? 'custom' : 'automl';
    
    // Update lastTrainingType in context before reset
    setLastTrainingType(validatedType);
    
    // Save to localStorage
    localStorage.setItem('lastTrainingType', validatedType);
    
    // Reset state
    resetTrainingState();
  };

  // Handler for refreshing results
  const handleRefresh = () => {
    console.log("[ExperimentResultsView] Refreshing results");
    refetch();
  };

  // Use memoized values for result type determination
  const resultType = useMemo(() => {
    return {
      // Explicitly check for MLJAR engine (case insensitive)
      isMljarExperiment: data?.automl_engine?.toLowerCase() === "mljar",
      isH2OExperiment: data?.automl_engine?.toLowerCase() === "h2o",
      isAutoMLExperiment: !!data?.automl_engine,
      isCustomTrainingExperiment: data?.training_type === "custom" || (!data?.automl_engine && !data?.training_type)
    };
  }, [data]);

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

  // Additional logging to help diagnose render issues - include model display name
  console.log("[ExperimentResultsView] Rendering results component:", {
    isMljarExperiment: resultType.isMljarExperiment,
    isH2OExperiment: resultType.isH2OExperiment,
    isAutoMLExperiment: resultType.isAutoMLExperiment,
    isCustomTrainingExperiment: resultType.isCustomTrainingExperiment,
    training_type: data.training_type,
    automl_engine: data.automl_engine,
    model_name: data.model_display_name,
    filesCount: data.files?.length,
    metricsKeys: data.metrics ? Object.keys(data.metrics) : [],
    perClassMetrics: data.metrics?.per_class ? Object.keys(data.metrics.per_class) : []
  });

  // Render the appropriate component based on experiment type
  if (resultType.isMljarExperiment) {
    return (
      <div className="w-full">
        <MLJARExperimentResults
          experimentId={experimentId}
          status={data.status as ExperimentStatus}
          experimentResults={data}
          isLoading={false}
          error={null}
          onReset={handleReset}
          onRefresh={handleRefresh}
        />
      </div>
    );
  } else if (resultType.isH2OExperiment) {
    return (
      <div className="w-full">
        <H2OExperimentResults
          experimentId={experimentId}
          status={data.status as ExperimentStatus}
          experimentResults={data}
          isLoading={false}
          error={null}
          onReset={handleReset}
          onRefresh={handleRefresh}
        />
      </div>
    );
  } else if (resultType.isAutoMLExperiment) {
    return (
      <div className="w-full">
        <StandardExperimentResults
          experimentId={experimentId}
          status={data.status as ExperimentStatus}
          experimentResults={data}
          isLoading={false}
          error={null}
          onReset={handleReset}
          onRefresh={handleRefresh}
          // ✅ FIXED: Ensure training type is properly validated as a literal type
          trainingType={data.training_type === 'custom' ? 'custom' : 'automl'}
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
