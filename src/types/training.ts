
export type TrainingEngine = 'mljar' | 'autokeras';
export type TaskType = 'binary_classification' | 'multiclass_classification' | 'regression';
export type ExperimentStatus = 'running' | 'completed' | 'failed' | 'success' | 'processing';

export interface AutoMLParameters {
  automlEngine: TrainingEngine;
  testSize: number;
  stratify: boolean;
  randomSeed: number;
}

export interface CustomTrainingParameters {
  algorithm: string;
  hyperparameters: Record<string, any>;
  testSize: number;
  stratify: boolean;
  randomSeed: number;
  enableAnalytics: boolean;
  useDefaultHyperparameters: boolean;
  enableVisualization: boolean;
}

export type HyperParameter = string | number | boolean | string[] | number[];
export type HyperParameters = Record<string, HyperParameter>;

export interface TrainingFile {
  file_id: string;
  file_type: string;
  file_url: string;
  created_at: string;
}

export interface TrainingResults {
  metrics: Record<string, number>;
  y_true?: number[] | string[];
  y_pred?: number[] | string[];
  y_probs?: number[][];
}

export interface ExperimentResults {
  id: string;
  experiment_id?: string;
  experiment_name: string;
  status: ExperimentStatus;
  task_type?: string;
  target_column?: string;
  created_at: string;
  completed_at?: string;
  error_message?: string;
  training_results?: TrainingResults;
  files?: TrainingFile[];
  algorithm?: string;
  model_format?: string;
  leaderboard?: any[];
  selected_algorithm?: string;
  columns_to_keep?: string[];
  hyperparameters?: Record<string, any>;
  message?: string;
  automl_engine?: string;
}

export interface AutoMLResult {
  experimentId: string;
  engine: TrainingEngine;
  taskType: TaskType;
  target: string;
  metrics: Record<string, number>;
  modelPath: string;
  completedAt: string;
  trainingTimeSec: number;
  leaderboard: any[];
  selectedAlgorithm: string;
}

export interface CustomTrainingResult {
  experimentId: string;
  taskType: TaskType;
  target: string;
  metrics: Record<string, number>;
  modelPath: string;
  completedAt: string;
  trainingTimeSec: number;
  selectedAlgorithm: string;
  modelFormat: string;
  experimentName: string;
}
