
export type TaskType = 'binary_classification' | 'multiclass_classification' | 'regression';

export type TrainingEngine = 'mljar' | 'h2o';

export interface ExperimentResults {
  metrics: Record<string, any>;
  model_path: string;
  completed_at: string;
  training_time_sec: number;
  selected_algorithm?: string;
  model_format?: string;
  leaderboard?: any[];
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
