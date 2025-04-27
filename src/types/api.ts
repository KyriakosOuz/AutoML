
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
    };
    target_column: string;
    auto_tune: boolean;
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

interface ExperimentSearchParams {
  engine?: string;
  task_type?: string;
  limit?: number;
  offset?: number;
}

export type { 
  ApiResponse, 
  ExperimentStatusResponse, 
  ExperimentSearchParams,
  ExperimentListResponse 
};
