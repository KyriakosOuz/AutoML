
// Import necessary dependencies
import { TaskType } from '@/types/training';

export interface Dataset {
  dataset_id: string;
  file_url: string;
  data?: Record<string, any>[];
  overview?: Record<string, any>;
}

export interface DatasetOverview {
  num_rows: number;
  num_columns: number;
  missing_values: Record<string, any>;
  numerical_features: string[];
  categorical_features: string[];
  total_missing_values?: number;
  missing_values_count?: Record<string, number>;
  column_names?: string[];
  unique_values_count?: Record<string, number>;
  data_types?: Record<string, string>;
  feature_classification?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  status?: string;
  message?: string;
  data?: T;
}
