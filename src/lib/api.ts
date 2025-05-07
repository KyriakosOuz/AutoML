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

  preprocessDataset: async (datasetId: string, normalizationMethod: string, balanceStrategy: string, balanceMethod?: string) => {
    const formData = new FormData();
    formData.append('dataset_id', datasetId);
    formData.append('normalization_method', normalizationMethod);
    formData.append('balance_strategy', balanceStrategy);
    
    // Only add balance_method if balanceStrategy is not 'skip'
    if (balanceStrategy !== 'skip' && balanceMethod) {
      formData.append('balance_method', balanceMethod);
    }
    
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

  checkClassImbalance: async (datasetId: string) => {
    const formData = new FormData();
    formData.append('dataset_id', datasetId);
    
    const token = getAuthToken();
    
    const response = await fetch(`${API_URL}/dataset/check-class-imbalance/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    });
    
    return await handleApiResponse(response);
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
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Status check error:', {
          experimentId,
          status: response.status,
          response: errorText.substring(0, 200)
        });
        
        throw new Error(`Failed to check status: ${response.status} ${response.statusText}`);
      }
      
      // Check content type before parsing JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[API] Expected JSON response, got:', contentType, text.substring(0, 200));
        throw new Error('Server returned invalid content type');
      }
      
      // Parse JSON with error handling
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        const text = await response.text();
        console.error('[API] JSON parsing error:', jsonError, text.substring(0, 200));
        throw new Error('Failed to parse server response');
      }
      
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
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('AutoML training error:', {
          status: response.status,
          response: errorText.substring(0, 200)
        });
        
        // Check if the error response is HTML
        if (errorText.includes('<!DOCTYPE html>') || errorText.includes('<html')) {
          throw new Error(`Server returned HTML error page. Status: ${response.status}`);
        }
        
        try {
          // Try to parse as JSON for structured error
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.detail || errorJson.message || `Error: ${response.status}`);
        } catch (parseError) {
          // If parsing fails, use text
          throw new Error(`Error: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
        }
      }
      
      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Expected JSON response, got:', contentType, text.substring(0, 200));
        throw new Error('Server returned invalid content type');
      }
      
      // Parse with error handling
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        const text = await response.text();
        console.error('JSON parsing error:', jsonError, text.substring(0, 200));
        throw new Error('Failed to parse server response');
      }
      
      // Extract result from response data structure
      const result = data.data || data;
      
      if (!result.experiment_id) {
        throw new Error('No experiment ID returned from the server');
      }
      
      return result;
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
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Custom training error:', {
          status: response.status,
          response: errorText.substring(0, 200)
        });
        
        // Check if HTML error page
        if (errorText.includes('<!DOCTYPE html>') || errorText.includes('<html')) {
          throw new Error(`Server returned HTML error page. Status: ${response.status}`);
        }
        
        try {
          // Try to parse as JSON
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.detail || errorJson.message || `Error: ${response.status}`);
        } catch (parseError) {
          // Use text if parsing fails
          throw new Error(`Error: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
        }
      }
      
      // Check content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[API] Expected JSON response, got:', contentType, text.substring(0, 200));
        throw new Error('Server returned invalid content type');
      }
      
      // Parse with error handling
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        const text = await response.text();
        console.error('[API] JSON parsing error:', jsonError, text.substring(0, 200));
        throw new Error('Failed to parse server response');
      }
      
      console.log('[API] Custom training response:', data);
      
      // Unwrap nested data if present
      const result = data.data || data;
      
      if (!result.experiment_id) {
        throw new Error('No experiment ID returned from the server');
      }
      
      return result;
    } catch (error) {
      console.error('[API] Error starting custom training:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },

  getAvailableHyperparameters: async (algorithm: string) => {
    try {
      // Use a fixed localhost URL for hyperparameters
      const response = await fetch(`http://localhost:8000/algorithms/get-hyperparameters/?algorithm=${encodeURIComponent(algorithm)}`, {
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
      console.log('[API] Fetching results for experiment:', experimentId);
      const response = await fetch(`${API_URL}/experiments/experiment-results/${experimentId}`, {
        headers: getAuthHeaders()
      });
      
      // Handle non-200 responses
      if (!response.ok) {
        // Special case for 404 - experiment may not exist yet
        if (response.status === 404) {
          return { 
            status: 'processing',
            experiment_id: experimentId,
            message: 'Waiting for experiment to start...',
          };
        }
        
        // For other errors, extract useful information
        let errorMessage;
        try {
          // Try to get response as text first
          const errorText = await response.text();
          
          // Check if we got HTML instead of JSON
          if (errorText.includes('<!DOCTYPE html>') || errorText.includes('<html')) {
            console.error("Server returned HTML instead of JSON:", errorText.substring(0, 200));
            errorMessage = `Error: Server returned HTML instead of JSON. Status: ${response.status}`;
          } else {
            // Try to parse as JSON
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.detail || errorJson.message || `Error: ${response.status} ${response.statusText}`;
            } catch {
              // If not parseable JSON, use the raw text
              errorMessage = `Error: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`;
            }
          }
        } catch (textError) {
          // If we can't even get text, fall back to status
          errorMessage = `Error: ${response.status} ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }
      
      // Check content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        try {
          const text = await response.text();
          console.error(`Expected JSON response, got: ${contentType}`, text.substring(0, 200));
          throw new Error(`Expected JSON response, got: ${contentType || 'unknown'}`);
        } catch (error) {
          throw new Error(`Failed to parse non-JSON response: ${error.message}`);
        }
      }
      
      // Parse JSON with extensive error handling
      let data;
      try {
        data = await response.json();
        console.log('[API] Results data received:', { 
          experimentId,
          status: data.status || 'unknown',
          hasTrainingResults: !!data.training_results
        });
      } catch (jsonError) {
        console.error("JSON parsing error:", jsonError);
        // Try to get the raw text to see what's going on
        try {
          const text = await response.text();
          console.error("Failed to parse as JSON:", text.substring(0, 200));
        } catch (textError) {
          console.error("Also failed to get response as text:", textError);
        }
        throw new Error(`Failed to parse response as JSON: ${jsonError.message}`);
      }
      
      // Return data in the expected format, handling various response structures
      return data.data?.experiment_results || 
             data.experiment_results || 
             data.data?.experiment_metadata || 
             data;
    } catch (error) {
      console.error('Error fetching experiment results:', error);
      throw error;
    }
  },

  getLastExperiment: async () => {
    try {
      console.log('[API] Fetching most recent experiment');
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_URL}/experiments/last-experiment/`, {
        headers
      });
      
      if (response.status === 404) {
        console.log('[API] No recent experiments found');
        return null;
      }
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        console.error('[API] Error fetching last experiment:', {
          status: response.status,
          response: errorText.substring(0, 200)
        });
        throw new Error(`Failed to fetch last experiment: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[API] Last experiment data:', data);
      
      return data.data || data;
    } catch (error) {
      console.error('[API] Error in getLastExperiment:', error);
      // Don't throw error, return null to gracefully handle this case
      return null;
    }
  }
};
