import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { trainingApi } from '@/lib/api';

import { 
  TrainingEngine, 
  TaskType,
  AutoMLParameters,
  CustomTrainingParameters,
  AutoMLResult,
  CustomTrainingResult,
  ExperimentResults,
  ExperimentStatus as TypeExperimentStatus
} from '@/types/training';

// Local storage keys
const EXPERIMENT_STORAGE_KEY = 'activeExperimentId';
const EXPERIMENT_TYPE_STORAGE_KEY = 'experimentType';

export type ExperimentStatus = 'processing' | 'running' | 'completed' | 'failed' | 'success';

export interface TrainingContextProps {
  isTraining: boolean;
  lastTrainingType: 'automl' | 'custom' | null;
  automlParameters: AutoMLParameters;
  customParameters: CustomTrainingParameters;
  automlResult: AutoMLResult | null;
  customResult: CustomTrainingResult | null;
  error: string | null;
  
  activeExperimentId: string | null;
  experimentResults: ExperimentResults | null;
  isLoadingResults: boolean;
  
  automlEngine: TrainingEngine;
  testSize: number;
  stratify: boolean;
  randomSeed: number;
  
  experimentStatus: ExperimentStatus;
  setExperimentStatus: (status: ExperimentStatus) => void;
  
  setIsTraining: (isTraining: boolean) => void;
  setLastTrainingType: (type: 'automl' | 'custom' | null) => void;
  setAutomlParameters: (params: Partial<AutoMLParameters>) => void;
  setCustomParameters: (params: Partial<CustomTrainingParameters>) => void;
  setAutomlResult: (result: AutoMLResult | null) => void;
  setCustomResult: (result: CustomTrainingResult | null) => void;
  setError: (error: string | null) => void;
  resetTrainingState: () => void;
  
  setActiveExperimentId: (id: string | null) => void;
  setExperimentResults: (results: ExperimentResults | null) => void;
  setIsLoadingResults: (isLoading: boolean) => void;
  clearExperimentResults: () => void;
  getExperimentResults: () => void;
  
  setAutomlEngine: (engine: TrainingEngine) => void;
  setTestSize: (size: number) => void;
  setStratify: (stratify: boolean) => void;
  setRandomSeed: (seed: number) => void;
  
  startPolling: (experimentId: string) => void;
  stopPolling: () => void;
}

const defaultAutomlParameters: AutoMLParameters = {
  automlEngine: 'mljar',
  testSize: 0.2,
  stratify: true,
  randomSeed: 42,
};

const defaultCustomParameters: CustomTrainingParameters = {
  algorithm: '',
  hyperparameters: {},
  testSize: 0.2,
  stratify: true,
  randomSeed: 42,
  enableAnalytics: true,
  useDefaultHyperparameters: true,
  enableVisualization: true
};

const TrainingContext = createContext<TrainingContextProps | undefined>(undefined);
const POLL_INTERVAL = 3000; // 3 seconds
const MAX_POLL_ATTEMPTS = 120; // 6 minutes

