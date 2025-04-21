
export type HyperParameter = string | number | boolean | number[];

export interface HyperParameters {
  [key: string]: HyperParameter;
}

export type TrainingEngine = 'mljar' | 'h2o' | 'custom';
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
  hyperparameters: HyperParameters;
  useDefaultHyperparameters: boolean; 
  enableAnalytics: boolean;
  enableVisualization: boolean;
}

export interface Metrics {
  [key: string]: any;
}

export interface TrainingResult {
  experimentId: string;
  taskType: TaskType;
  target: string;
  metrics: Metrics;
  modelPath: string;
  completedAt: string;
  trainingTimeSec: number;
  selectedAlgorithm: Algorithm;
  modelFormat?: string;
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
  files?: Array<{
    file_type: string;
    file_url: string;
  }>;
  experimentName?: string;
}

export interface ExperimentResults {
  id: string;
  experiment_name: string;
  target_column: string;
  task_type: TaskType;
  automl_engine: TrainingEngine;
  metrics: Metrics;
  files: Array<{
    file_type: string;
    file_url: string;
  }>;
  algorithm?: string;
}
