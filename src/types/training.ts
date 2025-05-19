
// If this file doesn't exist, I'll create it with the necessary types
export type ExperimentStatus = 'running' | 'completed' | 'failed' | 'success' | 'processing';

export interface PerClassMetric {
  precision?: number;
  recall?: number;
  f1_score?: number;
  'f1-score'?: number;  // Alternative naming
  support?: number;
}

export interface FileInfo {
  file_url: string;
  file_type: string;
  file_name?: string;
  created_at: string;
  curve_subtype?: string;
  visualization_group?: string;
}

export interface VisualizationFile {
  file_url: string;
  curve_subtype?: string;
  created_at: string;
  visualization_group?: string;
  file_name?: string;
}

export interface GroupedVisualizations {
  [groupName: string]: VisualizationFile[];
}

export interface ExperimentResults {
  experiment_name?: string;
  experiment_id?: string;
  task_type?: string;
  target_column?: string;
  columns_to_keep?: string[];
  status?: ExperimentStatus;
  metrics?: Record<string, any>;
  algorithm?: string;
  per_class_metrics?: Record<string, PerClassMetric>;
  model_display_name?: string;
  files?: FileInfo[];
  completed_at?: string;
  training_time_sec?: number;
  model_file_url?: string;
  report_file_url?: string;
  error_message?: string;
  hyperparameters?: Record<string, any>;
  training_type?: string;
  automl_engine?: string;
  visualizations_grouped?: GroupedVisualizations;
  pdp_ice_metadata?: any[];
  training_results?: {
    y_true?: any[];
    y_pred?: any[];
    y_probs?: any[];
    metrics?: Record<string, any>;
  };
  visualizations_by_type?: Record<string, any[]>;
}