export const TrainingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  
  const [isTraining, setIsTraining] = useState(false);
  const [lastTrainingType, setLastTrainingType] = useState<'automl' | 'custom' | null>(null);
  const [automlParameters, setAutomlParametersState] = useState<AutoMLParameters>(defaultAutomlParameters);
  const [customParameters, setCustomParametersState] = useState<CustomTrainingParameters>(defaultCustomParameters);
  const [automlResult, setAutomlResult] = useState<AutoMLResult | null>(null);
  const [customResult, setCustomResult] = useState<CustomTrainingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [activeExperimentId, setActiveExperimentId] = useState<string | null>(null);
  const [experimentResults, setExperimentResults] = useState<ExperimentResults | null>(null);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [experimentStatus, setExperimentStatus] = useState<ExperimentStatus>('processing');

  useEffect(() => {
    try {
      const savedExperimentId = localStorage.getItem(EXPERIMENT_STORAGE_KEY);
      const savedTrainingType = localStorage.getItem(EXPERIMENT_TYPE_STORAGE_KEY) as 'automl' | 'custom' | null;
      
      if (savedExperimentId) {
        console.log("Restored experiment ID from storage:", savedExperimentId);
        setActiveExperimentId(savedExperimentId);
        
        if (savedTrainingType) {
          setLastTrainingType(savedTrainingType);
        }
      }
    } catch (error) {
      console.error("Error loading experiment data from localStorage:", error);
    }
  }, []);
  
  useEffect(() => {
    try {
      if (activeExperimentId) {
        localStorage.setItem(EXPERIMENT_STORAGE_KEY, activeExperimentId);
        
        if (lastTrainingType) {
          localStorage.setItem(EXPERIMENT_TYPE_STORAGE_KEY, lastTrainingType);
        }
      } else {
        localStorage.removeItem(EXPERIMENT_STORAGE_KEY);
        localStorage.removeItem(EXPERIMENT_TYPE_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Error saving experiment data to localStorage:", error);
    }
  }, [activeExperimentId, lastTrainingType]);

  const startPolling = async (experimentId: string) => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    console.log('[TrainingContext] Starting polling for experiment:', experimentId);
    setIsLoadingResults(true);
    setActiveExperimentId(experimentId);
    setPollingAttempts(0);
    setExperimentStatus('processing');

    toast({
      title: "Training in Progress",
      description: "Your model training has started. Please wait while we process your request."
    });

    const interval = setInterval(async () => {
      try {
        const statusResponse = await trainingApi.checkStatus(experimentId);
        console.log('[TrainingContext] Status response:', {
          status: statusResponse.status,
          experimentId,
          response: statusResponse
        });
        
        setExperimentStatus(statusResponse.status as ExperimentStatus);
        
        if (statusResponse.status === 'completed' || statusResponse.status === 'success') {
          console.log('[TrainingContext] Training completed successfully');
          stopPolling();
          
          try {
            const results = await trainingApi.getExperimentResults(experimentId);
            console.log('[TrainingContext] Retrieved results:', results);
            setExperimentResults(results);
            setIsLoadingResults(false);
            setIsTraining(false);
            
            toast({
              title: "Training Complete",
              description: "Your model has finished training successfully!"
            });
          } catch (resultError) {
            console.error('[TrainingContext] Error fetching results:', resultError);
            setError(resultError instanceof Error ? resultError.message : 'Failed to fetch results');
            setIsLoadingResults(false);
            setIsTraining(false);
            
            toast({
              title: "Error Fetching Results",
              description: resultError instanceof Error ? resultError.message : 'Failed to fetch experiment results',
              variant: "destructive"
            });
          }
        } else if (statusResponse.status === 'failed') {
          console.error('[TrainingContext] Training failed');
          stopPolling();
          try {
            const results = await trainingApi.getExperimentResults(experimentId);
            console.error('[TrainingContext] Error details:', results.error_message);
            setError(results.error_message || 'Training failed');
            setExperimentResults(results);
            setIsLoadingResults(false);
            setIsTraining(false);
            
            toast({
              title: "Training Failed",
              description: results.error_message || 'An error occurred during training',
              variant: "destructive"
            });
          } catch (resultError) {
            console.error('[TrainingContext] Error fetching failure details:', resultError);
            setError('Training failed and could not fetch error details');
            setIsLoadingResults(false);
            setIsTraining(false);
            
            toast({
              title: "Training Failed",
              description: 'An error occurred during training',
              variant: "destructive"
            });
          }
        } else if (pollingAttempts >= MAX_POLL_ATTEMPTS) {
          console.warn('[TrainingContext] Reached maximum polling attempts');
          stopPolling();
          setError('Timeout while waiting for training completion');
          setIsLoadingResults(false);
          setIsTraining(false);
          
          toast({
            title: "Training Timeout",
            description: "The training process is taking longer than expected. Check back later.",
            variant: "destructive"
          });
        } else {
          setPollingAttempts(prev => prev + 1);
        }
      } catch (error) {
        console.error('[TrainingContext] Polling error:', error);
        if (pollingAttempts >= MAX_POLL_ATTEMPTS) {
          setExperimentStatus('failed');
          setError('Failed to check experiment status after multiple attempts');
          stopPolling();
          setIsLoadingResults(false);
          setIsTraining(false);
          
          toast({
            title: "Connection Error",
            description: "Failed to connect to the server after multiple attempts",
            variant: "destructive"
          });
        } else {
          setPollingAttempts(prev => prev + 1);
        }
      }
    }, POLL_INTERVAL);

    setPollingInterval(interval);
  };

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  const setAutomlEngine = (engine: TrainingEngine) => {
    setAutomlParametersState(prev => ({ ...prev, automlEngine: engine }));
  };
  
  const setTestSize = (size: number) => {
    setAutomlParametersState(prev => ({ ...prev, testSize: size }));
  };
  
  const setStratify = (stratify: boolean) => {
    setAutomlParametersState(prev => ({ ...prev, stratify }));
  };
  
  const setRandomSeed = (seed: number) => {
    setAutomlParametersState(prev => ({ ...prev, randomSeed: seed }));
  };
  
  const getExperimentResults = async () => {
    if (!activeExperimentId) return;
    
    try {
      setIsLoadingResults(true);
      const results = await trainingApi.getExperimentResults(activeExperimentId);
      setExperimentResults(results);
      setIsLoadingResults(false);
    } catch (error) {
      console.error('Error fetching experiment results:', error);
      setError('Failed to fetch experiment results');
      setIsLoadingResults(false);
      
      toast({
        title: "Error Fetching Results",
        description: error instanceof Error ? error.message : 'Failed to fetch experiment results',
        variant: "destructive"
      });
    }
  };
  
  const clearExperimentResults = () => {
    setExperimentResults(null);
    setActiveExperimentId(null);
    localStorage.removeItem(EXPERIMENT_STORAGE_KEY);
    localStorage.removeItem(EXPERIMENT_TYPE_STORAGE_KEY);
  };
  
  const setAutomlParameters = (params: Partial<AutoMLParameters>) => {
    setAutomlParametersState(prev => ({ ...prev, ...params }));
  };
  
  const setCustomParameters = (params: Partial<CustomTrainingParameters>) => {
    setCustomParametersState(prev => ({ ...prev, ...params }));
  };
  
  const resetTrainingState = () => {
    setIsTraining(false);
    setLastTrainingType(null);
    setAutomlParametersState(defaultAutomlParameters);
    setCustomParametersState(defaultCustomParameters);
    setAutomlResult(null);
    setCustomResult(null);
    setError(null);
    setExperimentResults(null);
    setActiveExperimentId(null);
    setIsLoadingResults(false);
    setPollingAttempts(0);
    
    localStorage.removeItem(EXPERIMENT_STORAGE_KEY);
    localStorage.removeItem(EXPERIMENT_TYPE_STORAGE_KEY);
  };
  
  const contextValue: TrainingContextProps = {
    isTraining,
    lastTrainingType,
    automlParameters,
    customParameters,
    automlResult,
    customResult,
    error,
    
    activeExperimentId,
    experimentResults,
    isLoadingResults,
    
    automlEngine: automlParameters.automlEngine,
    testSize: automlParameters.testSize,
    stratify: automlParameters.stratify,
    randomSeed: automlParameters.randomSeed,
    
    experimentStatus,
    setExperimentStatus,
    
    setIsTraining,
    setLastTrainingType,
    setAutomlParameters,
    setCustomParameters,
    setAutomlResult,
    setCustomResult,
    setError,
    resetTrainingState,
    
    setActiveExperimentId,
    setExperimentResults,
    setIsLoadingResults,
    clearExperimentResults,
    getExperimentResults,
    
    setAutomlEngine,
    setTestSize,
    setStratify,
    setRandomSeed,
    
    startPolling,
    stopPolling,
  };
  
  return (
    <TrainingContext.Provider value={contextValue}>
      {children}
    </TrainingContext.Provider>
  );
};

export const useTraining = (): TrainingContextProps => {
  const context = useContext(TrainingContext);
  if (context === undefined) {
    throw new Error('useTraining must be used within a TrainingProvider');
  }
  return context;
};
