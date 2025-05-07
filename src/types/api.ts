
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
      f1?: number; // Added this field for AutoML engines
      precision?: number;
      recall?: number;
      r2?: number;
      mae?: number;
      mse?: number;
      rmse?: number;
    };
    target_column: string;
    auto_train: boolean; 
    training_type?: 'automl' | 'custom';  // Added this field
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
  training_type?: 'automl' | 'custom';  // Added this field
  metrics: {
    accuracy?: number;
    f1_score?: number;
    f1?: number; // Added this field for AutoML engines
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
  auto_train?: boolean;
}

interface ExperimentSearchParams {
  engine?: string;
  task_type?: string;
  limit?: number;
  offset?: number;
  auto_train?: boolean;
  search?: string;
  metric_name?: string;
  metric_threshold?: number;
}

export type { 
  ApiResponse, 
  ExperimentStatusResponse, 
  ExperimentSearchParams,
  ExperimentListResponse,
  ExperimentDetailResponse
};
