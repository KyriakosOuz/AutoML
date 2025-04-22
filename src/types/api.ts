
interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data: T;
}

interface ExperimentStatusResponse {
  experimentId: string;
  status: string;
  hasTrainingResults: boolean;
  error_message?: string;
}

export type { ApiResponse, ExperimentStatusResponse };
