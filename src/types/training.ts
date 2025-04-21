
export type TaskType = 'binary_classification' | 'multiclass_classification' | 'regression';

export type TrainingEngine = 'mljar' | 'h2o';

export interface Algorithm {
  name: string;
  description: string;
  supportedTasks: TaskType[];
}

export interface HyperParameter {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'select';
  default: any;
  description?: string;
  options?: string[] | number[];
  min?: number;
  max?: number;
  step?: number;
}

export interface HyperParameters {
  [key: string]: any;
}

export interface Metrics {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1_score?: number;
  r2_score?: number;
  mae?: number;
  mse?: number;
  rmse?: number;
  classification_report?: any;
  [key: string]: any;
}

export interface TrainingParameters {
  testSize: number;
  stratify: boolean;
  randomSeed: number;
}

export interface AutoMLParameters extends TrainingParameters {
  automlEngine: TrainingEngine;
}

export interface CustomTrainingParameters extends TrainingParameters {
  algorithm: string;
  hyperparameters: HyperParameters;
  useDefaultHyperparameters: boolean;
  enableAnalytics: boolean;
  enableVisualization: boolean;
}

export interface ExperimentResults {
  id?: string;
  experiment_name?: string;
  target_column?: string;
  task_type?: string;
  metrics: Record<string, any>;
  model_path: string;
  completed_at: string;
  training_time_sec: number;
  selected_algorithm?: string;
  model_format?: string;
  leaderboard?: any[];
  files?: any[];
  algorithm?: string;
  [key: string]: any;
}

export interface AutoMLResult {
  experimentId: string;
  engine: TrainingEngine;
  taskType: TaskType;
  target: string;
  metrics: Record<string, any>;
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
  metrics: Record<string, any>;
  modelPath: string;
  completedAt: string;
  trainingTimeSec: number;
  selectedAlgorithm: string;
  modelFormat: string;
  experimentName: string;
}
