
interface ApiResponse<T = any> {
  status?: string;
  message?: string;
  data: {
    datasets?: T[];
    experiments?: T[];
    comparisons?: T[];
  } | T;
}

interface ExperimentStatusResponse {
  experiment_id: string;
  status: 'running' | 'completed' | 'failed' | 'success';
  error_message: string | null;
  completed_at: string | null;
  hasTrainingResults: boolean;
}

export type { ApiResponse, ExperimentStatusResponse };
