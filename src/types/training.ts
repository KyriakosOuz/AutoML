export type TrainingEngine = 'mljar' | 'autokeras';
export type TaskType = 'binary_classification' | 'multiclass_classification' | 'regression';

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

export interface ExperimentResults {
  status: 'running' | 'completed' | 'failed';
  error_message?: string;
  experiment_id: string;
  experiment_name?: string;
  task_type: string;
  target_column?: string;
  metrics?: Record<string, number>;
  model_path?: string;
  completed_at?: string;
  training_time_sec?: number;
  files?: Array<{
    file_type: string;
    file_url: string;
  }>;
  model_file_url?: string;
  report_file_url?: string;
  training_results?: any;
  algorithm?: string;
  model_format?: string;
  leaderboard?: any[];
  selected_algorithm?: string;
  columns_to_keep?: string[];
  hyperparameters?: Record<string, any>;
  message?: string;
}
