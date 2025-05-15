
import { ExperimentResults, Metric } from '@/types/training';
import { TrainingEngine } from '@/types/training';

// Export ExperimentStatus to fix import errors elsewhere
export type ExperimentStatus = 'idle' | 'processing' | 'running' | 'completed' | 'failed';

export interface AutoMLParameters {
  automlEngine: TrainingEngine;
  testSize: number;
  stratify: boolean;
  randomSeed: number;
}

export interface HyperParameter {
  type: 'number' | 'boolean' | 'string' | 'array';
  value: number | boolean | string | (number | string)[];
  options?: (number | string | boolean)[];
  range?: [number, number];
  step?: number;
}

export interface HyperParameters {
  [key: string]: HyperParameter;
}

export interface CustomParameters {
  algorithm: string;
  useDefaultHyperparameters: boolean;
  hyperparameters: HyperParameters;
  testSize: number;
  stratify: boolean;
  randomSeed: number;
  enableVisualization: boolean;
}

// Define the SubmittedTrainingParameters interface
export interface SubmittedTrainingParameters {
  engine: TrainingEngine;
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
  statusResponse: { status: string; hasTrainingResults?: boolean; error_message?: string } | null;
  automlEngine: TrainingEngine;
  testSize: number;
  stratify: boolean;
  randomSeed: number;
  activeTab: 'automl' | 'custom';
  isCheckingLastExperiment: boolean;
  resultsLoaded: boolean;
  experimentName: string | null;
  submittedParameters: SubmittedTrainingParameters | null;
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
  setStatusResponse: (response: { status: string; hasTrainingResults?: boolean } | null) => void;
  setAutomlEngine: (engine: TrainingEngine) => void;
  setTestSize: (size: number) => void;
  setStratify: (stratify: boolean) => void;
  setRandomSeed: (seed: number) => void;
  setActiveTab: (tab: 'automl' | 'custom') => void;
  setResultsLoaded: (loaded: boolean) => void;
  setExperimentName: (name: string | null) => void;
  setSubmittedParameters: (params: SubmittedTrainingParameters | null) => void;
  resetTrainingState: () => void;
  clearExperimentResults: () => void;
  getExperimentResults: () => Promise<void>;
  startPolling: (experimentId: string) => void;
  stopPolling: () => void;
  checkLastExperiment: () => Promise<void>;
}
