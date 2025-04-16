import { supabase } from '@/integrations/supabase/client';

// Base API URL - configure all requests to go through this base URL
const API_BASE_URL = 'https://smart-whole-cockatoo.ngrok-free.app';
const DATASET_API_PREFIX = '/dataset';

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

  const url = `${API_BASE_URL}${DATASET_API_PREFIX}${endpoint}`;
  
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
  uploadDataset: (file: File, customMissingSymbol?: string) => {
    const data = { 
      file, 
      ...(customMissingSymbol && { custom_missing_symbol: customMissingSymbol })
    };
    return apiRequest('/dataset-overview/', 'POST', data, true);
  },
  
  // 2. Preview Dataset
  previewDataset: (datasetId: string, stage: 'raw' | 'cleaned' | 'final' | 'processed' | 'latest' = 'latest') => {
    return apiRequest('/preview-data/', 'POST', { dataset_id: datasetId, stage }, true);
  },
  
  // 3. Handle Missing Values
  handleMissingValues: (
    datasetId: string, 
    strategy: 'mean' | 'median' | 'mode' | 'drop' | 'skip',
    customMissingSymbol?: string
  ) => {
    const data = { 
      dataset_id: datasetId, 
      strategy,
      ...(customMissingSymbol && { custom_missing_symbol: customMissingSymbol })
    };
    return apiRequest('/handle-dataset/', 'POST', data, true);
  },
  
  // 4. Feature Importance Preview
  featureImportancePreview: (datasetId: string, targetColumn: string) => {
    return apiRequest('/feature-importance-preview/', 'POST', {
      dataset_id: datasetId,
      target_column: targetColumn
    }, true);
  },
  
  // 5. Detect Task Type
  detectTaskType: (datasetId: string, targetColumn: string) => {
    return apiRequest('/detect-task-type/', 'POST', {
      dataset_id: datasetId,
      target_column: targetColumn
    }, true);
  },
  
  // 6. Save Dataset (Features + Target)
  saveDataset: (datasetId: string, targetColumn: string, columnsToKeep: string[]) => {
    return apiRequest('/save-dataset/', 'POST', {
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
    return apiRequest('/data-preprocess/', 'POST', {
      dataset_id: datasetId,
      normalization_method: normalizationMethod,
      balance_strategy: balanceStrategy
    }, true);
  }
};
