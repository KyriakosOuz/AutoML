
// Add this to your existing training.d.ts file
// If the file doesn't exist, create it

export type ExperimentStatus = 'processing' | 'running' | 'completed' | 'failed' | 'success';

export interface ModelLeaderboardEntry {
  name: string;
  metrics: Record<string, number>;
  training_time_sec?: number;
}

export interface ExperimentResults {
  experimentId?: string;
  experiment_id?: string;
  experiment_name?: string;
  status?: ExperimentStatus;
  task_type?: string;
  target_column?: string;
  created_at?: string;
  completed_at?: string;
  error_message?: string;
  training_time_sec?: number;
  metrics?: Record<string, any>;
  files?: Array<{
    file_type: string;
    file_url: string;
  }>;
  algorithm?: string;
  algorithm_choice?: string;
  model_format?: string;
  model_file_url?: string;
  report_file_url?: string;
  hyperparameters?: Record<string, any>;
  message?: string;
  automl_engine?: string;
  class_labels?: string[];
  training_type?: 'automl' | 'custom';
  model_display_name?: string;
  training_results?: {
    metrics?: Record<string, any>;
    classification_report?: any;
    confusion_matrix?: any;
    y_true?: any[];
    y_pred?: any[];
    y_probs?: any[];
  };
  leaderboard?: ModelLeaderboardEntry[];
  leaderboard_csv?: string;
  columns_to_keep?: string[];
}
