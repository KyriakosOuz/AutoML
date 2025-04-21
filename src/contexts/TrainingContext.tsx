
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { 
  TrainingEngine, 
  TaskType, 
  AutoMLParameters, 
  CustomTrainingParameters, 
  AutoMLResult, 
  CustomTrainingResult,
  ExperimentResults
} from '@/types/training';
import { useToast } from '@/hooks/use-toast';
import { trainingApi } from '@/lib/api';

// Define localStorage keys
const EXPERIMENT_STORAGE_KEY = 'last_experiment_id';
const EXPERIMENT_TYPE_STORAGE_KEY = 'last_training_type';

export interface TrainingContextProps {
  // Training state
  isTraining: boolean;
  lastTrainingType: 'automl' | 'custom' | null;
  automlParameters: AutoMLParameters;
  customParameters: CustomTrainingParameters;
  automlResult: AutoMLResult | null;
  customResult: CustomTrainingResult | null;
  error: string | null;
  
  // Experiment tracking
  activeExperimentId: string | null;
  experimentResults: ExperimentResults | null;
  isLoadingResults: boolean;
  
  // AutoML specific parameters
  automlEngine: TrainingEngine;
  testSize: number;
  stratify: boolean;
  randomSeed: number;
  
  // Methods
  setIsTraining: (isTraining: boolean) => void;
  setLastTrainingType: (type: 'automl' | 'custom' | null) => void;
  setAutomlParameters: (params: Partial<AutoMLParameters>) => void;
  setCustomParameters: (params: Partial<CustomTrainingParameters>) => void;
  setAutomlResult: (result: AutoMLResult | null) => void;
  setCustomResult: (result: CustomTrainingResult | null) => void;
  setError: (error: string | null) => void;
  resetTrainingState: () => void;
  
  // Experiment management
  setActiveExperimentId: (id: string | null) => void;
  clearExperimentResults: () => void;
  getExperimentResults: () => void;
  
  // AutoML specific setters
  setAutomlEngine: (engine: TrainingEngine) => void;
  setTestSize: (size: number) => void;
  setStratify: (stratify: boolean) => void;
  setRandomSeed: (seed: number) => void;
}

// Default parameter values
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

// Create context
const TrainingContext = createContext<TrainingContextProps | undefined>(undefined);

