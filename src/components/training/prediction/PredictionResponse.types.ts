
export type TaskType = 'binary_classification' | 'multiclass_classification' | 'regression';

export interface ManualPredictionResponse {
  prediction: string | number;
  task_type: TaskType;
  class_probabilities?: Record<string, number>;
  confidence_score?: number;
}

export interface BatchPredictionResponse {
  mode: 'prediction_only' | 'evaluation';
  task_type: TaskType;
  predictions?: (string | number)[];
  filled_dataset_preview?: Record<string, any>[];
  metrics?: {
    accuracy?: number;
    f1_macro?: number;
    mae?: number;
    rmse?: number;
    r2?: number;
    report?: Record<string, {
      precision: number;
      recall: number;
      'f1-score': number;
      support: number;
    }>;
  };
  y_true?: any[];
  y_pred?: any[];
  target_column?: string;
  automl_engine?: string;
  predictions_csv_file?: {
    file_type: string;
    file_url: string;
    file_name?: string;
  };
}
