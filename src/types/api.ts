
interface ApiResponse<T = any> {
  status?: string;
  message?: string;
  data?: T;
}

interface ExperimentStatusResponse {
  experiment_id: string;
  status: 'running' | 'completed' | 'failed' | 'success';
  error_message: string | null;
  completed_at: string | null;
  hasTrainingResults: boolean;
}

// Add more specific response types for the different endpoints
interface DatasetsResponse {
  datasets: Array<any>;
}

interface ExperimentsResponse {
  experiments: Array<any>;
}

interface ComparisonsResponse {
  comparisons: Array<any>;
}

export type { 
  ApiResponse, 
  ExperimentStatusResponse,
  DatasetsResponse,
  ExperimentsResponse,
  ComparisonsResponse
};
