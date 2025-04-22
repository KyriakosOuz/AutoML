
import { API_URL, getAuthHeaders, handleApiResponse } from './utils';
import { Dataset, ApiResponse } from './types';

export const datasetApi = {
  uploadDataset: async (file: File, customMissingSymbol?: string): Promise<Dataset | ApiResponse<Dataset>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    if (customMissingSymbol) {
      formData.append('custom_missing_symbol', customMissingSymbol);
    }
    
    const token = getAuthHeaders().Authorization;
    
    const response = await fetch(`${API_URL}/dataset/dataset-overview/`, {
      method: 'POST',
      headers: {
        'Authorization': token,
      },
      body: formData,
    });
    
    return await handleApiResponse(response);
  },

  previewDataset: async (datasetId: string, stage: string = 'raw') => {
    const formData = new FormData();
    formData.append('dataset_id', datasetId);
    formData.append('stage', stage);
    
    const token = getAuthHeaders().Authorization;
    
    const response = await fetch(`${API_URL}/dataset/preview-data/`, {
      method: 'POST',
      headers: {
        'Authorization': token,
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
    
    const token = getAuthHeaders().Authorization;
    
    const response = await fetch(`${API_URL}/dataset/handle-dataset/`, {
      method: 'POST',
      headers: {
        'Authorization': token,
      },
      body: formData
    });
    
    return await handleApiResponse(response);
  },

  detectTaskType: async (datasetId: string, targetColumn: string) => {
    const formData = new FormData();
    formData.append('dataset_id', datasetId);
    formData.append('target_column', targetColumn);
    
    const token = getAuthHeaders().Authorization;
    
    const response = await fetch(`${API_URL}/dataset/detect-task-type/`, {
      method: 'POST',
      headers: {
        'Authorization': token,
      },
      body: formData
    });
    
    return await handleApiResponse(response);
  },

  featureImportancePreview: async (datasetId: string, targetColumn: string) => {
    const formData = new FormData();
    formData.append('dataset_id', datasetId);
    formData.append('target_column', targetColumn);
    
    const token = getAuthHeaders().Authorization;
    
    const response = await fetch(`${API_URL}/dataset/feature-importance-preview/`, {
      method: 'POST',
      headers: {
        'Authorization': token,
      },
      body: formData
    });
    
    const data = await handleApiResponse(response);
    
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
    
    const token = getAuthHeaders().Authorization;
    
    const response = await fetch(`${API_URL}/dataset/save-dataset/`, {
      method: 'POST',
      headers: {
        'Authorization': token,
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
    
    const token = getAuthHeaders().Authorization;
    
    const response = await fetch(`${API_URL}/dataset/data-preprocess/`, {
      method: 'POST',
      headers: {
        'Authorization': token,
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
