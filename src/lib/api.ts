
import axios from 'axios';
import { API_BASE_URL, DATASET_API } from './api-constants';

// Define enhanced interface for the Dataset type
export interface Dataset {
  id: string;
  name: string;
  created_at: string;
  size: number;
  rows: number;
  columns: number;
  dataset_id: string;  // Added this property
  file_url: string;    // Added this property
  overview?: any;      // Added this property
}

// Group all dataset API functions under a single datasetApi object
export const datasetApi = {
  // Function to upload a dataset
  uploadDataset: async function(formData: FormData) {
    try {
      const response = await axios.post(`${API_BASE_URL}${DATASET_API.UPLOAD}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading dataset:', error);
      throw error;
    }
  },

  // Function to get dataset overview
  getDatasetOverview: async function(datasetId?: string) {
    try {
      const url = `${API_BASE_URL}${DATASET_API.OVERVIEW}${datasetId ? `?dataset_id=${datasetId}` : ''}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error getting dataset overview:', error);
      throw error;
    }
  },

  // Function to preview dataset
  previewDataset: async function(datasetId?: string, stage?: string) {
    try {
      let url = `${API_BASE_URL}${DATASET_API.PREVIEW}`;
      if (datasetId) {
        url += `?dataset_id=${datasetId}`;
        if (stage) {
          url += `&stage=${stage}`;
        }
      }
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error previewing dataset:', error);
      throw error;
    }
  },

  // Function to get dataset features
  getDatasetFeatures: async function(datasetId?: string) {
    try {
      const url = `${API_BASE_URL}${DATASET_API.FEATURES}${datasetId ? `?dataset_id=${datasetId}` : ''}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error('Error getting dataset features:', error);
      throw error;
    }
  },

  // Function to calculate feature importance
  calculateFeatureImportance: async function(data: any) {
    try {
      const response = await axios.post(`${API_BASE_URL}${DATASET_API.IMPORTANCE}`, data);
      return response.data;
    } catch (error) {
      console.error('Error calculating feature importance:', error);
      throw error;
    }
  },

  // Function to save processed dataset
  saveDataset: async function(datasetId: string, targetColumn: string, columnsToKeep: string[]) {
    try {
      const data = {
        dataset_id: datasetId,
        target_column: targetColumn,
        columns_to_keep: columnsToKeep
      };
      const response = await axios.post(`${API_BASE_URL}${DATASET_API.SAVE}`, data);
      return response.data;
    } catch (error) {
      console.error('Error saving processed dataset:', error);
      throw error;
    }
  },

  // Function to list datasets
  listDatasets: async function() {
    try {
      const response = await axios.get(`${API_BASE_URL}${DATASET_API.LIST}`);
      return response.data;
    } catch (error) {
      console.error('Error listing datasets:', error);
      throw error;
    }
  },

  // Function to delete dataset
  deleteDataset: async function(datasetId: string) {
    try {
      const response = await axios.delete(`${API_BASE_URL}${DATASET_API.DELETE}?dataset_id=${datasetId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting dataset:', error);
      throw error;
    }
  },

  // Adding missing methods that are used in components
  featureImportancePreview: async function(datasetId: string, targetColumn: string) {
    try {
      const data = {
        dataset_id: datasetId,
        target_column: targetColumn
      };
      const response = await axios.post(`${API_BASE_URL}/feature-importance-preview/`, data);
      return response.data;
    } catch (error) {
      console.error('Error previewing feature importance:', error);
      throw error;
    }
  },

  handleMissingValues: async function(datasetId: string, strategy: string) {
    try {
      const data = {
        dataset_id: datasetId,
        strategy: strategy
      };
      const response = await axios.post(`${API_BASE_URL}/handle-missing-values/`, data);
      return response.data;
    } catch (error) {
      console.error('Error handling missing values:', error);
      throw error;
    }
  },

  checkClassImbalance: async function(datasetId: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/check-class-imbalance/?dataset_id=${datasetId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking class imbalance:', error);
      throw error;
    }
  },

  preprocessDataset: async function(datasetId: string, normalizationMethod: string, balanceStrategy: string, balanceMethod?: string) {
    try {
      const data = {
        dataset_id: datasetId,
        normalization_method: normalizationMethod,
        balance_strategy: balanceStrategy
      };
      
      if (balanceMethod) {
        Object.assign(data, { balance_method: balanceMethod });
      }
      
      const response = await axios.post(`${API_BASE_URL}/preprocess-dataset/`, data);
      return response.data;
    } catch (error) {
      console.error('Error preprocessing dataset:', error);
      throw error;
    }
  },

  detectTaskType: async function(datasetId: string, targetColumn: string) {
    try {
      const response = await axios.get(`${API_BASE_URL}/detect-task-type/?dataset_id=${datasetId}&target_column=${targetColumn}`);
      return response.data;
    } catch (error) {
      console.error('Error detecting task type:', error);
      throw error;
    }
  }
};

// Export individual functions for backward compatibility
export const {
  uploadDataset,
  getDatasetOverview,
  previewDataset,
  getDatasetFeatures,
  calculateFeatureImportance,
  saveProcessedDataset: saveDataset,
  listDatasets,
  deleteDataset
} = datasetApi;

// Export training API from the training module
export { trainingApi } from './training';
