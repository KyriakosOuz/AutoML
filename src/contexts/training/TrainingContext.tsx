import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { trainingApi } from '@/lib/api';
import { ExperimentResults } from '@/types/training';
import { TrainingContextValue, TrainingContextState, ExperimentStatus } from './types';
import { EXPERIMENT_STORAGE_KEY, EXPERIMENT_TYPE_STORAGE_KEY, defaultAutomlParameters, defaultCustomParameters } from './constants';
import { useExperimentPolling } from './useExperimentPolling';

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
    experimentStatus: 'processing',
    automlEngine: defaultAutomlParameters.automlEngine,
    testSize: defaultAutomlParameters.testSize,
    stratify: defaultAutomlParameters.stratify,
    randomSeed: defaultAutomlParameters.randomSeed,
  });

  useEffect(() => {
    try {
      const savedExperimentId = localStorage.getItem(EXPERIMENT_STORAGE_KEY);
      const savedTrainingType = localStorage.getItem(EXPERIMENT_TYPE_STORAGE_KEY) as 'automl' | 'custom' | null;
      
      if (savedExperimentId) {
        console.log("Restored experiment ID from storage:", savedExperimentId);
        setState(prev => ({
          ...prev,
          activeExperimentId: savedExperimentId,
          lastTrainingType: savedTrainingType
        }));
      }
    } catch (error) {
      console.error("Error loading experiment data from localStorage:", error);
    }
  }, []);

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

  const handlePollingSuccess = React.useCallback(async (experimentId: string) => {
    setState(prev => ({
      ...prev,
      isLoadingResults: true
    }));
    try {
      const results = await trainingApi.getExperimentResults(experimentId);
      if (results) {
        setState(prev => ({
          ...prev,
          experimentResults: results,
          isLoadingResults: false,
          isTraining: false,
          error: null,
        }));

        toast({
          title: "Training Complete",
          description: "Your model has finished training successfully!"
        });
        return;
      } else {
        setState(prev => ({
          ...prev,
          isLoadingResults: false
        }));
        return;
      }
    } catch (error) {
      const errMsg =
        error instanceof Error
          ? error.message
          : 'Failed to fetch results after training completion (server not ready)';
      setState(prev => ({
        ...prev,
        error: errMsg,
        isLoadingResults: false,
        isTraining: false
      }));

      toast({
        title: "Error Fetching Results",
        description: errMsg,
        variant: "destructive"
      });
      return;
    }
  }, [toast]);

  const handlePollingError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      error,
      isLoadingResults: false,
      isTraining: false
    }));
    
    toast({
      title: "Training Error",
      description: error,
      variant: "destructive"
    });
  }, [toast]);

  const { startPolling, stopPolling } = useExperimentPolling({
    onSuccess: handlePollingSuccess,
    onError: handlePollingError,
    setExperimentStatus: (status) => setState(prev => ({ ...prev, experimentStatus: status })),
    setIsLoading: (loading) => setState(prev => ({ ...prev, isLoadingResults: loading }))
  });

  const getExperimentResults = React.useCallback(async () => {
    if (!state.activeExperimentId) return;
    setState(prev => ({ ...prev, isLoadingResults: true }));

    try {
      const results = await trainingApi.getExperimentResults(state.activeExperimentId);

      if (results) {
        setState(prev => ({ ...prev, experimentResults: results, isLoadingResults: false, error: null }));
      } else {
        setState(prev => ({ ...prev, isLoadingResults: false }));
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to fetch experiment results';
      setState(prev => ({ ...prev, error: errorMessage, isLoadingResults: false }));
      toast({
        title: "Error Fetching Results",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [state.activeExperimentId, toast]);

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
    setAutomlEngine: (engine) => setState(prev => ({ ...prev, automlEngine: engine })),
    setTestSize: (size) => setState(prev => ({ ...prev, testSize: size })),
    setStratify: (stratify) => setState(prev => ({ ...prev, stratify })),
    setRandomSeed: (seed) => setState(prev => ({ ...prev, randomSeed: seed })),
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
        experimentStatus: 'processing',
        automlEngine: defaultAutomlParameters.automlEngine,
        testSize: defaultAutomlParameters.testSize,
        stratify: defaultAutomlParameters.stratify,
        randomSeed: defaultAutomlParameters.randomSeed,
      });
      localStorage.removeItem(EXPERIMENT_STORAGE_KEY);
      localStorage.removeItem(EXPERIMENT_TYPE_STORAGE_KEY);
    },
    clearExperimentResults: () => {
      setState(prev => ({
        ...prev,
        experimentResults: null,
        activeExperimentId: null
      }));
      localStorage.removeItem(EXPERIMENT_STORAGE_KEY);
      localStorage.removeItem(EXPERIMENT_TYPE_STORAGE_KEY);
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
