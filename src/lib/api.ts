
// Define the base API URL and authentication functions
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Helper function to get authentication headers
const getAuthHeaders = () => {
  // For now, returning empty headers
  // This would be updated with actual authentication logic later
  return {
    'Content-Type': 'application/json',
  };
};

// Types
export interface Dataset {
  id: string;
  dataset_id: string; 
  filename: string;
  created_at: string;
  rows: number;
  columns: number;
  file_url?: string;
  overview?: DatasetOverview;
}

export interface DatasetOverview {
  num_rows: number;
  num_columns: number;
  numerical_features: string[];
  categorical_features: string[];
  total_missing_values: number;
  missing_values?: Record<string, any>;
  missing_values_count?: Record<string, number>;
  column_names?: string[];
  unique_values_count?: Record<string, number>;
  data_types?: Record<string, string>;
  feature_classification?: Record<string, string>;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

// Dataset API service
export const datasetApi = {
  // Upload a dataset
  uploadDataset: async (formData: FormData, customMissingSymbol?: string) => {
    // If customMissingSymbol is provided, append it to the form
    if (customMissingSymbol) {
      formData.append('missing_values_symbol', customMissingSymbol);
    }
    
    const response = await fetch(`${API_URL}/datasets/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error uploading dataset: ${errorText}`);
    }

    return response.json();
  },

  // Preview a dataset
  previewDataset: async (datasetId: string, stage: string = 'raw') => {
    const response = await fetch(`${API_URL}/datasets/${datasetId}/preview?stage=${stage}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error previewing dataset: ${errorText}`);
    }

    return response.json();
  },

  // Process missing values in a dataset
  processMissingValues: async (datasetId: string, strategy: string) => {
    const response = await fetch(`${API_URL}/datasets/${datasetId}/process-missing`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ strategy }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error processing missing values: ${errorText}`);
    }

    return response.json();
  },

  // Handle missing values (alias to processMissingValues)
  handleMissingValues: async (datasetId: string, strategy: string) => {
    return datasetApi.processMissingValues(datasetId, strategy);
  },

  // Calculate feature importance
  featureImportancePreview: async (datasetId: string, targetColumn: string) => {
    const response = await fetch(
      `${API_URL}/datasets/${datasetId}/feature-importance?target_column=${targetColumn}`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error calculating feature importance: ${errorText}`);
    }

    return response.json();
  },

  // Save dataset with selected features
  saveDataset: async (datasetId: string, targetColumn: string, columnsToKeep: string[]) => {
    const response = await fetch(`${API_URL}/datasets/${datasetId}/save`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ target_column: targetColumn, columns_to_keep: columnsToKeep }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error saving dataset: ${errorText}`);
    }

    return response.json();
  },

  // Preprocess dataset for training
  preprocessDataset: async (
    datasetId: string,
    normalizationMethod: string,
    balanceStrategy: string
  ) => {
    const response = await fetch(`${API_URL}/datasets/${datasetId}/preprocess`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        normalization_method: normalizationMethod,
        balance_strategy: balanceStrategy,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error preprocessing dataset: ${errorText}`);
    }

    return response.json();
  },

  // Detect task type from target column
  detectTaskType: async (datasetId: string, targetColumn: string) => {
    const response = await fetch(
      `${API_URL}/datasets/${datasetId}/detect-task-type?target_column=${targetColumn}`,
      {
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error detecting task type: ${errorText}`);
    }

    return response.json();
  }
};

// Training API service
export const trainingApi = {
  // AutoML training
  automlTrain: async (
    datasetId: string,
    taskType: string,
    automlEngine: string,
    testSize: number,
    stratify: boolean,
    randomSeed: number
  ) => {
    const response = await fetch(`${API_URL}/training/automl`, {
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

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error starting AutoML training: ${errorText}`);
    }

    return response.json();
  },

  // Custom training
  customTrain: async (formData: FormData) => {
    const response = await fetch(`${API_URL}/training/custom`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error starting custom training: ${errorText}`);
    }

    return response.json();
  },

  // Get available algorithms
  getAvailableAlgorithms: async (taskType: string) => {
    const response = await fetch(`${API_URL}/training/algorithms?task_type=${taskType}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error fetching available algorithms: ${errorText}`);
    }

    const data = await response.json();
    return data.algorithms || [];
  },

  // Get available hyperparameters
  getAvailableHyperparameters: async (algorithm: string) => {
    const response = await fetch(`${API_URL}/training/hyperparameters?algorithm=${algorithm}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error fetching available hyperparameters: ${errorText}`);
    }

    const data = await response.json();
    return data.hyperparameters || {};
  },

  // Check experiment status
  checkStatus: async (experimentId: string) => {
    const response = await fetch(`${API_URL}/experiments/${experimentId}/status`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error checking experiment status: ${errorText}`);
    }

    return response.json();
  },

  // Get experiment results
  getExperimentResults: async (experimentId: string) => {
    try {
      console.log('[API] Fetching experiment results for:', experimentId);
      
      const response = await fetch(`${API_URL}/experiments/experiment-results/${experimentId}`, {
        headers: getAuthHeaders()
      });
      
      const contentType = response.headers.get('content-type');
      console.log('[API] Response content-type:', contentType);

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
