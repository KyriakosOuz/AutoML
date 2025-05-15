
import { ExperimentResults, ExperimentStatusResponse } from '@/types/training';

export type ExperimentStatus = 'idle' | 'processing' | 'running' | 'completed' | 'success' | 'failed' | 'error';

export interface AutoMLParameters {
  automlEngine: string;
  testSize: number;
  stratify: boolean;
  randomSeed: number;
}

export interface CustomParameters {
  algorithm: string;
  // Add missing properties that are being used in CustomTraining.tsx
  useDefaultHyperparameters: boolean;
  hyperparameters: Record<string, any>;
  testSize: number;
  stratify: boolean;
  randomSeed: number;
  enableVisualization: boolean;
}

export interface TrainingContextState {
  isTraining: boolean;
  isSubmitting: boolean;
  isPredicting: boolean; // Add isPredicting state
  lastTrainingType: 'automl' | 'custom' | null;
  automlParameters: AutoMLParameters;
  customParameters: CustomParameters;
  automlResult: any | null;
  customResult: any | null;
  error: string | null;
  activeExperimentId: string | null;
  experimentResults: ExperimentResults | null;
  isLoadingResults: boolean;
  experimentStatus: ExperimentStatus;
  statusResponse: ExperimentStatusResponse | null;
  automlEngine: string;
  testSize: number;
  stratify: boolean;
  randomSeed: number;
  activeTab: 'automl' | 'custom' | 'results' | 'predict';
  isCheckingLastExperiment: boolean;
  resultsLoaded: boolean;
  experimentName: string | null;
}

export interface TrainingContextValue extends TrainingContextState {
  setIsTraining: (isTraining: boolean) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  setIsPredicting: (isPredicting: boolean) => void; // Add setter for isPredicting
  setLastTrainingType: (type: 'automl' | 'custom' | null) => void;
  setAutomlParameters: (params: Partial<AutoMLParameters>) => void;
  setCustomParameters: (params: Partial<CustomParameters>) => void;
  setAutomlResult: (result: any) => void;
  setCustomResult: (result: any) => void;
  setError: (error: string | null) => void;
  setActiveExperimentId: (id: string | null) => void;
  setExperimentResults: (results: ExperimentResults | null) => void;
  setIsLoadingResults: (isLoading: boolean) => void;
  setExperimentStatus: (status: ExperimentStatus) => void;
  setStatusResponse: (response: ExperimentStatusResponse | null) => void;
  setAutomlEngine: (engine: string) => void;
  setTestSize: (size: number) => void;
  setStratify: (stratify: boolean) => void;
  setRandomSeed: (seed: number) => void;
  setActiveTab: (tab: 'automl' | 'custom' | 'results' | 'predict') => void;
  resetTrainingState: () => void;
  clearExperimentResults: () => void;
  setResultsLoaded: (loaded: boolean) => void;
  setExperimentName: (name: string | null) => void;
  getExperimentResults: () => Promise<void>;
  startPolling: (experimentId: string) => void;
  stopPolling: () => void;
  checkLastExperiment: () => Promise<void>;
}
