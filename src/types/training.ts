export type TrainingEngine = 'mljar' | 'autokeras' | 'h2o';
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
  file_name?: string;
  created_at: string;
}

export interface TrainingResults {
  metrics?: Record<string, any>;
  y_true?: number[] | string[];
  y_pred?: number[] | string[];
  y_probs?: number[][] | number[];
  classification_report?: string | Record<string, any>;
  confusion_matrix?: number[][];
  shap_values?: any;
  fpr?: number[];
  tpr?: number[];
  auc?: number;
  precision?: number[];
  recall?: number[];
  f1_score?: number[];
}

export interface ExperimentResults {
  id?: string;
  experimentId: string;
  experiment_id?: string;
  experiment_name: string;
  status: ExperimentStatus;
  task_type?: string;
  target_column?: string;
  created_at: string;
  completed_at?: string;
  error_message?: string;
  training_results?: TrainingResults;
  training_time_sec?: number;
  metrics?: Record<string, any>;
  files?: TrainingFile[];
  algorithm?: string;
  model_format?: string;
  model_file_url?: string;
  report_file_url?: string;
  leaderboard?: any[];
  selected_algorithm?: string;
  columns_to_keep?: string[];
  hyperparameters?: Record<string, any>;
  message?: string;
  automl_engine?: string;
  class_labels?: string[];
}

export interface ExperimentStatusResponse {
  status: ExperimentStatus;
  hasTrainingResults: boolean;
  message?: string;
  error_message?: string;
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

export interface PredictionResult {
  prediction: string | number;
  probability?: number | number[];
}

export interface BatchPredictionResult {
  metrics?: Record<string, number>;
  preview?: Record<string, any>[];
}

// Prediction types
export interface ManualPredictionRequest {
  experiment_id: string;
  input_values: Record<string, any>;
}

export interface ManualPredictionResponse {
  prediction: string | number;
  probability?: number | number[];
  class_probabilities?: Record<string, number>;
}

export interface BatchPredictionRequest {
  experiment_id: string;
  file: File;
}

export interface BatchPredictionResponseEvaluation {
  mode: 'evaluation';
  metrics: Record<string, number>;
  y_true: Array<string | number>;
  y_pred: Array<string | number>;
  confusion_matrix?: number[][];
}

export interface BatchPredictionResponsePrediction {
  mode: 'prediction_only';
  filled_dataset_preview: Record<string, any>[];
  predictions?: Array<string | number>;
  download_url?: string;
}

export type BatchPredictionResponse = BatchPredictionResponseEvaluation | BatchPredictionResponsePrediction;
