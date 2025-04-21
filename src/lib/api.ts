// Import necessary dependencies
import { getAuthToken } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Define the TaskType type since it can't be imported from '@/types/dataset'
export type TaskType = 'binary_classification' | 'multiclass_classification' | 'regression';

// Define the Dataset type
export interface Dataset {
  dataset_id: string;
  file_url: string;
  data?: Record<string, any>[];
  overview?: Record<string, any>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Updated getAuthHeaders function that returns a regular object, not a Promise
const getAuthHeaders = () => {
  const token = getAuthToken();
  
  if (!token) {
    console.warn('No authentication token available. User may need to log in.');
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Helper function to handle API responses
const handleApiResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage;
    
    try {
      // Try to parse as JSON
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.detail || errorJson.message || `Error: ${response.status} ${response.statusText}`;
    } catch {
      // If not JSON, use the raw text
      errorMessage = `Error: ${response.status} ${response.statusText} - ${errorText}`;
    }
    
    throw new Error(errorMessage);
  }
  
  return await response.json();
};

export const datasetApi = {
  uploadDataset: async (file: File, customMissingSymbol?: string): Promise<Dataset> => {
    const formData = new FormData();
    formData.append('file', file);
    
    if (customMissingSymbol) {
      formData.append('missing_symbol', customMissingSymbol);
    }
    
    const token = getAuthToken();
    
    const response = await fetch(`${API_URL}/datasets/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload dataset');
    }
    
    return await response.json();
  },

  previewDataset: async (datasetId: string, stage: string = 'raw') => {
    try {
      const response = await fetch(`${API_URL}/datasets/${datasetId}/preview?stage=${stage}`, {
        headers: getAuthHeaders(),
      });
      
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Error fetching dataset preview:', error);
      throw error;
    }
  },

  getDatasetPreview: async (datasetId: string) => {
    const response = await fetch(`${API_URL}/datasets/${datasetId}/preview`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch dataset preview');
    }
    
    return await response.json();
  },

  analyzeDataset: async (datasetId: string) => {
    const response = await fetch(`${API_URL}/datasets/${datasetId}/analyze`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to analyze dataset');
    }
    
    return await response.json();
  },

  detectTaskType: async (datasetId: string, targetColumn: string) => {
    const response = await fetch(`${API_URL}/datasets/${datasetId}/detect_task_type`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ target_column: targetColumn }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to detect task type');
    }
    
    return await response.json();
  },

  featureImportancePreview: async (datasetId: string, targetColumn: string) => {
    const response = await fetch(`${API_URL}/datasets/${datasetId}/feature_importance_preview`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ target_column: targetColumn }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to calculate feature importance');
    }
    
    return await response.json();
  },

  handleMissingValues: async (datasetId: string, strategy: string, fillValue?: any) => {
    const payload: any = { strategy };
    if (fillValue !== undefined) {
      payload.fill_value = fillValue;
    }
    
    const response = await fetch(`${API_URL}/datasets/${datasetId}/handle_missing_values`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error('Failed to handle missing values');
    }
    
    return await response.json();
  },

  preprocessDataset: async (datasetId: string, normalizationMethod: string, balanceStrategy: string) => {
    const response = await fetch(`${API_URL}/datasets/${datasetId}/preprocess`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        normalization_method: normalizationMethod,
        balance_strategy: balanceStrategy
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to preprocess dataset');
    }
    
    return await response.json();
  },

  setTargetColumn: async (datasetId: string, targetColumn: string, taskType: TaskType) => {
    const response = await fetch(`${API_URL}/datasets/${datasetId}/set_target`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ target_column: targetColumn, task_type: taskType }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to set target column');
    }
    
    return await response.json();
  },

  saveDataset: async (datasetId: string, targetColumn: string, columnsToKeep: string[]) => {
    const response = await fetch(`${API_URL}/datasets/${datasetId}/save`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ target_column: targetColumn, columns_to_keep: columnsToKeep }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save dataset');
    }
    
    return await response.json();
  },

  getFeatureImportance: async (datasetId: string) => {
    const response = await fetch(`${API_URL}/datasets/${datasetId}/feature_importance`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch feature importance');
    }
    
    return await response.json();
  },
};

export const trainingApi = {
  getAvailableAlgorithms: async (taskType: string) => {
    try {
      // Ensure we're passing the task_type as a query parameter
      const response = await fetch(`${API_URL}/algorithms/get-algorithms/?task_type=${encodeURIComponent(taskType)}`, {
        headers: getAuthHeaders(),
      });
      
      const data = await handleApiResponse(response);
      return data.algorithms;
    } catch (error) {
      console.error('Error fetching algorithms:', error);
      throw error;
    }
  },

  automlTrain: async (
    datasetId: string, 
    taskType: string, 
    automlEngine: string, 
    testSize: number, 
    stratify: boolean, 
    randomSeed: number
  ) => {
    try {
      const response = await fetch(`${API_URL}/training/automl-train/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          dataset_id: datasetId,
          task_type: taskType,
          automl_engine: automlEngine,
          test_size: testSize,
          stratify: stratify,
          random_seed: randomSeed,
        }),
      });
      
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Error starting AutoML training:', error);
      throw error;
    }
  },

  getAvailableHyperparameters: async (algorithm: string) => {
    try {
      const response = await fetch(`${API_URL}/algorithms/get-hyperparameters/?algorithm=${encodeURIComponent(algorithm)}`, {
        headers: getAuthHeaders(),
      });
      
      const data = await handleApiResponse(response);
      return data.hyperparameters;
    } catch (error) {
      console.error('Error fetching hyperparameters:', error);
      throw error;
    }
  },

  customTrain: async (formData: FormData) => {
    try {
      // For FormData, we need a different approach for headers
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/training/custom-train/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Note: Do not set 'Content-Type' for FormData
        },
        body: formData
      });
      
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Error starting custom training:', error);
      throw error;
    }
  },

  getExperimentResults: async (experimentId: string): Promise<ExperimentResults> => {
    try {
      const response = await fetch(`${API_URL}/experiments/experiment-results/${experimentId}`, {
        headers: getAuthHeaders()
      });
      
      const data = await handleApiResponse(response);
      return data.experiment_results || data; // Handle both response formats
    } catch (error) {
      console.error('Error fetching experiment results:', error);
      throw error;
    }
  }
};
