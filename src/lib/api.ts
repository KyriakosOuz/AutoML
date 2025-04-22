// Import necessary dependencies
import { getAuthToken } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  ExperimentResults,
  TaskType 
} from '@/types/training';

// Define the Dataset type
export interface Dataset {
  dataset_id: string;
  file_url: string;
  data?: Record<string, any>[];
  overview?: Record<string, any>;
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

// Updated handleApiResponse function with better content-type handling
const handleApiResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type');

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage;

    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.detail || errorJson.message || `Error: ${response.status} ${response.statusText}`;
    } catch {
      errorMessage = `Error: ${response.status} ${response.statusText} - ${errorText}`;
    }

    throw new Error(errorMessage);
  }

  if (!contentType || !contentType.includes('application/json')) {
    return {}; // Safe fallback if no body or wrong format
  }

  try {
    const data = await response.json();
    return data.data?.experiment_results || data.experiment_results || data;
  } catch (err) {
    console.error('❌ Failed to parse JSON response:', err);
    return {};
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

  checkStatus: async (experimentId: string) => {
    try {
      console.log('[API] Checking status for experiment:', experimentId);
      const response = await fetch(`${API_URL}/training/check-status/${experimentId}`, {
        headers: getAuthHeaders(),
      });
      
      const data = await handleApiResponse(response);
      console.log('[API] Status check response:', {
        experimentId,
        status: response.status,
        data
      });
      return data;
    } catch (error) {
      console.error('[API] Error checking training status:', {
        experimentId,
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
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
      const formData = new FormData();
      formData.append('dataset_id', datasetId);
      formData.append('task_type', taskType);
      formData.append('automl_engine', automlEngine);
      formData.append('test_size', testSize.toString());
      formData.append('stratify', stratify.toString());
      formData.append('random_seed', randomSeed.toString());
      
      const response = await fetch(`${API_URL}/training/automl/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: formData,
      });
      
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Error starting AutoML training:', error);
      throw error;
    }
  },

  customTrain: async (formData: FormData) => {
    try {
      console.log('[API] Starting custom training with params:', {
        dataset_id: formData.get('dataset_id'),
        algorithm: formData.get('algorithm'),
        use_default_hyperparams: formData.get('use_default_hyperparams'),
      });
      
      const token = getAuthToken();
      const response = await fetch(`${API_URL}/training/custom-train/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      console.log('[DEBUG] Raw customTrain response:', response);
      console.log('[DEBUG] Content-Type:', response.headers.get('content-type'));
      
      const responseJson = await handleApiResponse(response);
      console.log('[API] Custom training response:', responseJson);

      // Unwrap `data` object if present
      const data = responseJson.data || responseJson;

      if (!data.experiment_id) {
        throw new Error('No experiment ID returned from the server');
      }

      // Start polling for status immediately after successful training start
      const pollingInterval = setInterval(async () => {
        try {
          console.log('[API] Polling status for experiment:', data.experiment_id);
          const statusResponse = await trainingApi.checkStatus(data.experiment_id);
          console.log('[API] Status response:', statusResponse);

          if (statusResponse.status === 'completed' || statusResponse.status === 'success') {
            console.log('[API] Training completed successfully');
            clearInterval(pollingInterval);
            // Results will be fetched by the component
          } else if (statusResponse.status === 'failed') {
            console.log('[API] Training failed:', statusResponse.error_message);
            clearInterval(pollingInterval);
            throw new Error(statusResponse.error_message || 'Training failed');
          }
        } catch (error) {
          console.error('[API] Error polling status:', error);
          clearInterval(pollingInterval);
          throw error;
        }
      }, 3000);

      return data;
    } catch (error) {
      console.error('[API] Error starting custom training:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        formDataKeys: Array.from(formData.keys())
      });
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

  getExperimentResults: async (experimentId: string) => {
    try {
      const response = await fetch(`${API_URL}/experiments/experiment-results/${experimentId}`, {
        headers: getAuthHeaders()
      });
      
      const contentType = response.headers.get('content-type');

      if (!response.ok) {
        if (response.status === 404) {
          // Return a structured response for 404 (experiment not yet created)
          return { 
            status: 'processing',
            experiment_id: experimentId,
            message: 'Waiting for experiment to start...',
          };
        }
        
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
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON response, got: ${contentType}\n${text.slice(0, 200)}`);
      }
      
      const data = await response.json();
      return data.data?.experiment_results || data.experiment_results || data;
    } catch (error) {
      console.error('Error fetching experiment results:', error);
      throw error;
    }
  }
};
