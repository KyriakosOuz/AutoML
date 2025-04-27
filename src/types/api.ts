
interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data: T;
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

export type { ApiResponse, ExperimentStatusResponse, ExperimentSearchParams };
