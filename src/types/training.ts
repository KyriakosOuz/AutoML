
export type HyperParameter = string | number | boolean | number[];

export interface HyperParameters {
  [key: string]: HyperParameter;
}

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
}
