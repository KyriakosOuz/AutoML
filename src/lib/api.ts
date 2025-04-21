import { getAuthToken } from '@/contexts/AuthContext';
import { Dataset, TaskType } from '@/types/dataset';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const datasetApi = {
  uploadDataset: async (file: File): Promise<Dataset> => {
    const formData = new FormData();
    formData.append('file', file);
    
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

  automlTrain: async (datasetId: string, taskType: string, automlEngine: string, testSize: number, stratify: boolean, randomSeed: number) => {
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
      headers: getAuthHeaders(),
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
