import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { 
  TrainingEngine, 
  TaskType,
  AutoMLParameters,
  CustomTrainingParameters,
  AutoMLResult,
  CustomTrainingResult,
  ExperimentResults,
  ExperimentStatus
} from '@/types/training';
import { useToast } from '@/hooks/use-toast';
import { trainingApi } from '@/lib/api';

const EXPERIMENT_STORAGE_KEY = 'last_experiment_id';
const EXPERIMENT_TYPE_STORAGE_KEY = 'last_training_type';

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
  
  setIsTraining: (isTraining: boolean) => void;
  setLastTrainingType: (type: 'automl' | 'custom' | null) => void;
  setAutomlParameters: (params: Partial<AutoMLParameters>) => void;
  setCustomParameters: (params: Partial<CustomTrainingParameters>) => void;
  setAutomlResult: (result: AutoMLResult | null) => void;
  setCustomResult: (result: CustomTrainingResult | null) => void;
  setError: (error: string | null) => void;
  resetTrainingState: () => void;
  
  setActiveExperimentId: (id: string | null) => void;
  clearExperimentResults: () => void;
  getExperimentResults: () => void;
  
  setAutomlEngine: (engine: TrainingEngine) => void;
  setTestSize: (size: number) => void;
  setStratify: (stratify: boolean) => void;
  setRandomSeed: (seed: number) => void;
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
const POLL_INTERVAL = 5000; // 5 seconds
const MAX_POLL_ATTEMPTS = 30; // ~2.5 minutes

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
  const [pollingAttempts, setPollingAttempts] = useState(0);
  
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

  useEffect(() => {
    let pollTimeout: NodeJS.Timeout | null = null;
    
    const pollResults = async () => {
      if (!activeExperimentId) {
        return;
      }
      
      try {
        const results = await trainingApi.getExperimentResults(activeExperimentId);
        
        if (results.status === 'failed') {
          setExperimentResults(results);
          setError(results.error_message || 'The experiment failed without a specific error message.');
          setIsLoadingResults(false);
          toast({
            title: "Training Failed",
            description: `⚠️ Experiment failed: ${results.error_message || 'Unknown error'}`,
            variant: "destructive"
          });
          return; // Stop polling on failure
        }
        
        if (results.status === 'completed' || results.status === 'success') {
          setExperimentResults(results);
          setIsLoadingResults(false);
          toast({
            title: "Training Completed",
            description: `Model training ${results.experiment_name ? `for ${results.experiment_name}` : ''} completed successfully.`
          });
          return; // Stop polling on completion
        }
        
        // Continue polling for 'running' status
        if (results.status === 'running') {
          setPollingAttempts(prev => {
            if (prev >= MAX_POLL_ATTEMPTS) {
              setError('Training timeout: The experiment took too long to complete.');
              setIsLoadingResults(false);
              toast({
                title: "Training Timeout",
                description: "The experiment took too long to complete. Please check the status later.",
                variant: "destructive"
              });
              return prev;
            }
            return prev + 1;
          });
          
          pollTimeout = setTimeout(pollResults, POLL_INTERVAL);
        }
        
      } catch (error: any) {
        if (error.message && error.message.includes('404')) {
          // Experiment not yet created - continue polling
          toast({
            title: "Waiting",
            description: "Waiting for experiment to start...",
          });
          pollTimeout = setTimeout(pollResults, POLL_INTERVAL);
        } else {
          setError(error.message || 'Failed to fetch experiment results');
          setIsLoadingResults(false);
          toast({
            title: "Error",
            description: error.message || 'Failed to fetch experiment results',
            variant: "destructive"
          });
        }
      }
    };
    
    if (activeExperimentId && !experimentResults) {
      setIsLoadingResults(true);
      pollTimeout = setTimeout(pollResults, 1000); // Start polling after 1 second
    }
    
    return () => {
      if (pollTimeout) {
        clearTimeout(pollTimeout);
      }
    };
  }, [activeExperimentId, experimentResults, toast]);
  
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
    
    setIsTraining,
    setLastTrainingType,
    setAutomlParameters,
    setCustomParameters,
    setAutomlResult,
    setCustomResult,
    setError,
    resetTrainingState,
    
    setActiveExperimentId,
    clearExperimentResults,
    getExperimentResults,
    
    setAutomlEngine,
    setTestSize,
    setStratify,
    setRandomSeed,
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
