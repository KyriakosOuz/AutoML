
// First, let's fix the import issues
import { getAuthToken } from '@/contexts/AuthContext';

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

const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
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
    const response = await fetch(`${API_URL}/datasets/${datasetId}/preview?stage=${stage}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch dataset preview');
    }
    
    return await response.json();
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
    const response = await fetch(`${API_URL}/training/algorithms/${taskType}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch algorithms');
    }
    
    const data = await response.json();
    return data.algorithms;
  },

  automlTrain: async (
    datasetId: string, 
    taskType: string, 
    automlEngine: string, 
    testSize: number, 
    stratify: boolean, 
    randomSeed: number
  ) => {
    const response = await fetch(`${API_URL}/training/automl-train`, {
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
      throw new Error('Failed to start AutoML training');
    }
    
    return await response.json();
  },

  getAvailableHyperparameters: async (algorithm: string) => {
    const response = await fetch(`${API_URL}/training/hyperparameters/${algorithm}`, {
      headers: getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch hyperparameters');
    }
    
    const data = await response.json();
    return data.hyperparameters;
  },

  customTrain: async (formData: FormData) => {
    const response = await fetch(`${API_URL}/training/custom-train/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Failed to start custom training');
    }
    
    const data = await response.json();
    return data;
  },

  getExperimentResults: async (experimentId: string) => {
    const response = await fetch(`${API_URL}/experiments/experiment-results/${experimentId}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch experiment results');
    }
    
    const data = await response.json();
    return data.experiment_results;
  }
};
