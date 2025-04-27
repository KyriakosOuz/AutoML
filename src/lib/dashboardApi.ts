
import { getAuthHeaders, handleApiResponse } from './utils';
import { API_BASE_URL } from './constants';
import { ApiResponse } from '@/types/api';

export interface Dataset {
  dataset_id: string;
  name: string;
  created_at: string;
  file_url: string;
  final_file_url?: string;
  processed_file_url?: string;
  num_rows?: number;
  num_columns?: number;
  file_size?: string;
  description?: string;
  stages?: {
    raw: boolean;
    cleaned: boolean;
    final: boolean;
    processed: boolean;
  };
}

export interface Experiment {
  experiment_id: string;
  experiment_name: string;
  dataset_id: string;
  dataset_name?: string;
  task_type: string;
  algorithm: string;
  status: 'running' | 'completed' | 'failed' | 'success';
  created_at: string;
  completed_at?: string;
  metrics?: Record<string, any>;
  model_file_url?: string;
}

export interface Comparison {
  comparison_id: string;
  name: string;
  created_at: string;
  experiment_ids: string[];
  experiments?: Experiment[];
  task_type?: string;
}

export interface ComparisonResult {
  experiments: Experiment[];
  metrics_comparison: Record<string, any>[];
  task_type: string;
}

export interface DatasetPreview {
  rows: any[];
  columns: string[];
}

// Datasets API
export const datasetsApi = {
  listDatasets: async (): Promise<Dataset[]> => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/dataset-management/list-datasets/`, { headers });
      const apiResponse = await handleApiResponse<Dataset[]>(response);
      return apiResponse.data;
    } catch (error) {
      console.error('Error listing datasets:', error);
      throw error;
    }
  },

  deleteDataset: async (datasetId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/dataset-management/delete-dataset/${datasetId}`, {
        method: 'DELETE',
        headers
      });
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error deleting dataset:', error);
      throw error;
    }
  },

  previewDataset: async (datasetId: string, stage: 'raw' | 'cleaned' | 'final' | 'processed' = 'raw'): Promise<DatasetPreview> => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `${API_BASE_URL}/dataset-management/preview-dataset/${datasetId}?stage=${stage}`,
        { headers }
      );
      const apiResponse = await handleApiResponse<DatasetPreview>(response);
      return apiResponse.data;
    } catch (error) {
      console.error('Error previewing dataset:', error);
      throw error;
    }
  }
};

// Experiments API
export const experimentsApi = {
  listExperiments: async (): Promise<Experiment[]> => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/experiments/list-experiments/`, { headers });
      const apiResponse = await handleApiResponse<Experiment[]>(response);
      return apiResponse.data;
    } catch (error) {
      console.error('Error listing experiments:', error);
      throw error;
    }
  },

  getExperimentResults: async (experimentId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/experiments/experiment-results/${experimentId}`, { headers });
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error getting experiment results:', error);
      throw error;
    }
  },

  tuneModel: async (experimentId: string, params: Record<string, any>) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/experiments/tune-model/`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experiment_id: experimentId,
          ...params
        })
      });
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error tuning model:', error);
      throw error;
    }
  },

  deleteExperiment: async (experimentId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/experiments/delete-experiment/${experimentId}`, {
        method: 'DELETE',
        headers
      });
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error deleting experiment:', error);
      throw error;
    }
  }
};

// Comparisons API
export const comparisonsApi = {
  listComparisons: async (): Promise<Comparison[]> => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/comparisons/list/`, { headers });
      const apiResponse = await handleApiResponse<Comparison[]>(response);
      return apiResponse.data;
    } catch (error) {
      console.error('Error listing comparisons:', error);
      throw error;
    }
  },

  saveComparison: async (name: string, experimentIds: string[]) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/comparisons/save/`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          experiment_ids: experimentIds
        })
      });
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error saving comparison:', error);
      throw error;
    }
  },

  compareExperiments: async (experimentIds: string[], taskType?: string): Promise<ComparisonResult> => {
    try {
      const headers = await getAuthHeaders();
      const body: { experiment_ids: string[], task_type?: string } = { experiment_ids: experimentIds };
      
      if (taskType) body.task_type = taskType;
      
      const response = await fetch(`${API_BASE_URL}/comparisons/compare/`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const apiResponse = await handleApiResponse<ComparisonResult>(response);
      return apiResponse.data;
    } catch (error) {
      console.error('Error comparing experiments:', error);
      throw error;
    }
  },

  deleteComparison: async (comparisonId: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/comparisons/delete/${comparisonId}`, {
        method: 'DELETE',
        headers
      });
      return handleApiResponse(response);
    } catch (error) {
      console.error('Error deleting comparison:', error);
      throw error;
    }
  }
};
