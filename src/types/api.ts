
interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data: T;
}

interface ExperimentStatusResponse {
  experiment_id: string;
  status: 'running' | 'completed' | 'failed';
  error_message: string | null;
  completed_at: string | null;
  hasTrainingResults: boolean;
}

export type { ApiResponse, ExperimentStatusResponse };
