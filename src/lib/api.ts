
import axios from 'axios';
import { API_BASE_URL, DATASET_API } from './api-constants';

// Function to upload a dataset
export async function uploadDataset(formData: FormData) {
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
}

// Function to get dataset overview
export async function getDatasetOverview() {
  try {
    const response = await axios.get(`${API_BASE_URL}${DATASET_API.OVERVIEW}`);
    return response.data;
  } catch (error) {
    console.error('Error getting dataset overview:', error);
    throw error;
  }
}

// Function to preview dataset
export async function previewDataset() {
  try {
    const response = await axios.get(`${API_BASE_URL}${DATASET_API.PREVIEW}`);
    return response.data;
  } catch (error) {
    console.error('Error previewing dataset:', error);
    throw error;
  }
}

// Function to get dataset features
export async function getDatasetFeatures() {
  try {
    const response = await axios.get(`${API_BASE_URL}${DATASET_API.FEATURES}`);
    return response.data;
  } catch (error) {
    console.error('Error getting dataset features:', error);
    throw error;
  }
}

// Function to calculate feature importance
export async function calculateFeatureImportance(data: any) {
  try {
    const response = await axios.post(`${API_BASE_URL}${DATASET_API.IMPORTANCE}`, data);
    return response.data;
  } catch (error) {
    console.error('Error calculating feature importance:', error);
    throw error;
  }
}

// Function to save processed dataset
export async function saveProcessedDataset(data: any) {
  try {
    const response = await axios.post(`${API_BASE_URL}${DATASET_API.SAVE}`, data);
    return response.data;
  } catch (error) {
    console.error('Error saving processed dataset:', error);
    throw error;
  }
}

// Function to list datasets
export async function listDatasets() {
  try {
    const response = await axios.get(`${API_BASE_URL}${DATASET_API.LIST}`);
    return response.data;
  } catch (error) {
    console.error('Error listing datasets:', error);
    throw error;
  }
}

// Function to delete dataset
export async function deleteDataset(datasetId: string) {
  try {
    const response = await axios.delete(`${API_BASE_URL}${DATASET_API.DELETE}?dataset_id=${datasetId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting dataset:', error);
    throw error;
  }
}
