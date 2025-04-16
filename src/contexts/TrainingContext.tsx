
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types
export type TrainingEngine = 'mljar' | 'h2o';
export type Algorithm = string;
export type TaskType = 'binary_classification' | 'multiclass_classification' | 'regression';

export interface TrainingParameters {
  testSize: number;
  stratify: boolean;
  randomSeed: number;
}

export interface AutoMLParameters extends TrainingParameters {
  automlEngine: TrainingEngine;
}

export interface CustomTrainingParameters extends TrainingParameters {
  algorithm: Algorithm;
  hyperparameters: Record<string, any>;
  enableAnalytics: boolean;
}

export interface Metrics {
  [key: string]: number;
}

export interface TrainingResult {
  experimentId: string;
  taskType: TaskType;
  target: string;
  metrics: Metrics;
  modelPath: string;
  completedAt: string;
  trainingTimeSec: number;
}

export interface AutoMLResult extends TrainingResult {
  engine: TrainingEngine;
  leaderboard?: Array<{
    model: string;
    metric_value: number;
    training_time: number;
  }>;
}

export interface CustomTrainingResult extends TrainingResult {
  selectedAlgorithm: Algorithm;
  modelFormat: string;
}

export interface TrainingContextProps {
  // Training state
  isTraining: boolean;
  lastTrainingType: 'automl' | 'custom' | null;
  automlParameters: AutoMLParameters;
  customParameters: CustomTrainingParameters;
  automlResult: AutoMLResult | null;
  customResult: CustomTrainingResult | null;
  error: string | null;
  
  // Methods
  setIsTraining: (isTraining: boolean) => void;
  setLastTrainingType: (type: 'automl' | 'custom' | null) => void;
  setAutomlParameters: (params: Partial<AutoMLParameters>) => void;
  setCustomParameters: (params: Partial<CustomTrainingParameters>) => void;
  setAutomlResult: (result: AutoMLResult | null) => void;
  setCustomResult: (result: CustomTrainingResult | null) => void;
  setError: (error: string | null) => void;
  resetTrainingState: () => void;
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
};

// Create context
const TrainingContext = createContext<TrainingContextProps | undefined>(undefined);

// Provider component
export const TrainingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state
  const [isTraining, setIsTraining] = useState(false);
  const [lastTrainingType, setLastTrainingType] = useState<'automl' | 'custom' | null>(null);
  const [automlParameters, setAutomlParametersState] = useState<AutoMLParameters>(defaultAutomlParameters);
  const [customParameters, setCustomParametersState] = useState<CustomTrainingParameters>(defaultCustomParameters);
  const [automlResult, setAutomlResult] = useState<AutoMLResult | null>(null);
  const [customResult, setCustomResult] = useState<CustomTrainingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
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
    
    setIsTraining,
    setLastTrainingType,
    setAutomlParameters,
    setCustomParameters,
    setAutomlResult,
    setCustomResult,
    setError,
    resetTrainingState,
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
