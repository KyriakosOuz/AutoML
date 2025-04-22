// Import necessary dependencies
import { getAuthToken } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  ExperimentResults,
  TaskType 
} from '@/types/training';

// Import the functions from training.ts and re-export them
import { checkStatus, getExperimentResults, predictManual, predictBatchCsv } from './training';

// Define the Dataset type
export interface Dataset {
  dataset_id: string;
  file_url: string;
  data?: Record<string, any>[];
  overview?: Record<string, any>;
}

// Define the DatasetOverview interface to match the one in DatasetContext
export interface DatasetOverview {
  num_rows: number;
  num_columns: number;
  missing_values: Record<string, any>; // Now required, not optional
  numerical_features: string[];
  categorical_features: string[];
  // Properties from backend response
  total_missing_values?: number;
  missing_values_count?: Record<string, number>;
  column_names?: string[];
  unique_values_count?: Record<string, number>;
  data_types?: Record<string, string>;
  feature_classification?: Record<string, string>;
}

// Define the API response interfaces
export interface ApiResponse<T = any> {
  status?: string;
  message?: string;
  data?: T;
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

// Updated handleApiResponse function with better content-type and error handling
const handleApiResponse = async (response: Response) => {
  // Check if the response is ok first
  if (!response.ok) {
    try {
      // Try to get an error message from JSON
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const errorJson = await response.json();
        throw new Error(errorJson.detail || errorJson.message || `Error: ${response.status} ${response.statusText}`);
      } else {
        // If not JSON, get text instead
        const errorText = await response.text();
        
        // Check if it's HTML (likely an error page)
        if (errorText.includes('<!DOCTYPE html>') || errorText.includes('<html')) {
          console.error("Server returned HTML instead of JSON:", errorText.substring(0, 200));
          throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
        } else {
          throw new Error(`Error: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
        }
      }
    } catch (parseError) {
      // If we can't parse the error response at all
      if (parseError instanceof SyntaxError) {
        throw new Error(`Failed to parse error response: ${response.status} ${response.statusText}`);
      }
      // Re-throw if it's our own Error with a proper message
      throw parseError;
    }
  }

  // Handle successful responses
  const contentType = response.headers.get('content-type');
  
  // Return empty object if no content or not JSON
  if (!contentType || !contentType.includes('application/json')) {
    console.warn("Response is not JSON:", contentType);
    return {};
  }
  
  try {
    const data = await response.json();
    // Unwrap nested data if present
    return data.data?.experiment_results || data.experiment_results || data;
  } catch (err) {
    console.error('❌ Failed to parse JSON response:', err);
    // Try to get the text to diagnose the issue
    try {
      const text = await response.text();
      console.error("Invalid JSON response:", text.substring(0, 200));
    } catch (textError) {
      console.error("Could not read response as text either:", textError);
    }
    throw new Error('Failed to parse JSON response from server');
  }
};

export const datasetApi = {
  uploadDataset: async (file: File, customMissingSymbol?: string): Promise<Dataset | ApiResponse<Dataset>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    if (customMissingSymbol) {
      formData.append('custom_missing_symbol', customMissingSymbol);
    }
    
    const token = getAuthToken();
    
    const response = await fetch(`${API_URL}/dataset/dataset-overview/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    return await handleApiResponse(response);
  },

  previewDataset: async (datasetId: string, stage: string = 'raw') => {
    const formData = new FormData();
    formData.append('dataset_id', datasetId);
    formData.append('stage', stage);
    
    const token = getAuthToken();
    
    const response = await fetch(`${API_URL}/dataset/preview-data/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });
    
    return await handleApiResponse(response);
  },

  handleMissingValues: async (datasetId: string, strategy: string, customMissingSymbol?: string) => {
    console.log('Calling handleMissingValues with:', { datasetId, strategy, customMissingSymbol });
    
    const formData = new FormData();
    formData.append('dataset_id', datasetId);
    formData.append('strategy', strategy);
    
    if (customMissingSymbol) {
      formData.append('custom_missing_symbol', customMissingSymbol);
    }
    
    const token = getAuthToken();
    
    const response = await fetch(`${API_URL}/dataset/handle-dataset/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });
    
    return await handleApiResponse(response);
  },

  detectTaskType: async (datasetId: string, targetColumn: string) => {
    const formData = new FormData();
    formData.append('dataset_id', datasetId);
    formData.append('target_column', targetColumn);
    
    const token = getAuthToken();
    
    const response = await fetch(`${API_URL}/dataset/detect-task-type/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });
    
    return await handleApiResponse(response);
  },

  featureImportancePreview: async (datasetId: string, targetColumn: string) => {
    const formData = new FormData();
    formData.append('dataset_id', datasetId);
    formData.append('target_column', targetColumn);
    
    const token = getAuthToken();
    
    const response = await fetch(`${API_URL}/dataset/feature-importance-preview/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });
    
    const data = await handleApiResponse(response);
    
    // Handle both direct response and nested data
    const featureImportance = data.feature_importance || (data.data && data.data.feature_importance);
    const taskType = data.task_type || (data.data && data.data.task_type);
    
    if (!featureImportance || !taskType) {
      throw new Error('Invalid response format from feature importance analysis');
    }
    
    return {
      feature_importance: featureImportance,
      task_type: taskType,
      target_column: targetColumn,
    };
  },

  saveDataset: async (datasetId: string, targetColumn: string, columnsToKeep: string[]) => {
    const formData = new FormData();
    formData.append('dataset_id', datasetId);
    formData.append('target_column', targetColumn);
    formData.append('columns_to_keep', JSON.stringify(columnsToKeep));
    
    const token = getAuthToken();
    
    const response = await fetch(`${API_URL}/dataset/save-dataset/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });
    
    return await handleApiResponse(response);
  },

  preprocessDataset: async (datasetId: string, normalizationMethod: string, balanceStrategy: string) => {
    const formData = new FormData();
    formData.append('dataset_id', datasetId);
    formData.append('normalization_method', normalizationMethod);
    formData.append('balance_strategy', balanceStrategy);
    
    const token = getAuthToken();
    
    const response = await fetch(`${API_URL}/dataset/data-preprocess/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });
    
    return await handleApiResponse(response);
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

// Export the training API functions
export const trainingApi = {
  checkStatus,
  getExperimentResults,
  predictManual,
  predictBatchCsv
};
