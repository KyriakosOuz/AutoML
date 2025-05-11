
import React, { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getExperimentResults } from '@/lib/training';
import { ExperimentResults, ExperimentStatus } from '@/types/training';
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

const ExperimentResultsView: React.FC<ExperimentResultsViewProps> = ({
  experimentId
}) => {
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
  
  const [localLoadingState, setLocalLoadingState] = useState(true); // Local loading state
  
  // Use React Query with improved configuration
  const { data, isLoading, error } = useQuery({
    queryKey: ['experiment', experimentId],
    queryFn: () => getExperimentResults(experimentId),
    enabled: !!experimentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2, // Retry up to 2 times if the request fails
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid disrupting UI
  });
  
  // Log key state changes
  useEffect(() => {
    console.log("[ExperimentResultsView] Component mounted or updated:", { 
      experimentId, 
      lastTrainingType, 
      experimentStatus,
      isLoading,
      hasData: !!data,
      hasError: !!error
    });
  }, [experimentId, lastTrainingType, experimentStatus, isLoading, data, error]);
  
  // Special handling for AutoML results
  useEffect(() => {
    const isAutoML = lastTrainingType === 'automl';
    
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
        setExperimentStatus('completed');
      }
    }
  }, [data, isLoading, lastTrainingType, setResultsLoaded, setIsTraining, setExperimentStatus, experimentStatus, resultsLoaded, isTraining]);
  
  // Notify parent components when results are loaded or loading, with improved flow
  useEffect(() => {
    if (data && !isLoading) {
      console.log("[ExperimentResultsView] Results loaded successfully", {
        status: data.status,
        algorithm: data.algorithm,
        automl_engine: data.automl_engine
      });
      
      setLocalLoadingState(false); // ✅ Always safe to update this
      
      // ✅ Set other global flags ONLY if not already correct
      if (!resultsLoaded) {
        setResultsLoaded(true);
      }
      
      if (experimentStatus !== 'completed') {
        setExperimentStatus('completed');
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

  // Handler for the "Run New Experiment" button
  const handleReset = () => {
    console.log("[ExperimentResultsView] Resetting training state");
    resetTrainingState();
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

  // Additional logging to help diagnose render issues
  console.log("[ExperimentResultsView] Rendering results component:", {
    isMljarExperiment: resultType.isMljarExperiment,
    isH2OExperiment: resultType.isH2OExperiment,
    isAutoMLExperiment: resultType.isAutoMLExperiment,
    isCustomTrainingExperiment: resultType.isCustomTrainingExperiment,
    training_type: data.training_type,
    automl_engine: data.automl_engine
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
