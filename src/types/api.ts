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

interface Dataset {
  id: string;
  dataset_name: string;
  created_at: string;
  has_raw: boolean;
  has_cleaned: boolean;
  has_final: boolean;
  has_processed: boolean;
}

interface DatasetPreview {
  stage: 'raw' | 'cleaned' | 'final' | 'processed';
  preview: Record<string, any>[];
  columns: string[];
}

interface DatasetsResponse {
  status: string;
  message: string;
  data: {
    datasets: Dataset[];
  };
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
  Dataset,
  DatasetPreview,
  DatasetsResponse,
  ExperimentsResponse,
  ComparisonsResponse
};
