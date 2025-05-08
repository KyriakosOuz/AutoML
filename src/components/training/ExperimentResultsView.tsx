
import React, { useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getExperimentResults } from '@/lib/training';
import { ExperimentResults } from '@/types/training';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import CustomTrainingResults from './CustomTrainingResults';
import MLJARExperimentResults from '@/components/results/MLJARExperimentResults';
// Fix: Import with a different name directly
import StandardExperimentResults from '@/components/results/ExperimentResults';
import { useTraining } from '@/contexts/training/TrainingContext';

interface ExperimentResultsViewProps {
  experimentId: string;
}

// Development-only logging utility to prevent excessive logs
const logDebug = (message: string, data?: any) => {
  if (process.env.NODE_ENV !== 'production') {
    // Using a simple counter to prevent excessive identical logs
    const now = new Date().getTime();
    const key = `${message}-${JSON.stringify(data || {})}`;
    const lastLog = (window as any)._lastLogTime || {};
    
    // Only log if 2 seconds have passed since the identical log
    if (now - (lastLog[key] || 0) > 2000) {
      console.log(message, data || '');
      (window as any)._lastLogTime = {
        ...((window as any)._lastLogTime || {}),
        [key]: now
      };
    }
  }
};

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
    resultsLoaded
  } = useTraining();
  
  const [localLoadingState, setLocalLoadingState] = useState(true); // Local loading state
  const [lastProcessedData, setLastProcessedData] = useState<string | null>(null);
  
  // Use React Query with improved configuration
  const { data, isLoading, error } = useQuery({
    queryKey: ['experiment', experimentId],
    queryFn: () => getExperimentResults(experimentId),
    enabled: !!experimentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2, // Retry up to 2 times if the request fails
    refetchOnWindowFocus: false, // Don't refetch on window focus to avoid disrupting UI
  });
  
  // Log key state changes (with reduced frequency)
  useEffect(() => {
    logDebug("[ExperimentResultsView] Component status:", { 
      experimentId, 
      lastTrainingType, 
      experimentStatus,
      isLoading,
      hasData: !!data,
      hasError: !!error,
      resultsLoaded
    });
  }, [experimentId, lastTrainingType, experimentStatus, isLoading, data, error, resultsLoaded]);
  
  // Create data fingerprint to detect changes
  const getDataFingerprint = useCallback((data: any) => {
    if (!data) return null;
    // Create a simple fingerprint with key data properties
    return JSON.stringify({
      id: data.id,
      status: data.status,
      updated_at: data.updated_at
    });
  }, []);
  
  // Special handling for AutoML results with guard conditions
  useEffect(() => {
    // Skip if no data or if already loaded
    if (!data || isLoading) return;
    
    // Create a fingerprint of the current data
    const currentDataFingerprint = getDataFingerprint(data);
    
    // Skip if we've already processed this exact data state
    if (currentDataFingerprint && currentDataFingerprint === lastProcessedData) {
      return;
    }
    
    // Update the fingerprint to prevent duplicate processing
    setLastProcessedData(currentDataFingerprint);
    
    const isAutoML = lastTrainingType === 'automl' || data.automl_engine;
    
    if (isAutoML && data.status === 'completed' || data.status === 'success') {
      logDebug("[ExperimentResultsView] Setting resultsLoaded for AutoML explicitly");
      
      // Batch state updates to prevent cascading renders
      Promise.resolve().then(() => {
        setIsTraining(false);
        setResultsLoaded(true);
        
        if (experimentStatus !== 'completed' && experimentStatus !== 'failed') {
          setExperimentStatus('completed');
        }
      });
    }
  }, [data, isLoading, lastTrainingType, setResultsLoaded, setIsTraining, 
      setExperimentStatus, experimentStatus, lastProcessedData, getDataFingerprint]);
  
  // Notify parent components when results are loaded or loading, with improved flow
  useEffect(() => {
    // Skip if no data change or still loading
    if (!data || isLoading) {
      setLocalLoadingState(isLoading);
      return;
    }

    // Skip unnecessary updates with a local fingerprint
    const currentFingerprint = getDataFingerprint(data);
    if (currentFingerprint && currentFingerprint === lastProcessedData) {
      setLocalLoadingState(false);
      return;
    }

    if (data.status === 'completed' || data.status === 'success') {
      logDebug("[ExperimentResultsView] Results loaded successfully", {
        status: data.status,
        algorithm: data.algorithm,
        automl_engine: data.automl_engine
      });
      
      // Batch state updates to prevent cascading renders
      Promise.resolve().then(() => {
        setIsTraining(false);
        setExperimentStatus('completed');
        setResultsLoaded(true);
      });
    } else if (error) {
      setResultsLoaded(false);
    }
    
    setLocalLoadingState(false);
  }, [data, isLoading, error, setResultsLoaded, setIsTraining, 
      setExperimentStatus, lastProcessedData, getDataFingerprint]);

  // Handler for the "Run New Experiment" button
  const handleReset = () => {
    logDebug("[ExperimentResultsView] Resetting training state");
    resetTrainingState();
  };

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

  // Additional logging with reduced frequency
  logDebug("[ExperimentResultsView] Rendering results component:", {
    isMljarExperiment,
    isAutoMLExperiment,
    isCustomTrainingExperiment,
    training_type: data.training_type,
    automl_engine: data.automl_engine
  });

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
