
import axios from 'axios';
import { API_BASE_URL, TRAINING_API, PREDICTION_API } from './api-constants';

// Define MLJARPreset interface
export interface MLJARPreset {
  name: string;
  description: string;
  time_limit: number;
  mode?: string;
  algorithms?: string[];
}

// Define H2OPreset interface
export interface H2OPreset {
  name: string;
  description: string;
  max_runtime_secs?: number;
  nfolds: number;
  balance_classes?: boolean;
  exclude_algos?: string[];
}

// Define ColumnSchema interface
export interface ColumnSchema {
  name: string;
  type: string;
  categorical_values?: string[];
  min_value?: number;
  max_value?: number;
  required: boolean;
}

// Function to check experiment status
export async function checkStatus(experimentId: string) {
  try {
    const response = await axios.get(`${API_BASE_URL}${TRAINING_API.EXPERIMENT_STATUS}?experiment_id=${experimentId}`);
    return response.data;
  } catch (error) {
    console.error('Error checking status:', error);
    throw error;
  }
}

// Functions to get presets
export async function getMljarPresets(): Promise<MLJARPreset[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/mljar-presets/`);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching MLJAR presets:', error);
    return [
      { name: 'balanced', description: 'Balanced preset (medium time)', time_limit: 600 },
      { name: 'quick', description: 'Quick preset (fast results)', time_limit: 300 },
      { name: 'thorough', description: 'Thorough preset (high accuracy)', time_limit: 1200 }
    ];
  }
}

export async function getH2OPresets(): Promise<H2OPreset[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/h2o-presets/`);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching H2O presets:', error);
    return [
      { name: 'balanced', description: 'Balanced preset', max_runtime_secs: 600, nfolds: 5, balance_classes: true },
      { name: 'quick', description: 'Quick preset', max_runtime_secs: 300, nfolds: 3, balance_classes: false },
      { name: 'thorough', description: 'Thorough preset', max_runtime_secs: 1200, nfolds: 10, balance_classes: true }
    ];
  }
}

export async function getPredictionSchema(experimentId: string): Promise<ColumnSchema[]> {
  try {
    const response = await axios.get(`${API_BASE_URL}/prediction-schema/?experiment_id=${experimentId}`);
    return response.data.schema || [];
  } catch (error) {
    console.error('Error fetching prediction schema:', error);
    return [];
  }
}

export async function automlTrain(
  datasetId: string, 
  taskType: string,
  automlEngine: string,
  testSize: number,
  stratify: boolean,
  randomSeed: number,
  experimentName: string,
  presetProfile: string | null
) {
  try {
    const formData = new FormData();
    formData.append('dataset_id', datasetId);
    formData.append('task_type', taskType);
    formData.append('automl_engine', automlEngine);
    formData.append('test_size', testSize.toString());
    formData.append('stratify', stratify ? 'true' : 'false');
    formData.append('random_seed', randomSeed.toString());
    formData.append('experiment_name', experimentName);
    if (presetProfile) {
      formData.append('preset_profile', presetProfile);
    }
    
    const response = await axios.post(`${API_BASE_URL}${TRAINING_API.AUTOML}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error in automlTrain:', error);
    throw error;
  }
}

export async function customTrain(formData: FormData) {
  try {
    const response = await axios.post(`${API_BASE_URL}${TRAINING_API.CUSTOM}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error in customTrain:', error);
    throw error;
  }
}

export async function getExperimentStatus(experimentId: string) {
  try {
    const response = await axios.get(`${API_BASE_URL}${TRAINING_API.EXPERIMENT_STATUS}?experiment_id=${experimentId}`);
    return response.data;
  } catch (error) {
    console.error('Error in getExperimentStatus:', error);
    throw error;
  }
}

export async function getExperimentResults(experimentId: string) {
  try {
    const response = await axios.get(`${API_BASE_URL}${TRAINING_API.EXPERIMENT_RESULTS}?experiment_id=${experimentId}`);
    return response.data;
  } catch (error) {
    console.error('Error in getExperimentResults:', error);
    throw error;
  }
}

export async function listExperiments() {
  try {
    const response = await axios.get(`${API_BASE_URL}${TRAINING_API.LIST_EXPERIMENTS}`);
    return response.data;
  } catch (error) {
    console.error('Error in listExperiments:', error);
    throw error;
  }
}

export async function deleteExperiment(experimentId: string) {
  try {
    const response = await axios.delete(`${API_BASE_URL}${TRAINING_API.DELETE_EXPERIMENT}?experiment_id=${experimentId}`);
    return response.data;
  } catch (error) {
    console.error('Error in deleteExperiment:', error);
    throw error;
  }
}

export async function predict(formData: FormData) {
  try {
    const response = await axios.post(`${API_BASE_URL}${PREDICTION_API.PREDICT}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error in predict:', error);
    throw error;
  }
}

export async function batchPredict(formData: FormData) {
  try {
    const response = await axios.post(`${API_BASE_URL}${PREDICTION_API.BATCH_PREDICT}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error in batchPredict:', error);
    throw error;
  }
}

// Create trainingApi object for export
export const trainingApi = {
  automlTrain,
  customTrain,
  getExperimentStatus,
  getExperimentResults,
  listExperiments,
  deleteExperiment,
  predict,
  batchPredict,
  checkStatus,
  getMljarPresets,
  getH2OPresets,
  getPredictionSchema
};
