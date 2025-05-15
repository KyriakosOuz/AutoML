
import axios from 'axios';
import { API_BASE_URL, TRAINING_API, PREDICTION_API } from './api-constants';

export async function automlTrain(formData: FormData) {
  try {
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
