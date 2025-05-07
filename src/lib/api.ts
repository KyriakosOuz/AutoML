import { getAuthHeaders, handleApiResponse } from './utils';
import { Dataset, DatasetOverview, DatasetPreviewData } from '@/types/dataset';
import { ApiResponse, ExperimentResponse } from '@/types/api';
import { API_BASE_URL } from './constants';

// Datasets API
export const uploadDataset = async (
  file: File,
  missingValuesSymbol?: string
): Promise<ApiResponse<Dataset>> => {
  try {
    console.log('[API] Uploading dataset:', file.name);
    const headers = await getAuthHeaders();
    const formData = new FormData();
    formData.append('file', file);
    if (missingValuesSymbol) {
      formData.append('missing_values_symbol', missingValuesSymbol);
    }

    const response = await fetch(`${API_BASE_URL}/datasets/upload/`, {
      method: 'POST',
      headers: {
        ...headers,
      },
      body: formData,
    });

    return handleApiResponse<Dataset>(response);
  } catch (error) {
    console.error('[API] Dataset upload error:', error);
    throw error;
  }
};

export const previewDataset = async (
  datasetId: string,
  stage: string
): Promise<ApiResponse<DatasetPreviewData>> => {
  try {
    console.log(`[API] Previewing dataset ${datasetId} at stage: ${stage}`);
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/datasets/preview/${datasetId}?stage=${stage}`, {
      headers,
    });

    return handleApiResponse<DatasetPreviewData>(response);
  } catch (error) {
    console.error('[API] Dataset preview error:', error);
    throw error;
  }
};

export const saveDataset = async (
  datasetId: string,
  targetColumn: string,
  columnsToKeep: string[]
): Promise<ApiResponse<Dataset>> => {
  try {
    console.log(`[API] Saving dataset ${datasetId} with target column: ${targetColumn}`);
    const headers = await getAuthHeaders();
    const body = JSON.stringify({
      target_column: targetColumn,
      columns_to_keep: columnsToKeep,
    });

    const response = await fetch(`${API_BASE_URL}/datasets/save/${datasetId}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body,
    });

    return handleApiResponse<Dataset>(response);
  } catch (error) {
    console.error('[API] Dataset save error:', error);
    throw error;
  }
};

export const preprocessDataset = async (
  datasetId: string,
  normalizationMethod: string,
  balanceStrategy: string,
  balanceMethod?: string
): Promise<ApiResponse<Dataset>> => {
  try {
    console.log(`[API] Preprocessing dataset ${datasetId} with normalization: ${normalizationMethod}, balance strategy: ${balanceStrategy}, balance method: ${balanceMethod}`);
    const headers = await getAuthHeaders();
    const body = JSON.stringify({
      normalization_method: normalizationMethod,
      balance_strategy: balanceStrategy,
      balance_method: balanceMethod,
    });

    const response = await fetch(`${API_BASE_URL}/datasets/preprocess/${datasetId}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body,
    });

    return handleApiResponse<Dataset>(response);
  } catch (error) {
    console.error('[API] Dataset preprocess error:', error);
    throw error;
  }
};

export const checkClassImbalance = async (datasetId: string): Promise<ApiResponse<any>> => {
  try {
    console.log(`[API] Checking class imbalance for dataset ${datasetId}`);
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_BASE_URL}/datasets/check-class-imbalance/${datasetId}`, {
      headers,
    });

    return handleApiResponse<any>(response);
  } catch (error) {
    console.error('[API] Class imbalance check error:', error);
    throw error;
  }
};

// Training API
export const startTraining = async (
  datasetId: string,
  taskType: string,
  targetColumn: string,
  testSize: number,
  stratify: boolean,
  randomSeed: number,
  selectedAlgorithm: string,
  experimentName: string
): Promise<ApiResponse<ExperimentResponse>> => {
  try {
    console.log(`[API] Starting training for dataset: ${datasetId}, task type: ${taskType}, algorithm: ${selectedAlgorithm}`);
    const headers = await getAuthHeaders();

    const formData = new FormData();
    formData.append('dataset_id', datasetId);
    formData.append('task_type', taskType);
    formData.append('target_column', targetColumn);
    formData.append('test_size', testSize.toString());
    formData.append('stratify', stratify.toString());
    formData.append('random_seed', randomSeed.toString());
    formData.append('algorithm', selectedAlgorithm);
    formData.append('experiment_name', experimentName);

    const response = await fetch(`${API_BASE_URL}/training/start-training/`, {
      method: 'POST',
      headers: { ...headers },
      body: formData,
    });

    return handleApiResponse<ExperimentResponse>(response);
  } catch (error) {
    console.error('[API] Training error:', error);
    throw error;
  }
};

// Add support for passing experimentName via options object in automlTrain
export const automlTrain = async (
  datasetId: string,
  taskType: string,
  engine: string,
  testSize: number,
  stratify: boolean,
  options: { randomSeed: number; experimentName?: string }
): Promise<ApiResponse<ExperimentResponse>> => {
  try {
    const { randomSeed, experimentName } = options;
    
    console.log(`[API] Starting AutoML training for dataset: ${datasetId}, engine: ${engine}`);
    const headers = await getAuthHeaders();
    
    const formData = new FormData();
    formData.append('dataset_id', datasetId);
    formData.append('task_type', taskType);
    formData.append('engine', engine);
    formData.append('test_size', testSize.toString());
    formData.append('stratify', stratify.toString());
    formData.append('random_seed', randomSeed.toString());
    
    // Add experiment_name to formData if provided
    if (experimentName) {
      formData.append('experiment_name', experimentName);
    }
    
    const response = await fetch(`${API_BASE_URL}/training/automl-train/`, {
      method: 'POST',
      headers: { ...headers },
      body: formData,
    });

    return handleApiResponse<ExperimentResponse>(response);
  } catch (error) {
    console.error('[API] AutoML training error:', error);
    throw error;
  }
};
