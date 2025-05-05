
import { 
  AutoMLParameters, 
  CustomTrainingParameters, 
  AutoMLResult, 
  CustomTrainingResult, 
  ExperimentResults, 
  TrainingEngine,
  ExperimentStatusResponse 
} from '@/types/training';

// Update the experiment status type to include 'processed' explicitly
export type ExperimentStatus = 'idle' | 'processing' | 'running' | 'completed' | 'failed' | 'success';

export interface TrainingContextState {
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
  experimentStatus: ExperimentStatus;
  statusResponse: ExperimentStatusResponse | null;
  automlEngine: TrainingEngine;
  testSize: number;
  stratify: boolean;
  randomSeed: number;
  activeTab: string;
}

export interface TrainingContextValue extends TrainingContextState {
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
  setExperimentStatus: (status: ExperimentStatus) => void;
  setStatusResponse: (response: ExperimentStatusResponse | null) => void;
  setActiveTab: (tab: string) => void;
}
