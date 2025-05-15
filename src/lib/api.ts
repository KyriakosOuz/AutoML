
import axios from 'axios';
import { API_BASE_URL, DATASET_API } from './api-constants';

// Define interface for the Dataset type
export interface Dataset {
  id: string;
  name: string;
  created_at: string;
  size: number;
  rows: number;
  columns: number;
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
  }
};

// For backward compatibility, also export individual functions
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
