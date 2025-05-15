import { ExperimentResults, ExperimentStatusResponse, TrainingEngine, ExperimentStatus } from '@/types/training';

export type AutoMLParameters = {
  automlEngine: TrainingEngine;
  testSize: number;
  stratify: boolean;
  randomSeed: number;
};

export type CustomParameters = {
  algorithm: string;
  useDefaultHyperparameters: boolean;
  hyperparameters: Record<string, unknown>;
  testSize: number;
  stratify: boolean;
  randomSeed: number;
  enableVisualization: boolean;
};

// Add new type for submitted training parameters
export interface SubmittedTrainingParameters {
  engine: TrainingEngine | null;
  preset: string | null;
  experimentName: string;
  testSize: number;
  stratify: boolean;
  randomSeed: number;
}

export interface TrainingContextState {
  isTraining: boolean;
  isSubmitting: boolean;
  isPredicting: boolean;
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
  activeTab: 'automl' | 'custom';
  isCheckingLastExperiment: boolean;
  resultsLoaded: boolean;
  experimentName: string | null;
  submittedParameters: SubmittedTrainingParameters | null; // New state for submitted parameters
}

export interface TrainingContextValue extends TrainingContextState {
  setIsTraining: (isTraining: boolean) => void;
  setIsPredicting: (isPredicting: boolean) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
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
  setAutomlEngine: (engine: TrainingEngine) => void;
  setTestSize: (size: number) => void;
  setStratify: (stratify: boolean) => void;
  setRandomSeed: (seed: number) => void;
  setActiveTab: (tab: 'automl' | 'custom') => void;
  setResultsLoaded: (loaded: boolean) => void;
  setExperimentName: (name: string | null) => void;
  setSubmittedParameters: (params: SubmittedTrainingParameters | null) => void; // New setter
  resetTrainingState: () => void;
  clearExperimentResults: () => void;
  getExperimentResults: () => Promise<void>;
  startPolling: (experimentId: string) => void;
  stopPolling: () => void;
  checkLastExperiment: () => Promise<void>;
}
