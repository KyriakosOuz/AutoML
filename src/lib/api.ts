
import { supabase } from '@/integrations/supabase/client';

// Base API URL - configure all requests to go through this base URL
const API_BASE_URL = 'https://smart-whole-cockatoo.ngrok-free.app';
const DATASET_API_PREFIX = '/dataset';
const TRAINING_API_PREFIX = '/training';

// Use the Supabase client to get auth token
export const getAuthToken = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
};

// Generic API request function
const apiRequest = async (
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any,
  isMultipart = false
): Promise<any> => {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
  };

  // Don't manually set Content-Type for FormData; browser will do it automatically
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (data) {
    if (isMultipart) {
      // For multipart/form-data, use FormData
      if (!(data instanceof FormData)) {
        // If data is not already FormData, create it
        const formData = new FormData();
        
        // Add all fields to FormData
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (typeof value === 'boolean') {
              // Convert boolean to string representation
              formData.append(key, value.toString());
            } else if (Array.isArray(value) || typeof value === 'object') {
              // Handle arrays or objects by converting to JSON string
              if (!(value instanceof File)) {
                formData.append(key, JSON.stringify(value));
              } else {
                formData.append(key, value);
              }
            } else {
              formData.append(key, String(value));
            }
          }
        });
        
        options.body = formData;
      } else {
        // If data is already FormData, use it directly
        options.body = data;
      }
    } else {
      // For JSON requests
      options.body = JSON.stringify(data);
    }
  }

  try {
    console.log(`Making API request to ${url}`);
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorDetail;
      
      try {
        // Try to parse as JSON
        const errorData = JSON.parse(errorText);
        errorDetail = errorData?.detail || errorData?.message;
      } catch {
        // If not JSON, use the text directly
        errorDetail = errorText;
      }
      
      throw new Error(
        errorDetail || `API request failed with status ${response.status}`
      );
    }
    
    // Try to parse response as JSON, but handle gracefully if not JSON
    try {
      const responseData = await response.json();
      console.log('API response data:', responseData);
      return responseData;
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      // Try to get the plain text response if JSON parsing fails
      const textResponse = await response.text();
      console.log('Raw text response:', textResponse);
      
      // If the text is just the task type as a string, return it in a structured format
      if (textResponse) {
        return { task_type: textResponse.trim() };
      }
      
      return { error: 'Invalid JSON response', text: textResponse };
    }
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Dataset API endpoints
export const datasetApi = {
  // 1. Upload Dataset
  uploadDataset: (file: File, customMissingSymbol?: string) => {
    const formData: Record<string, any> = { file };
    if (customMissingSymbol) {
      formData.custom_missing_symbol = customMissingSymbol;
    }
    return apiRequest(`${DATASET_API_PREFIX}/dataset-overview/`, 'POST', formData, true);
  },
  
  // 2. Preview Dataset
  previewDataset: (datasetId: string, stage: 'raw' | 'cleaned' | 'final' | 'processed' | 'latest' = 'latest') => {
    return apiRequest(`${DATASET_API_PREFIX}/preview-data/`, 'POST', { dataset_id: datasetId, stage }, true);
  },
  
  // Handle Missing Values
  handleMissingValues: (
    datasetId: string, 
    strategy: 'mean' | 'median' | 'mode' | 'drop' | 'hot_deck' | 'skip'
  ) => {
    const data = { 
      dataset_id: datasetId, 
      strategy
    };
    return apiRequest(`${DATASET_API_PREFIX}/handle-dataset/`, 'POST', data, true);
  },
  
  // Feature Importance Preview
  featureImportancePreview: (datasetId: string, targetColumn: string) => {
    return apiRequest(`${DATASET_API_PREFIX}/feature-importance-preview/`, 'POST', {
      dataset_id: datasetId,
      target_column: targetColumn
    }, true);
  },
  
  // Detect Task Type
  detectTaskType: (datasetId: string, targetColumn: string) => {
    console.log(`Calling detectTaskType with datasetId: ${datasetId}, targetColumn: ${targetColumn}`);
    
    if (!datasetId || !targetColumn) {
      throw new Error('Dataset ID and target column are required');
    }
    
    return apiRequest(`${DATASET_API_PREFIX}/detect-task-type/`, 'POST', {
      dataset_id: datasetId,
      target_column: targetColumn
    }, true).then(response => {
      console.log('DetectTaskType raw response:', response);
      
      // Normalized handling - return a consistent structure
      const taskType = response?.task_type || 
                        response?.data?.task_type || 
                        (typeof response === 'string' ? response.trim() : null);
      
      if (!taskType) {
        throw new Error("Could not determine task type from response");
      }
      
      // Return a normalized response object with only task_type
      return { task_type: taskType };
    });
  },
  
  // Save Dataset (Features + Target)
  saveDataset: (datasetId: string, targetColumn: string, columnsToKeep: string[]) => {
    if (!datasetId || !targetColumn || !columnsToKeep) {
      throw new Error('Dataset ID, target column, and columns are required');
    }
    
    return apiRequest(`${DATASET_API_PREFIX}/save-dataset/`, 'POST', {
      dataset_id: datasetId,
      target_column: targetColumn,
      columns_to_keep: columnsToKeep // Directly pass the array, no need for JSON.stringify
    }, true);
  },
  
  // 7. Preprocess Dataset
  preprocessDataset: (
    datasetId: string,
    normalizationMethod: 'minmax' | 'standard' | 'robust' | 'log' | 'skip',
    balanceStrategy: 'undersample' | 'smote' | 'skip'
  ) => {
    return apiRequest(`${DATASET_API_PREFIX}/data-preprocess/`, 'POST', {
      dataset_id: datasetId,
      normalization_method: normalizationMethod,
      balance_strategy: balanceStrategy
    }, true);
  }
};

