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
      const formData = new FormData();
      
      // Add all fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'file' && value instanceof File) {
            formData.append(key, value);
          } else if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else if (typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      });
      
      options.body = formData;
    } else {
      // For JSON requests
      options.body = JSON.stringify(data);
    }
  }

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.detail || `API request failed with status ${response.status}`
      );
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Dataset API endpoints
export const datasetApi = {
  // 1. Upload Dataset
  uploadDataset: (file: File) => {
    return apiRequest(`${DATASET_API_PREFIX}/dataset-overview/`, 'POST', { file }, true);
  },
  
  // 2. Preview Dataset
  previewDataset: (datasetId: string, stage: 'raw' | 'cleaned' | 'final' | 'processed' | 'latest' = 'latest') => {
    return apiRequest(`${DATASET_API_PREFIX}/preview-data/`, 'POST', { dataset_id: datasetId, stage }, true);
  },
  
  // 3. Handle Missing Values
  handleMissingValues: (
    datasetId: string, 
    strategy: 'mean' | 'median' | 'mode' | 'drop' | 'skip'
  ) => {
    const data = { 
      dataset_id: datasetId, 
      strategy
    };
    return apiRequest(`${DATASET_API_PREFIX}/handle-dataset/`, 'POST', data, true);
  },
  
  // 4. Feature Importance Preview
  featureImportancePreview: (datasetId: string, targetColumn: string) => {
    return apiRequest(`${DATASET_API_PREFIX}/feature-importance-preview/`, 'POST', {
      dataset_id: datasetId,
      target_column: targetColumn
    }, true);
  },
  
  // 5. Detect Task Type
  detectTaskType: (datasetId: string, targetColumn: string) => {
    return apiRequest(`${DATASET_API_PREFIX}/detect-task-type/`, 'POST', {
      dataset_id: datasetId,
      target_column: targetColumn
    }, true);
  },
  
  // 6. Save Dataset (Features + Target)
  saveDataset: (datasetId: string, targetColumn: string, columnsToKeep: string[]) => {
    return apiRequest(`${DATASET_API_PREFIX}/save-dataset/`, 'POST', {
      dataset_id: datasetId,
      target_column: targetColumn,
      columns_to_keep: JSON.stringify(columnsToKeep)
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
    automlEngine: 'mljar' | 'h2o',
    testSize: number,
    stratify: boolean,
    randomSeed: number
  ) => {
    return apiRequest(`${TRAINING_API_PREFIX}/automl/`, 'POST', {
      dataset_id: datasetId,
      automl_engine: automlEngine,
      test_size: testSize,
      stratify,
      random_seed: randomSeed
    });
  },
  
  // Custom model training
  customTrain: (
    datasetId: string,
    algorithm: string,
    hyperparameters: Record<string, any>,
    testSize: number,
    stratify: boolean,
    randomSeed: number,
    enableAnalytics: boolean
  ) => {
    return apiRequest(`${TRAINING_API_PREFIX}/custom-train/`, 'POST', {
      dataset_id: datasetId,
      algorithm,
      hyperparameters,
      test_size: testSize,
      stratify,
      random_seed: randomSeed,
      enable_analytics: enableAnalytics
    });
  },
  
  // Get available algorithms for current task type
  getAvailableAlgorithms: (taskType: string) => {
    return apiRequest(`${TRAINING_API_PREFIX}/algorithms/?task_type=${taskType}`, 'GET');
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
