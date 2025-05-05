
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { trainingApi } from '@/lib/api';
import { ExperimentResults, ExperimentStatusResponse } from '@/types/training';
import { TrainingContextValue, TrainingContextState, ExperimentStatus } from './types';
import { EXPERIMENT_STORAGE_KEY, EXPERIMENT_TYPE_STORAGE_KEY, defaultAutomlParameters, defaultCustomParameters } from './constants';
import { useExperimentPolling } from './useExperimentPolling';
import { checkStatus } from '@/lib/training';

const TrainingContext = createContext<TrainingContextValue | undefined>(undefined);

export const TrainingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [state, setState] = useState<TrainingContextState>({
    isTraining: false,
    lastTrainingType: null,
    automlParameters: defaultAutomlParameters,
    customParameters: defaultCustomParameters,
    automlResult: null,
    customResult: null,
    error: null,
    activeExperimentId: null,
    experimentResults: null,
    isLoadingResults: false,
    experimentStatus: 'idle', // Changed from 'processing' to 'idle'
    statusResponse: null,
    automlEngine: defaultAutomlParameters.automlEngine,
    testSize: defaultAutomlParameters.testSize,
    stratify: defaultAutomlParameters.stratify,
    randomSeed: defaultAutomlParameters.randomSeed,
    activeTab: 'automl',
    isCheckingLastExperiment: false,
  });

  // Define getExperimentResults first (no dependencies on functions defined later)
  const getExperimentResults = useCallback(async () => {
    if (!state.activeExperimentId) return;
    
    // Don't refetch if we already have results
    if (state.experimentResults && !state.isLoadingResults) {
      console.log("[TrainingContext] Already have results, not fetching again");
      return;
    }
    
    setState(prev => ({ ...prev, isLoadingResults: true }));
    console.log("[TrainingContext] Fetching experiment results for", state.activeExperimentId);

    try {
      // Use the correct endpoint for full experiment results
      const results = await trainingApi.getExperimentResults(state.activeExperimentId);

      if (results) {
        console.log("[TrainingContext] Successfully fetched experiment results");
        
        // Handle 'success' status from API by mapping it to 'completed'
        let resultStatus = results.status;
        if (resultStatus === 'success') {
          resultStatus = 'completed';
        }
        
        setState(prev => ({ 
          ...prev, 
          experimentResults: results, 
          isLoadingResults: false, 
          error: null,
          experimentStatus: resultStatus as ExperimentStatus,
          isTraining: false // Make sure to set isTraining to false when results are retrieved
        }));
      } else {
        console.log("[TrainingContext] No results returned from API");
        setState(prev => ({ ...prev, isLoadingResults: false }));
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to fetch experiment results';
      console.error("[TrainingContext] Error fetching results:", errorMessage);
      setState(prev => ({ 
        ...prev, 
        error: errorMessage, 
        isLoadingResults: false,
        experimentStatus: 'failed',
        isTraining: false
      }));
      toast({
        title: "Error Fetching Results",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [state.activeExperimentId, state.experimentResults, state.isLoadingResults, toast]);

  const handlePollingSuccess = useCallback(async (experimentId: string) => {
    setState(prev => ({
      ...prev,
      statusResponse: {
        status: 'completed',
        hasTrainingResults: true
      },
      experimentStatus: 'completed',
      isTraining: false // Make sure to set isTraining to false when completed
    }));
    
    toast({
      title: "Training Complete",
      description: "Your model has finished training successfully!"
    });
    
    // Automatically fetch results when training completes
    try {
      getExperimentResults();
    } catch (error) {
      console.error("[TrainingContext] Error fetching results after successful training:", error);
    }
  }, [toast, getExperimentResults]);

  const handlePollingError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      error,
      isLoadingResults: false,
      isTraining: false,
      statusResponse: {
        status: 'failed',
        hasTrainingResults: false,
        error_message: error
      },
      experimentStatus: 'failed'
    }));
    
    toast({
      title: "Training Error",
      description: error,
      variant: "destructive"
    });
  }, [toast]);

  // Define polling hooks before they're used in other functions
  const { startPolling, stopPolling } = useExperimentPolling({
    onSuccess: handlePollingSuccess,
    onError: handlePollingError,
    setExperimentStatus: (status) => setState(prev => ({ ...prev, experimentStatus: status })),
    setIsLoading: (loading) => setState(prev => ({ ...prev, isLoadingResults: loading }))
  });

  // Enhanced experiment restoration with improved logging and error handling
  useEffect(() => {
    const restoreExperiment = async () => {
      try {
        const savedExperimentId = localStorage.getItem(EXPERIMENT_STORAGE_KEY);
        const savedTrainingType = localStorage.getItem(EXPERIMENT_TYPE_STORAGE_KEY) as 'automl' | 'custom' | null;
        
        if (savedExperimentId) {
          console.log("[TrainingContext] Restored experiment ID from storage:", savedExperimentId);
          
          // First update state with basic info we have from storage
          setState(prev => ({
            ...prev,
            activeExperimentId: savedExperimentId,
            lastTrainingType: savedTrainingType,
            experimentStatus: 'processing', // Start with processing status until we know more
            isLoadingResults: true
          }));
          
          // Then check the actual experiment status from the API
          try {
            console.log("[TrainingContext] Checking status of restored experiment");
            const statusResponse = await checkStatus(savedExperimentId);
            const status = statusResponse.data;
            console.log("[TrainingContext] Retrieved status for restored experiment:", status);
            
            // Map backend status to our internal status type
            let mappedStatus: ExperimentStatus = status.status as ExperimentStatus;
            
            // If backend returns 'success', map it to our 'completed' status
            if (mappedStatus === 'success' || mappedStatus === 'completed') {
              mappedStatus = 'completed';
            }
            
            // Update with the actual status
            setState(prev => ({
              ...prev,
              experimentStatus: mappedStatus,
              statusResponse: status,
              isLoadingResults: false,
              // If experiment is still running or processing, we want to set isTraining to true
              isTraining: ['running', 'processing'].includes(mappedStatus)
            }));
            
            // If the experiment is still in progress, restart polling
            if (['running', 'processing'].includes(mappedStatus)) {
              console.log("[TrainingContext] Experiment still in progress, restarting polling");
              startPolling(savedExperimentId);
            } 
            // If it's completed, fetch results
            else if (mappedStatus === 'completed') {
              console.log("[TrainingContext] Experiment completed, fetching results");
              getExperimentResults();
            }
          } catch (error) {
            console.error("[TrainingContext] Error checking status of restored experiment:", error);
            // If there's an error checking status, assume it's completed to prevent blocking the UI
            setState(prev => ({
              ...prev,
              experimentStatus: 'completed',
              isLoadingResults: false
            }));
            
            // Show toast to inform user
            toast({
              title: "Error checking experiment status",
              description: "Could not verify the current experiment status. Showing cached data instead.",
              variant: "destructive"
            });
          }
        }
      } catch (error) {
        console.error("[TrainingContext] Error restoring experiment from localStorage:", error);
      }
    };
    
    restoreExperiment();
  }, [toast, startPolling, getExperimentResults]);

  // Now define checkLastExperiment after all its dependencies are defined
  const checkLastExperiment = useCallback(async () => {
    // Skip if we already have an active experiment or are already checking
    if (state.activeExperimentId || state.isCheckingLastExperiment) {
      console.log("[TrainingContext] Already have an active experiment or checking, skipping last experiment lookup");
      return;
    }

    try {
      console.log("[TrainingContext] Checking for most recent experiment");
      
      setState(prev => ({
        ...prev,
        isCheckingLastExperiment: true
      }));
      
      // Get the latest experiment from the API
      const latestExperiment = await trainingApi.getLastExperiment();
      
      if (!latestExperiment) {
        console.log("[TrainingContext] No recent experiments found");
        setState(prev => ({ ...prev, isCheckingLastExperiment: false }));
        return;
      }
      
      console.log("[TrainingContext] Found recent experiment:", latestExperiment);
      
      // Update state with the latest experiment
      const experimentId = latestExperiment.id;
      
      // First update with basic info
      setState(prev => ({
        ...prev,
        activeExperimentId: experimentId,
        experimentStatus: 'processing',
        lastTrainingType: latestExperiment.automl_engine ? 'automl' : 'custom',
        isLoadingResults: true
      }));
      
      // Save to localStorage for persistence between page refreshes
      localStorage.setItem(EXPERIMENT_STORAGE_KEY, experimentId);
      localStorage.setItem(EXPERIMENT_TYPE_STORAGE_KEY, latestExperiment.automl_engine ? 'automl' : 'custom');
      
      // Then check the actual status
      const statusResponse = await checkStatus(experimentId);
      const status = statusResponse.data;
      
      // Map backend status to our internal status type
      let mappedStatus: ExperimentStatus = status.status as ExperimentStatus;
      
      // If backend returns 'success', map it to our 'completed' status
      if (mappedStatus === 'success' || mappedStatus === 'completed') {
        mappedStatus = 'completed';
      }
      
      // Update with the actual status
      setState(prev => ({
        ...prev,
        experimentStatus: mappedStatus,
        statusResponse: status,
        isLoadingResults: false,
        isCheckingLastExperiment: false,
        // If experiment is still running, we want to set isTraining to true
        isTraining: ['running', 'processing'].includes(mappedStatus)
      }));
      
      // If has results and is completed, fetch them right away
      if (status.hasTrainingResults && mappedStatus === 'completed') {
        console.log("[TrainingContext] Latest experiment has results, fetching them");
        getExperimentResults();
      }
      
      // If still running, start polling
      if (['running', 'processing'].includes(mappedStatus)) {
        console.log("[TrainingContext] Latest experiment still in progress, starting polling");
        startPolling(experimentId);
        
        // Show toast to inform user
        toast({
          title: "Experiment in progress",
          description: "We found an experiment in progress and resumed monitoring it for you.",
        });
      }
    } catch (error) {
      console.error("[TrainingContext] Error checking for most recent experiment:", error);
      setState(prev => ({ ...prev, isCheckingLastExperiment: false }));
    }
  }, [state.activeExperimentId, state.isCheckingLastExperiment, toast, startPolling, getExperimentResults]);

  useEffect(() => {
    try {
      if (state.activeExperimentId) {
        localStorage.setItem(EXPERIMENT_STORAGE_KEY, state.activeExperimentId);
        if (state.lastTrainingType) {
          localStorage.setItem(EXPERIMENT_TYPE_STORAGE_KEY, state.lastTrainingType);
        }
      } else {
        localStorage.removeItem(EXPERIMENT_STORAGE_KEY);
        localStorage.removeItem(EXPERIMENT_TYPE_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Error saving experiment data to localStorage:", error);
    }
  }, [state.activeExperimentId, state.lastTrainingType]);

  // Effect to fetch results when status indicates they're ready
  useEffect(() => {
    if (state.statusResponse?.hasTrainingResults === true && 
        state.activeExperimentId && 
        !state.experimentResults && 
        !state.isLoadingResults) {
      console.log("[TrainingContext] Status indicates results are ready, fetching them now");
      getExperimentResults();
    }
  }, [state.statusResponse, state.activeExperimentId, state.experimentResults, state.isLoadingResults, getExperimentResults]);

  const contextValue: TrainingContextValue = {
    ...state,
    setIsTraining: (isTraining) => setState(prev => ({ ...prev, isTraining })),
    setLastTrainingType: (type) => setState(prev => ({ ...prev, lastTrainingType: type })),
    setAutomlParameters: (params) => setState(prev => ({ ...prev, automlParameters: { ...prev.automlParameters, ...params } })),
    setCustomParameters: (params) => setState(prev => ({ ...prev, customParameters: { ...prev.customParameters, ...params } })),
    setAutomlResult: (result) => setState(prev => ({ ...prev, automlResult: result })),
    setCustomResult: (result) => setState(prev => ({ ...prev, customResult: result })),
    setError: (error) => setState(prev => ({ ...prev, error })),
    setActiveExperimentId: (id) => setState(prev => ({ ...prev, activeExperimentId: id })),
    setExperimentResults: (results) => setState(prev => ({ ...prev, experimentResults: results })),
    setIsLoadingResults: (isLoading) => setState(prev => ({ ...prev, isLoadingResults: isLoading })),
    setExperimentStatus: (status) => setState(prev => ({ ...prev, experimentStatus: status })),
    setStatusResponse: (response) => setState(prev => ({ ...prev, statusResponse: response })),
    setAutomlEngine: (engine) => setState(prev => ({ ...prev, automlEngine: engine })),
    setTestSize: (size) => setState(prev => ({ ...prev, testSize: size })),
    setStratify: (stratify) => setState(prev => ({ ...prev, stratify })),
    setRandomSeed: (seed) => setState(prev => ({ ...prev, randomSeed: seed })),
    setActiveTab: (tab) => setState(prev => ({ ...prev, activeTab: tab })),
    checkLastExperiment,
    resetTrainingState: () => {
      setState({
        isTraining: false,
        lastTrainingType: null,
        automlParameters: defaultAutomlParameters,
        customParameters: defaultCustomParameters,
        automlResult: null,
        customResult: null,
        error: null,
        activeExperimentId: null,
        experimentResults: null,
        isLoadingResults: false,
        experimentStatus: 'idle',
        statusResponse: null,
        automlEngine: defaultAutomlParameters.automlEngine,
        testSize: defaultAutomlParameters.testSize,
        stratify: defaultAutomlParameters.stratify,
        randomSeed: defaultAutomlParameters.randomSeed,
        activeTab: 'automl',
        isCheckingLastExperiment: false,
      });
      localStorage.removeItem(EXPERIMENT_STORAGE_KEY);
      localStorage.removeItem(EXPERIMENT_TYPE_STORAGE_KEY);
      stopPolling(); // Make sure to stop any active polling
    },
    clearExperimentResults: () => {
      setState(prev => ({
        ...prev,
        experimentResults: null,
        activeExperimentId: null,
        statusResponse: null
      }));
      localStorage.removeItem(EXPERIMENT_STORAGE_KEY);
      localStorage.removeItem(EXPERIMENT_TYPE_STORAGE_KEY);
      stopPolling(); // Make sure to stop any active polling
    },
    getExperimentResults,
    startPolling,
    stopPolling,
  };

  return (
    <TrainingContext.Provider value={contextValue}>
      {children}
    </TrainingContext.Provider>
  );
};

export const useTraining = (): TrainingContextValue => {
  const context = useContext(TrainingContext);
  if (context === undefined) {
    throw new Error('useTraining must be used within a TrainingProvider');
  }
  return context;
};
