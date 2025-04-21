
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
  
  const MAX_POLL_ATTEMPTS = 30; // ~2.5 minutes with 5-second intervals
  
  useEffect(() => {
    try {
      const savedExperimentId = localStorage.getItem(EXPERIMENT_STORAGE_KEY);
      const savedTrainingType = localStorage.getItem(EXPERIMENT_TYPE_STORAGE_KEY) as 'automl' | 'custom' | null;
      
      if (savedExperimentId) {
        console.log("📋 Restored experiment ID from storage:", savedExperimentId);
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
    let pollTimeout: number | null = null;
    let pollInterval: number | null = null;
    
    const pollResults = async () => {
      if (!activeExperimentId || activeExperimentId.length < 20) {
        console.warn("⚠️ Invalid or missing experimentId for polling:", activeExperimentId);
        if (pollInterval) {
          window.clearInterval(pollInterval);
        }
        return;
      }
      
      console.log(`🧠 Polling experiment ID (attempt ${pollingAttempts + 1}/${MAX_POLL_ATTEMPTS}):`, activeExperimentId);
      
      try {
        setIsLoadingResults(true);
        const results = await trainingApi.getExperimentResults(activeExperimentId);
        const status = results?.status as ExperimentStatus;
        
        console.log(`[Polling] Attempt ${pollingAttempts + 1}: Status = ${status}`);
        
        switch (status) {
          case 'completed':
            setExperimentResults(results);
            setIsLoadingResults(false);
            
            if (lastTrainingType === 'automl') {
              setAutomlResult({
                experimentId: activeExperimentId,
                engine: automlParameters.automlEngine,
                taskType: results.task_type as TaskType,
                target: results.target_column || '',
                metrics: results.metrics || {},
                modelPath: results.model_path || '',
                completedAt: results.completed_at || '',
                trainingTimeSec: results.training_time_sec || 0,
                leaderboard: results.leaderboard || [],
                selectedAlgorithm: results.selected_algorithm || '',
              });
            } else if (lastTrainingType === 'custom') {
              setCustomResult({
                experimentId: activeExperimentId,
                taskType: results.task_type as TaskType,
                target: results.target_column || '',
                metrics: results.metrics || {},
                modelPath: results.model_path || '',
                completedAt: results.completed_at || '',
                trainingTimeSec: results.training_time_sec || 0,
                selectedAlgorithm: results.algorithm || '',
                modelFormat: results.model_format || '',
                experimentName: results.experiment_name || '',
              });
            }
            
            if (pollInterval) {
              window.clearInterval(pollInterval);
            }
            
            toast({
              title: "Training Completed",
              description: `Model training ${results.experiment_name ? `for ${results.experiment_name}` : ''} completed successfully.`,
            });
            
            setPollingAttempts(0);
            break;
            
          case 'failed':
            setIsLoadingResults(false);
            const errorMessage = results?.error_message || "The training process failed.";
            setError(errorMessage);
            
            toast({
              title: "Training Failed",
              description: errorMessage,
              variant: "destructive"
            });
            
            if (pollInterval) {
              window.clearInterval(pollInterval);
            }
            
            setPollingAttempts(0);
            break;
            
          case 'running':
            setPollingAttempts(prev => prev + 1);
            
            if (pollingAttempts >= MAX_POLL_ATTEMPTS) {
              toast({
                title: "Training Timeout",
                description: "Training took too long. Please try again later.",
                variant: "destructive"
              });
              
              if (pollInterval) {
                window.clearInterval(pollInterval);
              }
              
              setIsLoadingResults(false);
              setPollingAttempts(0);
            }
            break;
            
          default:
            console.warn("Unknown status received:", status);
        }
      } catch (error: any) {
        console.error('Error polling experiment results:', error);
        
        if (error.message && error.message.includes('404')) {
          console.log('Training still in progress (404 response)');
          setPollingAttempts(prev => prev + 1);
          
          if (pollingAttempts >= MAX_POLL_ATTEMPTS) {
            toast({
              title: "Training Timeout",
              description: "Training took too long. Please try again later.",
              variant: "destructive"
            });
            
            if (pollInterval) {
              window.clearInterval(pollInterval);
            }
            
            setIsLoadingResults(false);
            setPollingAttempts(0);
          }
        } else {
          toast({
            title: "Error",
            description: error.message || "Failed to retrieve training results.",
            variant: "destructive"
          });
          
          if (pollInterval) {
            window.clearInterval(pollInterval);
          }
          
          setIsLoadingResults(false);
          setPollingAttempts(0);
        }
      }
    };
    
    if (activeExperimentId && !experimentResults) {
      setIsLoadingResults(true);
      
      console.log("🕒 Scheduling initial poll with 3-second delay for ID:", activeExperimentId);
      
      if (pollTimeout) {
        window.clearTimeout(pollTimeout);
      }
      if (pollInterval) {
        window.clearInterval(pollInterval);
      }
      
      pollTimeout = window.setTimeout(() => {
        console.log("🚀 Starting first poll after delay for ID:", activeExperimentId);
        
        pollResults();
        
        pollInterval = window.setInterval(pollResults, 5000);
      }, 3000);
    }
    
    return () => {
      if (pollTimeout) {
        window.clearTimeout(pollTimeout);
      }
      if (pollInterval) {
        window.clearInterval(pollInterval);
      }
    };
  }, [activeExperimentId, experimentResults, pollingAttempts, lastTrainingType, automlParameters, toast]);
  
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
