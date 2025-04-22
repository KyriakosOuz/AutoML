
import { API_URL, getAuthHeaders, handleApiResponse } from './utils';

export const trainingApi = {
  getAvailableAlgorithms: async (taskType: string) => {
    try {
      const response = await fetch(`${API_URL}/algorithms/get-algorithms/?task_type=${encodeURIComponent(taskType)}`, {
        headers: getAuthHeaders(),
      });
      
      const data = await handleApiResponse(response);
      return data.algorithms;
    } catch (error) {
      console.error('Error fetching algorithms:', error);
      throw error;
    }
  },

  checkStatus: async (experimentId: string) => {
    try {
      console.log('[API] Checking status for experiment:', experimentId);
      const response = await fetch(`${API_URL}/training/check-status/${experimentId}`, {
        headers: getAuthHeaders(),
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[API] Expected JSON response, got:', contentType, text.substring(0, 200));
        throw new Error('Server returned invalid content type');
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Status check error:', {
          experimentId,
          status: response.status,
          response: errorText.substring(0, 200)
        });
        
        throw new Error(`Failed to check status: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[API] Status check response:', {
        experimentId,
        status: response.status,
        data
      });
      
      return data;
    } catch (error) {
      console.error('[API] Error checking training status:', {
        experimentId,
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  },

  automlTrain: async (
    datasetId: string, 
    taskType: string, 
    automlEngine: string, 
    testSize: number, 
    stratify: boolean, 
    randomSeed: number
  ) => {
    try {
      const formData = new FormData();
      formData.append('dataset_id', datasetId);
      formData.append('task_type', taskType);
      formData.append('automl_engine', automlEngine);
      formData.append('test_size', testSize.toString());
      formData.append('stratify', stratify.toString());
      formData.append('random_seed', randomSeed.toString());
      
      const response = await fetch(`${API_URL}/training/automl/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthHeaders().Authorization}`,
        },
        body: formData,
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Expected JSON response, got:', contentType, text.substring(0, 200));
        throw new Error('Server returned invalid content type');
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('AutoML training error:', {
          status: response.status,
          response: errorText.substring(0, 200)
        });
        
        if (errorText.includes('<!DOCTYPE html>') || errorText.includes('<html')) {
          throw new Error(`Server returned HTML error page. Status: ${response.status}`);
        }
        
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.detail || errorJson.message || `Error: ${response.status}`);
        } catch {
          throw new Error(`Error: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
        }
      }
      
      const data = await response.json();
      const result = data.data || data;
      
      if (!result.experiment_id) {
        throw new Error('No experiment ID returned from the server');
      }
      
      return result;
    } catch (error) {
      console.error('Error starting AutoML training:', error);
      throw error;
    }
  },

  customTrain: async (formData: FormData) => {
    try {
      console.log('[API] Starting custom training with params:', {
        dataset_id: formData.get('dataset_id'),
        algorithm: formData.get('algorithm'),
        use_default_hyperparams: formData.get('use_default_hyperparams'),
      });
      
      const token = getAuthHeaders().Authorization;
      const response = await fetch(`${API_URL}/training/custom-train/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[API] Expected JSON response, got:', contentType, text.substring(0, 200));
        throw new Error('Server returned invalid content type');
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Custom training error:', {
          status: response.status,
          response: errorText.substring(0, 200)
        });
        
        if (errorText.includes('<!DOCTYPE html>') || errorText.includes('<html')) {
          throw new Error(`Server returned HTML error page. Status: ${response.status}`);
        }
        
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.detail || errorJson.message || `Error: ${response.status}`);
        } catch {
          throw new Error(`Error: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
        }
      }
      
      const data = await response.json();
      console.log('[API] Custom training response:', data);
      
      const result = data.data || data;
      
      if (!result.experiment_id) {
        throw new Error('No experiment ID returned from the server');
      }
      
      return result;
    } catch (error) {
      console.error('[API] Error starting custom training:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },

  getAvailableHyperparameters: async (algorithm: string) => {
    try {
      const response = await fetch(`${API_URL}/algorithms/get-hyperparameters/?algorithm=${encodeURIComponent(algorithm)}`, {
        headers: getAuthHeaders(),
      });
      
      const data = await handleApiResponse(response);
      return data.hyperparameters;
    } catch (error) {
      console.error('Error fetching hyperparameters:', error);
      throw error;
    }
  },

  getExperimentResults: async (experimentId: string) => {
    try {
      console.log('[API] Fetching results for experiment:', experimentId);
      const response = await fetch(`${API_URL}/experiments/experiment-results/${experimentId}`, {
        headers: getAuthHeaders()
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[API] Expected JSON response, got:', contentType, text.substring(0, 200));
        throw new Error('Server returned invalid content type');
      }
      
      if (!response.ok) {
        if (response.status === 404) {
          return { 
            status: 'processing',
            experiment_id: experimentId,
            message: 'Waiting for experiment to start...',
          };
        }
        
        const errorText = await response.text();
        console.error('[API] Error fetching results:', {
          experimentId,
          status: response.status,
          response: errorText.substring(0, 200)
        });
        
        if (errorText.includes('<!DOCTYPE html>') || errorText.includes('<html')) {
          throw new Error(`Server returned HTML error page. Status: ${response.status}`);
        }
        
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.detail || errorJson.message || `Error: ${response.status}`);
        } catch {
          throw new Error(`Error: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
        }
      }
      
      const data = await response.json();
      console.log('[API] Results data received:', { 
        experimentId,
        status: data.status || 'unknown',
        hasTrainingResults: !!data.training_results
      });
      
      return data.data?.experiment_results || 
             data.experiment_results || 
             data.data?.experiment_metadata || 
             data;
    } catch (error) {
      console.error('Error fetching experiment results:', error);
      throw error;
    }
  }
};
