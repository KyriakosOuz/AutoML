
import React, { createContext, useState, useContext, useCallback } from 'react';
import { trainingApi } from '@/lib/api';
import { ExperimentResults } from '@/types/training';
import { ExperimentStatus } from './types';
import { CustomTrainingParameters, AutoMLParameters, TrainingEngine } from '@/types/training';

interface TrainingContextType {
  lastExperimentId: string | null;
  experimentResults: ExperimentResults | null;
  isLoadingLastExperiment: boolean;
  isLoadingResults: boolean;
  setExperimentResults: (results: ExperimentResults | null) => void;
  checkLastExperiment: () => Promise<void>;
  resetExperiment: () => void;
  
  // Add missing properties needed by components
  isTraining: boolean;
  setIsTraining: (isTraining: boolean) => void;
  activeExperimentId: string | null;
  setActiveExperimentId: (id: string | null) => void;
  experimentStatus: ExperimentStatus;
  setExperimentStatus: (status: ExperimentStatus) => void;
  customParameters: CustomTrainingParameters;
  setCustomParameters: (params: Partial<CustomTrainingParameters>) => void;
  automlEngine: TrainingEngine;
  setAutomlEngine: (engine: TrainingEngine) => void;
  testSize: number;
  setTestSize: (size: number) => void;
  stratify: boolean;
  setStratify: (stratify: boolean) => void;
  randomSeed: number;
  setRandomSeed: (seed: number) => void;
  setLastTrainingType: (type: 'automl' | 'custom' | null) => void;
  startPolling: (experimentId: string) => void;
  resetTrainingState: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  getExperimentResults: () => void;
  setError: (error: string | null) => void;
  error: string | null;
  automlResult: any | null;
  customResult: any | null;
}

const TrainingContext = createContext<TrainingContextType | undefined>(undefined);

interface TrainingProviderProps {
  children: React.ReactNode;
}

const initialState = {
  lastExperimentId: null,
  experimentResults: null,
  isLoadingLastExperiment: false,
  isLoadingResults: false,
  
  // Add initial values for the missing properties
  isTraining: false,
  activeExperimentId: null,
  experimentStatus: 'idle' as ExperimentStatus,
  customParameters: {
    algorithm: '',
    hyperparameters: {},
    testSize: 0.2,
    stratify: true,
    randomSeed: 42,
    enableAnalytics: false,
    useDefaultHyperparameters: true,
    enableVisualization: true
  },
  automlEngine: 'mljar' as TrainingEngine,
  testSize: 0.2,
  stratify: true,
  randomSeed: 42,
  activeTab: 'automl',
  error: null,
  automlResult: null,
  customResult: null
};

export const TrainingProvider: React.FC<TrainingProviderProps> = ({ children }) => {
  const [lastExperimentId, setLastExperimentId] = useState<string | null>(initialState.lastExperimentId);
  const [experimentResults, setExperimentResults] = useState<ExperimentResults | null>(initialState.experimentResults);
  const [isLoadingLastExperiment, setIsLoadingLastExperiment] = useState<boolean>(initialState.isLoadingLastExperiment);
  const [isLoadingResults, setIsLoadingResults] = useState<boolean>(initialState.isLoadingResults);
  
  // Add state for the missing properties
  const [isTraining, setIsTraining] = useState<boolean>(initialState.isTraining);
  const [activeExperimentId, setActiveExperimentId] = useState<string | null>(initialState.activeExperimentId);
  const [experimentStatus, setExperimentStatus] = useState<ExperimentStatus>(initialState.experimentStatus);
  const [customParameters, setCustomParametersState] = useState<CustomTrainingParameters>(initialState.customParameters);
  const [automlEngine, setAutomlEngine] = useState<TrainingEngine>(initialState.automlEngine);
  const [testSize, setTestSize] = useState<number>(initialState.testSize);
  const [stratify, setStratify] = useState<boolean>(initialState.stratify);
  const [randomSeed, setRandomSeed] = useState<number>(initialState.randomSeed);
  const [activeTab, setActiveTab] = useState<string>(initialState.activeTab);
  const [error, setError] = useState<string | null>(initialState.error);
  const [automlResult, setAutomlResult] = useState<any | null>(initialState.automlResult);
  const [customResult, setCustomResult] = useState<any | null>(initialState.customResult);
  const [lastTrainingType, setLastTrainingType] = useState<'automl' | 'custom' | null>(null);

  // Handle setting customParameters with partial updates
  const setCustomParameters = (params: Partial<CustomTrainingParameters>) => {
    setCustomParametersState(prev => ({
      ...prev,
      ...params
    }));
  };

  const checkLastExperiment = useCallback(async () => {
    // Add a check to prevent multiple calls if already loading
    if (isLoadingLastExperiment) return;
    
    try {
      setIsLoadingLastExperiment(true);
      console.log("[TrainingContext] Checking for last experiment");
      const response = await trainingApi.getLastExperiment();
      console.log("[TrainingContext] Last experiment response:", response);
      
      if (response && response.data && response.data.experimentId) {
        setLastExperimentId(response.data.experimentId);
        // Only set experiment results if we have them and they're not already set
        if (response.data.hasTrainingResults && (!experimentResults || experimentResults.experiment_id !== response.data.experimentId)) {
          setExperimentResults(response.data);
        }
      }
    } catch (error) {
      console.error("[TrainingContext] Error checking for last experiment:", error);
      // Don't set last experiment ID if there's an error
    } finally {
      setIsLoadingLastExperiment(false);
    }
  }, [isLoadingLastExperiment, experimentResults]);

  const resetExperiment = () => {
    setLastExperimentId(null);
    setExperimentResults(null);
  };

  // Add the missing functions
  const resetTrainingState = () => {
    setIsTraining(false);
    setActiveExperimentId(null);
    setExperimentStatus('idle');
    setExperimentResults(null);
    setError(null);
  };

  const startPolling = (experimentId: string) => {
    // This is a stub - actual polling logic would be implemented here
    setActiveExperimentId(experimentId);
    setExperimentStatus('processing');
    console.log(`[TrainingContext] Started polling for experiment ${experimentId}`);
  };

  const getExperimentResults = () => {
    // This is a stub - actual results fetching logic would be implemented here
    console.log("[TrainingContext] Fetching experiment results");
    setIsLoadingResults(true);
    // Simulate fetching
    setTimeout(() => {
      setIsLoadingResults(false);
      console.log("[TrainingContext] Finished fetching experiment results");
    }, 500);
  };

  const value: TrainingContextType = {
    lastExperimentId,
    experimentResults,
    isLoadingLastExperiment,
    isLoadingResults,
    setExperimentResults,
    checkLastExperiment,
    resetExperiment,
    
    // Add the missing properties
    isTraining,
    setIsTraining,
    activeExperimentId,
    setActiveExperimentId,
    experimentStatus,
    setExperimentStatus,
    customParameters,
    setCustomParameters,
    automlEngine,
    setAutomlEngine,
    testSize,
    setTestSize,
    stratify,
    setStratify,
    randomSeed,
    setRandomSeed,
    setLastTrainingType,
    startPolling,
    resetTrainingState,
    activeTab,
    setActiveTab,
    getExperimentResults,
    setError,
    error,
    automlResult,
    customResult
  };

  return (
    <TrainingContext.Provider value={value}>
      {children}
    </TrainingContext.Provider>
  );
};

export const useTraining = (): TrainingContextType => {
  const context = useContext(TrainingContext);
  if (context === undefined) {
    throw new Error("useTraining must be used within a TrainingProvider");
  }
  return context;
};
