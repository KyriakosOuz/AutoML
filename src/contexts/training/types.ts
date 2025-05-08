
import { ExperimentResults } from '@/types/training';

export type TrainingEngine = 'mljar' | 'autokeras' | 'h2o' | 'h2o_automl';
export type ExperimentStatus = 'running' | 'completed' | 'failed' | 'success' | 'processing' | 'idle';
export type TrainingTab = 'automl' | 'custom' | 'results' | 'predict';

export interface AutoMLParameters {
  automlEngine: TrainingEngine;
  testSize: number;
  stratify: boolean;
  randomSeed: number;
}

export interface CustomParameters {
  algorithm: string;
  hyperparameters: Record<string, any>;
  testSize: number;
  stratify: boolean;
  randomSeed: number;
  enableAnalytics?: boolean;
  useDefaultHyperparameters?: boolean;
  enableVisualization?: boolean;
}

export interface ExperimentStatusResponse {
  status: ExperimentStatus;
  hasTrainingResults: boolean;
  message?: string;
  error_message?: string;
}

export interface TrainingContextState {
  isTraining: boolean;
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
  automlEngine: TrainingEngine;
  testSize: number;
  stratify: boolean;
  randomSeed: number;
  activeTab: TrainingTab;
  isCheckingLastExperiment: boolean;
  resultsLoaded: boolean; // Changed from optional to required boolean
  experimentName: string | null; // Added field for experiment name
}

export interface TrainingContextValue extends TrainingContextState {
  setIsTraining: (isTraining: boolean) => void;
  setLastTrainingType: (type: 'automl' | 'custom' | null) => void;
  setAutomlParameters: (params: Partial<AutoMLParameters>) => void;
  setCustomParameters: (params: Partial<CustomParameters>) => void;
  setAutomlResult: (result: any | null) => void;
  setCustomResult: (result: any | null) => void;
  setError: (error: string | null) => void;
  setActiveExperimentId: (id: string | null) => void;
  setExperimentResults: (results: ExperimentResults | null) => void;
  setIsLoadingResults: (isLoading: boolean) => void;
  setExperimentStatus: (status: ExperimentStatus) => void;
  setStatusResponse: (response: ExperimentStatusResponse | null) => void;
  setAutomlEngine: (engine: TrainingEngine) => void;
  setTestSize: (size: number) => void;
  setStratify: (stratify: boolean) => void;
  setRandomSeed: (seed: number) => void;
  setActiveTab: (tab: TrainingTab) => void;
  setResultsLoaded: (loaded: boolean) => void; // Make this required, not optional
  setExperimentName: (name: string) => void; // Added setter for experiment name
  resetTrainingState: () => void;
  clearExperimentResults: () => void;
  checkLastExperiment: () => void;
  getExperimentResults: () => void;
  startPolling: (experimentId: string) => void;
  stopPolling: () => void;
}
