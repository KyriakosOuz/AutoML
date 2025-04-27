
export interface Experiment {
  id: string;
  experiment_name: string;
  created_at: string;
  task_type: string;
  algorithm_choice: string;
  automl_engine: string;
  auto_tune: boolean;
  status: 'completed' | 'running' | 'failed';
  error_message: string | null;
  dataset_name: string;
  model_file_url: string;
  report_file_url: string;
  metrics: {
    recall: number;
    accuracy: number;
    f1_score: number;
    precision: number;
  };
}

export interface ExperimentsResponse {
  status: string;
  message: string;
  data: {
    results: Experiment[];
  };
}