// Provider component
export const TrainingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  
  // Initialize state
  const [isTraining, setIsTraining] = useState(false);
  const [lastTrainingType, setLastTrainingType] = useState<'automl' | 'custom' | null>(null);
  const [automlParameters, setAutomlParametersState] = useState<AutoMLParameters>(defaultAutomlParameters);
  const [customParameters, setCustomParametersState] = useState<CustomTrainingParameters>(defaultCustomParameters);
  const [automlResult, setAutomlResult] = useState<AutoMLResult | null>(null);
  const [customResult, setCustomResult] = useState<CustomTrainingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Experiment tracking state
  const [activeExperimentId, setActiveExperimentId] = useState<string | null>(null);
  const [experimentResults, setExperimentResults] = useState<ExperimentResults | null>(null);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  
  // Load saved experiment ID from localStorage on initial mount
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
  
  // Save experiment ID to localStorage whenever it changes
  useEffect(() => {
    try {
      if (activeExperimentId) {
        localStorage.setItem(EXPERIMENT_STORAGE_KEY, activeExperimentId);
        
        if (lastTrainingType) {
          localStorage.setItem(EXPERIMENT_TYPE_STORAGE_KEY, lastTrainingType);
        }
      } else {
        // Clear if null to prevent stale data
        localStorage.removeItem(EXPERIMENT_STORAGE_KEY);
        localStorage.removeItem(EXPERIMENT_TYPE_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Error saving experiment data to localStorage:", error);
    }
  }, [activeExperimentId, lastTrainingType]);
  
  // Poll for experiment results when activeExperimentId changes
  useEffect(() => {
    let pollTimeout: number | null = null;
    let pollInterval: number | null = null;
    const MAX_FETCH_ATTEMPTS = 80; // ~6.6 minutes with 5-second intervals
    
    const pollResults = async () => {
      // Validate experiment ID
      if (!activeExperimentId || activeExperimentId.length < 20) {
        console.warn("⚠️ Invalid or missing experimentId for polling:", activeExperimentId);
        if (pollInterval) {
          window.clearInterval(pollInterval);
        }
        return;
      }
      
      console.log(`🧠 Polling experiment ID (attempt ${pollingAttempts + 1}/${MAX_FETCH_ATTEMPTS}):`, activeExperimentId);
      
      try {
        setIsLoadingResults(true);
        const results = await trainingApi.getExperimentResults(activeExperimentId);
        const status = results?.status;
        
        console.log(`[Polling] Attempt ${pollingAttempts + 1}: Status = ${status}`);
        
        if (status === 'completed') {
          // Success! We have results
          setExperimentResults(results);
          setIsLoadingResults(false);
          
          // Update the appropriate result based on training type
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
          
          // Clear polling
          if (pollInterval) {
            window.clearInterval(pollInterval);
          }
          
          // Show success toast
          toast({
            title: "Training Completed",
            description: `Model training ${results.experiment_name ? `for ${results.experiment_name}` : ''} completed successfully.`,
          });
          
          setPollingAttempts(0);
        } else if (status === 'failed') {
          // Training failed
          setIsLoadingResults(false);
          setError(results?.training_results?.error_message || "The training process failed.");
          
          toast({
            title: "Training Failed",
            description: results?.training_results?.error_message || "The training process failed.",
            variant: "destructive"
          });
          
          if (pollInterval) {
            window.clearInterval(pollInterval);
          }
          
          setPollingAttempts(0);
        } else {
          // Still running, increment attempts counter
          setPollingAttempts(prev => prev + 1);
          
          if (pollingAttempts >= MAX_FETCH_ATTEMPTS) {
            toast({
              title: "Timeout",
              description: "Training is taking longer than expected. Please check later.",
              variant: "destructive"
            });
            
            if (pollInterval) {
              window.clearInterval(pollInterval);
            }
            
            setIsLoadingResults(false);
            setPollingAttempts(0);
          }
        }
      } catch (error: any) {
        console.error('Error polling experiment results:', error);
        
        // If we get a 404, it means the processing hasn't finished yet, this is normal
        if (error.message && error.message.includes('404')) {
          console.log('Training still in progress (404 response)');
        } else {
          // For other errors, increment attempts
          setPollingAttempts(prev => prev + 1);
        }
        
        if (pollingAttempts >= MAX_FETCH_ATTEMPTS) {
          toast({
            title: "Polling Failed",
            description: "Failed to retrieve training results after multiple attempts.",
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
    
    // Start polling if we have an active experiment ID and no results yet
    if (activeExperimentId && !experimentResults) {
      setIsLoadingResults(true);
      
      // Add a 3-second initial delay before starting to poll
      console.log("🕒 Scheduling initial poll with 3-second delay for ID:", activeExperimentId);
      
      // Clear any existing timeout/interval to prevent duplicates
      if (pollTimeout) {
        window.clearTimeout(pollTimeout);
      }
      if (pollInterval) {
        window.clearInterval(pollInterval);
      }
      
      // Set initial delay before first poll
      pollTimeout = window.setTimeout(() => {
        console.log("🚀 Starting first poll after delay for ID:", activeExperimentId);
        
        // Initial poll after delay
        pollResults();
        
        // Then poll at intervals
        pollInterval = window.setInterval(pollResults, 5000); // Poll every 5 seconds
      }, 3000); // 3 second initial delay
    }
    
    // Cleanup function
    return () => {
      if (pollTimeout) {
        window.clearTimeout(pollTimeout);
      }
      if (pollInterval) {
        window.clearInterval(pollInterval);
      }
    };
  }, [activeExperimentId, experimentResults, pollingAttempts, lastTrainingType, automlParameters, toast]);
  
  // Helper functions for individual parameter updates
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
  
  // Manual experiment result fetching function
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
  
  // Clear experiment results
  const clearExperimentResults = () => {
    setExperimentResults(null);
    setActiveExperimentId(null);
    localStorage.removeItem(EXPERIMENT_STORAGE_KEY);
    localStorage.removeItem(EXPERIMENT_TYPE_STORAGE_KEY);
  };
  
  // Helper functions
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
    
    // Clear localStorage
    localStorage.removeItem(EXPERIMENT_STORAGE_KEY);
    localStorage.removeItem(EXPERIMENT_TYPE_STORAGE_KEY);
  };
  
  // Context value
  const contextValue: TrainingContextProps = {
    isTraining,
    lastTrainingType,
    automlParameters,
    customParameters,
    automlResult,
    customResult,
    error,
    
    // Experiment tracking
    activeExperimentId,
    experimentResults,
    isLoadingResults,
    
    // Add automl specific parameters
    automlEngine: automlParameters.automlEngine,
    testSize: automlParameters.testSize,
    stratify: automlParameters.stratify,
    randomSeed: automlParameters.randomSeed,
    
    // Methods
    setIsTraining,
    setLastTrainingType,
    setAutomlParameters,
    setCustomParameters,
    setAutomlResult,
    setCustomResult,
    setError,
    resetTrainingState,
    
    // Experiment management
    setActiveExperimentId,
    clearExperimentResults,
    getExperimentResults,
    
    // Add automl specific setters
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

// Custom hook to use the training context
export const useTraining = (): TrainingContextProps => {
  const context = useContext(TrainingContext);
  if (context === undefined) {
    throw new Error('useTraining must be used within a TrainingProvider');
  }
  return context;
};
