

interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data: T;
}

interface ExperimentListResponse {
  results: Array<{
    id: string;
    experiment_name: string;
    created_at: string;
    task_type: string;
    algorithm_choice: string;
    status: string;
    metrics: {
      accuracy?: number;
      f1_score?: number;
      precision?: number;
      recall?: number;
      r2?: number;
      mae?: number;
      mse?: number;
      rmse?: number;
    };
    target_column: string;
    auto_train: boolean; // Updated: Changed from auto_tune to auto_train
    dataset_id: string;
    dataset_filename: string;
    has_model: boolean;
    error_message: string | null;
    automl_engine?: string;
  }>;
}

interface ExperimentStatusResponse {
  experiment_id: string;
  status: 'running' | 'completed' | 'failed' | 'success';
  error_message: string | null;
  completed_at: string | null;
  hasTrainingResults: boolean;
}

interface ExperimentDetailResponse {
  experimentId: string;
  experiment_id: string;
  experiment_name: string;
  status: string;
  hasTrainingResults: boolean;
  task_type: string;
  target_column: string;
  created_at: string;
  completed_at: string;
  error_message: string | null;
  training_time_sec?: number;
  metrics: {
    accuracy?: number;
    f1_score?: number;
    precision?: number;
    recall?: number;
    auc?: number;
    r2?: number;
    mae?: number;
    mse?: number;
    rmse?: number;
    classification_report?: any;
    confusion_matrix?: number[][];
    [key: string]: any;
  };
  files: Array<{
    file_id: string;
    file_type: string; 
    file_url: string;
    file_name?: string;
    created_at: string;
  }>;
  algorithm?: string;
  model_format?: string;
  hyperparameters?: Record<string, any>;
  class_labels?: string[];
  automl_engine?: string;
  auto_train?: boolean; // Added: field to indicate AutoML vs Custom
}

interface ExperimentSearchParams {
  engine?: string;
  task_type?: string;
  limit?: number;
  offset?: number;
  auto_train?: boolean; // Added: parameter to filter by experiment type
  search?: string; // Added: parameter to search by name
  metric_name?: string; // Added: parameter for metric filtering
  metric_threshold?: number; // Added: parameter for metric threshold
}

export type { 
  ApiResponse, 
  ExperimentStatusResponse, 
  ExperimentSearchParams,
  ExperimentListResponse,
  ExperimentDetailResponse
};