// Training API endpoints
export const trainingApi = {
  // AutoML training
  automlTrain: (
    datasetId: string,
    taskType: string,
    automlEngine: 'mljar' | 'h2o',
    testSize: number,
    stratify: boolean,
    randomSeed: number,
    experimentName?: string,
    enableVisualization: boolean = true,
    storeModel: boolean = true
  ) => {
    // Create FormData directly
    const formData = new FormData();
    formData.append('dataset_id', datasetId);
    formData.append('task_type', taskType);
    formData.append('automl_engine', automlEngine);
    formData.append('test_size', testSize.toString());
    formData.append('stratify', stratify.toString());
    formData.append('random_seed', randomSeed.toString());
    
    // Handle optional parameters
    if (experimentName) {
      formData.append('experiment_name', experimentName);
    }
    
    formData.append('enable_visualization', enableVisualization.toString());
    formData.append('store_model', storeModel.toString());

    // Pass FormData directly to the request
    return apiRequest(`${TRAINING_API_PREFIX}/automl/`, 'POST', formData, true);
  },
  
  // Custom model training
  customTrain: (
    datasetId: string,
    taskType: string,
    algorithm: string,
    hyperparameters: Record<string, any>,
    testSize: number,
    stratify: boolean,
    randomSeed: number,
    enableAnalytics: boolean,
    experimentName?: string,
    storeModel: boolean = true
  ) => {
    // Create FormData directly
    const formData = new FormData();
    formData.append('dataset_id', datasetId);
    formData.append('task_type', taskType);
    formData.append('algorithm', algorithm);
    formData.append('use_default_hyperparams', 'false'); // Always sending custom hyperparams
    formData.append('hyperparameters', JSON.stringify(hyperparameters));
    formData.append('test_size', testSize.toString());
    formData.append('stratify', stratify.toString());
    formData.append('random_seed', randomSeed.toString());
    formData.append('advanced_analytics', enableAnalytics.toString());
    formData.append('enable_visualization', 'true');
    
    // Handle optional parameters
    if (experimentName) {
      formData.append('experiment_name', experimentName);
    }
    
    formData.append('store_model', storeModel.toString());

    // Pass FormData directly to the request
    return apiRequest(`${TRAINING_API_PREFIX}/custom-train/`, 'POST', formData, true);
  },
  
  // Get available algorithms for current task type
  getAvailableAlgorithms: (taskType: string) => {
    if (!taskType) {
      throw new Error('Task type is required');
    }
    
    // Use the correct endpoint URL
    return apiRequest(`${TRAINING_API_PREFIX}/algorithms/?task_type=${taskType}`, 'GET')
      .then(response => {
        console.log('Algorithm response:', response);
        // Ensure we return the algorithms array from the response
        return response?.algorithms || [];
      });
  },
  
  // Get default hyperparameters for an algorithm
  getHyperparameters: (algorithm: string) => {
    return apiRequest(`${TRAINING_API_PREFIX}/get-hyperparameters/?algorithm=${algorithm}`, 'GET');
  },
  
  // Get training results by experiment ID
  getTrainingResults: (experimentId: string) => {
    return apiRequest(`${TRAINING_API_PREFIX}/results/${experimentId}`, 'GET');
  }
};
